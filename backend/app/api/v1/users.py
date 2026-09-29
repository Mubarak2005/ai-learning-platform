from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.rbac import get_current_user
from app.database import get_db
from app.models.competency import Competency, CompetencyHistory, UserCompetency
from app.models.user import Department, User
from app.schemas.user import (
    DepartmentResponse,
    OnboardingRequest,
    OnboardingResponse,
    ProfileResponse,
    ProfileUpdateRequest,
    SettingsUpdateRequest,
)
from app.services.gap_service import recompute_skill_gaps
from app.services.recommendation_service import generate_recommendations

router = APIRouter()


def _to_profile_response(user: User) -> ProfileResponse:
    return ProfileResponse(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        role=user.role.name if user.role else None,
        department_id=user.department_id,
        department_name=user.department.name if user.department else None,
        designation=user.designation,
        job_role=user.job_role,
        current_assignment=user.current_assignment,
        education=user.education,
        years_experience=user.years_experience,
        previous_training=user.previous_training,
        onboarding_completed=user.onboarding_completed,
        email_notifications_enabled=user.email_notifications_enabled,
    )


@router.get("/me/profile", response_model=ProfileResponse)
def get_my_profile(current_user: User = Depends(get_current_user)):
    return _to_profile_response(current_user)


@router.put("/me/profile", response_model=ProfileResponse)
def update_my_profile(
    payload: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(current_user, field, value)
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return _to_profile_response(current_user)


@router.get("/departments", response_model=list[DepartmentResponse])
def list_departments(db: Session = Depends(get_db)):
    return db.query(Department).order_by(Department.name).all()


@router.put("/me/settings", response_model=ProfileResponse)
def update_my_settings(
    payload: SettingsUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.email_notifications_enabled is not None:
        current_user.email_notifications_enabled = payload.email_notifications_enabled
        db.add(current_user)
        db.commit()
        db.refresh(current_user)
    return _to_profile_response(current_user)


@router.post("/me/onboarding", response_model=OnboardingResponse)
def complete_onboarding(
    payload: OnboardingRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    The single intake step every new user goes through once, right after
    email verification. This is what makes the rest of the platform
    data-driven instead of static:

        intake (designation, job role, self-rated skills, ...)
            -> UserCompetency seeded from self-ratings
            -> Skill Gap Analysis (Phase 5) recomputed against the
               job role's real requirements
            -> Recommendation Engine (Phase 6) regenerated against those
               gaps

    Self-ratings are stored with confidence=0.5 and evidence
    "self_reported_onboarding" — distinct from the higher-confidence
    evidence an actual quiz attempt produces (Phase 4), so a later
    assessment can still meaningfully override a rough self-estimate.
    """
    current_user.designation = payload.designation
    current_user.job_role = payload.job_role
    current_user.department_id = payload.department_id
    current_user.current_assignment = payload.current_assignment
    current_user.education = payload.education
    current_user.years_experience = payload.years_experience
    current_user.previous_training = payload.previous_training
    current_user.onboarding_completed = True
    db.add(current_user)
    db.flush()

    now = datetime.now(timezone.utc)
    for skill in payload.skills:
        competency = db.query(Competency).filter(Competency.id == skill.competency_id).first()
        if not competency:
            continue

        existing = (
            db.query(UserCompetency)
            .filter(
                UserCompetency.user_id == current_user.id,
                UserCompetency.competency_id == skill.competency_id,
            )
            .first()
        )
        if existing:
            existing.current_level = skill.self_rated_level
            existing.confidence = 0.5
            existing.assessment_date = now
            existing.evidence = "self_reported_onboarding"
            db.add(existing)
        else:
            db.add(
                UserCompetency(
                    user_id=current_user.id,
                    competency_id=skill.competency_id,
                    current_level=skill.self_rated_level,
                    confidence=0.5,
                    assessment_date=now,
                    evidence="self_reported_onboarding",
                )
            )
        db.add(
            CompetencyHistory(
                user_id=current_user.id,
                competency_id=skill.competency_id,
                level=skill.self_rated_level,
                source="onboarding_self_report",
            )
        )

    db.commit()
    db.refresh(current_user)

    gaps = recompute_skill_gaps(db, current_user)
    critical_count = sum(1 for g in gaps if g.severity.value == "critical")

    recommendations = generate_recommendations(db, current_user)

    return OnboardingResponse(
        profile=_to_profile_response(current_user),
        gaps_identified=len(gaps),
        critical_gaps=critical_count,
        recommendations_generated=len(recommendations),
    )
