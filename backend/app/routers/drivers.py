from fastapi import APIRouter, HTTPException
from app.core.security import verify_token
from app.core.config import settings
from app.services.airtable import AirtableClient

router = APIRouter(prefix="/drivers", tags=["drivers"])


@router.get("")
def list_drivers(token: dict = verify_token):
    carrier_record_id = token.get("carrier_record_id")
    if not carrier_record_id:
        raise HTTPException(status_code=400, detail="Missing carrier_record_id")
    airtable = AirtableClient()
    formula = airtable.formula_linked_record("Carrier", carrier_record_id)
    return airtable.list_records(settings.AIRTABLE_TABLE_DRIVERS, formula=formula)
