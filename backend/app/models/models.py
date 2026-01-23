from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text, Float, Enum, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base
import enum


class Role(str, enum.Enum):
    """User roles."""
    PLATFORM_OWNER = "platform_owner"
    TENANT_ADMIN = "tenant_admin"
    DISPATCHER = "dispatcher"
    DRIVER = "driver"
    MAINTENANCE_MANAGER = "maintenance_manager"
    COMPLIANCE_MANAGER = "compliance_manager"


class DocumentStatus(str, enum.Enum):
    """Compliance/maintenance document status."""
    MISSING = "missing"
    VALID = "valid"
    EXPIRING = "expiring"  # Within 30 days
    EXPIRED = "expired"


class MaintenanceStatus(str, enum.Enum):
    """Maintenance task status."""
    DUE = "due"
    OVERDUE = "overdue"
    COMPLETED = "completed"
    SCHEDULED = "scheduled"


class LoadStatus(str, enum.Enum):
    """Load status."""
    CREATED = "created"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class PODStatus(str, enum.Enum):
    """POD submission status."""
    PENDING = "pending"
    SUBMITTED = "submitted"
    APPROVED = "approved"
    REJECTED = "rejected"


class Tenant(Base):
    """Carrier/tenant organization."""
    __tablename__ = "tenants"

    id = Column(Integer, primary_key=True)
    slug = Column(String(100), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    company_name = Column(String(255), nullable=False)
    mc_number = Column(String(50))
    dot_number = Column(String(50))
    email = Column(String(255))
    phone = Column(String(20))
    address = Column(Text)
    city = Column(String(100))
    state = Column(String(2))
    zip_code = Column(String(10))
    logo_url = Column(String(500))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    is_active = Column(Boolean, default=True)

    users = relationship("User", back_populates="tenant", cascade="all, delete-orphan")
    drivers = relationship("Driver", back_populates="tenant", cascade="all, delete-orphan")
    vehicles = relationship("Vehicle", back_populates="tenant", cascade="all, delete-orphan")
    loads = relationship("Load", back_populates="tenant", cascade="all, delete-orphan")
    invites = relationship("TenantInvite", back_populates="tenant", cascade="all, delete-orphan")


class User(Base):
    """Platform or tenant user."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=True)
    email = Column(String(255), unique=True, nullable=False)
    full_name = Column(String(255))
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False)  # Enum value
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    tenant = relationship("Tenant", back_populates="users")


class TenantInvite(Base):
    """Invitation for new tenant admin."""
    __tablename__ = "tenant_invites"

    id = Column(Integer, primary_key=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    email = Column(String(255), nullable=False)
    token = Column(String(255), unique=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    expires_at = Column(DateTime, nullable=False)
    accepted = Column(Boolean, default=False)

    tenant = relationship("Tenant", back_populates="invites")


class Driver(Base):
    """Driver record."""
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255))
    phone = Column(String(20))
    license_number = Column(String(50))
    license_state = Column(String(2))
    date_of_birth = Column(String(10))
    hire_date = Column(String(10))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    tenant = relationship("Tenant", back_populates="drivers")
    compliance_docs = relationship("DriverComplianceDoc", back_populates="driver", cascade="all, delete-orphan")
    loads = relationship("Load", back_populates="driver")


class Vehicle(Base):
    """Vehicle (truck/trailer)."""
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    vehicle_number = Column(String(50), nullable=False)
    vin = Column(String(50))
    license_plate = Column(String(50))
    vehicle_type = Column(String(50))  # truck, trailer
    make = Column(String(100))
    model = Column(String(100))
    year = Column(Integer)
    purchase_date = Column(String(10))
    current_odometer = Column(Float)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    tenant = relationship("Tenant", back_populates="vehicles")
    compliance_docs = relationship("VehicleComplianceDoc", back_populates="vehicle", cascade="all, delete-orphan")
    maintenance_logs = relationship("MaintenanceLog", back_populates="vehicle", cascade="all, delete-orphan")


class Load(Base):
    """Transportation load/shipment."""
    __tablename__ = "loads"

    id = Column(Integer, primary_key=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=True)
    load_number = Column(String(50), nullable=False)
    status = Column(String(50), default=LoadStatus.CREATED.value)
    pickup_location = Column(String(255), nullable=False)
    pickup_date = Column(String(10))
    delivery_location = Column(String(255), nullable=False)
    delivery_date = Column(String(10))
    broker_name = Column(String(255))
    broker_phone = Column(String(20))
    broker_email = Column(String(255))
    notes = Column(Text)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    tenant = relationship("Tenant", back_populates="loads")
    driver = relationship("Driver", back_populates="loads")
    pod = relationship("PODSubmission", back_populates="load", uselist=False, cascade="all, delete-orphan")


class PODSubmission(Base):
    """Proof of Delivery submission."""
    __tablename__ = "pod_submissions"

    id = Column(Integer, primary_key=True)
    load_id = Column(Integer, ForeignKey("loads.id"), nullable=False, unique=True)
    status = Column(String(50), default=PODStatus.PENDING.value)
    receiver_name = Column(String(255), nullable=False)
    receiver_signature = Column(Text)  # SVG or base64
    delivery_date = Column(String(10), nullable=False)
    delivery_notes = Column(Text)
    
    # Dropbox links
    pdf_link = Column(String(500))
    bol_folder_link = Column(String(500))
    photos_zip_link = Column(String(500))
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    load = relationship("Load", back_populates="pod")
    files = relationship("PODFile", back_populates="submission", cascade="all, delete-orphan")


class PODFile(Base):
    """POD submission file (BOL, delivery photo)."""
    __tablename__ = "pod_files"

    id = Column(Integer, primary_key=True)
    pod_id = Column(Integer, ForeignKey("pod_submissions.id"), nullable=False)
    file_type = Column(String(50))  # bol, delivery_photo
    filename = Column(String(255), nullable=False)
    dropbox_path = Column(String(500))
    dropbox_link = Column(String(500))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    submission = relationship("PODSubmission", back_populates="files")


class DriverComplianceDoc(Base):
    """Driver compliance document."""
    __tablename__ = "driver_compliance_docs"

    id = Column(Integer, primary_key=True)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=False)
    doc_type = Column(String(100), nullable=False)  # license, medical, training, etc
    filename = Column(String(255), nullable=False)
    dropbox_path = Column(String(500))
    dropbox_link = Column(String(500))
    status = Column(String(50), default=DocumentStatus.MISSING.value)
    expires_at = Column(String(10), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    driver = relationship("Driver", back_populates="compliance_docs")


class VehicleComplianceDoc(Base):
    """Vehicle compliance document."""
    __tablename__ = "vehicle_compliance_docs"

    id = Column(Integer, primary_key=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    doc_type = Column(String(100), nullable=False)  # inspection, registration, insurance, etc
    filename = Column(String(255), nullable=False)
    dropbox_path = Column(String(500))
    dropbox_link = Column(String(500))
    status = Column(String(50), default=DocumentStatus.MISSING.value)
    expires_at = Column(String(10), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    vehicle = relationship("Vehicle", back_populates="compliance_docs")


class MaintenanceItem(Base):
    """Maintenance schedule item."""
    __tablename__ = "maintenance_items"

    id = Column(Integer, primary_key=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    interval_miles = Column(Integer)
    interval_days = Column(Integer)
    last_completed_miles = Column(Float)
    last_completed_date = Column(String(10))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class MaintenanceLog(Base):
    """Maintenance work log."""
    __tablename__ = "maintenance_logs"

    id = Column(Integer, primary_key=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    work_description = Column(Text, nullable=False)
    work_date = Column(String(10), nullable=False)
    odometer = Column(Float)
    cost = Column(Float)
    vendor = Column(String(255))
    invoice_filename = Column(String(255))
    dropbox_path = Column(String(500))
    dropbox_link = Column(String(500))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    vehicle = relationship("Vehicle", back_populates="maintenance_logs")


class AuditLog(Base):
    """Audit log for tracking changes."""
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False)  # created, updated, deleted, submitted, etc
    resource_type = Column(String(100), nullable=False)  # load, pod, doc, etc
    resource_id = Column(Integer)
    details = Column(JSON)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
