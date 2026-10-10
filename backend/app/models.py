from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text
)

from sqlalchemy.sql import func

from .database import Base


# ============================================================
# HOSPITAL
# ============================================================

class Hospital(Base):
    __tablename__ = "hospitals"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String(200), nullable=False)

    address = Column(Text, nullable=False)

    city = Column(String(100), nullable=False)

    state = Column(String(100), nullable=False)

    phone = Column(String(20))

    email = Column(String(150), unique=True, nullable=False)

    latitude = Column(Float)

    longitude = Column(Float)

    password_hash = Column(String(255), nullable=False)

    is_active = Column(Boolean, default=False)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )


class HospitalPasswordReset(Base):
    __tablename__ = "hospital_password_resets"

    token_hash = Column(String(64), primary_key=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"), nullable=False, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class HospitalVerification(Base):
    """Hospital administrator's verification of hospital supplied information."""
    __tablename__ = "hospital_verifications"

    hospital_id = Column(Integer, ForeignKey("hospitals.id"), primary_key=True)
    is_verified = Column(Boolean, nullable=False, default=False)
    note = Column(Text, nullable=False, default="")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class HospitalAdmin(Base):
    __tablename__ = "hospital_admins"

    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"), unique=True, nullable=False, index=True)
    name = Column(String(200), nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    is_active = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class PasswordResetOTP(Base):
    __tablename__ = "password_reset_otps"

    id = Column(Integer, primary_key=True, index=True)
    account_type = Column(String(30), nullable=False, index=True)
    account_id = Column(Integer, nullable=False, index=True)
    code_hash = Column(String(64), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used_at = Column(DateTime(timezone=True), nullable=True)
    attempts = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class EmergencyRequest(Base):
    __tablename__ = "emergency_requests"

    id = Column(Integer, primary_key=True, index=True)
    requester_name = Column(String(160), nullable=False)
    phone = Column(String(30), nullable=False)
    description = Column(Text, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    location_accuracy_m = Column(Float, nullable=False, default=0)
    status = Column(String(20), nullable=False, default="pending", index=True)
    review_note = Column(Text, nullable=False, default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class EmergencyProof(Base):
    __tablename__ = "emergency_proofs"

    id = Column(Integer, primary_key=True, index=True)
    emergency_id = Column(Integer, ForeignKey("emergency_requests.id"), nullable=False, index=True)
    stored_name = Column(String(255), nullable=False)
    original_name = Column(String(255), nullable=False)
    mime_type = Column(String(100), nullable=False)
    size_bytes = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class EmergencyDispatch(Base):
    """A private emergency alert routed to one nearby hospital."""
    __tablename__ = "emergency_dispatches"

    id = Column(Integer, primary_key=True, index=True)
    emergency_id = Column(Integer, ForeignKey("emergency_requests.id"), nullable=False, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"), nullable=False, index=True)
    status = Column(String(20), nullable=False, default="pending", index=True)
    response_note = Column(Text, nullable=False, default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    responded_at = Column(DateTime(timezone=True), nullable=True)


# ============================================================
# BLOOD INVENTORY
# ============================================================

class BloodInventory(Base):
    __tablename__ = "blood_inventory"

    id = Column(Integer, primary_key=True, index=True)

    hospital_id = Column(
        Integer,
        ForeignKey("hospitals.id"),
        nullable=False
    )

    blood_group = Column(
        String(10),
        nullable=False
    )

    units_available = Column(
        Integer,
        default=0,
        nullable=False
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )


# ============================================================
# ORGAN INVENTORY
# ============================================================

class OrganInventory(Base):
    __tablename__ = "organ_inventory"

    id = Column(Integer, primary_key=True, index=True)

    hospital_id = Column(
        Integer,
        ForeignKey("hospitals.id"),
        nullable=False
    )

    organ_name = Column(
        String(100),
        nullable=False
    )

    available = Column(
        Boolean,
        default=False,
        nullable=False
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )


# ============================================================
# ICU RESOURCE
# ============================================================

class ICUResource(Base):
    __tablename__ = "icu_resources"

    id = Column(Integer, primary_key=True, index=True)

    hospital_id = Column(
        Integer,
        ForeignKey("hospitals.id"),
        nullable=False
    )

    total_beds = Column(
        Integer,
        default=0,
        nullable=False
    )

    available_beds = Column(
        Integer,
        default=0,
        nullable=False
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )


# ============================================================
# MEDICAL EQUIPMENT
# ============================================================

class Equipment(Base):
    __tablename__ = "equipment"

    id = Column(Integer, primary_key=True, index=True)

    hospital_id = Column(
        Integer,
        ForeignKey("hospitals.id"),
        nullable=False
    )

    equipment_name = Column(
        String(150),
        nullable=False
    )

    total_quantity = Column(
        Integer,
        default=0,
        nullable=False
    )

    available_quantity = Column(
        Integer,
        default=0,
        nullable=False
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )


# ============================================================
# INTEGRATION LOG
# ============================================================

class IntegrationLog(Base):
    __tablename__ = "integration_logs"

    id = Column(Integer, primary_key=True, index=True)

    hospital_id = Column(
        Integer,
        ForeignKey("hospitals.id"),
        nullable=False
    )

    source = Column(String(100))

    status = Column(String(50))

    message = Column(Text)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )


# ============================================================
# ADMIN
# ============================================================

class Admin(Base):
    __tablename__ = "admins"

    id = Column(Integer, primary_key=True, index=True)

    username = Column(
        String(100),
        unique=True,
        nullable=False
    )

    email = Column(String(150), unique=True, nullable=True)

    password_hash = Column(
        String(255),
        nullable=False
    )

    is_active = Column(
        Boolean,
        default=True
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )
    
    # ============================================================
# RESOURCE HISTORY
# ============================================================

class ResourceHistory(Base):
    __tablename__ = "resource_history"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    hospital_id = Column(
        Integer,
        ForeignKey("hospitals.id"),
        nullable=False
    )

    resource_type = Column(
        String(50),
        nullable=False
    )

    resource_id = Column(
        Integer,
        nullable=False
    )

    action = Column(
        String(50),
        nullable=False
    )

    old_data = Column(
        Text
    )

    new_data = Column(
        Text
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )
    
    # ============================================================
# AUDIT LOG
# ============================================================

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    admin_id = Column(
        Integer,
        ForeignKey("admins.id"),
        nullable=True
    )

    hospital_id = Column(
        Integer,
        ForeignKey("hospitals.id"),
        nullable=True
    )

    action = Column(
        String(100),
        nullable=False
    )

    resource_type = Column(
        String(50),
        nullable=True
    )

    resource_id = Column(
        Integer,
        nullable=True
    )

    details = Column(
        Text,
        nullable=True
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )
