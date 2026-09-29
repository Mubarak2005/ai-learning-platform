"""
Seed the database with reference data: departments, system roles, the
competency framework, and role-competency requirements.

Safe to run multiple times — every insert is guarded by an existence check.

Usage:
    python -m scripts.seed_db
"""

import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent))

from app.data.competency_framework import (  # noqa: E402
    COMPETENCIES,
    DEPARTMENTS,
    ROLE_COMPETENCY_REQUIREMENTS,
)
from app.database import Base, SessionLocal, engine  # noqa: E402
from app.models.competency import Competency, RoleCompetency  # noqa: E402
from app.models.user import Department, Role, RoleName  # noqa: E402
from app.services.course_service import sync_course_catalog  # noqa: E402
import app.models  # noqa: E402, F401  ensures all model modules are registered


def seed_departments(db):
    created = 0
    for name, code in DEPARTMENTS:
        exists = db.query(Department).filter(Department.name == name).first()
        if not exists:
            db.add(Department(name=name, code=code))
            created += 1
    db.commit()
    print(f"Departments: {created} created")


def seed_roles(db):
    created = 0
    for role_name in RoleName:
        exists = db.query(Role).filter(Role.name == role_name).first()
        if not exists:
            db.add(Role(name=role_name, description=role_name.value.replace("_", " ").title()))
            created += 1
    db.commit()
    print(f"Roles: {created} created")


def seed_competencies(db):
    created = 0
    for domain, names in COMPETENCIES.items():
        for name in names:
            exists = db.query(Competency).filter(Competency.name == name).first()
            if not exists:
                db.add(Competency(name=name, domain=domain))
                created += 1
    db.commit()
    print(f"Competencies: {created} created")


def seed_role_competencies(db):
    created = 0
    for job_role, requirements in ROLE_COMPETENCY_REQUIREMENTS.items():
        for competency_name, required_level in requirements.items():
            competency = db.query(Competency).filter(Competency.name == competency_name).first()
            if not competency:
                print(f"  WARNING: competency '{competency_name}' not found, skipping")
                continue
            exists = (
                db.query(RoleCompetency)
                .filter(
                    RoleCompetency.job_role == job_role,
                    RoleCompetency.competency_id == competency.id,
                )
                .first()
            )
            if not exists:
                db.add(
                    RoleCompetency(
                        job_role=job_role,
                        competency_id=competency.id,
                        required_level=required_level,
                    )
                )
                created += 1
    db.commit()
    print(f"Role-competency mappings: {created} created")


def seed_course_catalog(db):
    result = sync_course_catalog(db)
    print(f"Course catalog: {result['igot']} iGOT courses, {result['nssta']} NSSTA courses created")


def main():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_departments(db)
        seed_roles(db)
        seed_competencies(db)
        seed_role_competencies(db)
        seed_course_catalog(db)
        print("Seed complete.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
