from pydantic import BaseModel


class DriverResponse(BaseModel):
    id: str
    fields: dict
