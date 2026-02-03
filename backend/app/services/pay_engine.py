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
    rate_amount = load.rate_amount or 0.0

    driver = load.driver
    if not driver or not driver.payee_id:
        return lines

    pay_profile = driver.pay_profile
    if pay_profile and pay_profile.pay_type == "percent":
        driver_pay = _percent(rate_amount, pay_profile.rate)
        lines.append(
            LedgerLineDraft(
                payee_id=driver.payee_id,
                category="base_pay",
                description=f"Freight % ({pay_profile.rate:.0f}%)",
                amount=driver_pay,
            )
        )
    else:
        driver_pay = 0.0

    # Additional payees (equipment owner, etc.)
    for additional in driver.additional_payees:
        if not additional.active:
            continue
        owner_pay = _percent(rate_amount, additional.pay_rate_percent)
        lines.append(
            LedgerLineDraft(
                payee_id=additional.payee_id,
                category="base_pay",
                description=f"OP net freight ({additional.pay_rate_percent:.0f}%)",
                amount=owner_pay,
            )
        )

        # Pass-through wages for company driver
        if pay_profile and pay_profile.driver_kind == "company_driver" and driver_pay > 0:
            lines.append(
                LedgerLineDraft(
                    payee_id=additional.payee_id,
                    category="pass_through",
                    description="Company driver wages pass-through",
                    amount=-driver_pay,
                )
            )

    # Load charges as adjustments to driver payee
    for charge in load.charges:
        lines.append(
            LedgerLineDraft(
                payee_id=driver.payee_id,
                category=charge.category,
                description=charge.description or charge.category.replace("_", " ").title(),
                amount=round(charge.amount, 2),
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
