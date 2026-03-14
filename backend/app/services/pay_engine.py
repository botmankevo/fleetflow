from __future__ import annotations

from typing import List
from uuid import uuid4

from sqlalchemy.orm import Session

from app import models


class LedgerLineDraft:
    def __init__(self, payee_id: int, category: str, description: str, amount: float):
        self.payee_id = payee_id
        self.category = category
        self.description = description
        self.amount = amount


def _percent(amount: float, rate: float) -> float:
    return round(amount * rate / 100.0, 2)


def compute_load_ledger_lines(load: models.Load) -> List[LedgerLineDraft]:
    lines: List[LedgerLineDraft] = []
    base_freight = load.rate_amount or 0.0
    fsc = load.fuel_surcharge or 0.0
    miles = load.total_miles or 0.0

    driver = load.driver
    if not driver or not driver.payee_id:
        return lines

    pay_profile = driver.pay_profile
    base_pay = 0.0
    
    if pay_profile:
        if pay_profile.pay_type == "percent":
            base_pay = _percent(base_freight, pay_profile.rate)
            description = f"Freight % ({pay_profile.rate:.0f}%)"
        elif pay_profile.pay_type == "per_mile":
            base_pay = round(miles * pay_profile.rate, 2)
            description = f"Mileage Pay ({miles} mi @ ${pay_profile.rate:.2f})"
        elif pay_profile.pay_type == "flat":
            base_pay = pay_profile.rate
            description = f"Flat Pay Rate"
        else:
            base_pay = 0.0
            description = "Unknown Pay Type"

        if base_pay > 0:
            lines.append(
                LedgerLineDraft(
                    payee_id=driver.payee_id,
                    category="base_pay",
                    description=description,
                    amount=base_pay,
                )
            )

        # FSC Pass-through (usually 100% for owner-ops, or a fixed amount for company drivers)
        if fsc > 0:
            fsc_pay = fsc if pay_profile.driver_kind == "owner_operator" else _percent(fsc, 100.0) # For now, 100%
            lines.append(
                LedgerLineDraft(
                    payee_id=driver.payee_id,
                    category="fsc_pass_through",
                    description="Fuel Surcharge (100%)",
                    amount=fsc_pay,
                )
            )

    # Accessorials Pass-through (Detention, Layover, Lumper)
    accessorials = [
        ("detention", load.detention),
        ("layover", load.layover),
        ("lumper", load.lumper),
        ("other_fees", load.other_fees)
    ]
    for cat, amount in accessorials:
        if amount and amount > 0:
            lines.append(
                LedgerLineDraft(
                    payee_id=driver.payee_id,
                    category=cat,
                    description=cat.replace("_", " ").title() + " Reimbursement",
                    amount=round(amount, 2),
                )
            )

    # Additional payees logic (Simplified for now, usually for owner-ops with company drivers)
    for additional in driver.additional_payees:
        if not additional.active:
            continue
        owner_pay = _percent(base_freight, additional.pay_rate_percent)
        lines.append(
            LedgerLineDraft(
                payee_id=additional.payee_id,
                category="base_pay",
                description=f"OP net freight ({additional.pay_rate_percent:.0f}%)",
                amount=owner_pay,
            )
        )

    return lines


def recalc_load_pay(db: Session, load: models.Load) -> List[models.SettlementLedgerLine]:
    existing = (
        db.query(models.SettlementLedgerLine)
        .filter(models.SettlementLedgerLine.load_id == load.id)
        .all()
    )
    locked = [line for line in existing if line.locked_at is not None]
    unlocked = [line for line in existing if line.locked_at is None]

    computed = compute_load_ledger_lines(load)

    if not locked:
        for line in unlocked:
            db.delete(line)
        db.flush()
        created = []
        for draft in computed:
            created.append(
                models.SettlementLedgerLine(
                    load_id=load.id,
                    payee_id=draft.payee_id,
                    category=draft.category,
                    description=draft.description,
                    amount=draft.amount,
                )
            )
        db.add_all(created)
        db.commit()
        return created

    # If locked, do not touch locked lines; replace unlocked with adjustments
    for line in unlocked:
        db.delete(line)
    db.flush()

    locked_totals: dict[int, float] = {}
    for line in locked:
        locked_totals[line.payee_id] = locked_totals.get(line.payee_id, 0.0) + line.amount

    desired_totals: dict[int, float] = {}
    for draft in computed:
        desired_totals[draft.payee_id] = desired_totals.get(draft.payee_id, 0.0) + draft.amount

    adjustment_group = str(uuid4())
    created: List[models.SettlementLedgerLine] = []
    for payee_id, desired_total in desired_totals.items():
        locked_total = locked_totals.get(payee_id, 0.0)
        diff = round(desired_total - locked_total, 2)
        if abs(diff) < 0.01:
            continue
        created.append(
            models.SettlementLedgerLine(
                load_id=load.id,
                payee_id=payee_id,
                category="adjustment",
                description="Adjustment for locked settlement",
                amount=diff,
                adjustment_group_id=adjustment_group,
            )
        )

    if created:
        db.add_all(created)
        db.commit()

    return created
