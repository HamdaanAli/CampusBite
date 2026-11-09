
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


# Data received when a customer submits a review
class ReviewCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: str | None = None


# Data returned by the API
class ReviewResponse(BaseModel):
    id: int
    order_id: int
    rating: int
    comment: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
