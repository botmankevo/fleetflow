"""
Demo data seeder for payroll system.
Creates realistic payroll scenarios with drivers, loads, settlements, and recurring items.
"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.core.database import get_session_factory
from app import models
from decimal import Decimal
import random


def seed_payroll_demo_data():
    """Seed database with realistic payroll demo data."""
    SessionLocal = get_session_factory()
    db = SessionLocal()
    
    try:
        print("🌱 Starting payroll demo data seeding...")
        
        # Get or create carrier
        carrier = db.query(models.Carrier).first()
        if not carrier:
            carrier = models.Carrier(
                name="Cox Transport & Logistics",
                mc_number="MC123456",
                dot_number="DOT789012"
            )
            db.add(carrier)
            db.commit()
            db.refresh(carrier)
            print(f"✓ Created carrier: {carrier.name}")
        else:
            print(f"✓ Using existing carrier: {carrier.name}")
        
        # Create demo payees and drivers
        demo_drivers = [
            {
                "name": "Manuel Flores",
                "email": "manuel.flores@example.com",
                "phone": "555-0101",
                "license_number": "DL123456",
                "payee_type": "individual",
                "driver_kind": "company_driver",
                "pay_type": "percentage",
                "pay_rate": 25.0,  # 25% of freight
            },
            {
                "name": "James Wilson",
                "email": "james.wilson@example.com",
                "phone": "555-0102",
                "license_number": "DL234567",
                "payee_type": "individual",
                "driver_kind": "company_driver",
                "pay_type": "per_mile",
                "pay_rate": 0.55,  # $0.55 per mile
            },
            {
                "name": "Kevin Cox",
                "email": "kevin.cox@example.com",
                "phone": "555-0103",
                "license_number": "DL345678",
                "payee_type": "company",
                "driver_kind": "owner_operator",
                "pay_type": "percentage",
                "pay_rate": 75.0,  # 75% of freight
            },
            {
                "name": "Sarah Johnson",
                "email": "sarah.johnson@example.com",
                "phone": "555-0104",
                "license_number": "DL456789",
                "payee_type": "individual",
                "driver_kind": "company_driver",
                "pay_type": "flat_rate",
                "pay_rate": 500.0,  # $500 flat rate per load
            },
        ]
        
        created_drivers = []
        for driver_data in demo_drivers:
            # Check if driver already exists
            existing = db.query(models.Driver).filter(
                models.Driver.name == driver_data["name"],
                models.Driver.carrier_id == carrier.id
            ).first()
            
            if existing:
                print(f"  → Driver already exists: {driver_data['name']}")
                created_drivers.append(existing)
                continue
            
            # Create payee
            payee = models.Payee(
                name=driver_data["name"],
                payee_type=driver_data["payee_type"],
                carrier_id=carrier.id
            )
            db.add(payee)
            db.flush()
            
            # Create driver
            driver = models.Driver(
                name=driver_data["name"],
                email=driver_data["email"],
                phone=driver_data["phone"],
                license_number=driver_data["license_number"],
                payee_id=payee.id,
                carrier_id=carrier.id,
                driver_kind=driver_data["driver_kind"],
                status="active"
            )
            db.add(driver)
            db.flush()
            
            # Create pay profile
            pay_profile = models.DriverPayProfile(
                driver_id=driver.id,
                pay_type=driver_data["pay_type"],
                rate=Decimal(str(driver_data["pay_rate"])),
                effective_date=datetime.now() - timedelta(days=90)
            )
            db.add(pay_profile)
            
            created_drivers.append(driver)
            print(f"✓ Created driver: {driver.name} ({driver.driver_kind}, {driver_data['pay_type']})")
        
        db.commit()
        
        # Create recurring items for some drivers
        print("\n💰 Creating recurring settlement items...")
        recurring_items_data = [
            {"driver_idx": 0, "type": "deduction", "amount": 50.0, "description": "Health Insurance", "schedule": "weekly"},
            {"driver_idx": 0, "type": "deduction", "amount": 25.0, "description": "401k Contribution", "schedule": "weekly"},
            {"driver_idx": 1, "type": "deduction", "amount": 75.0, "description": "Health Insurance", "schedule": "weekly"},
            {"driver_idx": 1, "type": "bonus", "amount": 100.0, "description": "Safety Bonus", "schedule": "monthly"},
            {"driver_idx": 2, "type": "deduction", "amount": 200.0, "description": "Truck Lease Payment", "schedule": "weekly"},
            {"driver_idx": 3, "type": "deduction", "amount": 50.0, "description": "Fuel Card Fee", "schedule": "weekly"},
        ]
        
        for item_data in recurring_items_data:
            driver = created_drivers[item_data["driver_idx"]]
            
            # Check if already exists
            existing = db.query(models.RecurringSettlementItem).filter(
                models.RecurringSettlementItem.driver_id == driver.id,
                models.RecurringSettlementItem.description == item_data["description"]
            ).first()
            
            if existing:
                continue
            
            recurring_item = models.RecurringSettlementItem(
                driver_id=driver.id,
                payee_id=driver.payee_id,
                item_type=item_data["type"],
                amount=Decimal(str(item_data["amount"])),
                description=item_data["description"],
                schedule=item_data["schedule"],
                next_date=datetime.now() - timedelta(days=7),  # Due now
                active=True
            )
            db.add(recurring_item)
            print(f"  ✓ {driver.name}: {item_data['description']} (${item_data['amount']}, {item_data['schedule']})")
        
        db.commit()
        
        # Create demo loads with payroll data
        print("\n🚛 Creating demo loads...")
        demo_loads = [
            {"driver_idx": 0, "load_number": "DEMO-L001", "rate": 1250.0, "miles": 500},
            {"driver_idx": 0, "load_number": "DEMO-L002", "rate": 1500.0, "miles": 600},
            {"driver_idx": 1, "load_number": "DEMO-L003", "rate": 1800.0, "miles": 750},
            {"driver_idx": 1, "load_number": "DEMO-L004", "rate": 1400.0, "miles": 550},
            {"driver_idx": 2, "load_number": "DEMO-L005", "rate": 2000.0, "miles": 800},
            {"driver_idx": 3, "load_number": "DEMO-L006", "rate": 1600.0, "miles": 650},
            {"driver_idx": 3, "load_number": "DEMO-L007", "rate": 1300.0, "miles": 500},
        ]
        
        created_loads = []
        for load_data in demo_loads:
            # Check if load exists
            existing = db.query(models.Load).filter(
                models.Load.load_number == load_data["load_number"]
            ).first()
            
            if existing:
                print(f"  → Load already exists: {load_data['load_number']}")
                created_loads.append(existing)
                continue
            
            driver = created_drivers[load_data["driver_idx"]]
            
            load = models.Load(
                load_number=load_data["load_number"],
                carrier_id=carrier.id,
                driver_id=driver.id,
                pickup_location="Chicago, IL",
                delivery_location="Dallas, TX",
                pickup_date=datetime.now() - timedelta(days=random.randint(1, 14)),
                delivery_date=datetime.now() - timedelta(days=random.randint(0, 7)),
                status="delivered",
                rate=Decimal(str(load_data["rate"])),
                miles=load_data["miles"],
                pickup_address="123 Main St, Chicago, IL 60601",
                delivery_address="456 Oak Ave, Dallas, TX 75201"
            )
            db.add(load)
            db.flush()
            
            # Create settlement ledger lines based on pay type
            driver_pay = 0
            pay_profile = db.query(models.DriverPayProfile).filter(
                models.DriverPayProfile.driver_id == driver.id
            ).first()
            
            if pay_profile:
                if pay_profile.pay_type == "percentage":
                    driver_pay = float(load_data["rate"]) * (float(pay_profile.rate) / 100)
                    description = f"Freight % ({pay_profile.rate}%)"
                elif pay_profile.pay_type == "per_mile":
                    driver_pay = load_data["miles"] * float(pay_profile.rate)
                    description = f"Per Mile (${pay_profile.rate}/mi)"
                elif pay_profile.pay_type == "flat_rate":
                    driver_pay = float(pay_profile.rate)
                    description = "Flat Rate"
                
                ledger_line = models.SettlementLedgerLine(
                    load_id=load.id,
                    payee_id=driver.payee_id,
                    category="freight_pay",
                    description=description,
                    amount=Decimal(str(driver_pay))
                )
                db.add(ledger_line)
            
            created_loads.append(load)
            print(f"✓ Created load: {load.load_number} - ${load_data['rate']} ({driver.name}, ${driver_pay:.2f} pay)")
        
        db.commit()
        
        # Create a paid settlement for one driver (to demonstrate locked lines)
        print("\n📋 Creating demo settlements...")
        
        # Settlement 1: Paid settlement for Manuel Flores
        manuel = created_drivers[0]
        settlement1 = models.PayrollSettlement(
            payee_id=manuel.payee_id,
            period_start=datetime.now() - timedelta(days=14),
            period_end=datetime.now() - timedelta(days=7),
            status="paid",
            paid_at=datetime.now() - timedelta(days=3)
        )
        db.add(settlement1)
        db.flush()
        
        # Attach first load's lines to settlement
        manuel_lines = db.query(models.SettlementLedgerLine).filter(
            models.SettlementLedgerLine.payee_id == manuel.payee_id
        ).limit(1).all()
        
        for line in manuel_lines:
            line.settlement_id = settlement1.id
            line.locked_at = datetime.now() - timedelta(days=3)
            line.locked_reason = "included_in_paid_settlement"
        
        # Add recurring items to settlement
        manuel_recurring = db.query(models.RecurringSettlementItem).filter(
            models.RecurringSettlementItem.driver_id == manuel.id
        ).all()
        
        for item in manuel_recurring:
            amount = float(item.amount) if item.item_type in ["addition", "bonus"] else -float(item.amount)
            rec_line = models.SettlementLedgerLine(
                load_id=None,
                payee_id=manuel.payee_id,
                settlement_id=settlement1.id,
                category=item.item_type,
                description=item.description,
                amount=Decimal(str(amount)),
                locked_at=datetime.now() - timedelta(days=3),
                locked_reason="included_in_paid_settlement"
            )
            db.add(rec_line)
        
        settlement_total = sum(float(line.amount) for line in db.query(models.SettlementLedgerLine).filter(
            models.SettlementLedgerLine.settlement_id == settlement1.id
        ).all())
        
        print(f"✓ Created PAID settlement #{settlement1.id} for {manuel.name}: ${settlement_total:.2f}")
        
        # Settlement 2: Draft settlement for James Wilson
        james = created_drivers[1]
        settlement2 = models.PayrollSettlement(
            payee_id=james.payee_id,
            period_start=datetime.now() - timedelta(days=7),
            period_end=datetime.now(),
            status="draft"
        )
        db.add(settlement2)
        db.flush()
        
        james_lines = db.query(models.SettlementLedgerLine).filter(
            models.SettlementLedgerLine.payee_id == james.payee_id,
            models.SettlementLedgerLine.settlement_id.is_(None)
        ).all()
        
        for line in james_lines:
            line.settlement_id = settlement2.id
        
        settlement2_total = sum(float(line.amount) for line in db.query(models.SettlementLedgerLine).filter(
            models.SettlementLedgerLine.settlement_id == settlement2.id
        ).all())
        
        print(f"✓ Created DRAFT settlement #{settlement2.id} for {james.name}: ${settlement2_total:.2f}")
        
        db.commit()
        
        # Create an adjustment line (simulating a change after payment)
        print("\n🔧 Creating demo adjustment...")
        if manuel_lines:
            original_line = manuel_lines[0]
            adjustment = models.SettlementLedgerLine(
                load_id=original_line.load_id,
                payee_id=original_line.payee_id,
                category="adjustment",
                description=f"Rate correction for Load {created_loads[0].load_number}",
                amount=Decimal("25.00"),  # $25 increase
                replaces_line_id=original_line.id
            )
            db.add(adjustment)
            db.commit()
            print(f"✓ Created adjustment line: +$25.00 for {manuel.name} (replaces line #{original_line.id})")
        
        # Summary
        print("\n" + "="*60)
        print("✅ DEMO DATA SEEDING COMPLETE!")
        print("="*60)
        print(f"Drivers created: {len(created_drivers)}")
        print(f"Loads created: {len(created_loads)}")
        print(f"Recurring items: {len(recurring_items_data)}")
        print(f"Settlements: 2 (1 paid, 1 draft)")
        print(f"Adjustments: 1")
        print("\n📊 Summary:")
        
        # Calculate totals
        total_pending = db.query(func.sum(models.SettlementLedgerLine.amount)).filter(
            models.SettlementLedgerLine.settlement_id.is_(None),
            models.SettlementLedgerLine.locked_at.is_(None)
        ).scalar() or 0
        
        total_paid = db.query(func.sum(models.SettlementLedgerLine.amount)).filter(
            models.SettlementLedgerLine.locked_at.isnot(None)
        ).scalar() or 0
        
        print(f"  Total Paid: ${float(total_paid):.2f}")
        print(f"  Total Pending: ${float(total_pending):.2f}")
        print(f"  Grand Total: ${float(total_paid + total_pending):.2f}")
        
        print("\n🚀 Ready to test! Access the system at:")
        print("  Admin: http://localhost:3000/admin/payroll")
        print("  Driver Portal: http://localhost:3000/driver/pay-history")
        print("\n")
        
    except Exception as e:
        print(f"\n❌ Error seeding data: {str(e)}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    from sqlalchemy import func
    seed_payroll_demo_data()
