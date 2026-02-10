"""
Temporary script to add Customer and Invoice models to the database
Run this once to create the tables
"""
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import os

# Get database URL from environment or use default
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./app.db")
engine = create_engine(DATABASE_URL)

Base = declarative_base()

class Customer(Base):
    """Customer/Broker/Shipper model"""
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    carrier_id = Column(Integer, nullable=False, index=True)
    company_name = Column(String(200), nullable=False, index=True)
    mc_number = Column(String(50), nullable=True, index=True)
    dot_number = Column(String(50), nullable=True)
    customer_type = Column(String(50), nullable=False, default="broker")
    
    # Contact Information
    contact_name = Column(String(200), nullable=True)
    email = Column(String(200), nullable=True)
    phone = Column(String(50), nullable=True)
    
    # Address
    address = Column(String(300), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(2), nullable=True)
    zip_code = Column(String(20), nullable=True)
    
    # Business Terms
    payment_terms = Column(String(50), nullable=False, default="Net 30")
    credit_limit = Column(Float, nullable=True)
    default_rate = Column(Float, nullable=True)
    
    # Additional Info
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class Invoice(Base):
    """Invoice model for billing"""
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    carrier_id = Column(Integer, nullable=False, index=True)
    customer_id = Column(Integer, nullable=True, index=True)
    load_id = Column(Integer, nullable=True, index=True)
    
    invoice_number = Column(String(100), nullable=False, unique=True, index=True)
    invoice_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    due_date = Column(DateTime, nullable=False)
    
    # Amounts
    subtotal = Column(Float, nullable=False, default=0.0)
    tax_amount = Column(Float, nullable=False, default=0.0)
    total_amount = Column(Float, nullable=False, default=0.0)
    amount_paid = Column(Float, nullable=False, default=0.0)
    balance_due = Column(Float, nullable=False, default=0.0)
    
    # Status
    status = Column(String(50), nullable=False, default="draft")
    payment_terms = Column(String(50), nullable=False, default="Net 30")
    
    # Additional Info
    notes = Column(Text, nullable=True)
    sent_at = Column(DateTime, nullable=True)
    paid_at = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class InvoiceLineItem(Base):
    """Line items for invoices"""
    __tablename__ = "invoice_line_items"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, nullable=False, index=True)
    
    description = Column(String(500), nullable=False)
    quantity = Column(Float, nullable=False, default=1.0)
    unit_price = Column(Float, nullable=False, default=0.0)
    amount = Column(Float, nullable=False, default=0.0)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


if __name__ == "__main__":
    print("Creating Customer, Invoice, and InvoiceLineItem tables...")
    try:
        # Create tables
        Base.metadata.create_all(engine)
        print("✓ Tables created successfully!")
        print("  - customers")
        print("  - invoices")
        print("  - invoice_line_items")
    except Exception as e:
        print(f"✗ Error creating tables: {e}")
