
from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


# Individual item included in an order request
class OrderItemCreate(BaseModel):
    menu_item_id: int
    quantity: int = Field(ge=1)


# Data received when placing an order
class OrderCreate(BaseModel):
    delivery_address: str = Field(min_length=5)
    special_instructions: str | None = None
    items: list[OrderItemCreate] = Field(min_length=1)

# Data received when assigning a delivery partner
class DeliveryAssignment(BaseModel):
    delivery_partner_id: int = Field(gt=0)


# Data received when updating order status
class OrderStatusUpdate(BaseModel):
    status: Literal[
        "ACCEPTED",
        "PREPARING",
        "READY",
        "ASSIGNED",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "CANCELLED",
    ]

# Individual item returned in an order response
class OrderItemResponse(BaseModel):
    id: int
    menu_item_id: int
    item_name: str
    quantity: int
    unit_price: Decimal
    subtotal: Decimal

    model_config = ConfigDict(from_attributes=True)


# Complete order information returned by the API
class OrderResponse(BaseModel):
    id: int
    customer_id: int
    restaurant_id: int
    delivery_partner_id: int | None
    total_amount: Decimal
    status: str
    payment_status: str
    delivery_address: str
    special_instructions: str | None
    created_at: datetime
    updated_at: datetime
    order_items: list[OrderItemResponse]

    model_config = ConfigDict(from_attributes=True)
