from app.models import HospitalVerification


def invalidate_hospital_verification(db, hospital_id: int) -> None:
    """Require the hospital admin to review the listing after a resource edit."""
    record = db.query(HospitalVerification).filter(
        HospitalVerification.hospital_id == hospital_id
    ).first()
    if record and record.is_verified:
        record.is_verified = False
