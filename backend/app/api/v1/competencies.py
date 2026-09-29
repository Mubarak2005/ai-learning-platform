from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.rbac import get_current_user
from app.database import get_db
from app.models.competency import Competency, CompetencyDomain, RoleCompetency, UserCompetency
from app.models.user import User
from app.schemas.competency import (
    CompetencyResponse,
    JobRoleFrameworkResponse,
    RoleCompetencyRequirement,
)
from app.schemas.assessment import MyCompetencyItem

router = APIRouter()


@router.get("", response_model=list[CompetencyResponse])
def list_competencies(
    domain: Optional[CompetencyDomain] = Query(None, description="Filter by competency domain"),
    db: Session = Depends(get_db),
):
    query = db.query(Competency)
    if domain:
        query = query.filter(Competency.domain == domain)
    return query.order_by(Competency.domain, Competency.name).all()


@router.get("/job-roles", response_model=list[str])
def list_job_roles(db: Session = Depends(get_db)):
    rows = db.query(RoleCompetency.job_role).distinct().order_by(RoleCompetency.job_role).all()
    return [r[0] for r in rows]


@router.get("/job-roles/{job_role}", response_model=JobRoleFrameworkResponse)
def get_job_role_framework(job_role: str, db: Session = Depends(get_db)):
    rows = (
        db.query(RoleCompetency)
        .join(Competency, RoleCompetency.competency_id == Competency.id)
        .filter(RoleCompetency.job_role == job_role)
        .all()
    )
    requirements = [
        RoleCompetencyRequirement(
            competency_id=row.competency.id,
            competency_name=row.competency.name,
            domain=row.competency.domain,
            required_level=row.required_level,
        )
        for row in rows
    ]
    return JobRoleFrameworkResponse(job_role=job_role, requirements=requirements)


@router.get("/me", response_model=list[MyCompetencyItem])
def my_competencies(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(UserCompetency)
        .filter(UserCompetency.user_id == current_user.id)
        .join(Competency, UserCompetency.competency_id == Competency.id)
        .all()
    )
    return [
        MyCompetencyItem(
            competency_id=row.competency_id,
            competency_name=row.competency.name,
            domain=row.competency.domain.value,
            current_level=row.current_level,
            confidence=row.confidence,
            assessment_date=row.assessment_date.isoformat() if row.assessment_date else None,
        )
        for row in rows
    ]
