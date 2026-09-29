import enum
import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import JSON, DateTime, Enum, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class QuestionStatus(str, enum.Enum):
    AI_GENERATED = "ai_generated"  # not yet reviewed — never shown to learners
    APPROVED = "approved"
    EDITED = "edited"
    REJECTED = "rejected"


class MaterialType(str, enum.Enum):
    PDF = "pdf"
    PPTX = "pptx"
    DOCX = "docx"
    VIDEO = "video"


class Assessment(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "assessments"

    title: Mapped[str] = mapped_column(String(300), nullable=False)
    course_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("courses.id"))
    created_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    is_published: Mapped[bool] = mapped_column(default=False)

    questions: Mapped[list["Question"]] = relationship(back_populates="assessment")


class Question(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """
    An MCQ, either AI-generated from uploaded material (Phase 9) or authored
    manually. `status` gates visibility: only APPROVED / EDITED questions may
    be published to a live assessment — see CRITICAL rule: never
    auto-publish unverified AI-generated questions.
    """

    __tablename__ = "questions"

    assessment_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("assessments.id"), nullable=False
    )
    prompt: Mapped[str] = mapped_column(Text, nullable=False)
    options: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    correct_option_index: Mapped[int] = mapped_column(Integer, nullable=False)
    explanation: Mapped[Optional[str]] = mapped_column(Text)
    topic: Mapped[Optional[str]] = mapped_column(String(200))
    competency_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("competencies.id")
    )
    difficulty: Mapped[Optional[str]] = mapped_column(String(20))  # easy | medium | hard
    source_reference: Mapped[Optional[str]] = mapped_column(String(300))  # e.g. chunk id / page number
    status: Mapped[QuestionStatus] = mapped_column(Enum(QuestionStatus), default=QuestionStatus.AI_GENERATED)

    assessment: Mapped["Assessment"] = relationship(back_populates="questions")
    competency: Mapped[Optional["Competency"]] = relationship()


class QuizAttempt(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "quiz_attempts"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    assessment_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("assessments.id"), nullable=False
    )
    score: Mapped[Optional[float]] = mapped_column(Float)  # deterministic scoring for MCQs
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))


class UploadedMaterial(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Raw file uploaded by a trainer; feeds the Phase 8 content pipeline."""

    __tablename__ = "uploaded_materials"

    uploaded_by_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    course_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("courses.id"))
    file_name: Mapped[str] = mapped_column(String(300), nullable=False)
    file_type: Mapped[MaterialType] = mapped_column(Enum(MaterialType), nullable=False)
    storage_path: Mapped[str] = mapped_column(String(500), nullable=False)
    processed: Mapped[bool] = mapped_column(default=False)


class ContentChunk(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """
    A chunk of extracted text plus its embedding, used for semantic search
    (pgvector) and as grounding context for AI question generation / RAG.
    The embedding column is intentionally typed as JSON here for
    portability across dev databases; swap to pgvector's Vector type (and
    add an ivfflat/HNSW index) once the extension is provisioned in the
    target Postgres instance.
    """

    __tablename__ = "content_chunks"

    material_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("uploaded_materials.id"), nullable=False
    )
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    embedding: Mapped[Optional[list[float]]] = mapped_column(JSON)
