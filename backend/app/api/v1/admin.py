"""
Phase 11 — Admin Intelligence.

All figures here are computed with plain SQL aggregation, not an LLM —
this is dashboard analytics, not content generation. Requires the ADMIN
role.
"""

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.rbac import require_role
from app.database import get_db
from app.models.assessment import QuizAttempt
from app.models.competency import Competency, GapSeverity, SkillGap, UserCompetency
from app.models.learning import Enrollment, EnrollmentStatus
from app.models.user import Department, RoleName, User

router = APIRouter()
require_admin = require_role([RoleName.ADMIN])


@router.get("/overview", dependencies=[Depends(require_admin)])
def admin_overview(db: Session = Depends(get_db)):
    total_officers = db.query(func.count(User.id)).scalar() or 0

    active_learner_ids = {row[0] for row in db.query(QuizAttempt.user_id).distinct().all()}
    active_learner_ids |= {row[0] for row in db.query(Enrollment.user_id).distinct().all()}

    critical_gaps = (
        db.query(func.count(SkillGap.id)).filter(SkillGap.severity == GapSeverity.CRITICAL).scalar() or 0
    )

    department_count = db.query(func.count(Department.id)).scalar() or 0

    avg_score = db.query(func.avg(QuizAttempt.score)).filter(QuizAttempt.score.isnot(None)).scalar()
    completed_enrollments = (
        db.query(func.count(Enrollment.id)).filter(Enrollment.status == EnrollmentStatus.COMPLETED).scalar() or 0
    )
    total_enrollments = db.query(func.count(Enrollment.id)).scalar() or 0
    completion_rate = round((completed_enrollments / total_enrollments) * 100, 1) if total_enrollments else 0.0

    return {
        "total_officers": total_officers,
        "active_learners": len(active_learner_ids),
        "critical_skill_gaps": critical_gaps,
        "departments_covered": department_count,
        "avg_assessment_score": round(avg_score, 1) if avg_score is not None else None,
        "course_completion_rate": completion_rate,
    }


@router.get("/competency-distribution", dependencies=[Depends(require_admin)])
def competency_distribution(db: Session = Depends(get_db)):
    """Average current level per domain, across everyone who has been assessed."""
    rows = (
        db.query(Competency.domain, func.avg(UserCompetency.current_level), func.count(UserCompetency.id))
        .join(UserCompetency, UserCompetency.competency_id == Competency.id)
        .group_by(Competency.domain)
        .all()
    )
    return [
        {"domain": domain.value, "average_level": round(avg_level, 2), "assessed_count": count}
        for domain, avg_level, count in rows
    ]


@router.get("/critical-gaps", dependencies=[Depends(require_admin)])
def critical_gaps(db: Session = Depends(get_db)):
    """Which competencies show up as CRITICAL gaps most often — a proxy for emerging training priorities."""
    rows = (
        db.query(Competency.name, Competency.domain, func.count(SkillGap.id))
        .join(SkillGap, SkillGap.competency_id == Competency.id)
        .filter(SkillGap.severity == GapSeverity.CRITICAL)
        .group_by(Competency.name, Competency.domain)
        .order_by(func.count(SkillGap.id).desc())
        .limit(10)
        .all()
    )
    return [
        {"competency_name": name, "domain": domain.value, "officers_affected": count}
        for name, domain, count in rows
    ]


@router.get("/department-breakdown", dependencies=[Depends(require_admin)])
def department_breakdown(db: Session = Depends(get_db)):
    rows = (
        db.query(Department.name, func.count(User.id))
        .outerjoin(User, User.department_id == Department.id)
        .group_by(Department.name)
        .all()
    )
    return [{"department": name, "officer_count": count} for name, count in rows]
