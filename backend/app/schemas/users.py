from pydantic import BaseModel
from typing import Optional


class UserBase(BaseModel):
    email: str
    role: str
    driver_id: Optional[int] = None
    is_active: bool = True


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    role: Optional[str] = None
    driver_id: Optional[int] = None
    is_active: Optional[bool] = None


class UserResponse(UserBase):
    id: int
    carrier_id: int

    class Config:
        from_attributes = True


class UserPasswordReset(BaseModel):
    new_password: str
