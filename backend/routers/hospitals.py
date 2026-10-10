import hashlib
import os
import secrets
import smtplib
import ssl
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import (
    AuditLog,
    BloodInventory,
    Equipment,
    Hospital,
    HospitalAdmin,
    HospitalPasswordReset,
    HospitalVerification,
    ICUResource,
    IntegrationLog,
    OrganInventory,
    ResourceHistory,
)
from app.schemas import (
    HospitalCreate,
    HospitalResponse,
    HospitalLogin,
    HospitalForgotPassword,
    HospitalResetPassword,
    TokenResponse
)
from app.auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_hospital,
    get_current_hospital_staff,
)


router = APIRouter(
    prefix="/api/hospitals",
    tags=["Hospitals"]
)


# ============================================================
# HOSPITAL REGISTRATION
# ============================================================

@router.post(
    "/register",
    response_model=dict
)
def register_hospital(
    hospital: HospitalCreate,
    db: Session = Depends(get_db)
):

    # Check existing email
    existing_hospital = db.query(Hospital).filter(
        Hospital.email == hospital.email
    ).first()

    if existing_hospital:
        raise HTTPException(
            status_code=400,
            detail="Hospital with this email already exists"
        )

    # Create hospital
    new_hospital = Hospital(
        name=hospital.name,
        address=hospital.address,
        city=hospital.city,
        state=hospital.state,
        phone=hospital.phone,
        email=hospital.email,
        latitude=hospital.latitude,
        longitude=hospital.longitude,

        # Password is stored securely
        password_hash=hash_password(
            hospital.password
        ),

        # IMPORTANT:
        # New hospital requires admin approval
        is_active=False
    )

    db.add(new_hospital)
    db.commit()
    db.refresh(new_hospital)

    return {
        "message": "Hospital registration submitted successfully",
        "hospital_id": new_hospital.id,
        "status": "pending",
        "detail": "Your hospital will become active after admin approval."
    }


# ============================================================
# HOSPITAL LOGIN
# ============================================================

@router.post(
    "/login",
    response_model=TokenResponse
)
def login_hospital(
    hospital: HospitalLogin,
    db: Session = Depends(get_db)
):

    # Find hospital
    existing_hospital = db.query(Hospital).filter(
        Hospital.email == hospital.email
    ).first()

    if not existing_hospital:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    # Check password
    if not verify_password(
        hospital.password,
        existing_hospital.password_hash
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    # IMPORTANT:
    # Hospital cannot login until admin approves it
    if not existing_hospital.is_active:
        raise HTTPException(
            status_code=403,
            detail="Your hospital registration is pending admin approval"
        )

    # Create JWT token
    access_token = create_access_token({
        "hospital_id": existing_hospital.id
    })

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


def send_password_reset_email(recipient: str, reset_url: str) -> None:
    host = os.getenv("SMTP_HOST")
    username = os.getenv("SMTP_USERNAME")
    password = os.getenv("SMTP_PASSWORD")
    sender = os.getenv("SMTP_FROM") or username
    if not all((host, username, password, sender)):
        raise RuntimeError("SMTP email settings are not configured")

    message = EmailMessage()
    message["Subject"] = "Reset your Tech4Life hospital password"
    message["From"] = sender
    message["To"] = recipient
    message.set_content(
        "We received a request to reset your Tech4Life hospital password. "
        f"Use this link within 30 minutes: {reset_url}\n\n"
        "If you did not request this, you can ignore this email."
    )
    port = int(os.getenv("SMTP_PORT", "587"))
    if port == 465:
        with smtplib.SMTP_SSL(host, port, timeout=15, context=ssl.create_default_context()) as smtp:
            smtp.login(username, password)
            smtp.send_message(message)
    else:
        with smtplib.SMTP(host, port, timeout=15) as smtp:
            smtp.starttls(context=ssl.create_default_context())
            smtp.login(username, password)
            smtp.send_message(message)


@router.post("/forgot-password", response_model=dict)
def forgot_hospital_password(
    request: HospitalForgotPassword,
    db: Session = Depends(get_db),
):
    hospital = db.query(Hospital).filter(
        Hospital.email == str(request.email)
    ).first()
    if not hospital:
        return {"message": "If an account exists for that email, a reset link has been sent."}

    raw_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=30)
    db.query(HospitalPasswordReset).filter(
        HospitalPasswordReset.hospital_id == hospital.id,
        HospitalPasswordReset.used_at.is_(None),
    ).delete(synchronize_session=False)
    db.add(HospitalPasswordReset(
        token_hash=token_hash,
        hospital_id=hospital.id,
        expires_at=expires_at,
    ))
    db.commit()

    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
    reset_url = f"{frontend_url}/reset-password?token={raw_token}"
    try:
        send_password_reset_email(str(request.email), reset_url)
    except Exception as exc:
        db.query(HospitalPasswordReset).filter(
            HospitalPasswordReset.token_hash == token_hash
        ).delete(synchronize_session=False)
        db.commit()
        print(f"Password reset email delivery failed: {exc}")
        raise HTTPException(
            status_code=503,
            detail="Password reset email is temporarily unavailable. Please contact support.",
        ) from exc
    return {"message": "If an account exists for that email, a reset link has been sent."}


@router.post("/reset-password", response_model=dict)
def reset_hospital_password(
    request: HospitalResetPassword,
    db: Session = Depends(get_db),
):
    token_hash = hashlib.sha256(request.token.encode()).hexdigest()
    reset = db.query(HospitalPasswordReset).filter(
        HospitalPasswordReset.token_hash == token_hash,
        HospitalPasswordReset.used_at.is_(None),
    ).first()
    if not reset:
        raise HTTPException(status_code=400, detail="This reset link is invalid or has already been used.")

    expires_at = reset.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at <= datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="This reset link has expired. Please request a new one.")

    hospital = db.query(Hospital).filter(Hospital.id == reset.hospital_id).first()
    if not hospital:
        raise HTTPException(status_code=400, detail="This reset link is invalid or has already been used.")
    hospital.password_hash = hash_password(request.password)
    reset.used_at = datetime.now(timezone.utc)
    db.query(HospitalPasswordReset).filter(
        HospitalPasswordReset.hospital_id == hospital.id,
        HospitalPasswordReset.token_hash != token_hash,
    ).delete(synchronize_session=False)
    db.commit()
    return {"message": "Your password has been reset. You can now sign in."}


# ============================================================
# GET ALL HOSPITALS
# ============================================================

@router.get(
    "/",
    response_model=list[HospitalResponse]
)
def get_hospitals(
    db: Session = Depends(get_db)
):

    hospitals = db.query(Hospital).join(
        HospitalVerification,
        HospitalVerification.hospital_id == Hospital.id,
    ).filter(
        Hospital.is_active.is_(True),
        HospitalVerification.is_verified.is_(True),
    ).all()

    return hospitals


# ============================================================
# GET CURRENT HOSPITAL
# ============================================================

@router.get(
    "/me",
    response_model=HospitalResponse
)
def get_current_hospital_profile(
    hospital_id: int = Depends(get_current_hospital),
    db: Session = Depends(get_db)
):

    hospital = db.query(Hospital).filter(
        Hospital.id == hospital_id
    ).first()

    if not hospital:
        raise HTTPException(
            status_code=404,
            detail="Hospital not found"
        )

    return hospital


# ============================================================
# GET HOSPITAL BY ID
# ============================================================

@router.get(
    "/{hospital_id}",
    response_model=HospitalResponse
)
def get_hospital(
    hospital_id: int,
    db: Session = Depends(get_db)
):

    hospital = db.query(Hospital).join(
        HospitalVerification,
        HospitalVerification.hospital_id == Hospital.id,
    ).filter(
        Hospital.id == hospital_id,
        Hospital.is_active.is_(True),
        HospitalVerification.is_verified.is_(True),
    ).first()

    if not hospital:
        raise HTTPException(
            status_code=404,
            detail="Hospital not found"
        )

    return hospital


# ============================================================
# DELETE CURRENT HOSPITAL ACCOUNT
# ============================================================

@router.delete("/delete", response_model=dict)
def delete_current_hospital(
    hospital_id: int = Depends(get_current_hospital_staff),
    db: Session = Depends(get_db),
):
    """Remove the signed-in hospital and every record it owns."""
    hospital = db.query(Hospital).filter(
        Hospital.id == hospital_id
    ).first()

    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")

    # These models use foreign keys without database-level cascade rules, so
    # delete dependent records first to keep account deletion reliable.
    for model in (
        BloodInventory,
        ICUResource,
        OrganInventory,
        Equipment,
        HospitalAdmin,
        HospitalVerification,
        IntegrationLog,
        ResourceHistory,
        AuditLog,
    ):
        db.query(model).filter(model.hospital_id == hospital_id).delete(
            synchronize_session=False
        )

    db.delete(hospital)
    db.commit()

    return {"message": "Hospital account and its resources were deleted."}
