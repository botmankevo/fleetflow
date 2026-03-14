import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent.parent))

from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import random
from app.core.database import get_session_factory, get_engine
from app.models import Carrier, User, FinancialSettings, Expense, Load

def seed_financials():
    engine = get_engine()
    SessionLocal = get_session_factory()
    db = SessionLocal()
    
    try:
        # Get or create carrier
        carrier = db.query(Carrier).filter(Carrier.internal_code == "MAIN").first()
        if not carrier:
            carrier = Carrier(name="MainTMS Carrier", internal_code="MAIN")
            db.add(carrier)
            db.commit()
            db.refresh(carrier)
        
        # Create financial settings
        settings = db.query(FinancialSettings).filter(FinancialSettings.carrier_id == carrier.id).first()
        if not settings:
            settings = FinancialSettings(
                carrier_id=carrier.id,
                target_profit_rpm=1.85,
                warning_rpm=1.50,
                break_even_rpm=1.35,
                fuel_cost_per_gallon=3.85,
                avg_mpg=6.2,
                monthly_insurance=1500,
                monthly_truck_payment=2500,
                monthly_permits=200,
                monthly_other_fixed=500
            )
            db.add(settings)
            db.commit()
            print("✅ Created financial settings")
        
        # Create some expenses
        expense_types = ['fixed', 'variable']
        categories = ['Fuel', 'Maintenance', 'Insurance', 'Tolls', 'Repair', 'Tires']
        
        print("Seeding expenses...")
        for i in range(20):
            exp_type = random.choice(expense_types)
            amount = random.uniform(50, 2000)
            date = datetime.utcnow() - timedelta(days=random.randint(0, 60))
            
            expense = Expense(
                carrier_id=carrier.id,
                amount=amount,
                occurred_at=date,
                category=random.choice(categories),
                description=f"Demo {exp_type} expense {i}",
                expense_type=exp_type,
                status="Paid"
            )
            db.add(expense)
        
        # Create some loads with financials
        print("Seeding loads...")
        for i in range(15):
            miles = random.randint(300, 2500)
            rpm = random.uniform(1.2, 2.5)
            rate = miles * rpm
            
            load = Load(
                carrier_id=carrier.id,
                load_number=f"DEMO-{1000+i}",
                status=random.choice(["Delivered", "In Transit", "Assigned"]),
                pickup_address="Origin City, ST",
                delivery_address="Destination City, ST",
                rate_amount=rate,
                total_miles=miles,
                rate_per_mile=rpm,
                deadhead_miles=random.randint(20, 100),
                load_type=random.choice(["Full", "Partial"]),
                pickup_date=datetime.utcnow() - timedelta(days=random.randint(0, 30)),
                delivery_date=datetime.utcnow() + timedelta(days=random.randint(1, 5))
            )
            db.add(load)
            
        db.commit()
        print("✅ Seeding complete!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_financials()
