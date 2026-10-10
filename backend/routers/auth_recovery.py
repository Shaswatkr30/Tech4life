import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import hash_password
from app.database import get_db
from app.email_service import send_email
from app.models import Admin, Hospital, HospitalAdmin, PasswordResetOTP
from app.schemas import PasswordOTPRequest, PasswordOTPReset


router = APIRouter(prefix="/api/auth", tags=["Account recovery"])
ACCOUNT_MODELS = {
    "hospital": Hospital,
    "hospital_admin": HospitalAdmin,
    "admin": Admin,
}


def _find_account(account_type: str, identifier: str, db: Session):
    model = ACCOUNT_MODELS[account_type]
    column = model.username if account_type == "admin" else model.email
    return db.query(model).filter(column == identifier.strip()).first()


def _code_hash(account_type: str, account_id: int, code: str) -> str:
    return hashlib.sha256(f"{account_type}:{account_id}:{code}".encode()).hexdigest()


@router.post("/send-otp", response_model=dict)
def send_password_otp(request: PasswordOTPRequest, db: Session = Depends(get_db)):
    account = _find_account(request.account_type, request.identifier, db)
    if not account:
        return {"message": "If the account and recovery email exist, an OTP will be sent."}
    email = account.email if request.account_type != "admin" else account.email
    if not email:
        raise HTTPException(status_code=409, detail="This admin account has no recovery email configured. Ask the platform owner to add one.")

    now = datetime.now(timezone.utc)
    latest = db.query(PasswordResetOTP).filter(
        PasswordResetOTP.account_type == request.account_type,
        PasswordResetOTP.account_id == account.id,
        PasswordResetOTP.used_at.is_(None),
    ).order_by(PasswordResetOTP.created_at.desc()).first()
    if latest and latest.created_at:
        created_at = latest.created_at.replace(tzinfo=timezone.utc) if latest.created_at.tzinfo is None else latest.created_at
        if now - created_at < timedelta(seconds=60):
            raise HTTPException(status_code=429, detail="Please wait one minute before requesting another code.")

    db.query(PasswordResetOTP).filter(
        PasswordResetOTP.account_type == request.account_type,
        PasswordResetOTP.account_id == account.id,
        PasswordResetOTP.used_at.is_(None),
    ).update({PasswordResetOTP.used_at: now}, synchronize_session=False)
    code = f"{secrets.randbelow(1_000_000):06d}"
    reset = PasswordResetOTP(
        account_type=request.account_type,
        account_id=account.id,
        code_hash=_code_hash(request.account_type, account.id, code),
        expires_at=now + timedelta(minutes=10),
    )
    db.add(reset)
    db.commit()
    try:
        send_email(
            email,
            "Your Tech4Life password reset code",
            f"Your password reset code is {code}. It expires in 10 minutes. If you did not request this code, ignore this email.",
        )
    except Exception as exc:
        db.delete(reset)
        db.commit()
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return {"message": "A six-digit OTP was sent to your registered email address."}


@router.post("/reset-password", response_model=dict)
def reset_password_with_otp(request: PasswordOTPReset, db: Session = Depends(get_db)):
    account = _find_account(request.account_type, request.identifier, db)
    if not account:
        raise HTTPException(status_code=400, detail="The code is invalid or expired. Request a new OTP.")
    reset = db.query(PasswordResetOTP).filter(
        PasswordResetOTP.account_type == request.account_type,
        PasswordResetOTP.account_id == account.id,
        PasswordResetOTP.used_at.is_(None),
    ).order_by(PasswordResetOTP.created_at.desc()).first()
    expires_at = reset.expires_at if reset else None
    if expires_at and expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if not reset or expires_at <= datetime.now(timezone.utc) or reset.attempts >= 5:
        raise HTTPException(status_code=400, detail="The code is invalid or expired. Request a new OTP.")
    reset.attempts += 1
    if reset.code_hash != _code_hash(request.account_type, account.id, request.otp):
        db.commit()
        raise HTTPException(status_code=400, detail="The code is incorrect. Check the email and try again.")
    reset.used_at = datetime.now(timezone.utc)
    account.password_hash = hash_password(request.password)
    db.commit()
    return {"message": "Password changed. You can now sign in with the new password."}
