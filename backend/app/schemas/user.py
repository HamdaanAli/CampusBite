from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


# Allowed CampusBite user roles
UserRole = Literal[
    "CUSTOMER",
    "RESTAURANT_OWNER",
    "DELIVERY_PARTNER"
]


# Data received during registration
class UserCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=20)
    password: str = Field(min_length=8, max_length=128)
    role: UserRole


# Data received during login
class UserLogin(BaseModel):
    email: EmailStr
    password: str


# Data returned by the API
class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    phone: str | None
    role: UserRole
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)