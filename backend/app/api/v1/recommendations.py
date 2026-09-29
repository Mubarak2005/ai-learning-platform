from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.rbac import get_current_user
from app.database import get_db
from app.models.learning import Recommendation
from app.models.user import User
from app.schemas.learning import RecommendationResponse
from app.services.recommendation_service import generate_recommendations

router = APIRouter()


@router.get("/me", response_model=list[RecommendationResponse])
def my_recommendations(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    existing = (
        db.query(Recommendation)
        .filter(Recommendation.user_id == current_user.id)
        .order_by(Recommendation.score.desc())
        .all()
    )
    if existing:
        return existing
    return generate_recommendations(db, current_user)


@router.post("/me/refresh", response_model=list[RecommendationResponse])
def refresh_recommendations(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return generate_recommendations(db, current_user)
