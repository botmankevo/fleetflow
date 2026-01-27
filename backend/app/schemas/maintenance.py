from pydantic import BaseModel


class MaintenanceCreate(BaseModel):
    fields: dict


class MaintenanceUpdate(BaseModel):
    fields: dict
