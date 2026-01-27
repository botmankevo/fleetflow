from pydantic import BaseModel
from typing import Optional


class LoadResponse(BaseModel):
    id: str
    fields: dict


class LoadCreate(BaseModel):
    fields: dict


class LoadUpdate(BaseModel):
    fields: dict
