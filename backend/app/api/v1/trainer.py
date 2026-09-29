import os
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.config import get_settings
from app.core.rbac import get_current_user, require_role
from app.database import get_db
from app.models.assessment import Assessment, Question, QuestionStatus, UploadedMaterial
from app.models.user import RoleName, User
from app.schemas.trainer import (
    AssessmentReviewOut,
    AssessmentSummary,
    GenerateQuestionsRequest,
    MaterialResponse,
    QuestionReviewOut,
    QuestionReviewUpdate,
)
from app.services.content_pipeline import process_material
from app.services.text_extraction import guess_material_type
from app.services.trainer_content_service import (
    NoContentAvailableError,
    UnreviewedQuestionsError,
    generate_draft_assessment,
    publish_assessment,
)

router = APIRouter()
settings = get_settings()

require_trainer_or_admin = require_role([RoleName.TRAINER, RoleName.ADMIN])


@router.post("/materials/upload", response_model=MaterialResponse, status_code=status.HTTP_201_CREATED)
async def upload_material(
    file: UploadFile = File(...),
    current_user: User = Depends(require_trainer_or_admin),
    db: Session = Depends(get_db),
):
    suffix = Path(file.filename).suffix.lower()
    if suffix not in settings.ALLOWED_UPLOAD_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type '{suffix}'. Allowed: {', '.join(settings.ALLOWED_UPLOAD_EXTENSIONS)}",
        )

    contents = await file.read()
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if len(contents) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds the {settings.MAX_UPLOAD_SIZE_MB}MB upload limit.",
        )

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    stored_name = f"{uuid.uuid4()}{suffix}"
    storage_path = os.path.join(settings.UPLOAD_DIR, stored_name)
    with open(storage_path, "wb") as f:
        f.write(contents)

    material = UploadedMaterial(
        uploaded_by_id=current_user.id,
        file_name=file.filename,
        file_type=guess_material_type(file.filename),
        storage_path=storage_path,
        processed=False,
    )
    db.add(material)
    db.commit()
    db.refresh(material)

    # Process synchronously for Phase 8 (small files, demo scale). A
    # production build would hand this to a background task queue.
    process_material(db, material)
    db.refresh(material)

    return material


@router.get("/materials", response_model=list[MaterialResponse])
def list_materials(current_user: User = Depends(require_trainer_or_admin), db: Session = Depends(get_db)):
    return (
        db.query(UploadedMaterial)
        .filter(UploadedMaterial.uploaded_by_id == current_user.id)
        .order_by(UploadedMaterial.created_at.desc())
        .all()
    )


@router.post(
    "/materials/{material_id}/generate-questions",
    response_model=AssessmentReviewOut,
    status_code=status.HTTP_201_CREATED,
)
def generate_questions(
    material_id: uuid.UUID,
    payload: GenerateQuestionsRequest,
    current_user: User = Depends(require_trainer_or_admin),
    db: Session = Depends(get_db),
):
    material = (
        db.query(UploadedMaterial)
        .filter(UploadedMaterial.id == material_id, UploadedMaterial.uploaded_by_id == current_user.id)
        .first()
    )
    if not material:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Material not found.")

    try:
        assessment = generate_draft_assessment(db, material=material, question_count=payload.question_count)
    except NoContentAvailableError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    return _to_review_out(assessment)


@router.get("/assessments", response_model=list[AssessmentSummary])
def list_trainer_assessments(
    current_user: User = Depends(require_trainer_or_admin), db: Session = Depends(get_db)
):
    assessments = (
        db.query(Assessment)
        .filter(Assessment.created_by_id == current_user.id)
        .order_by(Assessment.created_at.desc())
        .all()
    )
    summaries = []
    for a in assessments:
        questions = a.questions
        summaries.append(
            AssessmentSummary(
                id=a.id,
                title=a.title,
                is_published=a.is_published,
                total_questions=len(questions),
                approved_count=sum(1 for q in questions if q.status in (QuestionStatus.APPROVED, QuestionStatus.EDITED)),
                pending_count=sum(1 for q in questions if q.status == QuestionStatus.AI_GENERATED),
                rejected_count=sum(1 for q in questions if q.status == QuestionStatus.REJECTED),
            )
        )
    return summaries


@router.get("/assessments/{assessment_id}", response_model=AssessmentReviewOut)
def get_trainer_assessment(
    assessment_id: uuid.UUID,
    current_user: User = Depends(require_trainer_or_admin),
    db: Session = Depends(get_db),
):
    assessment = (
        db.query(Assessment)
        .filter(Assessment.id == assessment_id, Assessment.created_by_id == current_user.id)
        .first()
    )
    if not assessment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found.")
    return _to_review_out(assessment)


@router.put("/questions/{question_id}", response_model=QuestionReviewOut)
def review_question(
    question_id: uuid.UUID,
    payload: QuestionReviewUpdate,
    current_user: User = Depends(require_trainer_or_admin),
    db: Session = Depends(get_db),
):
    question = (
        db.query(Question)
        .join(Assessment, Question.assessment_id == Assessment.id)
        .filter(Question.id == question_id, Assessment.created_by_id == current_user.id)
        .first()
    )
    if not question:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found.")

    if payload.prompt is not None:
        question.prompt = payload.prompt
    if payload.options is not None:
        question.options = payload.options
    if payload.correct_option_index is not None:
        question.correct_option_index = payload.correct_option_index
    if payload.explanation is not None:
        question.explanation = payload.explanation

    # Editing content and approving are separate signals, but a trainer who
    # changes the text is implicitly marking it reviewed too.
    question.status = payload.status
    db.add(question)
    db.commit()
    db.refresh(question)
    return question


@router.post("/assessments/{assessment_id}/publish", response_model=AssessmentReviewOut)
def publish_trainer_assessment(
    assessment_id: uuid.UUID,
    current_user: User = Depends(require_trainer_or_admin),
    db: Session = Depends(get_db),
):
    assessment = (
        db.query(Assessment)
        .filter(Assessment.id == assessment_id, Assessment.created_by_id == current_user.id)
        .first()
    )
    if not assessment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found.")

    try:
        assessment = publish_assessment(db, assessment)
    except UnreviewedQuestionsError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    return _to_review_out(assessment)


def _to_review_out(assessment: Assessment) -> AssessmentReviewOut:
    return AssessmentReviewOut(
        id=assessment.id,
        title=assessment.title,
        is_published=assessment.is_published,
        questions=[
            QuestionReviewOut(
                id=q.id,
                prompt=q.prompt,
                options=q.options,
                correct_option_index=q.correct_option_index,
                explanation=q.explanation,
                topic=q.topic,
                difficulty=q.difficulty,
                status=q.status,
            )
            for q in assessment.questions
        ],
    )
