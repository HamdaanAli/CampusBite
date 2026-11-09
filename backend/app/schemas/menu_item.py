
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


# Data received when creating a menu item
class MenuItemCreate(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    description: str | None = None
    price: Decimal = Field(gt=0, max_digits=10, decimal_places=2)
    image_url: str | None = Field(default=None, max_length=500)
    category: str | None = Field(default=None, max_length=100)


# Data received when updating a menu item
class MenuItemUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=150)
    description: str | None = None
    price: Decimal | None = Field(
        default=None,
        gt=0,
        max_digits=10,
        decimal_places=2
    )
    image_url: str | None = Field(default=None, max_length=500)
    category: str | None = Field(default=None, max_length=100)
    is_available: bool | None = None


# Data returned by the API
class MenuItemResponse(BaseModel):
    id: int
    restaurant_id: int
    name: str
    description: str | None
    price: Decimal
    image_url: str | None
    category: str | None
    is_available: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
