from pydantic import BaseModel


class ExpenseCreate(BaseModel):
    fields: dict


class ExpenseUpdate(BaseModel):
    fields: dict
