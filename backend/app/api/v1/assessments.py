import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.rbac import get_current_user
from app.database import get_db
from app.models.assessment import Assessment, QuizAttempt
from app.models.misc import Feedback
from app.models.user import User
from app.schemas.assessment import (
    AssessmentOut,
    AssessmentResultResponse,
    QuestionOut,
    QuizAttemptSummary,
    SubmitAnswersRequest,
)
from app.services.assessment_service import (
    AssessmentSubmissionError,
    NoCompetenciesAvailableError,
    get_or_create_active_assessment,
    score_and_apply,
)

router = APIRouter()


@router.post("/competency-check/start", response_model=AssessmentOut)
def start_competency_check(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        assessment = get_or_create_active_assessment(db, current_user)
    except NoCompetenciesAvailableError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    return AssessmentOut(
        id=assessment.id,
        title=assessment.title,
        questions=[
            QuestionOut(id=q.id, prompt=q.prompt, options=q.options, topic=q.topic, difficulty=q.difficulty)
            for q in assessment.questions
        ],
    )


@router.post("/competency-check/{assessment_id}/submit", response_model=AssessmentResultResponse)
def submit_competency_check(
    assessment_id: uuid.UUID,
    payload: SubmitAnswersRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    assessment = (
        db.query(Assessment)
        .filter(Assessment.id == assessment_id, Assessment.created_by_id == current_user.id)
        .first()
    )
    if not assessment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found.")

    already_completed = (
        db.query(QuizAttempt)
        .filter(QuizAttempt.assessment_id == assessment.id, QuizAttempt.completed_at.isnot(None))
        .first()
    )
    if already_completed:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This assessment has already been submitted. Start a new one to reassess.",
        )

    try:
        result = score_and_apply(db, user=current_user, assessment=assessment, answers=payload.answers)
    except AssessmentSubmissionError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    return AssessmentResultResponse(**result)


@router.get("/competency-check/history", response_model=list[QuizAttemptSummary])
def competency_check_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    attempts = (
        db.query(QuizAttempt)
        .join(Assessment, QuizAttempt.assessment_id == Assessment.id)
        .filter(QuizAttempt.user_id == current_user.id, Assessment.title == "Competency Self-Assessment")
        .order_by(QuizAttempt.completed_at.desc())
        .all()
    )
    return [
        QuizAttemptSummary(
            id=a.id,
            assessment_id=a.assessment_id,
            score=a.score,
            completed_at=a.completed_at.isoformat() if a.completed_at else None,
        )
        for a in attempts
    ]


# --- Phase 10: published (trainer-authored) assessments, learner-facing ----


@router.get("/published", response_model=list[dict])
def list_published_assessments(db: Session = Depends(get_db)):
    assessments = db.query(Assessment).filter(Assessment.is_published.is_(True)).all()
    return [{"id": str(a.id), "title": a.title, "question_count": len(a.questions)} for a in assessments]


@router.get("/{assessment_id}", response_model=AssessmentOut)
def get_published_assessment(assessment_id: uuid.UUID, db: Session = Depends(get_db)):
    assessment = (
        db.query(Assessment)
        .filter(Assessment.id == assessment_id, Assessment.is_published.is_(True))
        .first()
    )
    if not assessment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found.")
    return AssessmentOut(
        id=assessment.id,
        title=assessment.title,
        questions=[
            QuestionOut(id=q.id, prompt=q.prompt, options=q.options, topic=q.topic, difficulty=q.difficulty)
            for q in assessment.questions
        ],
    )


def _generate_feedback_text(result: dict) -> str:
    weak = [b["competency_name"] for b in result["breakdown"] if b["percent"] < 60]
    if result["overall_percent"] >= 80:
        base = f"Strong performance — {result['overall_percent']}% overall."
    elif result["overall_percent"] >= 50:
        base = f"Solid attempt — {result['overall_percent']}% overall, with room to improve."
    else:
        base = f"{result['overall_percent']}% overall — this topic needs more review."
    if weak:
        base += f" Focus areas: {', '.join(weak)}."
    return base


@router.post("/{assessment_id}/submit", response_model=AssessmentResultResponse)
def submit_published_assessment(
    assessment_id: uuid.UUID,
    payload: SubmitAnswersRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    assessment = (
        db.query(Assessment)
        .filter(Assessment.id == assessment_id, Assessment.is_published.is_(True))
        .first()
    )
    if not assessment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found.")

    try:
        result = score_and_apply(db, user=current_user, assessment=assessment, answers=payload.answers)
    except AssessmentSubmissionError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    attempt = (
        db.query(QuizAttempt)
        .filter(QuizAttempt.assessment_id == assessment.id, QuizAttempt.user_id == current_user.id)
        .order_by(QuizAttempt.completed_at.desc())
        .first()
    )
    feedback_text = _generate_feedback_text(result)
    db.add(Feedback(user_id=current_user.id, quiz_attempt_id=attempt.id if attempt else None, content=feedback_text))
    db.commit()

    return AssessmentResultResponse(**result, feedback=feedback_text)
