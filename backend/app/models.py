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


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    carrier_id = Column(Integer, ForeignKey("carriers.id"), nullable=False, index=True)
    customer_type = Column(String(50), nullable=False, default="broker")  # broker, shipper, both
    company_name = Column(String(200), nullable=False)
    mc_number = Column(String(50), nullable=True)
    dot_number = Column(String(50), nullable=True)
    contact_name = Column(String(200), nullable=True)
    email = Column(String(200), nullable=True)
    phone = Column(String(50), nullable=True)
    address = Column(String(300), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(2), nullable=True)
    zip_code = Column(String(20), nullable=True)
    payment_terms = Column(String(50), nullable=True)
    credit_limit = Column(Float, nullable=True)
    default_rate = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    loads = relationship("Load", back_populates="customer")


class Load(Base):
    __tablename__ = "loads"

    id = Column(Integer, primary_key=True, index=True)
    carrier_id = Column(Integer, ForeignKey("carriers.id"), nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True, index=True)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=True, index=True)
    load_number = Column(String(100), nullable=False)
    status = Column(String(50), nullable=False, default="Created")
    broker_name = Column(String(200), nullable=True)
    broker_mc = Column(String(50), nullable=True)
    broker_dot = Column(String(50), nullable=True)
    broker_verified = Column(Boolean, default=False, nullable=True)
    broker_verified_at = Column(DateTime, nullable=True)
    po_number = Column(String(100), nullable=True)
    rate_amount = Column(Float, nullable=True)
    total_miles = Column(Float, nullable=True)
    rate_per_mile = Column(Float, nullable=True)
    pickup_address = Column(Text, nullable=False)
    pickup_date = Column(DateTime, nullable=True)
    delivery_address = Column(Text, nullable=False)
    delivery_date = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    
    # Document attachments
    rc_document = Column(Text, nullable=True)  # Rate Confirmation
    bol_document = Column(Text, nullable=True)  # Bill of Lading
    pod_document = Column(Text, nullable=True)  # Proof of Delivery
    invoice_document = Column(Text, nullable=True)  # Invoice
    receipt_document = Column(Text, nullable=True)  # Receipt
    other_document = Column(Text, nullable=True)  # Other documents
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    carrier = relationship("Carrier", back_populates="loads")
    customer = relationship("Customer", back_populates="loads")
    driver = relationship("Driver", back_populates="loads")
    equipment = relationship("Equipment", back_populates="load")
    extractions = relationship("LoadExtraction", back_populates="load")
    stops = relationship("LoadStop", back_populates="load")
    charges = relationship("LoadCharge", back_populates="load")
    ledger_lines = relationship("SettlementLedgerLine", back_populates="load")
    documents_exchange = relationship("DocumentExchange", foreign_keys="[DocumentExchange.load_id]")


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


class DocumentExchange(Base):
    __tablename__ = "document_exchange"

    id = Column(Integer, primary_key=True, index=True)
    carrier_id = Column(Integer, ForeignKey("carriers.id"), nullable=False, index=True)
    load_id = Column(Integer, ForeignKey("loads.id"), nullable=False, index=True)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=False, index=True)
    uploaded_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    doc_type = Column(String(50), nullable=False)  # BOL, Lumper, Receipt, Other
    attachment_url = Column(String(500), nullable=False)
    status = Column(String(50), nullable=False, default="Pending")  # Pending, Accepted, Rejected
    notes = Column(Text, nullable=True)
    reviewed_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    carrier_id = Column(Integer, ForeignKey("carriers.id"), nullable=False, index=True)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=True, index=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=True, index=True)
    load_id = Column(Integer, ForeignKey("loads.id"), nullable=True, index=True)
    equipment_id = Column(Integer, ForeignKey("equipment.id"), nullable=True, index=True)
    amount = Column(Integer, nullable=False, default=0)
    category = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    status = Column(String(50), default="pending")  # pending, approved, rejected
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    occurred_at = Column(DateTime, nullable=True)
    receipt_link = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class Maintenance(Base):
    __tablename__ = "maintenance"

    id = Column(Integer, primary_key=True, index=True)
    carrier_id = Column(Integer, ForeignKey("carriers.id"), nullable=False, index=True)
    equipment_id = Column(Integer, ForeignKey("equipment.id"), nullable=True, index=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=True, index=True)
    unit = Column(String(100), nullable=True)
    maintenance_type = Column(String(100), nullable=True)  # service, repair, inspection
    description = Column(Text, nullable=True)
    cost = Column(Integer, nullable=False, default=0)
    odometer = Column(Integer, nullable=True)
    scheduled_date = Column(DateTime, nullable=True)
    completed_date = Column(DateTime, nullable=True)
    status = Column(String(50), default="scheduled")  # scheduled, in_progress, completed, cancelled
    occurred_at = Column(DateTime, nullable=True)
    receipt_link = Column(String(500), nullable=True)
    carrier = relationship("Carrier", back_populates="maintenance")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


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
    stop_number = Column(Integer, nullable=False, default=1)
    company = Column(String(200), nullable=True)
    address = Column(Text, nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(20), nullable=True)
    zip_code = Column(String(20), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    date = Column(String(20), nullable=True)
    time = Column(String(20), nullable=True)
    miles_to_next_stop = Column(Float, nullable=True)
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


# Safety & Compliance Models
class SafetyEvent(Base):
    __tablename__ = "safety_events"
    
    id = Column(Integer, primary_key=True, index=True)
    carrier_id = Column(Integer, ForeignKey("carriers.id"), nullable=False, index=True)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=True)
    equipment_id = Column(Integer, ForeignKey("equipment.id"), nullable=True)
    event_type = Column(String(50))  # accident, violation, inspection, citation
    event_date = Column(DateTime)
    severity = Column(String(50))  # low, medium, high, critical
    description = Column(Text)
    location = Column(String(200), nullable=True)
    citation_number = Column(String(100), nullable=True)
    points = Column(Integer, default=0)
    fine_amount = Column(Float, nullable=True)
    status = Column(String(50), default="open")  # open, resolved, contested
    resolution_notes = Column(Text, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class SafetyScore(Base):
    __tablename__ = "safety_scores"
    
    id = Column(Integer, primary_key=True, index=True)
    carrier_id = Column(Integer, ForeignKey("carriers.id"), nullable=False, index=True)
    driver_id = Column(Integer, ForeignKey("drivers.id"), unique=True)
    csa_score = Column(Float, nullable=True)
    accident_count = Column(Integer, default=0)
    violation_count = Column(Integer, default=0)
    inspection_count = Column(Integer, default=0)
    clean_inspection_count = Column(Integer, default=0)
    last_violation_date = Column(DateTime, nullable=True)
    last_inspection_date = Column(DateTime, nullable=True)
    safety_rating = Column(String(50), default="satisfactory")  # satisfactory, conditional, unsatisfactory
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# Toll Management Models
class TollTransaction(Base):
    __tablename__ = "toll_transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    carrier_id = Column(Integer, ForeignKey("carriers.id"), nullable=False, index=True)
    load_id = Column(Integer, ForeignKey("loads.id"), nullable=True)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=True)
    equipment_id = Column(Integer, ForeignKey("equipment.id"), nullable=True)
    transponder_id = Column(Integer, ForeignKey("toll_transponders.id"), nullable=True)
    transaction_date = Column(DateTime)
    toll_authority = Column(String(100))  # EZPass, PrePass, etc.
    location = Column(String(200))
    amount = Column(Float)
    reference_number = Column(String(100), nullable=True)
    status = Column(String(50), default="pending")  # pending, verified, disputed
    reimbursed = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class TollTransponder(Base):
    __tablename__ = "toll_transponders"
    
    id = Column(Integer, primary_key=True, index=True)
    carrier_id = Column(Integer, ForeignKey("carriers.id"), nullable=False, index=True)
    transponder_number = Column(String(100), unique=True)
    provider = Column(String(100))  # EZPass, PrePass, BestPass, etc.
    equipment_id = Column(Integer, ForeignKey("equipment.id"), nullable=True)
    status = Column(String(50), default="active")  # active, inactive, lost, damaged
    activation_date = Column(DateTime)
    deactivation_date = Column(DateTime, nullable=True)
    balance = Column(Float, default=0.0)
    auto_replenish = Column(Boolean, default=True)
    replenish_threshold = Column(Float, default=20.0)
    replenish_amount = Column(Float, default=50.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# Vendor Management Models
class Vendor(Base):
    __tablename__ = "vendors"
    
    id = Column(Integer, primary_key=True, index=True)
    carrier_id = Column(Integer, ForeignKey("carriers.id"), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    vendor_type = Column(String(100))  # repair_shop, fuel_station, tire_shop, permit_service, insurance, etc.
    contact_name = Column(String(200), nullable=True)
    email = Column(String(200), nullable=True)
    phone = Column(String(50), nullable=True)
    address = Column(String(300), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(2), nullable=True)
    zip_code = Column(String(20), nullable=True)
    tax_id = Column(String(50), nullable=True)
    payment_terms = Column(String(50), nullable=True)  # NET30, NET60, COD, etc.
    account_number = Column(String(100), nullable=True)
    website = Column(String(200), nullable=True)
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    preferred = Column(Boolean, default=False)
    rating = Column(Float, nullable=True)  # 1-5 star rating
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# IFTA Models
class IftaReport(Base):
    __tablename__ = "ifta_reports"
    
    id = Column(Integer, primary_key=True, index=True)
    carrier_id = Column(Integer, ForeignKey("carriers.id"), nullable=False, index=True)
    quarter = Column(Integer, nullable=False)  # 1, 2, 3, 4
    year = Column(Integer, nullable=False)
    status = Column(String(50), default="draft")  # draft, finalized, filed
    total_miles = Column(Float, default=0.0)
    total_gallons = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class IftaEntry(Base):
    __tablename__ = "ifta_entries"
    
    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("ifta_reports.id"), nullable=True, index=True)
    carrier_id = Column(Integer, ForeignKey("carriers.id"), nullable=False, index=True)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=True)
    equipment_id = Column(Integer, ForeignKey("equipment.id"), nullable=True)
    jurisdiction = Column(String(2), nullable=False)  # State/Province code
    entry_date = Column(DateTime, nullable=False)
    miles = Column(Float, nullable=False)
    gallons = Column(Float, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
