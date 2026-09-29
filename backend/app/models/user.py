import enum
import uuid
from typing import Optional

from sqlalchemy import Boolean, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class RoleName(str, enum.Enum):
    """The three primary system roles (Phase 1 foundation, enforced in Phase 2)."""

    STATISTICAL_OFFICER = "statistical_officer"
    TRAINER = "trainer"
    ADMIN = "admin"


class Department(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "departments"

    name: Mapped[str] = mapped_column(String(200), unique=True, nullable=False)
    code: Mapped[Optional[str]] = mapped_column(String(30), unique=True)

    users: Mapped[list["User"]] = relationship(back_populates="department")


class Role(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "roles"

    name: Mapped[RoleName] = mapped_column(Enum(RoleName), unique=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(300))

    users: Mapped[list["User"]] = relationship(back_populates="role")


class User(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """
    Core user / professional profile record.

    Profile fields (designation, job_role, education, experience, etc.) feed
    the Phase 3 competency framework and Phase 4 assessment engine.
    """

    __tablename__ = "users"

    full_name: Mapped[str] = mapped_column(String(200), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_email_verified: Mapped[bool] = mapped_column(Boolean, default=False)

    role_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("roles.id"))
    department_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("departments.id")
    )

    # Professional profile (Phase 3)
    designation: Mapped[Optional[str]] = mapped_column(String(200))
    job_role: Mapped[Optional[str]] = mapped_column(String(200))
    current_assignment: Mapped[Optional[str]] = mapped_column(String(300))
    education: Mapped[Optional[str]] = mapped_column(String(300))
    years_experience: Mapped[Optional[int]] = mapped_column(Integer)
    previous_training: Mapped[Optional[str]] = mapped_column(Text)

    # Onboarding gate: the frontend redirects here until this is True, so
    # every user's dashboard is driven by real self-reported data (feeding
    # the gap engine) rather than a fresh account seeing empty/static state.
    onboarding_completed: Mapped[bool] = mapped_column(Boolean, default=False)

    # Settings (Phase 12 addition)
    email_notifications_enabled: Mapped[bool] = mapped_column(Boolean, default=True)

    role: Mapped[Optional[Role]] = relationship(back_populates="users")
    department: Mapped[Optional[Department]] = relationship(back_populates="users")
