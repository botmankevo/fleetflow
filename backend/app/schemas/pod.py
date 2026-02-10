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


class DocumentExchangeItem(BaseModel):
    id: int
    date: str
    driver_name: str
    driver_id: int
    load_id: int
    load_number: Optional[str] = None
    type: str  # BOL, Lumper, Receipt, Other
    attachment_url: str
    status: str  # Pending, Accepted, Rejected
    notes: Optional[str] = None
    created_at: str
    updated_at: str


class DocumentExchangeUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None
    type: Optional[str] = None
    load_id: Optional[int] = None
