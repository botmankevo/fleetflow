"""
Seed demo data for testing MainTMS AI features
Run with: python -m app.scripts.seed_demo_data
"""
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent.parent))

from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.core.database import get_session_factory, get_engine, Base
from app.models import User, Driver, Load, Equipment
# Customer and Invoice models may not exist yet
import app.models as models

# Get engine and session factory
engine = get_engine()
SessionLocal = get_session_factory()

# Create tables
Base.metadata.create_all(bind=engine)

def create_demo_user(db: Session):
    """Create demo admin user"""
    user = db.query(User).filter(User.email == "admin@maintms.com").first()
    if not user:
        user = User(
            email="admin@maintms.com",
            hashed_password="$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzS1qN.T3i",  # password: admin123
            full_name="Admin User",
            role="admin",
            is_active=True
        )
        db.add(user)
        db.commit()
        print("✅ Created admin user: admin@maintms.com / admin123")
    else:
        print("ℹ️  Admin user already exists")
    return user


def create_demo_customers(db: Session):
    """Create demo customers"""
    customers_data = [
        {"name": "Acme Corp", "email": "contact@acmecorp.com", "phone": "555-0101", "address": "123 Business Ave, New York, NY 10001"},
        {"name": "Global Logistics", "email": "info@globallogistics.com", "phone": "555-0102", "address": "456 Commerce Blvd, Los Angeles, CA 90001"},
        {"name": "TechStart Inc", "email": "ops@techstart.com", "phone": "555-0103", "address": "789 Innovation Dr, Austin, TX 78701"},
        {"name": "Retail Giants", "email": "shipping@retailgiants.com", "phone": "555-0104", "address": "321 Market St, Chicago, IL 60601"},
    ]
    
    customers = []
    for data in customers_data:
        customer = db.query(Customer).filter(Customer.email == data["email"]).first()
        if not customer:
            customer = Customer(**data)
            db.add(customer)
            customers.append(customer)
        else:
            customers.append(customer)
    
    db.commit()
    print(f"✅ Created/verified {len(customers)} customers")
    return customers


def create_demo_drivers(db: Session):
    """Create demo drivers"""
    drivers_data = [
        {"name": "John Smith", "email": "john.smith@maintms.com", "phone": "555-1001", "license_number": "DL123456", "status": "Available"},
        {"name": "Maria Garcia", "email": "maria.garcia@maintms.com", "phone": "555-1002", "license_number": "DL234567", "status": "On Trip"},
        {"name": "David Johnson", "email": "david.johnson@maintms.com", "phone": "555-1003", "license_number": "DL345678", "status": "Available"},
        {"name": "Sarah Williams", "email": "sarah.williams@maintms.com", "phone": "555-1004", "license_number": "DL456789", "status": "Available"},
        {"name": "Robert Brown", "email": "robert.brown@maintms.com", "phone": "555-1005", "license_number": "DL567890", "status": "Off Duty"},
        {"name": "Jennifer Davis", "email": "jennifer.davis@maintms.com", "phone": "555-1006", "license_number": "DL678901", "status": "Available"},
    ]
    
    drivers = []
    for data in drivers_data:
        driver = db.query(Driver).filter(Driver.email == data["email"]).first()
        if not driver:
            driver = Driver(**data)
            db.add(driver)
            drivers.append(driver)
        else:
            drivers.append(driver)
    
    db.commit()
    print(f"✅ Created/verified {len(drivers)} drivers")
    return drivers


def create_demo_equipment(db: Session):
    """Create demo equipment"""
    equipment_data = [
        {"unit_number": "TRUCK-101", "type": "Tractor", "make": "Freightliner", "model": "Cascadia", "year": 2022, "vin": "1FUJGHDV8NLBC1234", "status": "Active"},
        {"unit_number": "TRUCK-102", "type": "Tractor", "make": "Volvo", "model": "VNL", "year": 2021, "vin": "4V4NC9EH0LN234567", "status": "Active"},
        {"unit_number": "TRUCK-103", "type": "Tractor", "make": "Kenworth", "model": "T680", "year": 2023, "vin": "1XKYDP9X9NJ345678", "status": "Active"},
        {"unit_number": "TRAILER-201", "type": "Trailer", "make": "Utility", "model": "3000R", "year": 2020, "vin": "1UYVS25338M456789", "status": "Active"},
        {"unit_number": "TRAILER-202", "type": "Trailer", "make": "Great Dane", "model": "Freedom", "year": 2021, "vin": "1GRAA06229567890", "status": "Active"},
    ]
    
    equipment = []
    for data in equipment_data:
        equip = db.query(Equipment).filter(Equipment.unit_number == data["unit_number"]).first()
        if not equip:
            equip = Equipment(**data)
            db.add(equip)
            equipment.append(equip)
        else:
            equipment.append(equip)
    
    db.commit()
    print(f"✅ Created/verified {len(equipment)} equipment")
    return equipment


def create_demo_loads(db: Session, customers, drivers):
    """Create demo loads"""
    today = datetime.utcnow()
    
    loads_data = [
        {
            "load_number": "LOAD-2024-001",
            "customer_id": customers[0].id,
            "pickup_address": "123 Business Ave, New York, NY 10001",
            "delivery_address": "456 Commerce Blvd, Los Angeles, CA 90001",
            "pickup_date": today + timedelta(days=1),
            "delivery_date": today + timedelta(days=5),
            "status": "Created",
            "rate": 3500.00,
            "distance": 2800,
        },
        {
            "load_number": "LOAD-2024-002",
            "customer_id": customers[1].id,
            "driver_id": drivers[1].id,
            "pickup_address": "789 Innovation Dr, Austin, TX 78701",
            "delivery_address": "321 Market St, Chicago, IL 60601",
            "pickup_date": today - timedelta(days=2),
            "delivery_date": today + timedelta(days=2),
            "status": "In Transit",
            "rate": 2800.00,
            "distance": 1200,
        },
        {
            "load_number": "LOAD-2024-003",
            "customer_id": customers[2].id,
            "driver_id": drivers[0].id,
            "pickup_address": "555 Tech Park, San Francisco, CA 94102",
            "delivery_address": "777 Corporate Way, Seattle, WA 98101",
            "pickup_date": today + timedelta(days=2),
            "delivery_date": today + timedelta(days=4),
            "status": "Assigned",
            "rate": 2200.00,
            "distance": 900,
        },
        {
            "load_number": "LOAD-2024-004",
            "customer_id": customers[0].id,
            "pickup_address": "888 Distribution Center, Dallas, TX 75201",
            "delivery_address": "999 Warehouse Rd, Miami, FL 33101",
            "pickup_date": today + timedelta(days=3),
            "delivery_date": today + timedelta(days=6),
            "status": "Created",
            "rate": 3200.00,
            "distance": 1400,
        },
        {
            "load_number": "LOAD-2024-005",
            "customer_id": customers[3].id,
            "driver_id": drivers[2].id,
            "pickup_address": "111 Port Terminal, Long Beach, CA 90802",
            "delivery_address": "222 Industrial Pkwy, Phoenix, AZ 85001",
            "pickup_date": today - timedelta(days=5),
            "delivery_date": today - timedelta(days=2),
            "status": "Delivered",
            "rate": 1800.00,
            "distance": 400,
        },
        {
            "load_number": "LOAD-2024-006",
            "customer_id": customers[1].id,
            "pickup_address": "333 Manufacturing Dr, Detroit, MI 48201",
            "delivery_address": "444 Supply Chain Ave, Boston, MA 02101",
            "pickup_date": today + timedelta(days=1),
            "delivery_date": today + timedelta(days=4),
            "status": "Created",
            "rate": 2600.00,
            "distance": 800,
        },
    ]
    
    loads = []
    for data in loads_data:
        load = db.query(Load).filter(Load.load_number == data["load_number"]).first()
        if not load:
            load = Load(**data)
            db.add(load)
            loads.append(load)
        else:
            loads.append(load)
    
    db.commit()
    print(f"✅ Created/verified {len(loads)} loads")
    return loads


def create_demo_invoices(db: Session, loads, customers):
    """Create demo invoices"""
    invoices_data = []
    
    for i, load in enumerate(loads):
        status = "Paid" if load.status == "Delivered" else "Pending" if load.status == "In Transit" else "Draft"
        
        invoice_data = {
            "invoice_number": f"INV-2024-{str(i+1).zfill(3)}",
            "customer_id": load.customer_id,
            "load_id": load.id,
            "amount": load.rate or 0,
            "status": status,
            "issue_date": load.pickup_date or datetime.utcnow(),
            "due_date": (load.pickup_date or datetime.utcnow()) + timedelta(days=30),
        }
        
        if status == "Paid":
            invoice_data["paid_date"] = (load.delivery_date or datetime.utcnow()) + timedelta(days=5)
        
        invoices_data.append(invoice_data)
    
    invoices = []
    for data in invoices_data:
        invoice = db.query(Invoice).filter(Invoice.invoice_number == data["invoice_number"]).first()
        if not invoice:
            invoice = Invoice(**data)
            db.add(invoice)
            invoices.append(invoice)
        else:
            invoices.append(invoice)
    
    db.commit()
    print(f"✅ Created/verified {len(invoices)} invoices")
    return invoices


def main():
    """Seed all demo data"""
    print("\n🌱 Seeding MainTMS Demo Data...\n")
    
    db = SessionLocal()
    try:
        # Create data in order of dependencies
        user = create_demo_user(db)
        customers = create_demo_customers(db)
        drivers = create_demo_drivers(db)
        equipment = create_demo_equipment(db)
        loads = create_demo_loads(db, customers, drivers)
        invoices = create_demo_invoices(db, loads, customers)
        
        print("\n" + "="*50)
        print("✅ Demo data seeding complete!")
        print("="*50)
        print("\n📊 Summary:")
        print(f"   • Users: 1")
        print(f"   • Customers: {len(customers)}")
        print(f"   • Drivers: {len(drivers)}")
        print(f"   • Equipment: {len(equipment)}")
        print(f"   • Loads: {len(loads)}")
        print(f"   • Invoices: {len(invoices)}")
        print("\n🔑 Login Credentials:")
        print("   Email: admin@maintms.com")
        print("   Password: admin123")
        print("\n🚀 Ready to test!\n")
        
    except Exception as e:
        print(f"\n❌ Error seeding data: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
