
from datetime import datetime

from pydantic import BaseModel, ConfigDict


# Data returned by the API
class AdminReminderLogResponse(BaseModel):
    id: int
    order_id: int
    restaurant_id: int
    message: str
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
