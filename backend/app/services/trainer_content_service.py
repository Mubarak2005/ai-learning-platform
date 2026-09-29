"""
Phase 9 — AI Question Generation & Assessment (trainer workflow).

    Learning Material -> AI Question Generator -> MCQs/Quizzes
        -> AI Validation (not yet implemented; trainer review stands in)
        -> Trainer Review -> Publish Assessment

Every question generated here starts life as QuestionStatus.AI_GENERATED
and CANNOT be published until a trainer has explicitly approved or edited
it — see `publish_assessment` below, which refuses to publish while any
question is still unreviewed. This is the hard rule from the platform
spec: never automatically publish unverified AI-generated questions.
"""

from sqlalchemy.orm import Session

from app.models.assessment import Assessment, ContentChunk, Question, QuestionStatus, UploadedMaterial
from app.services.ai_service import get_ai_provider


class NoContentAvailableError(Exception):
    pass


class UnreviewedQuestionsError(Exception):
    pass


def generate_draft_assessment(db: Session, *, material: UploadedMaterial, question_count: int = 10) -> Assessment:
    chunks = (
        db.query(ContentChunk)
        .filter(ContentChunk.material_id == material.id)
        .order_by(ContentChunk.chunk_index)
        .all()
    )
    if not chunks:
        raise NoContentAvailableError("This material has not been processed into content chunks yet.")

    provider = get_ai_provider()
    generated = provider.generate_questions_from_text(chunks=[c.text for c in chunks], count=question_count)
    if not generated:
        raise NoContentAvailableError(
            "Could not generate questions from this material — it may be too short."
        )

    assessment = Assessment(
        title=f"Draft Assessment: {material.file_name}",
        course_id=material.course_id,
        created_by_id=material.uploaded_by_id,
        is_published=False,
    )
    db.add(assessment)
    db.flush()

    for g in generated:
        db.add(
            Question(
                assessment_id=assessment.id,
                prompt=g["prompt"],
                options=g["options"],
                correct_option_index=g["correct_option_index"],
                explanation=g["explanation"],
                topic=material.file_name,
                difficulty=g["difficulty"],
                source_reference=f"material:{material.id}",
                status=QuestionStatus.AI_GENERATED,  # must be reviewed before publish
            )
        )

    db.commit()
    db.refresh(assessment)
    return assessment


def publish_assessment(db: Session, assessment: Assessment) -> Assessment:
    unreviewed = (
        db.query(Question)
        .filter(Question.assessment_id == assessment.id, Question.status == QuestionStatus.AI_GENERATED)
        .count()
    )
    if unreviewed > 0:
        raise UnreviewedQuestionsError(
            f"{unreviewed} question(s) still need trainer review before this assessment can be published."
        )

    rejected_count = (
        db.query(Question)
        .filter(Question.assessment_id == assessment.id, Question.status == QuestionStatus.REJECTED)
        .count()
    )
    remaining = db.query(Question).filter(Question.assessment_id == assessment.id).count() - rejected_count
    if remaining == 0:
        raise UnreviewedQuestionsError("All questions were rejected — nothing left to publish.")

    assessment.is_published = True
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    return assessment
