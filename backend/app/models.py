from datetime import datetime
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, Boolean, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base


class Carrier(Base):
    __tablename__ = "carriers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    internal_code = Column(String(100), unique=True, index=True, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    users = relationship("User", back_populates="carrier")
    drivers = relationship("Driver", back_populates="carrier")
    loads = relationship("Load", back_populates="carrier")
    equipment = relationship("Equipment", back_populates="carrier")
    maintenance = relationship("Maintenance", back_populates="carrier")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    carrier_id = Column(Integer, ForeignKey("carriers.id"), nullable=False, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=True, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    carrier = relationship("Carrier", back_populates="users")
    driver = relationship("Driver", back_populates="user", uselist=False)


class Driver(Base):
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True, index=True)
    carrier_id = Column(Integer, ForeignKey("carriers.id"), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    email = Column(String(255), nullable=True, index=True)
    phone = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    carrier = relationship("Carrier", back_populates="drivers")
    loads = relationship("Load", back_populates="driver")
    user = relationship("User", back_populates="driver", uselist=False)


class Load(Base):
    __tablename__ = "loads"

    id = Column(Integer, primary_key=True, index=True)
    carrier_id = Column(Integer, ForeignKey("carriers.id"), nullable=False, index=True)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=True, index=True)
    load_number = Column(String(100), nullable=False)
    status = Column(String(50), nullable=False, default="Created")
    pickup_address = Column(Text, nullable=False)
    delivery_address = Column(Text, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    carrier = relationship("Carrier", back_populates="loads")
    driver = relationship("Driver", back_populates="loads")
    equipment = relationship("Equipment", back_populates="load")


class PodRecord(Base):
    __tablename__ = "pods"

    id = Column(Integer, primary_key=True, index=True)
    load_id = Column(Integer, ForeignKey("loads.id"), nullable=False, index=True)
    uploaded_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    file_links = Column(JSON, nullable=False, default=list)
    signature_link = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    carrier_id = Column(Integer, ForeignKey("carriers.id"), nullable=False, index=True)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=True, index=True)
    amount = Column(Integer, nullable=False, default=0)
    category = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    occurred_at = Column(DateTime, nullable=True)
    receipt_link = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class Maintenance(Base):
    __tablename__ = "maintenance"

    id = Column(Integer, primary_key=True, index=True)
    carrier_id = Column(Integer, ForeignKey("carriers.id"), nullable=False, index=True)
    unit = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    cost = Column(Integer, nullable=False, default=0)
    occurred_at = Column(DateTime, nullable=True)
    receipt_link = Column(String(500), nullable=True)
    carrier = relationship("Carrier", back_populates="maintenance")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class Equipment(Base):
    __tablename__ = "equipment"

    id = Column(Integer, primary_key=True, index=True)
    carrier_id = Column(Integer, ForeignKey("carriers.id"), nullable=False, index=True)
    equipment_type = Column(String(50), nullable=False) # truck, trailer, etc
    identifier = Column(String(100), nullable=False)
    status = Column(String(50), nullable=False, default="available") # available, in_use, maintenance
    assigned_load_id = Column(Integer, ForeignKey("loads.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    carrier = relationship("Carrier", back_populates="equipment")
    load = relationship("Load", back_populates="equipment")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    carrier_id = Column(Integer, ForeignKey("carriers.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    type = Column(String(50), nullable=False) # urgent, warning, info
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    action_required = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
