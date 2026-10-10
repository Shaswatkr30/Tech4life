import math
import os
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.auth import get_current_admin, get_current_hospital_admin
from app.database import get_db
from app.models import EmergencyDispatch, EmergencyProof, EmergencyRequest, Hospital, HospitalAdmin, HospitalVerification
from app.schemas import EmergencyHospitalResponseUpdate, EmergencyStatusUpdate


router = APIRouter(prefix="/api/emergencies", tags=["Emergencies"])
PROOF_DIR = Path(os.getenv("EMERGENCY_PROOF_DIR", str(Path(__file__).resolve().parent.parent / "private_uploads" / "emergencies")))
MAX_FILE_SIZE = 25 * 1024 * 1024
MAX_FILES = 4
ALLOWED_MEDIA = {"image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm", "video/quicktime"}


def distance_km(lat1, lon1, lat2, lon2):
    radius = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dlat, dlon = math.radians(lat2 - lat1), math.radians(lon2 - lon1)
    value = math.sin(dlat / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlon / 2) ** 2
    return radius * 2 * math.atan2(math.sqrt(value), math.sqrt(1 - value))


def serialize_emergency(item, distance=None):
    return {
        "id": item.id,
        "requester_name": item.requester_name,
        "description": item.description,
        "latitude": item.latitude,
        "longitude": item.longitude,
        "status": item.status,
        "created_at": item.created_at,
        "distance_km": round(distance, 2) if distance is not None else None,
    }


@router.post("/", response_model=dict)
async def create_emergency(
    requester_name: str = Form(..., min_length=2, max_length=160),
    phone: str = Form(..., min_length=7, max_length=30),
    description: str = Form(..., min_length=10, max_length=2000),
    latitude: float = Form(...),
    longitude: float = Form(...),
    location_accuracy_m: float = Form(...),
    proofs: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
):
    if not -90 <= latitude <= 90 or not -180 <= longitude <= 180:
        raise HTTPException(status_code=422, detail="Enter a valid location.")
    if not 0 < location_accuracy_m <= 2000:
        raise HTTPException(status_code=422, detail="Use a fresh GPS location with accuracy within 2 km to submit an emergency report.")
    if not proofs or len(proofs) > MAX_FILES:
        raise HTTPException(status_code=422, detail="Upload 1 to 4 photos or videos as proof.")
    recent_cutoff = datetime.now(timezone.utc) - timedelta(minutes=5)
    recent_report = db.query(EmergencyRequest).filter(
        EmergencyRequest.phone == phone.strip(),
        EmergencyRequest.status.in_(["pending", "dispatched"]),
        EmergencyRequest.created_at >= recent_cutoff,
    ).first()
    if recent_report:
        raise HTTPException(status_code=429, detail="A recent report from this phone number is already active. Check your phone for a nearby hospital response or call local emergency services if you need immediate help.")

    nearby_hospitals = db.query(Hospital).join(
        HospitalAdmin, HospitalAdmin.hospital_id == Hospital.id
    ).filter(
        Hospital.is_active.is_(True),
        HospitalAdmin.is_active.is_(True),
        Hospital.latitude.is_not(None),
        Hospital.longitude.is_not(None),
    ).all()
    recipients = [
        hospital for hospital in nearby_hospitals
        if distance_km(latitude, longitude, hospital.latitude, hospital.longitude) <= 10
    ]

    emergency = EmergencyRequest(
        requester_name=requester_name.strip(), phone=phone.strip(),
        description=description.strip(), latitude=latitude, longitude=longitude,
        location_accuracy_m=location_accuracy_m,
        status="dispatched" if recipients else "unrouted",
    )
    db.add(emergency)
    db.flush()
    PROOF_DIR.mkdir(parents=True, exist_ok=True)
    saved_paths = []
    try:
        for upload in proofs:
            if upload.content_type not in ALLOWED_MEDIA:
                raise HTTPException(status_code=415, detail="Proof must be a JPG, PNG, WebP, MP4, WebM, or MOV file.")
            stored_name = f"{uuid.uuid4().hex}{Path(upload.filename or '').suffix[:12]}"
            destination = PROOF_DIR / stored_name
            saved_paths.append(destination)
            size = 0
            with destination.open("wb") as output:
                while chunk := await upload.read(1024 * 1024):
                    size += len(chunk)
                    if size > MAX_FILE_SIZE:
                        raise HTTPException(status_code=413, detail="Each proof file must be 25 MB or smaller.")
                    output.write(chunk)
            if size == 0:
                raise HTTPException(status_code=422, detail="Proof files cannot be empty.")
            db.add(EmergencyProof(
                emergency_id=emergency.id,
                stored_name=stored_name,
                original_name=Path(upload.filename or "proof").name[:255],
                mime_type=upload.content_type,
                size_bytes=size,
            ))
        for hospital in recipients:
            db.add(EmergencyDispatch(
                emergency_id=emergency.id,
                hospital_id=hospital.id,
                status="pending",
            ))
        db.commit()
    except Exception:
        db.rollback()
        for path in saved_paths:
            path.unlink(missing_ok=True)
        raise
    if not recipients:
        return {
            "id": emergency.id,
            "status": "unrouted",
            "hospital_count": 0,
            "message": "Your report and proof were saved, but no nearby hospital admin is available to receive it. Call your local emergency number now.",
        }
    return {
        "id": emergency.id,
        "status": "dispatched",
        "hospital_count": len(recipients),
        "message": f"Emergency alert sent to {len(recipients)} nearby hospital(s). Keep your phone available for their response.",
    }


@router.get("/nearby", response_model=dict)
def get_nearby_emergencies(
    latitude: float,
    longitude: float,
    db: Session = Depends(get_db),
):
    if not -90 <= latitude <= 90 or not -180 <= longitude <= 180:
        raise HTTPException(status_code=422, detail="Enter a valid location.")
    hospitals = db.query(Hospital).join(
        HospitalVerification, HospitalVerification.hospital_id == Hospital.id
    ).filter(
        Hospital.is_active.is_(True),
        HospitalVerification.is_verified.is_(True),
        Hospital.latitude.is_not(None),
        Hospital.longitude.is_not(None),
    ).all()
    nearby_hospitals = []
    for hospital in hospitals:
        distance = distance_km(latitude, longitude, hospital.latitude, hospital.longitude)
        if distance <= 10:
            nearby_hospitals.append({
                "id": hospital.id, "name": hospital.name, "address": hospital.address,
                "city": hospital.city, "state": hospital.state, "phone": hospital.phone,
                "latitude": hospital.latitude, "longitude": hospital.longitude,
                "distance_km": round(distance, 2),
            })
    emergencies = db.query(EmergencyRequest).filter(EmergencyRequest.status == "verified").all()
    nearby_emergencies = []
    for item in emergencies:
        distance = distance_km(latitude, longitude, item.latitude, item.longitude)
        if distance <= 10:
            nearby_emergencies.append(serialize_emergency(item, distance))
    nearby_hospitals.sort(key=lambda item: item["distance_km"])
    nearby_emergencies.sort(key=lambda item: item["distance_km"])
    return {"radius_km": 10, "hospitals": nearby_hospitals, "emergencies": nearby_emergencies}


@router.get("/hospital/inbox", response_model=list[dict])
def get_hospital_emergency_inbox(
    identity: dict = Depends(get_current_hospital_admin),
    db: Session = Depends(get_db),
):
    hospital = db.query(Hospital).filter(Hospital.id == identity["hospital_id"]).first()
    if not hospital or hospital.latitude is None or hospital.longitude is None:
        raise HTTPException(status_code=409, detail="Add your hospital's map coordinates to receive nearby emergency alerts.")
    dispatches = db.query(EmergencyDispatch, EmergencyRequest).join(
        EmergencyRequest, EmergencyRequest.id == EmergencyDispatch.emergency_id
    ).filter(
        EmergencyDispatch.hospital_id == identity["hospital_id"],
    ).order_by(EmergencyDispatch.created_at.desc()).all()
    results = []
    for dispatch, emergency in dispatches:
        proofs = db.query(EmergencyProof).filter(EmergencyProof.emergency_id == emergency.id).all()
        results.append({
            **serialize_emergency(emergency, distance_km(
                emergency.latitude, emergency.longitude,
                hospital.latitude,
                hospital.longitude,
            )),
            "requester_name": emergency.requester_name,
            "phone": emergency.phone,
            "location_accuracy_m": emergency.location_accuracy_m,
            "dispatch_status": dispatch.status,
            "response_note": dispatch.response_note,
            "created_at": emergency.created_at,
            "proofs": [{"id": proof.id, "name": proof.original_name, "mime_type": proof.mime_type, "size_bytes": proof.size_bytes} for proof in proofs],
        })
    return results


@router.get("/hospital/{emergency_id}/proofs/{proof_id}")
def get_hospital_emergency_proof(
    emergency_id: int,
    proof_id: int,
    identity: dict = Depends(get_current_hospital_admin),
    db: Session = Depends(get_db),
):
    dispatch = db.query(EmergencyDispatch).filter(
        EmergencyDispatch.emergency_id == emergency_id,
        EmergencyDispatch.hospital_id == identity["hospital_id"],
    ).first()
    proof = db.query(EmergencyProof).filter(
        EmergencyProof.id == proof_id,
        EmergencyProof.emergency_id == emergency_id,
    ).first()
    if not dispatch or not proof:
        raise HTTPException(status_code=404, detail="Emergency proof not found for this hospital.")
    path = PROOF_DIR / proof.stored_name
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Proof file is unavailable.")
    return FileResponse(path, media_type=proof.mime_type, filename=proof.original_name)


@router.put("/hospital/{emergency_id}/response", response_model=dict)
def respond_to_hospital_emergency(
    emergency_id: int,
    request: EmergencyHospitalResponseUpdate,
    identity: dict = Depends(get_current_hospital_admin),
    db: Session = Depends(get_db),
):
    dispatch = db.query(EmergencyDispatch).filter(
        EmergencyDispatch.emergency_id == emergency_id,
        EmergencyDispatch.hospital_id == identity["hospital_id"],
    ).first()
    if not dispatch:
        raise HTTPException(status_code=404, detail="This emergency was not sent to your hospital.")
    if dispatch.status != "pending":
        raise HTTPException(status_code=409, detail="Your hospital has already responded to this alert.")

    emergency = db.query(EmergencyRequest).filter(EmergencyRequest.id == emergency_id).first()
    if request.decision == "accepted":
        emergency.status = "verified"
        db.query(EmergencyDispatch).filter(
            EmergencyDispatch.emergency_id == emergency_id,
            EmergencyDispatch.hospital_id != identity["hospital_id"],
            EmergencyDispatch.status == "pending",
        ).update({
            EmergencyDispatch.status: "cancelled",
            EmergencyDispatch.response_note: "Another nearby hospital accepted this emergency.",
            EmergencyDispatch.responded_at: datetime.now(timezone.utc),
        }, synchronize_session=False)
    else:
        other_hospitals_pending = db.query(EmergencyDispatch).filter(
            EmergencyDispatch.emergency_id == emergency_id,
            EmergencyDispatch.hospital_id != identity["hospital_id"],
            EmergencyDispatch.status == "pending",
        ).first()
        another_hospital_accepted = db.query(EmergencyDispatch).filter(
            EmergencyDispatch.emergency_id == emergency_id,
            EmergencyDispatch.status == "accepted",
        ).first()
        if not other_hospitals_pending and not another_hospital_accepted:
            emergency.status = "rejected"

    dispatch.status = request.decision
    dispatch.response_note = request.note.strip()
    dispatch.responded_at = datetime.now(timezone.utc)
    db.commit()
    return {"id": emergency_id, "dispatch_status": dispatch.status, "emergency_status": emergency.status}


@router.get("/admin/all", response_model=list[dict])
def get_emergency_queue(admin_id: int = Depends(get_current_admin), db: Session = Depends(get_db)):
    items = db.query(EmergencyRequest).order_by(EmergencyRequest.created_at.desc()).all()
    result = []
    for item in items:
        proofs = db.query(EmergencyProof).filter(EmergencyProof.emergency_id == item.id).all()
        result.append({
            **serialize_emergency(item), "phone": item.phone, "review_note": item.review_note,
            "location_accuracy_m": item.location_accuracy_m,
            "proofs": [{"id": proof.id, "name": proof.original_name, "mime_type": proof.mime_type, "size_bytes": proof.size_bytes} for proof in proofs],
        })
    return result


@router.get("/admin/{emergency_id}/proofs/{proof_id}")
def get_emergency_proof(
    emergency_id: int,
    proof_id: int,
    admin_id: int = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    proof = db.query(EmergencyProof).filter(
        EmergencyProof.id == proof_id,
        EmergencyProof.emergency_id == emergency_id,
    ).first()
    if not proof:
        raise HTTPException(status_code=404, detail="Proof not found.")
    path = PROOF_DIR / proof.stored_name
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Proof file is unavailable.")
    return FileResponse(path, media_type=proof.mime_type, filename=proof.original_name)


@router.put("/admin/{emergency_id}/status", response_model=dict)
def review_emergency(
    emergency_id: int,
    request: EmergencyStatusUpdate,
    admin_id: int = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    item = db.query(EmergencyRequest).filter(EmergencyRequest.id == emergency_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Emergency report not found.")
    if not db.query(EmergencyProof).filter(EmergencyProof.emergency_id == item.id).first():
        raise HTTPException(status_code=409, detail="An emergency cannot be approved without proof.")
    item.status = request.status
    item.review_note = request.review_note.strip()
    db.commit()
    return {"id": item.id, "status": item.status}
