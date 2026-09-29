import enum
import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Enum, Float, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class CourseSource(str, enum.Enum):
    IGOT_KARMAYOGI = "igot_karmayogi"
    NSSTA_TPAC = "nssta_tpac"
    INTERNAL = "internal"


class EnrollmentStatus(str, enum.Enum):
    ENROLLED = "enrolled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    DROPPED = "dropped"


class Course(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """
    Unified course record. `source` + `external_id` let this row represent
    either a cached iGOT/NSSTA catalogue entry or an internally authored course.
    See services/integrations for the adapter that populates these from
    external APIs (Phase 7).
    """

    __tablename__ = "courses"

    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    source: Mapped[CourseSource] = mapped_column(Enum(CourseSource), nullable=False)
    external_id: Mapped[Optional[str]] = mapped_column(String(200), index=True)
    duration_hours: Mapped[Optional[float]] = mapped_column(Float)
    url: Mapped[Optional[str]] = mapped_column(String(500))


class CourseCompetency(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Which competencies a course develops, and to what level."""

    __tablename__ = "course_competencies"

    course_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("courses.id"), nullable=False)
    competency_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("competencies.id"), nullable=False
    )
    target_level: Mapped[int] = mapped_column(nullable=False, default=3)


class Enrollment(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "enrollments"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    course_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("courses.id"), nullable=False)
    status: Mapped[EnrollmentStatus] = mapped_column(Enum(EnrollmentStatus), default=EnrollmentStatus.ENROLLED)
    enrolled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    course: Mapped["Course"] = relationship()


class LearningProgress(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "learning_progress"

    enrollment_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("enrollments.id"), nullable=False
    )
    percent_complete: Mapped[float] = mapped_column(Float, default=0)
    last_activity_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))


class Recommendation(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """
    Output of the Phase 6 recommendation engine. `reason` always stores a
    short human-readable explanation ("why this was recommended") — the
    platform never surfaces a recommendation without one.
    """

    __tablename__ = "recommendations"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    course_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("courses.id"), nullable=False)
    skill_gap_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("skill_gaps.id")
    )
    score: Mapped[float] = mapped_column(Float, nullable=False)  # ranking score
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    course: Mapped["Course"] = relationship()
