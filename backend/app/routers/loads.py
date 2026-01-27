from fastapi import APIRouter, HTTPException
from app.core.security import verify_token
from app.core.config import settings
from app.services.airtable import AirtableClient
from app.schemas.loads import LoadCreate, LoadUpdate

router = APIRouter(prefix="/loads", tags=["loads"])


@router.get("")
def list_loads(token: dict = verify_token):
    role = token.get("role")
    email = token.get("email")
    carrier_record_id = token.get("carrier_record_id")
    if not carrier_record_id:
        raise HTTPException(status_code=400, detail="Missing carrier_record_id")

    airtable = AirtableClient()

    if role == "driver":
        driver_record_id = airtable.find_driver_record_id(email, carrier_record_id)
        if not driver_record_id:
            return []
        formula = f"AND({airtable.formula_linked_record('Carrier', carrier_record_id)}, {airtable.formula_linked_record('Driver', driver_record_id)})"
    else:
        formula = airtable.formula_linked_record("Carrier", carrier_record_id)

    records = airtable.list_records(settings.AIRTABLE_TABLE_LOADS, formula=formula)
    return records


@router.get("/{record_id}")
def get_load(record_id: str, token: dict = verify_token):
    carrier_record_id = token.get("carrier_record_id")
    if not carrier_record_id:
        raise HTTPException(status_code=400, detail="Missing carrier_record_id")

    airtable = AirtableClient()
    record = airtable.get_record(settings.AIRTABLE_TABLE_LOADS, record_id)
    carrier_links = record.get("fields", {}).get("Carrier", [])
    if carrier_record_id not in carrier_links:
        raise HTTPException(status_code=403, detail="Access denied")
    return record


@router.post("")
def create_load(payload: LoadCreate, token: dict = verify_token):
    carrier_record_id = token.get("carrier_record_id")
    if not carrier_record_id:
        raise HTTPException(status_code=400, detail="Missing carrier_record_id")

    fields = payload.fields.copy()
    fields["Carrier"] = [carrier_record_id]
    airtable = AirtableClient()
    return airtable.create_record(settings.AIRTABLE_TABLE_LOADS, fields)


@router.patch("/{record_id}")
def update_load(record_id: str, payload: LoadUpdate, token: dict = verify_token):
    carrier_record_id = token.get("carrier_record_id")
    if not carrier_record_id:
        raise HTTPException(status_code=400, detail="Missing carrier_record_id")

    airtable = AirtableClient()
    record = airtable.get_record(settings.AIRTABLE_TABLE_LOADS, record_id)
    carrier_links = record.get("fields", {}).get("Carrier", [])
    if carrier_record_id not in carrier_links:
        raise HTTPException(status_code=403, detail="Access denied")

    return airtable.update_record(settings.AIRTABLE_TABLE_LOADS, record_id, payload.fields)
