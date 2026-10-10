from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import (
    create_access_token,
    get_current_hospital_admin,
    hash_password,
    verify_password,
)
from app.database import get_db
from app.models import Hospital, HospitalAdmin, HospitalVerification
from app.schemas import HospitalAdminLogin, HospitalAdminRegister, HospitalVerificationUpdate


router = APIRouter(prefix="/api/hospital-admin", tags=["Hospital Admin"])


@router.get("/hospitals")
def list_hospitals_for_admin_registration(db: Session = Depends(get_db)):
    return [
        {"id": hospital.id, "name": hospital.name, "city": hospital.city, "state": hospital.state}
        for hospital in db.query(Hospital).order_by(Hospital.name).all()
    ]


@router.post("/register", response_model=dict)
def register_hospital_admin(request: HospitalAdminRegister, db: Session = Depends(get_db)):
    hospital = db.query(Hospital).filter(Hospital.id == request.hospital_id).first()
    if not hospital:
        raise HTTPException(status_code=404, detail="Select a registered hospital.")
    if db.query(HospitalAdmin).filter(HospitalAdmin.hospital_id == hospital.id).first():
        raise HTTPException(status_code=409, detail="This hospital already has an admin account or a pending admin application.")
    if db.query(HospitalAdmin).filter(HospitalAdmin.email == str(request.email)).first():
        raise HTTPException(status_code=409, detail="This email is already registered as a hospital admin.")

    admin = HospitalAdmin(
        hospital_id=hospital.id,
        name=request.name.strip(),
        email=str(request.email),
        password_hash=hash_password(request.password),
        is_active=False,
    )
    db.add(admin)
    db.commit()
    return {"status": "pending", "message": "Hospital admin application sent to the Admin Portal for approval."}


@router.post("/login", response_model=dict)
def login_hospital_admin(request: HospitalAdminLogin, db: Session = Depends(get_db)):
    admin = db.query(HospitalAdmin).filter(HospitalAdmin.email == str(request.email)).first()
    if not admin or not verify_password(request.password, admin.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    if not admin.is_active:
        raise HTTPException(status_code=403, detail="Your hospital admin application is awaiting Admin Portal approval.")
    hospital = db.query(Hospital).filter(Hospital.id == admin.hospital_id).first()
    if not hospital or not hospital.is_active:
        raise HTTPException(status_code=403, detail="The hospital account must be approved before the hospital admin can sign in.")
    token = create_access_token({
        "hospital_admin_id": admin.id,
        "hospital_id": hospital.id,
        "role": "hospital_admin",
    })
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me", response_model=dict)
def get_my_hospital_admin(
    identity: dict = Depends(get_current_hospital_admin),
    db: Session = Depends(get_db),
):
    admin = db.query(HospitalAdmin).filter(
        HospitalAdmin.id == identity["admin_id"],
        HospitalAdmin.hospital_id == identity["hospital_id"],
        HospitalAdmin.is_active.is_(True),
    ).first()
    if not admin:
        raise HTTPException(status_code=401, detail="Hospital admin account is inactive.")
    hospital = db.query(Hospital).filter(Hospital.id == identity["hospital_id"]).first()
    return {"id": admin.id, "name": admin.name, "email": admin.email, "hospital_id": hospital.id, "hospital_name": hospital.name}


@router.get("/verification", response_model=dict)
def get_hospital_verification(
    identity: dict = Depends(get_current_hospital_admin),
    db: Session = Depends(get_db),
):
    record = db.query(HospitalVerification).filter(HospitalVerification.hospital_id == identity["hospital_id"]).first()
    if not record:
        return {"is_verified": False, "note": "", "updated_at": None}
    return {"is_verified": record.is_verified, "note": record.note, "updated_at": record.updated_at}


@router.put("/verification", response_model=dict)
def update_hospital_verification(
    request: HospitalVerificationUpdate,
    identity: dict = Depends(get_current_hospital_admin),
    db: Session = Depends(get_db),
):
    admin = db.query(HospitalAdmin).filter(
        HospitalAdmin.id == identity["admin_id"],
        HospitalAdmin.hospital_id == identity["hospital_id"],
        HospitalAdmin.is_active.is_(True),
    ).first()
    if not admin:
        raise HTTPException(status_code=401, detail="Hospital admin account is inactive.")
    record = db.query(HospitalVerification).filter(HospitalVerification.hospital_id == identity["hospital_id"]).first()
    if not record:
        record = HospitalVerification(hospital_id=identity["hospital_id"])
        db.add(record)
    record.is_verified = request.is_verified
    record.note = request.note.strip()
    db.commit()
    db.refresh(record)
    return {"is_verified": record.is_verified, "note": record.note, "updated_at": record.updated_at}
