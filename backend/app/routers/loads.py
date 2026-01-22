from fastapi import APIRouter, Depends, Query

from app.core.security import get_current_user
from app.services.airtable import list_records

router = APIRouter()


@router.get("/loads")
def get_loads(
    view: str = Query("All Loads"),
    max_records: int = Query(50, ge=1, le=200),
    current_user: dict = Depends(get_current_user),
) -> dict:
    carrier_id = current_user.get("carrier_id", "")
    role = current_user.get("role", "")
    email = current_user.get("email", "").lower()

    carrier_filter = f"FIND('{carrier_id}', ARRAYJOIN({{Carrier}}))"
    filter_formula = carrier_filter

    if role == "Driver":
        driver_filter = (
            "AND(LOWER({Driver Email})='{}', {} )".format(email, carrier_filter)
        )
        drivers = list_records("Drivers", max_records=1, filterByFormula=driver_filter)
        if not drivers:
            return {"ok": True, "data": {"count": 0, "records": []}}
        driver_record_id = drivers[0].get("id")
        if not driver_record_id:
            return {"ok": True, "data": {"count": 0, "records": []}}
        filter_formula = (
            f"AND({carrier_filter}, FIND('{driver_record_id}', ARRAYJOIN({{Driver}})))"
        )

    records = list_records(
        "Loads", view=view, max_records=max_records, filterByFormula=filter_formula
    )
    return {"ok": True, "data": {"count": len(records), "records": records}}
