"""
Officer-facing personal analytics — every number here comes from the
user's actual QuizAttempt / CompetencyHistory / Enrollment rows, not
placeholder data.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.rbac import get_current_user
from app.database import get_db
from app.models.assessment import QuizAttempt
from app.models.competency import Competency, CompetencyHistory
from app.models.learning import Enrollment, LearningProgress
from app.models.user import User

router = APIRouter()


@router.get("/me/analytics")
def my_analytics(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    enrollments = db.query(Enrollment).filter(Enrollment.user_id == current_user.id).all()

    total_hours = 0.0
    for e in enrollments:
        progress_row = db.query(LearningProgress).filter(LearningProgress.enrollment_id == e.id).first()
        pct = progress_row.percent_complete if progress_row else 0
        total_hours += (e.course.duration_hours or 0) * (pct / 100)

    attempts = (
        db.query(QuizAttempt)
        .filter(QuizAttempt.user_id == current_user.id, QuizAttempt.completed_at.isnot(None))
        .order_by(QuizAttempt.completed_at)
        .all()
    )
    score_history = [
        {"date": a.completed_at.isoformat(), "score": a.score, "assessment_id": str(a.assessment_id)}
        for a in attempts
    ]
    scored = [a.score for a in attempts if a.score is not None]
    avg_score = round(sum(scored) / len(scored), 1) if scored else None

    history_rows = (
        db.query(CompetencyHistory, Competency.name, Competency.domain)
        .join(Competency, CompetencyHistory.competency_id == Competency.id)
        .filter(CompetencyHistory.user_id == current_user.id)
        .order_by(CompetencyHistory.recorded_at)
        .all()
    )
    competency_growth = [
        {
            "date": history.recorded_at.isoformat(),
            "competency_name": name,
            "domain": domain.value,
            "level": history.level,
            "source": history.source,
        }
        for history, name, domain in history_rows
    ]

    completed_courses = sum(1 for e in enrollments if e.status.value == "completed")

    return {
        "total_learning_hours": round(total_hours, 1),
        "courses_enrolled": len(enrollments),
        "courses_completed": completed_courses,
        "assessments_taken": len(attempts),
        "average_assessment_score": avg_score,
        "score_history": score_history,
        "competency_growth": competency_growth,
    }
