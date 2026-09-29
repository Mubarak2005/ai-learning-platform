import uuid
from typing import Optional

from pydantic import BaseModel, Field

from app.models.user import RoleName


class ProfileUpdateRequest(BaseModel):
    designation: Optional[str] = Field(None, max_length=200)
    job_role: Optional[str] = Field(None, max_length=200)
    current_assignment: Optional[str] = Field(None, max_length=300)
    education: Optional[str] = Field(None, max_length=300)
    years_experience: Optional[int] = Field(None, ge=0, le=60)
    previous_training: Optional[str] = Field(None, max_length=2000)
    department_id: Optional[uuid.UUID] = None


class ProfileResponse(BaseModel):
    id: uuid.UUID
    full_name: str
    email: str
    role: Optional[RoleName] = None
    department_id: Optional[uuid.UUID] = None
    department_name: Optional[str] = None
    designation: Optional[str] = None
    job_role: Optional[str] = None
    current_assignment: Optional[str] = None
    education: Optional[str] = None
    years_experience: Optional[int] = None
    previous_training: Optional[str] = None
    onboarding_completed: bool = False
    email_notifications_enabled: bool = True

    model_config = {"from_attributes": True}


class DepartmentResponse(BaseModel):
    id: uuid.UUID
    name: str
    code: Optional[str] = None

    model_config = {"from_attributes": True}


class SkillSelfRating(BaseModel):
    competency_id: uuid.UUID
    self_rated_level: float = Field(ge=0, le=5)


class OnboardingRequest(BaseModel):
    designation: str = Field(min_length=1, max_length=200)
    job_role: str = Field(min_length=1, max_length=200)
    department_id: Optional[uuid.UUID] = None
    current_assignment: Optional[str] = Field(None, max_length=300)
    education: Optional[str] = Field(None, max_length=300)
    years_experience: Optional[int] = Field(None, ge=0, le=60)
    previous_training: Optional[str] = Field(None, max_length=2000)
    skills: list[SkillSelfRating] = Field(default_factory=list)


class OnboardingResponse(BaseModel):
    profile: ProfileResponse
    gaps_identified: int
    critical_gaps: int
    recommendations_generated: int


class SettingsUpdateRequest(BaseModel):
    email_notifications_enabled: Optional[bool] = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)
