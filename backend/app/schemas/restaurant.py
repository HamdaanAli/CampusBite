
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


# Data received when creating a restaurant
class RestaurantCreate(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    description: str | None = None
    address: str
    phone: str | None = Field(default=None, max_length=20)


# Data received when updating a restaurant
class RestaurantUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=150)
    description: str | None = None
    address: str | None = None
    phone: str | None = Field(default=None, max_length=20)
    is_active: bool | None = None


# Data returned by the API
class RestaurantResponse(BaseModel):
    id: int
    owner_id: int
    name: str
    description: str | None
    address: str
    phone: str | None
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
