"""
Phase 4 — AI Competency Assessment.

Workflow implemented here:
    Professional Profile (job_role)
        -> target competencies (from RoleCompetency)
        -> AI-generated questions per competency (app.services.ai_service)
        -> user answers
        -> DETERMINISTIC scoring (no LLM in the scoring path)
        -> UserCompetency + CompetencyHistory updated

This is a self-assessment: the same user who answers the questions is the
one being assessed, and results only ever update that user's own
competency record. It is therefore a different trust boundary from Phase
9's trainer-authored assessments (which require human review before
publication to other learners) — no review gate is needed here.
"""

from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.assessment import Assessment, Question, QuestionStatus, QuizAttempt
from app.models.competency import Competency, CompetencyHistory, RoleCompetency, UserCompetency
from app.models.user import User
from app.services.ai_service import get_ai_provider
from app.services.gap_service import recompute_skill_gaps

QUESTIONS_PER_COMPETENCY = 2
MAX_TOTAL_QUESTIONS = 16

# Used when a user's job_role has no RoleCompetency rows configured yet,
# so the flow never dead-ends with zero questions.
DEFAULT_COMPETENCIES = [
    "Data Quality Frameworks",
    "Python",
    "Communication",
    "Data Privacy",
]


class NoCompetenciesAvailableError(Exception):
    pass


def _target_competencies(db: Session, user: User) -> list[tuple[Competency, int]]:
    """Returns [(Competency, required_level)] for the user's job role, or a
    sensible default set if the job role has no configured requirements."""

    rows: list[RoleCompetency] = []
    if user.job_role:
        rows = db.query(RoleCompetency).filter(RoleCompetency.job_role == user.job_role).all()

    if rows:
        return [(row.competency, row.required_level) for row in rows]

    fallback = db.query(Competency).filter(Competency.name.in_(DEFAULT_COMPETENCIES)).all()
    if not fallback:
        raise NoCompetenciesAvailableError("No competency framework has been seeded yet.")
    return [(c, 3) for c in fallback]


def get_or_create_active_assessment(db: Session, user: User) -> Assessment:
    """
    Returns the user's currently in-progress self-assessment if one exists
    (no completed QuizAttempt yet), otherwise generates a new one.
    """
    existing = (
        db.query(Assessment)
        .filter(Assessment.created_by_id == user.id, Assessment.title == "Competency Self-Assessment")
        .order_by(Assessment.created_at.desc())
        .first()
    )
    if existing:
        already_attempted = (
            db.query(QuizAttempt)
            .filter(QuizAttempt.assessment_id == existing.id, QuizAttempt.completed_at.isnot(None))
            .first()
        )
        if not already_attempted:
            return existing

    targets = _target_competencies(db, user)

    # Cap total questions so the assessment stays a reasonable length even
    # if a job role has many required competencies.
    per_competency = max(1, min(QUESTIONS_PER_COMPETENCY, MAX_TOTAL_QUESTIONS // max(1, len(targets))))

    assessment = Assessment(
        title="Competency Self-Assessment",
        created_by_id=user.id,
        is_published=False,  # not a trainer-published assessment; accessed via created_by_id, not this flag
    )
    db.add(assessment)
    db.flush()  # get assessment.id without committing yet

    provider = get_ai_provider()
    for competency, _required_level in targets:
        generated = provider.generate_assessment_questions(
            competency_name=competency.name,
            domain=competency.domain.value,
            count=per_competency,
        )
        for g in generated:
            db.add(
                Question(
                    assessment_id=assessment.id,
                    prompt=g["prompt"],
                    options=g["options"],
                    correct_option_index=g["correct_option_index"],
                    explanation=g["explanation"],
                    topic=competency.name,
                    competency_id=competency.id,
                    difficulty=g["difficulty"],
                    source_reference="ai_generated:self_assessment",
                    # Self-assessment questions are consumed only by the same
                    # user immediately after generation — APPROVED here does
                    # NOT mean "safe to publish to other learners" (that gate
                    # is enforced separately in the Phase 9 trainer workflow).
                    status=QuestionStatus.APPROVED,
                )
            )

    db.commit()
    db.refresh(assessment)
    return assessment


def _level_from_percent(percent: float) -> float:
    """Deterministic mapping: percent correct (0-100) -> competency level (0-5)."""
    return round((percent / 100) * 5, 1)


def _upsert_competency(
    db: Session, *, user: User, competency: Competency, percent: float, assessment_id
) -> UserCompetency:
    level = _level_from_percent(percent)
    record = (
        db.query(UserCompetency)
        .filter(UserCompetency.user_id == user.id, UserCompetency.competency_id == competency.id)
        .first()
    )
    now = datetime.now(timezone.utc)
    if record:
        record.current_level = level
        record.confidence = round(percent / 100, 2)
        record.assessment_date = now
        record.evidence = f"assessment:{assessment_id}"
    else:
        record = UserCompetency(
            user_id=user.id,
            competency_id=competency.id,
            current_level=level,
            confidence=round(percent / 100, 2),
            assessment_date=now,
            evidence=f"assessment:{assessment_id}",
        )
    db.add(record)
    db.add(CompetencyHistory(user_id=user.id, competency_id=competency.id, level=level, source="quiz_attempt"))
    return record


class AssessmentSubmissionError(Exception):
    pass


def score_and_apply(
    db: Session, *, user: User, assessment: Assessment, answers: dict[str, int]
) -> dict:
    """
    answers: {question_id (str): selected_option_index}

    Scoring is entirely deterministic (correct/incorrect comparison) — no
    LLM is involved in computing the score, per the platform's
    "rules/scoring for competency math, LLM only for content" principle.
    """
    questions = db.query(Question).filter(Question.assessment_id == assessment.id).all()
    if not questions:
        raise AssessmentSubmissionError("This assessment has no questions.")

    by_competency: dict[str, list[Question]] = {}
    for q in questions:
        key = str(q.competency_id)
        by_competency.setdefault(key, []).append(q)

    total_correct = 0
    breakdown = []

    for competency_id, comp_questions in by_competency.items():
        correct_count = 0
        question_results = []
        for q in comp_questions:
            selected = answers.get(str(q.id))
            is_correct = selected is not None and int(selected) == q.correct_option_index
            if is_correct:
                correct_count += 1
                total_correct += 1
            question_results.append(
                {
                    "question_id": str(q.id),
                    "prompt": q.prompt,
                    "selected_option_index": selected,
                    "correct_option_index": q.correct_option_index,
                    "is_correct": is_correct,
                    "explanation": q.explanation,
                }
            )

        percent = round((correct_count / len(comp_questions)) * 100, 1)
        competency = comp_questions[0].competency  # relationship lookup

        if competency is None:
            # Trainer-authored, content-derived questions (Phase 9) aren't
            # necessarily tagged to a specific competency — score them
            # toward the overall total, but skip the competency-level
            # UserCompetency/CompetencyHistory update for this group.
            breakdown.append(
                {
                    "competency_id": "general",
                    "competency_name": "General",
                    "domain": "general",
                    "correct": correct_count,
                    "total": len(comp_questions),
                    "percent": percent,
                    "new_level": None,
                    "questions": question_results,
                }
            )
            continue

        updated = _upsert_competency(
            db, user=user, competency=competency, percent=percent, assessment_id=assessment.id
        )
        breakdown.append(
            {
                "competency_id": competency_id,
                "competency_name": competency.name,
                "domain": competency.domain.value,
                "correct": correct_count,
                "total": len(comp_questions),
                "percent": percent,
                "new_level": updated.current_level,
                "questions": question_results,
            }
        )

    overall_percent = round((total_correct / len(questions)) * 100, 1)

    attempt = QuizAttempt(
        user_id=user.id,
        assessment_id=assessment.id,
        score=overall_percent,
        completed_at=datetime.now(timezone.utc),
    )
    db.add(attempt)
    db.commit()

    # Phase 11's continuous loop: assessment result -> competency evidence ->
    # updated competency -> skill gap recalculation, automatically.
    recompute_skill_gaps(db, user)

    return {
        "assessment_id": str(assessment.id),
        "overall_percent": overall_percent,
        "total_questions": len(questions),
        "total_correct": total_correct,
        "breakdown": breakdown,
    }
