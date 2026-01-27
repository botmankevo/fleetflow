import requests
from typing import Any, Dict, List, Optional
from app.core.config import settings


class AirtableClient:
    def __init__(self) -> None:
        if not settings.AIRTABLE_PAT or not settings.AIRTABLE_BASE_ID:
            raise ValueError("AIRTABLE_PAT and AIRTABLE_BASE_ID are required")
        self.base_id = settings.AIRTABLE_BASE_ID
        self.session = requests.Session()
        self.session.headers.update({
            "Authorization": f"Bearer {settings.AIRTABLE_PAT}",
            "Content-Type": "application/json",
        })

    def _url(self, table: str) -> str:
        return f"https://api.airtable.com/v0/{self.base_id}/{table}"

    def list_records(self, table: str, formula: Optional[str] = None) -> List[Dict[str, Any]]:
        params = {}
        if formula:
            params["filterByFormula"] = formula
        res = self.session.get(self._url(table), params=params, timeout=20)
        res.raise_for_status()
        return res.json().get("records", [])

    def get_record(self, table: str, record_id: str) -> Dict[str, Any]:
        res = self.session.get(f"{self._url(table)}/{record_id}", timeout=20)
        res.raise_for_status()
        return res.json()

    def create_record(self, table: str, fields: Dict[str, Any]) -> Dict[str, Any]:
        res = self.session.post(self._url(table), json={"fields": fields}, timeout=20)
        res.raise_for_status()
        return res.json()

    def update_record(self, table: str, record_id: str, fields: Dict[str, Any]) -> Dict[str, Any]:
        res = self.session.patch(f"{self._url(table)}/{record_id}", json={"fields": fields}, timeout=20)
        res.raise_for_status()
        return res.json()

    def delete_record(self, table: str, record_id: str) -> Dict[str, Any]:
        res = self.session.delete(f"{self._url(table)}/{record_id}", timeout=20)
        res.raise_for_status()
        return res.json()

    @staticmethod
    def formula_linked_record(field_name: str, record_id: str) -> str:
        return f"FIND('{record_id}', ARRAYJOIN({{{field_name}}}))"

    def find_driver_record_id(self, email: str, carrier_record_id: str) -> Optional[str]:
        field_email = "Driver Email"
        field_carrier = "Carrier"
        formula = f"AND({{{field_email}}}='{email}', {self.formula_linked_record(field_carrier, carrier_record_id)})"
        records = self.list_records(settings.AIRTABLE_TABLE_DRIVERS, formula=formula)
        if not records:
            return None
        return records[0]["id"]

    def find_carrier_record_id(self, carrier_code: str) -> Optional[str]:
        # Prefer Internal ID; fallback to Name
        internal_field = "Internal ID"
        name_field = "Name"
        formula = f"OR({{{internal_field}}}='{carrier_code}', {{{name_field}}}='{carrier_code}')"
        records = self.list_records(settings.AIRTABLE_TABLE_CARRIERS, formula=formula)
        if not records:
            return None
        return records[0]["id"]

    def find_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        field_email = "Email"
        formula = f"{{{field_email}}}='{email}'"
        records = self.list_records(settings.AIRTABLE_TABLE_USERS, formula=formula)
        if not records:
            return None
        return records[0]
