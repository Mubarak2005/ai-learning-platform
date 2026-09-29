import uuid
from typing import Optional

from pydantic import BaseModel

from app.models.competency import CompetencyDomain


class CompetencyResponse(BaseModel):
    id: uuid.UUID
    name: str
    domain: CompetencyDomain
    description: Optional[str] = None

    model_config = {"from_attributes": True}


class RoleCompetencyRequirement(BaseModel):
    competency_id: uuid.UUID
    competency_name: str
    domain: CompetencyDomain
    required_level: int


class JobRoleFrameworkResponse(BaseModel):
    job_role: str
    requirements: list[RoleCompetencyRequirement]
