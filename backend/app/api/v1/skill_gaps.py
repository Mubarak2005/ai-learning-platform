from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.rbac import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.gap import SkillGapItem
from app.services.gap_service import get_skill_gaps

router = APIRouter()


def _to_item(row) -> SkillGapItem:
    return SkillGapItem(
        competency_id=row.competency_id,
        competency_name=row.competency.name,
        domain=row.competency.domain.value,
        required_level=row.required_level,
        current_level=row.current_level,
        gap_score=row.gap_score,
        severity=row.severity,
    )


@router.get("/me", response_model=list[SkillGapItem])
def my_skill_gaps(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = get_skill_gaps(db, current_user, recompute=True)
    rows = sorted(rows, key=lambda r: r.gap_score, reverse=True)
    return [_to_item(r) for r in rows]
