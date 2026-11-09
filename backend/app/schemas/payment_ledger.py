
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


# Data returned by the API
class PaymentLedgerResponse(BaseModel):
    id: int
    order_id: int
    transaction_type: str
    amount: Decimal
    payment_status: str
    transaction_reference: str
    description: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
