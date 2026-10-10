import os
from datetime import datetime, timedelta, timezone

from dotenv import load_dotenv
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwt
from pwdlib import PasswordHash
from sqlalchemy.orm import Session

from .database import get_db
from .models import Hospital, HospitalAdmin


load_dotenv()


# ============================================================
# JWT CONFIGURATION
# ============================================================

SECRET_KEY = os.getenv(
    "SECRET_KEY",
    "tech4life-secret-key-change-this"
)

ALGORITHM = os.getenv(
    "ALGORITHM",
    "HS256"
)

ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv(
        "ACCESS_TOKEN_EXPIRE_MINUTES",
        "60"
    )
)


# ============================================================
# PASSWORD HASHING
# ============================================================

password_hash = PasswordHash.recommended()


def hash_password(password: str):
    return password_hash.hash(password)


def verify_password(
    password: str,
    hashed_password: str
):
    return password_hash.verify(
        password,
        hashed_password
    )


# ============================================================
# CREATE JWT TOKEN
# ============================================================

def create_access_token(data: dict):

    to_encode = data.copy()

    expire = datetime.now(
        timezone.utc
    ) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    to_encode.update({
        "exp": expire
    })

    return jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )


# ============================================================
# HTTP BEARER
# ============================================================

security = HTTPBearer()


# ============================================================
# CURRENT HOSPITAL
# ============================================================

def get_current_hospital(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        hospital_id = payload.get("hospital_id")
        role = payload.get("role")
        if hospital_id is None or role not in (None, "hospital_admin"):
            raise HTTPException(status_code=401, detail="Invalid token")
        hospital_id = int(hospital_id)
        if role == "hospital_admin":
            admin_id = payload.get("hospital_admin_id")
            account = db.query(HospitalAdmin).join(
                Hospital, Hospital.id == HospitalAdmin.hospital_id
            ).filter(
                HospitalAdmin.id == admin_id,
                HospitalAdmin.hospital_id == hospital_id,
                HospitalAdmin.is_active.is_(True),
                Hospital.is_active.is_(True),
            ).first()
            if not account:
                raise HTTPException(status_code=403, detail="Hospital admin access is inactive.")
        return hospital_id
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


def get_current_hospital_staff(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("role") is not None:
            raise HTTPException(status_code=403, detail="This action is available to hospital staff accounts only.")
        return get_current_hospital(credentials, db)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


# ============================================================
# CURRENT ADMIN
# ============================================================

def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):

    token = credentials.credentials

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        admin_id = payload.get(
            "admin_id"
        )

        role = payload.get(
            "role"
        )

        if admin_id is None or role != "admin":

            raise HTTPException(
                status_code=401,
                detail="Invalid admin token"
            )

        return int(admin_id)

    except HTTPException:
        raise

    except Exception:

        raise HTTPException(
            status_code=401,
            detail="Invalid or expired admin token"
        )


def get_current_hospital_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    try:
        payload = jwt.decode(
            credentials.credentials,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )
        admin_id = payload.get("hospital_admin_id")
        hospital_id = payload.get("hospital_id")
        if admin_id is None or hospital_id is None or payload.get("role") != "hospital_admin":
            raise HTTPException(status_code=401, detail="Invalid hospital admin token")
        account = db.query(HospitalAdmin).join(
            Hospital, Hospital.id == HospitalAdmin.hospital_id
        ).filter(
            HospitalAdmin.id == int(admin_id),
            HospitalAdmin.hospital_id == int(hospital_id),
            HospitalAdmin.is_active.is_(True),
            Hospital.is_active.is_(True),
        ).first()
        if not account:
            raise HTTPException(status_code=403, detail="Hospital admin access is inactive.")
        return {"admin_id": int(admin_id), "hospital_id": int(hospital_id)}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired hospital admin token")
