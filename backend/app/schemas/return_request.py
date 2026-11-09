
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


# Data received when a customer submits a return request
class ReturnRequestCreate(BaseModel):
    reason: str = Field(min_length=5)


# Data received when the restaurant owner reviews a request
class ReturnRequestUpdate(BaseModel):
    status: Literal["APPROVED", "REJECTED"]
    owner_response: str | None = None


# Data returned by the API
class ReturnRequestResponse(BaseModel):
    id: int
    order_id: int
    reason: str
    status: str
    owner_response: str | None
    reviewed_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
