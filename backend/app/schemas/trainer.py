import uuid
from typing import Optional

from pydantic import BaseModel

from app.models.assessment import MaterialType, QuestionStatus


class MaterialResponse(BaseModel):
    id: uuid.UUID
    file_name: str
    file_type: MaterialType
    processed: bool

    model_config = {"from_attributes": True}


class GenerateQuestionsRequest(BaseModel):
    question_count: int = 10


class QuestionReviewOut(BaseModel):
    """Trainer-facing view — includes the correct answer, unlike the learner-facing QuestionOut."""

    id: uuid.UUID
    prompt: str
    options: list[str]
    correct_option_index: int
    explanation: Optional[str] = None
    topic: Optional[str] = None
    difficulty: Optional[str] = None
    status: QuestionStatus


class AssessmentReviewOut(BaseModel):
    id: uuid.UUID
    title: str
    is_published: bool
    questions: list[QuestionReviewOut]


class AssessmentSummary(BaseModel):
    id: uuid.UUID
    title: str
    is_published: bool
    total_questions: int
    approved_count: int
    pending_count: int
    rejected_count: int


class QuestionReviewUpdate(BaseModel):
    status: QuestionStatus
    prompt: Optional[str] = None
    options: Optional[list[str]] = None
    correct_option_index: Optional[int] = None
    explanation: Optional[str] = None
