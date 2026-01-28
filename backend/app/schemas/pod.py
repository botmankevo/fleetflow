from pydantic import BaseModel
from typing import List, Optional


class PodUploadResponse(BaseModel):
    links: List[str]
    signature_link: Optional[str] = None


class PodScanResponse(BaseModel):
    ok: bool


class PodHistoryItem(BaseModel):
    id: int
    load_id: int
    load_number: Optional[str] = None
    uploaded_by_email: Optional[str] = None
    file_links: List[str]
    signature_link: Optional[str] = None
    created_at: str
