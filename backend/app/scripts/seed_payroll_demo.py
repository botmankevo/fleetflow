import argparse
from datetime import datetime

from app.core.database import get_session_factory
from app import models


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed payroll demo data")
    parser.add_argument("--carrier-code", default="FF")
    args = parser.parse_args()

    SessionLocal = get_session_factory()
    db = SessionLocal()
    try:
        carrier = db.query(models.Carrier).filter(models.Carrier.internal_code == args.carrier_code).first()
        if not carrier:
            carrier = models.Carrier(name="FleetFlow", internal_code=args.carrier_code)
            db.add(carrier)
            db.commit()
            db.refresh(carrier)

        # Payees
        manuel_payee = models.Payee(name="Manuel Flores", payee_type="person", carrier_id=carrier.id)
        kevin_payee = models.Payee(name="Kevin Cox", payee_type="company", carrier_id=carrier.id)
        ezdub_payee = models.Payee(name="Ez Dub Transport LLC", payee_type="company", carrier_id=carrier.id)
        db.add_all([manuel_payee, kevin_payee, ezdub_payee])
        db.commit()

        # Driver
        driver = models.Driver(
            carrier_id=carrier.id,
            name="Manuel Flores",
            email="manuelflores093@gmail.com",
            phone="(346) 431-8323",
            payee_id=manuel_payee.id,
        )
        db.add(driver)
        db.commit()
        db.refresh(driver)

        # Pay profile
        profile = models.DriverPayProfile(
            driver_id=driver.id,
            pay_type="percent",
            rate=25.0,
            driver_kind="company_driver",
            active=True,
        )
        db.add(profile)

        # Additional payee (equipment owner)
        additional = models.DriverAdditionalPayee(
            driver_id=driver.id,
            payee_id=kevin_payee.id,
            pay_rate_percent=55.0,
            active=True,
        )
        db.add(additional)

        # Documents
        docs = [
            models.DriverDocument(driver_id=driver.id, doc_type="Application", status="complete"),
            models.DriverDocument(driver_id=driver.id, doc_type="CDL", status="active", expires_at=datetime(2031, 8, 17)),
            models.DriverDocument(driver_id=driver.id, doc_type="Medical Card", status="active", expires_at=datetime(2026, 11, 16)),
            models.DriverDocument(driver_id=driver.id, doc_type="Drug Test", status="missing"),
            models.DriverDocument(driver_id=driver.id, doc_type="MVR", status="missing"),
            models.DriverDocument(driver_id=driver.id, doc_type="SSN Card", status="active"),
            models.DriverDocument(driver_id=driver.id, doc_type="Employment Verification", status="missing"),
        ]
        db.add_all(docs)

        # Recurring item example
        recurring = models.RecurringSettlementItem(
            driver_id=driver.id,
            payee_id=manuel_payee.id,
            item_type="escrow",
            amount=-1500.0,
            schedule="weekly",
            next_date=datetime(2026, 2, 13),
            description="Escrow",
        )
        db.add(recurring)

        # Load
        load = models.Load(
            carrier_id=carrier.id,
            driver_id=driver.id,
            load_number="1654",
            status="New",
            broker_name="ALCO USA LLP",
            po_number="70911",
            rate_amount=1250.00,
            pickup_address="Magnolia, TX",
            delivery_address="Houma, LA",
            notes="Alco USA reserves the right to impose reasonable and industry-accepted penalties against the carrier for late pickup and/or delayed delivery.",
        )
        db.add(load)
        db.commit()
        db.refresh(load)

        stops = [
            models.LoadStop(load_id=load.id, stop_type="pickup", company="OSS METALS", city="Magnolia", state="TX", date="01/30/26", time="03:30 PM"),
            models.LoadStop(load_id=load.id, stop_type="delivery", company="K&B Industries", city="Schriever", state="LA", date="02/02/26", time="08:00 AM"),
            models.LoadStop(load_id=load.id, stop_type="delivery", company="OLYMPIAN MACHINE", city="Gray", state="LA", date="02/02/26", time="09:30 AM"),
            models.LoadStop(load_id=load.id, stop_type="delivery", company="ELITE ENERGY SERVICES", city="Houma", state="LA", date="02/02/26", time="10:30 AM"),
            models.LoadStop(load_id=load.id, stop_type="delivery", company="CORTEC Fluid Control", city="Houma", state="LA", date="02/02/26", time="11:30 AM"),
        ]
        db.add_all(stops)

        # Ledger lines similar to screenshot
        lines = [
            models.SettlementLedgerLine(
                load_id=load.id,
                payee_id=manuel_payee.id,
                category="base_pay",
                description="Freight % (25%)",
                amount=312.50,
            ),
            models.SettlementLedgerLine(
                load_id=load.id,
                payee_id=kevin_payee.id,
                category="base_pay",
                description="OP net freight (55%)",
                amount=687.50,
            ),
            models.SettlementLedgerLine(
                load_id=load.id,
                payee_id=kevin_payee.id,
                category="pass_through",
                description="Company driver wages pass-through",
                amount=-312.50,
            ),
            models.SettlementLedgerLine(
                load_id=load.id,
                payee_id=kevin_payee.id,
                category="adjustment",
                description="OP freight deduction: 45% Load #1654 Rate $1,250.00",
                amount=-562.50,
            ),
        ]
        db.add_all(lines)

        db.commit()
        print("Seeded payroll demo data.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
