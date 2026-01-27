from fastapi import APIRouter, HTTPException, UploadFile, File
from app.core.security import verify_token
from app.core.config import settings
from app.services.airtable import AirtableClient
from app.services.dropbox import DropboxService
from app.schemas.maintenance import MaintenanceCreate, MaintenanceUpdate

router = APIRouter(prefix="/maintenance", tags=["maintenance"])


@router.get("")
def list_maintenance(token: dict = verify_token):
    carrier_record_id = token.get("carrier_record_id")
    if not carrier_record_id:
        raise HTTPException(status_code=400, detail="Missing carrier_record_id")
    airtable = AirtableClient()
    formula = airtable.formula_linked_record("Carrier", carrier_record_id)
    return airtable.list_records(settings.AIRTABLE_TABLE_MAINTENANCE, formula=formula)


@router.post("")
def create_maintenance(payload: MaintenanceCreate, token: dict = verify_token):
    carrier_record_id = token.get("carrier_record_id")
    if not carrier_record_id:
        raise HTTPException(status_code=400, detail="Missing carrier_record_id")
    fields = payload.fields.copy()
    fields["Carrier"] = [carrier_record_id]
    airtable = AirtableClient()
    return airtable.create_record(settings.AIRTABLE_TABLE_MAINTENANCE, fields)


@router.patch("/{record_id}")
def update_maintenance(record_id: str, payload: MaintenanceUpdate, token: dict = verify_token):
    airtable = AirtableClient()
    return airtable.update_record(settings.AIRTABLE_TABLE_MAINTENANCE, record_id, payload.fields)


@router.post("/{record_id}/receipt")
def upload_receipt(record_id: str, file: UploadFile = File(...), token: dict = verify_token):
    carrier_record_id = token.get("carrier_record_id")
    if not carrier_record_id:
        raise HTTPException(status_code=400, detail="Missing carrier_record_id")
    dropbox = DropboxService()
    base_path = f"{settings.DROPBOX_ROOT_FOLDER}/{carrier_record_id}/maintenance/{record_id}"
    dropbox.upload_file(file.file.read(), f"{base_path}/{file.filename}")
    link = dropbox.create_shared_link(f"{base_path}/{file.filename}")
    return {"link": link}
