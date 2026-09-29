import enum
import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Enum, Float, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class CompetencyDomain(str, enum.Enum):
    STATISTICAL = "statistical"
    TECHNICAL = "technical"
    DIGITAL_GOVERNANCE = "digital_governance"
    BEHAVIOURAL_MANAGERIAL = "behavioural_managerial"


class GapSeverity(str, enum.Enum):
    CRITICAL = "critical"
    MODERATE = "moderate"
    LOW = "low"
    NONE = "none"


class Competency(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """A single competency, e.g. 'Survey Design' or 'Python'."""

    __tablename__ = "competencies"

    name: Mapped[str] = mapped_column(String(200), nullable=False, unique=True)
    domain: Mapped[CompetencyDomain] = mapped_column(Enum(CompetencyDomain), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)


class RoleCompetency(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Maps a job role to a required competency and the level expected."""

    __tablename__ = "role_competencies"

    job_role: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    competency_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("competencies.id"), nullable=False
    )
    required_level: Mapped[int] = mapped_column(nullable=False, default=3)  # 1-5 scale

    competency: Mapped["Competency"] = relationship()


class UserCompetency(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """A user's current assessed level for a competency (Phase 4 output)."""

    __tablename__ = "user_competencies"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    competency_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("competencies.id"), nullable=False
    )
    current_level: Mapped[float] = mapped_column(Float, nullable=False, default=0)  # 0-5 scale
    confidence: Mapped[Optional[float]] = mapped_column(Float)  # 0-1, model confidence
    assessment_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    evidence: Mapped[Optional[str]] = mapped_column(Text)  # e.g. assessment id / quiz reference

    competency: Mapped["Competency"] = relationship()


class SkillGap(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Computed deterministically: required_level - current_level (Phase 5)."""

    __tablename__ = "skill_gaps"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    competency_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("competencies.id"), nullable=False
    )
    required_level: Mapped[float] = mapped_column(Float, nullable=False)
    current_level: Mapped[float] = mapped_column(Float, nullable=False)
    gap_score: Mapped[float] = mapped_column(Float, nullable=False)
    severity: Mapped[GapSeverity] = mapped_column(Enum(GapSeverity), nullable=False)

    competency: Mapped["Competency"] = relationship()


class CompetencyHistory(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Historical snapshot so admins can chart improvement over time."""

    __tablename__ = "competency_history"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    competency_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("competencies.id"), nullable=False
    )
    level: Mapped[float] = mapped_column(Float, nullable=False)
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    source: Mapped[Optional[str]] = mapped_column(String(200))  # e.g. "quiz_attempt", "manual_review"
