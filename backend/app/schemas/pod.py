from pydantic import BaseModel
from typing import List, Optional


class PodUploadResponse(BaseModel):
    links: List[str]
    signature_link: Optional[str] = None


class PodScanResponse(BaseModel):
    ok: bool
