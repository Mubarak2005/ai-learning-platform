from fastapi import APIRouter

from app.api.v1 import (
    admin,
    analytics,
    assessments,
    auth,
    community,
    competencies,
    courses,
    health,
    recommendations,
    skill_gaps,
    trainer,
    users,
)

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(analytics.router, prefix="/users", tags=["analytics"])
api_router.include_router(competencies.router, prefix="/competencies", tags=["competencies"])
api_router.include_router(assessments.router, prefix="/assessments", tags=["assessments"])
api_router.include_router(skill_gaps.router, prefix="/skill-gaps", tags=["skill-gaps"])
api_router.include_router(courses.router, prefix="/courses", tags=["courses"])
api_router.include_router(recommendations.router, prefix="/recommendations", tags=["recommendations"])
api_router.include_router(trainer.router, prefix="/trainer", tags=["trainer"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(community.router, prefix="/community", tags=["community"])
