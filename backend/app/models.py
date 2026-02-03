from datetime import datetime
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, Boolean, JSON, Float
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
    payee_id = Column(Integer, ForeignKey("payees.id"), nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    carrier = relationship("Carrier", back_populates="drivers")
    loads = relationship("Load", back_populates="driver")
    user = relationship("User", back_populates="driver", uselist=False)
    payee = relationship("Payee", back_populates="driver", uselist=False)
    pay_profile = relationship("DriverPayProfile", back_populates="driver", uselist=False)
    documents = relationship("DriverDocument", back_populates="driver")
    additional_payees = relationship("DriverAdditionalPayee", back_populates="driver")
    recurring_items = relationship("RecurringSettlementItem", back_populates="driver")


class Load(Base):
    __tablename__ = "loads"

    id = Column(Integer, primary_key=True, index=True)
    carrier_id = Column(Integer, ForeignKey("carriers.id"), nullable=False, index=True)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=True, index=True)
    load_number = Column(String(100), nullable=False)
    status = Column(String(50), nullable=False, default="Created")
    broker_name = Column(String(200), nullable=True)
    po_number = Column(String(100), nullable=True)
    rate_amount = Column(Float, nullable=True)
    pickup_address = Column(Text, nullable=False)
    delivery_address = Column(Text, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    carrier = relationship("Carrier", back_populates="loads")
    driver = relationship("Driver", back_populates="loads")
    equipment = relationship("Equipment", back_populates="load")
    extractions = relationship("LoadExtraction", back_populates="load")
    stops = relationship("LoadStop", back_populates="load")
    charges = relationship("LoadCharge", back_populates="load")
    ledger_lines = relationship("SettlementLedgerLine", back_populates="load")


class LoadExtraction(Base):
    __tablename__ = "load_extractions"

    id = Column(Integer, primary_key=True, index=True)
    load_id = Column(Integer, ForeignKey("loads.id"), nullable=False, index=True)
    raw_text = Column(Text, nullable=False)
    source_files = Column(JSON, nullable=False, default=list)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    load = relationship("Load", back_populates="extractions")


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


class Payee(Base):
    __tablename__ = "payees"

    id = Column(Integer, primary_key=True, index=True)
    carrier_id = Column(Integer, ForeignKey("carriers.id"), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    payee_type = Column(String(50), nullable=False, default="person")  # person, company, owner_operator
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    driver = relationship("Driver", back_populates="payee", uselist=False)


class DriverPayProfile(Base):
    __tablename__ = "driver_pay_profiles"

    id = Column(Integer, primary_key=True, index=True)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=False, index=True)
    pay_type = Column(String(50), nullable=False)  # percent, per_mile, flat, hourly
    rate = Column(Float, nullable=False)
    driver_kind = Column(String(50), nullable=False, default="company_driver")  # company_driver, owner_operator
    active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    driver = relationship("Driver", back_populates="pay_profile")


class DriverAdditionalPayee(Base):
    __tablename__ = "driver_additional_payees"

    id = Column(Integer, primary_key=True, index=True)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=False, index=True)
    payee_id = Column(Integer, ForeignKey("payees.id"), nullable=False, index=True)
    pay_rate_percent = Column(Float, nullable=False, default=0.0)
    active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    driver = relationship("Driver", back_populates="additional_payees")
    payee = relationship("Payee")


class DriverDocument(Base):
    __tablename__ = "driver_documents"

    id = Column(Integer, primary_key=True, index=True)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=False, index=True)
    doc_type = Column(String(50), nullable=False)
    status = Column(String(50), nullable=False, default="pending")
    issued_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    attachment_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    driver = relationship("Driver", back_populates="documents")


class RecurringSettlementItem(Base):
    __tablename__ = "recurring_settlement_items"

    id = Column(Integer, primary_key=True, index=True)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=False, index=True)
    payee_id = Column(Integer, ForeignKey("payees.id"), nullable=False, index=True)
    item_type = Column(String(50), nullable=False)  # addition, deduction, escrow, loan
    amount = Column(Float, nullable=False)
    schedule = Column(String(50), nullable=False, default="weekly")
    next_date = Column(DateTime, nullable=True)
    active = Column(Boolean, default=True, nullable=False)
    description = Column(String(200), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    driver = relationship("Driver", back_populates="recurring_items")


class LoadStop(Base):
    __tablename__ = "load_stops"

    id = Column(Integer, primary_key=True, index=True)
    load_id = Column(Integer, ForeignKey("loads.id"), nullable=False, index=True)
    stop_type = Column(String(20), nullable=False)  # pickup, delivery
    company = Column(String(200), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(20), nullable=True)
    date = Column(String(20), nullable=True)
    time = Column(String(20), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    load = relationship("Load", back_populates="stops")


class LoadCharge(Base):
    __tablename__ = "load_charges"

    id = Column(Integer, primary_key=True, index=True)
    load_id = Column(Integer, ForeignKey("loads.id"), nullable=False, index=True)
    category = Column(String(50), nullable=False)  # lumper, detention, adjustment
    description = Column(String(200), nullable=True)
    amount = Column(Float, nullable=False, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    load = relationship("Load", back_populates="charges")


class PayrollSettlement(Base):
    __tablename__ = "payroll_settlements"

    id = Column(Integer, primary_key=True, index=True)
    payee_id = Column(Integer, ForeignKey("payees.id"), nullable=False, index=True)
    period_start = Column(DateTime, nullable=False)
    period_end = Column(DateTime, nullable=False)
    status = Column(String(50), nullable=False, default="draft")  # draft, approved, paid, exported, voided
    paid_at = Column(DateTime, nullable=True)
    exported_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class SettlementLedgerLine(Base):
    __tablename__ = "settlement_ledger_lines"

    id = Column(Integer, primary_key=True, index=True)
    load_id = Column(Integer, ForeignKey("loads.id"), nullable=True, index=True)
    payee_id = Column(Integer, ForeignKey("payees.id"), nullable=False, index=True)
    settlement_id = Column(Integer, ForeignKey("payroll_settlements.id"), nullable=True, index=True)
    category = Column(String(50), nullable=False)
    description = Column(String(300), nullable=True)
    amount = Column(Float, nullable=False, default=0.0)
    locked_at = Column(DateTime, nullable=True)
    locked_reason = Column(String(50), nullable=True)
    voided_at = Column(DateTime, nullable=True)
    replaces_line_id = Column(Integer, ForeignKey("settlement_ledger_lines.id"), nullable=True)
    adjustment_group_id = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    load = relationship("Load", back_populates="ledger_lines")
