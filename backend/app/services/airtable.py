from typing import Any, Dict, List, Optional

import requests

from app.core.settings import AIRTABLE_BASE_ID, AIRTABLE_PAT

BASE_URL = "https://api.airtable.com/v0"


def _headers() -> Dict[str, str]:
    return {
        "Authorization": f"Bearer {AIRTABLE_PAT}",
        "Content-Type": "application/json",
    }


def list_records(
    table: str,
    view: Optional[str] = None,
    max_records: int = 50,
    filterByFormula: Optional[str] = None,
) -> List[Dict[str, Any]]:
    url = f"{BASE_URL}/{AIRTABLE_BASE_ID}/{table}"
    params: Dict[str, Any] = {"maxRecords": max_records}
    if view:
        params["view"] = view
    if filterByFormula:
        params["filterByFormula"] = filterByFormula

    response = requests.get(url, headers=_headers(), params=params, timeout=30)
    response.raise_for_status()
    data = response.json()
    records = data.get("records", [])
    if isinstance(records, list):
        return records
    return []


def get_record(table: str, record_id: str) -> Optional[Dict[str, Any]]:
    url = f"{BASE_URL}/{AIRTABLE_BASE_ID}/{table}/{record_id}"
    response = requests.get(url, headers=_headers(), timeout=30)
    if response.status_code == 404:
        return None
    response.raise_for_status()
    return response.json()
