from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    role = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Load(Base):
    __tablename__ = "loads"

    id = Column(Integer, primary_key=True, index=True)
    load_id = Column(String, unique=True, index=True, nullable=False)
    commodity = Column(String, nullable=True)
    broker_info_text = Column(Text, nullable=True)
    pickup_name = Column(String, nullable=False)
    pickup_address = Column(Text, nullable=False)
    delivery_name = Column(String, nullable=False)
    delivery_address = Column(Text, nullable=False)
    delivery_date = Column(String, nullable=True)
    status = Column(String, default="created")
    assigned_driver_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    assigned_driver = relationship("User", foreign_keys=[assigned_driver_id])


class PodSubmission(Base):
    __tablename__ = "pod_submissions"

    id = Column(Integer, primary_key=True, index=True)
    load_id = Column(Integer, ForeignKey("loads.id"), nullable=False)
    driver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    receiver_name = Column(String, nullable=False)
    receiver_signature_typed = Column(String, nullable=False)
    delivery_notes = Column(Text, nullable=True)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())
    dropbox_signed_bol_paths = Column(JSON, default=list)
    dropbox_delivery_photo_paths = Column(JSON, default=list)
    dropbox_zip_path = Column(String, nullable=True)
    dropbox_zip_shared_link = Column(String, nullable=True)
    dropbox_pod_packet_pdf_path = Column(String, nullable=True)
    dropbox_pod_packet_shared_link = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    load = relationship("Load")
    driver = relationship("User")


class Maintenance(Base):
    __tablename__ = "maintenance"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(String, nullable=False)
    type = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    cost = Column(String, nullable=True)
    date = Column(String, nullable=True)
    attachment_paths = Column(JSON, default=list)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    cost = Column(String, nullable=True)
    date = Column(String, nullable=True)
    attachment_paths = Column(JSON, default=list)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    actor_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String, nullable=False)
    entity_type = Column(String, nullable=False)
    entity_id = Column(String, nullable=False)
    metadata = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
