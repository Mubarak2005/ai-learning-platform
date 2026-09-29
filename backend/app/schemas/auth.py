import uuid
from typing import Optional

from pydantic import BaseModel, EmailStr, Field

from app.models.user import RoleName


class RegisterRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=200)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: RoleName
    department_id: Optional[uuid.UUID] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: uuid.UUID
    full_name: str
    email: EmailStr
    role: Optional[RoleName] = None
    department_id: Optional[uuid.UUID] = None
    department_name: Optional[str] = None
    is_active: bool
    is_email_verified: bool
    onboarding_completed: bool

    model_config = {"from_attributes": True}


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    email: EmailStr
    code: str = Field(min_length=4, max_length=10)
    new_password: str = Field(min_length=8, max_length=128)


class OtpSendRequest(BaseModel):
    purpose: str = Field(pattern="^(email_verification)$")


class OtpVerifyRequest(BaseModel):
    code: str = Field(min_length=4, max_length=10)
