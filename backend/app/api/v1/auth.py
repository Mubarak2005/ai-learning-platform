from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.audit import record_audit_event
from app.core.rbac import get_current_user
from app.core.security import create_access_token, hash_password
from app.database import get_db
from app.models.auth import OtpPurpose
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    OtpSendRequest,
    OtpVerifyRequest,
    PasswordResetConfirm,
    PasswordResetRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)
from app.schemas.user import ChangePasswordRequest
from app.services.auth_service import (
    EmailAlreadyRegisteredError,
    authenticate_user,
    register_user,
)
from app.services.otp_service import OtpVerificationError, issue_otp, verify_otp
from app.core.security import verify_password

router = APIRouter()


def _to_user_response(user: User) -> UserResponse:
    return UserResponse(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        role=user.role.name if user.role else None,
        department_id=user.department_id,
        department_name=user.department.name if user.department else None,
        is_active=user.is_active,
        is_email_verified=user.is_email_verified,
        onboarding_completed=user.onboarding_completed,
    )


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, request: Request, db: Session = Depends(get_db)):
    try:
        user = register_user(
            db,
            full_name=payload.full_name,
            email=payload.email,
            password=payload.password,
            role_name=payload.role,
            department_id=payload.department_id,
        )
    except EmailAlreadyRegisteredError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    record_audit_event(
        db, action="user_registered", user_id=user.id,
        ip_address=request.client.host if request.client else None,
    )

    # Fire off the verification email immediately. Failure to send (e.g. SMTP
    # misconfigured) should not block account creation — the user can hit
    # "resend" from the verify-email screen.
    try:
        issue_otp(db, user=user, purpose=OtpPurpose.EMAIL_VERIFICATION)
    except Exception:  # noqa: BLE001
        pass

    return _to_user_response(user)


@router.post("/login", response_model=TokenResponse)
def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # OAuth2PasswordRequestForm uses `username` as the field name; we treat it as email.
    user = authenticate_user(db, email=form_data.username, password=form_data.password)
    ip = request.client.host if request.client else None
    if not user:
        record_audit_event(db, action="login_failed", detail=form_data.username, ip_address=ip)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    record_audit_event(db, action="login_succeeded", user_id=user.id, ip_address=ip)
    token = create_access_token(subject=user.email)
    return TokenResponse(access_token=token)


@router.post("/login-json", response_model=TokenResponse)
def login_json(payload: LoginRequest, request: Request, db: Session = Depends(get_db)):
    """JSON-body login alternative for the SPA frontend (avoids form-encoding)."""
    user = authenticate_user(db, email=payload.email, password=payload.password)
    ip = request.client.host if request.client else None
    if not user:
        record_audit_event(db, action="login_failed", detail=payload.email, ip_address=ip)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    record_audit_event(db, action="login_succeeded", user_id=user.id, ip_address=ip)
    token = create_access_token(subject=user.email)
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return _to_user_response(current_user)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout():
    # Stateless JWTs: logout is handled client-side by discarding the token.
    # A denylist/refresh-token table can be added here if session revocation
    # becomes a requirement.
    return None


# --- Email verification (OTP) ---------------------------------------------


@router.post("/otp/send", status_code=status.HTTP_202_ACCEPTED)
def send_otp(
    payload: OtpSendRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.is_email_verified:
        return {"message": "Email is already verified."}
    issue_otp(db, user=current_user, purpose=OtpPurpose.EMAIL_VERIFICATION)
    return {"message": f"A verification code has been sent to {current_user.email}."}


@router.post("/otp/verify", response_model=UserResponse)
def verify_email_otp(
    payload: OtpVerifyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        verify_otp(db, user=current_user, purpose=OtpPurpose.EMAIL_VERIFICATION, code=payload.code)
    except OtpVerificationError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    current_user.is_email_verified = True
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return _to_user_response(current_user)


# --- Forgot / reset password (OTP) -----------------------------------------


@router.post("/change-password", status_code=status.HTTP_200_OK)
def change_password(
    payload: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect.")
    current_user.hashed_password = hash_password(payload.new_password)
    db.add(current_user)
    db.commit()
    return {"message": "Password changed successfully."}


@router.post("/password-reset/request", status_code=status.HTTP_202_ACCEPTED)
def request_password_reset(payload: PasswordResetRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    # Always return the same response whether or not the email exists, to
    # avoid leaking account existence to an attacker.
    if user:
        issue_otp(db, user=user, purpose=OtpPurpose.PASSWORD_RESET)
    return {"message": "If that email is registered, a reset code has been sent."}


@router.post("/password-reset/confirm", status_code=status.HTTP_200_OK)
def confirm_password_reset(payload: PasswordResetConfirm, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        # Same generic error as an invalid code, so this endpoint doesn't
        # leak whether the email exists either.
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid email or code.")

    try:
        verify_otp(db, user=user, purpose=OtpPurpose.PASSWORD_RESET, code=payload.code)
    except OtpVerificationError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    user.hashed_password = hash_password(payload.new_password)
    db.add(user)
    db.commit()
    return {"message": "Password has been reset. You can now log in with your new password."}
