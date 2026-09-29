import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.models.learning import CourseSource, EnrollmentStatus


class CourseResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: Optional[str] = None
    source: CourseSource
    duration_hours: Optional[float] = None
    url: Optional[str] = None

    model_config = {"from_attributes": True}


class EnrollmentResponse(BaseModel):
    id: uuid.UUID
    course: CourseResponse
    status: EnrollmentStatus
    enrolled_at: datetime
    percent_complete: float = 0

    model_config = {"from_attributes": True}


class ProgressUpdateRequest(BaseModel):
    percent_complete: float


class RecommendationResponse(BaseModel):
    id: uuid.UUID
    course: CourseResponse
    score: float
    reason: str

    model_config = {"from_attributes": True}
