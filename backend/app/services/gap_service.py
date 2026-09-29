"""
Phase 5 — Skill Gap Analysis Engine.

Gap = required_level - current_level. Purely arithmetic — no LLM involved,
per the platform's "rules/scoring for competency math" principle. This
runs whenever gaps are requested, and is also triggered automatically
right after an assessment updates UserCompetency (see assessment_service),
so gaps never go stale after a new score comes in.
"""

from sqlalchemy.orm import Session

from app.models.competency import Competency, GapSeverity, RoleCompetency, SkillGap, UserCompetency
from app.models.user import User


def _severity_for(gap: float) -> GapSeverity:
    if gap >= 2:
        return GapSeverity.CRITICAL
    if gap >= 1:
        return GapSeverity.MODERATE
    if gap > 0:
        return GapSeverity.LOW
    return GapSeverity.NONE


def recompute_skill_gaps(db: Session, user: User) -> list[SkillGap]:
    """Recomputes and upserts every SkillGap row for a user's job role."""
    if not user.job_role:
        return []

    requirements = db.query(RoleCompetency).filter(RoleCompetency.job_role == user.job_role).all()
    if not requirements:
        return []

    current_levels = {
        uc.competency_id: uc.current_level
        for uc in db.query(UserCompetency).filter(UserCompetency.user_id == user.id).all()
    }

    results = []
    for req in requirements:
        current = current_levels.get(req.competency_id, 0.0)
        gap_score = round(max(0.0, req.required_level - current), 2)
        severity = _severity_for(gap_score)

        row = (
            db.query(SkillGap)
            .filter(SkillGap.user_id == user.id, SkillGap.competency_id == req.competency_id)
            .first()
        )
        if row:
            row.required_level = req.required_level
            row.current_level = current
            row.gap_score = gap_score
            row.severity = severity
        else:
            row = SkillGap(
                user_id=user.id,
                competency_id=req.competency_id,
                required_level=req.required_level,
                current_level=current,
                gap_score=gap_score,
                severity=severity,
            )
        db.add(row)
        results.append(row)

    db.commit()
    return results


def get_skill_gaps(db: Session, user: User, *, recompute: bool = True) -> list[SkillGap]:
    if recompute:
        return recompute_skill_gaps(db, user)
    return db.query(SkillGap).filter(SkillGap.user_id == user.id).all()
