import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.rbac import get_current_user
from app.database import get_db
from app.models.learning import Course, CourseSource, Enrollment, EnrollmentStatus, LearningProgress
from app.models.user import User
from app.schemas.learning import CourseResponse, EnrollmentResponse, ProgressUpdateRequest

router = APIRouter()


@router.get("", response_model=list[CourseResponse])
def list_courses(source: CourseSource | None = None, db: Session = Depends(get_db)):
    query = db.query(Course)
    if source:
        query = query.filter(Course.source == source)
    return query.order_by(Course.title).all()


@router.get("/enrollments/me", response_model=list[EnrollmentResponse])
def my_enrollments(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    enrollments = db.query(Enrollment).filter(Enrollment.user_id == current_user.id).all()
    return [_to_enrollment_response(e, _percent_for(db, e.id)) for e in enrollments]


@router.get("/{course_id}", response_model=CourseResponse)
def get_course(course_id: uuid.UUID, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found.")
    return course


@router.post("/{course_id}/enroll", response_model=EnrollmentResponse, status_code=status.HTTP_201_CREATED)
def enroll_in_course(
    course_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found.")

    existing = (
        db.query(Enrollment)
        .filter(Enrollment.user_id == current_user.id, Enrollment.course_id == course_id)
        .first()
    )
    if existing:
        percent = _percent_for(db, existing.id)
        return _to_enrollment_response(existing, percent)

    enrollment = Enrollment(user_id=current_user.id, course_id=course_id, status=EnrollmentStatus.ENROLLED)
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)
    return _to_enrollment_response(enrollment, 0)


@router.put("/enrollments/{enrollment_id}/progress", response_model=EnrollmentResponse)
def update_progress(
    enrollment_id: uuid.UUID,
    payload: ProgressUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    enrollment = (
        db.query(Enrollment)
        .filter(Enrollment.id == enrollment_id, Enrollment.user_id == current_user.id)
        .first()
    )
    if not enrollment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Enrollment not found.")

    percent = max(0.0, min(100.0, payload.percent_complete))
    progress = (
        db.query(LearningProgress).filter(LearningProgress.enrollment_id == enrollment.id).first()
    )
    if progress:
        progress.percent_complete = percent
    else:
        progress = LearningProgress(enrollment_id=enrollment.id, percent_complete=percent)
    db.add(progress)

    if percent >= 100:
        enrollment.status = EnrollmentStatus.COMPLETED
        enrollment.completed_at = datetime.now(timezone.utc)
    elif percent > 0:
        enrollment.status = EnrollmentStatus.IN_PROGRESS
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)
    return _to_enrollment_response(enrollment, percent)


def _percent_for(db: Session, enrollment_id: uuid.UUID) -> float:
    progress = db.query(LearningProgress).filter(LearningProgress.enrollment_id == enrollment_id).first()
    return progress.percent_complete if progress else 0.0


def _to_enrollment_response(enrollment: Enrollment, percent: float) -> EnrollmentResponse:
    return EnrollmentResponse(
        id=enrollment.id,
        course=enrollment.course,
        status=enrollment.status,
        enrolled_at=enrollment.enrolled_at,
        percent_complete=percent,
    )
