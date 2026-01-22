import httpx
from typing import Dict, Optional
from app.core.config import settings


class AirtableClient:
    def __init__(self) -> None:
        if not settings.airtable_api_key or not settings.airtable_base_id:
            raise ValueError("Airtable credentials missing")
        self.base_url = f"https://api.airtable.com/v0/{settings.airtable_base_id}"
        self.headers = {"Authorization": f"Bearer {settings.airtable_api_key}"}

    def upsert_record(self, table: str, record_id: Optional[str], fields: Dict) -> Dict:
        url = f"{self.base_url}/{table}"
        payload = {"fields": fields}
        if record_id:
            response = httpx.patch(f"{url}/{record_id}", headers=self.headers, json=payload)
        else:
            response = httpx.post(url, headers=self.headers, json=payload)
        response.raise_for_status()
        return response.json()

    def append_attachments(self, table: str, record_id: str, field: str, attachments: list) -> Dict:
        url = f"{self.base_url}/{table}/{record_id}"
        payload = {"fields": {field: attachments}}
        response = httpx.patch(url, headers=self.headers, json=payload)
        response.raise_for_status()
        return response.json()
