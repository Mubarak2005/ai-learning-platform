"""
Auth business logic, kept separate from the route layer so it can be
reused (e.g. by a future admin "create user" endpoint) and unit tested
without spinning up FastAPI.
"""

from typing import Optional

from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.models.user import Role, RoleName, User


class EmailAlreadyRegisteredError(Exception):
    pass


def get_or_create_role(db: Session, role_name: RoleName) -> Role:
    role = db.query(Role).filter(Role.name == role_name).first()
    if role:
        return role
    role = Role(name=role_name, description=role_name.value.replace("_", " ").title())
    db.add(role)
    db.flush()
    return role


def register_user(
    db: Session,
    *,
    full_name: str,
    email: str,
    password: str,
    role_name: RoleName,
    department_id=None,
) -> User:
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise EmailAlreadyRegisteredError(email)

    role = get_or_create_role(db, role_name)

    user = User(
        full_name=full_name,
        email=email,
        hashed_password=hash_password(password),
        role_id=role.id,
        department_id=department_id,
        is_active=True,
        is_email_verified=False,  # Phase 2 foundation: OTP/email verification flow hooks here
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, *, email: str, password: str) -> Optional[User]:
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.hashed_password):
        return None
    if not user.is_active:
        return None
    return user
