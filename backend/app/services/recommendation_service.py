"""
Phase 6 — AI Recommendation Engine.

Ranking is deterministic (rules + arithmetic), consistent with the
platform's architecture principle of not letting an LLM be responsible
for the whole system: an LLM could later be added to rerank or explain in
richer language, but the score itself is computed here, transparently,
and every recommendation always carries a human-readable `reason`.
"""

from sqlalchemy.orm import Session

from app.models.competency import GapSeverity
from app.models.learning import Course, CourseCompetency, Recommendation
from app.models.user import User
from app.services.gap_service import get_skill_gaps

_SEVERITY_WEIGHT = {
    GapSeverity.CRITICAL: 3.0,
    GapSeverity.MODERATE: 2.0,
    GapSeverity.LOW: 1.0,
    GapSeverity.NONE: 0.0,
}

MAX_RECOMMENDATIONS = 10


def generate_recommendations(db: Session, user: User) -> list[Recommendation]:
    gaps = get_skill_gaps(db, user, recompute=True)
    gaps = [g for g in gaps if g.severity != GapSeverity.NONE]
    if not gaps:
        return []

    # Clear previous recommendations for this user so the list always
    # reflects the latest gap analysis rather than accumulating stale rows.
    db.query(Recommendation).filter(Recommendation.user_id == user.id).delete()

    scored: list[tuple[float, Course, str, object]] = []

    for gap in gaps:
        candidate_links = (
            db.query(CourseCompetency)
            .filter(CourseCompetency.competency_id == gap.competency_id)
            .all()
        )
        for link in candidate_links:
            course = db.query(Course).filter(Course.id == link.course_id).first()
            if not course:
                continue

            # Prefer courses whose target level actually closes the gap
            # (target >= required) without being wildly overqualified.
            level_fit = 1.0 if link.target_level >= gap.required_level else 0.5
            score = round(_SEVERITY_WEIGHT[gap.severity] * gap.gap_score * level_fit, 2)

            reason = (
                f"Your current level in {gap.competency.name} is {gap.current_level}, "
                f"below the {gap.required_level} required for your role "
                f"(a {gap.severity.value} gap of {gap.gap_score}). "
                f"This course targets level {link.target_level}."
            )
            scored.append((score, course, reason, gap))

    scored.sort(key=lambda t: t[0], reverse=True)

    # Keep the single highest-scoring course per gap competency to avoid
    # flooding the list with near-duplicate courses for the same skill,
    # then take the overall top N.
    seen_courses = set()
    recommendations = []
    for score, course, reason, gap in scored:
        if course.id in seen_courses:
            continue
        seen_courses.add(course.id)
        rec = Recommendation(
            user_id=user.id,
            course_id=course.id,
            skill_gap_id=gap.id,
            score=score,
            reason=reason,
        )
        db.add(rec)
        recommendations.append(rec)
        if len(recommendations) >= MAX_RECOMMENDATIONS:
            break

    db.commit()
    for r in recommendations:
        db.refresh(r)
    return recommendations
