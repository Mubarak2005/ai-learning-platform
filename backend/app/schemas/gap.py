import uuid

from pydantic import BaseModel

from app.models.competency import GapSeverity


class SkillGapItem(BaseModel):
    competency_id: uuid.UUID
    competency_name: str
    domain: str
    required_level: float
    current_level: float
    gap_score: float
    severity: GapSeverity

    model_config = {"from_attributes": True}
