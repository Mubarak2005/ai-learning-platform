"""
Populates the internal `Course` / `CourseCompetency` tables from the
iGOT and NSSTA adapters. This is the "cache" that the rest of the
platform reads from — the recommendation engine, course browsing, and
enrollment all query `Course` directly rather than calling the adapters
on every request.
"""

from sqlalchemy.orm import Session

from app.models.competency import Competency
from app.models.learning import Course, CourseCompetency, CourseSource
from app.services.integrations.course_catalog import get_igot_adapter, get_nssta_adapter


def sync_course_catalog(db: Session) -> dict:
    competencies = db.query(Competency).all()
    if not competencies:
        return {"igot": 0, "nssta": 0}

    names = [c.name for c in competencies]
    by_name = {c.name: c for c in competencies}

    created = {"igot": 0, "nssta": 0}

    for source, adapter in (
        (CourseSource.IGOT_KARMAYOGI, get_igot_adapter()),
        (CourseSource.NSSTA_TPAC, get_nssta_adapter()),
    ):
        adapter_courses = adapter.list_courses_for_competencies(names)
        for ac in adapter_courses:
            existing = (
                db.query(Course)
                .filter(Course.source == source, Course.external_id == ac.external_id)
                .first()
            )
            if existing:
                continue

            course = Course(
                title=ac.title,
                description=ac.description,
                source=source,
                external_id=ac.external_id,
                duration_hours=ac.duration_hours,
                url=ac.url,
            )
            db.add(course)
            db.flush()

            for comp_name in ac.competency_names:
                competency = by_name.get(comp_name)
                if not competency:
                    continue
                db.add(
                    CourseCompetency(
                        course_id=course.id,
                        competency_id=competency.id,
                        target_level=ac.target_level,
                    )
                )

            created["igot" if source == CourseSource.IGOT_KARMAYOGI else "nssta"] += 1

    db.commit()
    return created
