import uuid
from typing import Optional

from pydantic import BaseModel


class QuestionOut(BaseModel):
    """Question shown to the learner — never includes the correct answer."""

    id: uuid.UUID
    prompt: str
    options: list[str]
    topic: Optional[str] = None
    difficulty: Optional[str] = None


class AssessmentOut(BaseModel):
    id: uuid.UUID
    title: str
    questions: list[QuestionOut]


class SubmitAnswersRequest(BaseModel):
    # question_id (as string) -> selected option index
    answers: dict[str, int]


class QuestionResult(BaseModel):
    question_id: str
    prompt: str
    selected_option_index: Optional[int] = None
    correct_option_index: int
    is_correct: bool
    explanation: Optional[str] = None


class CompetencyResultBreakdown(BaseModel):
    competency_id: str
    competency_name: str
    domain: str
    correct: int
    total: int
    percent: float
    new_level: Optional[float] = None
    questions: list[QuestionResult]


class AssessmentResultResponse(BaseModel):
    assessment_id: str
    overall_percent: float
    total_questions: int
    total_correct: int
    breakdown: list[CompetencyResultBreakdown]
    feedback: Optional[str] = None


class MyCompetencyItem(BaseModel):
    competency_id: uuid.UUID
    competency_name: str
    domain: str
    current_level: float
    confidence: Optional[float] = None
    assessment_date: Optional[str] = None


class QuizAttemptSummary(BaseModel):
    id: uuid.UUID
    assessment_id: uuid.UUID
    score: Optional[float] = None
    completed_at: Optional[str] = None
