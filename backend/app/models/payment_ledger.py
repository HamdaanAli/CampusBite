
from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    func
)
from sqlalchemy.orm import relationship

from app.database import Base


class PaymentLedger(Base):
    __tablename__ = "payment_ledger"

    id = Column(Integer, primary_key=True, index=True)

    order_id = Column(
        Integer,
        ForeignKey("orders.id"),
        nullable=False
    )

    transaction_type = Column(String(30), nullable=False)

    amount = Column(Numeric(10, 2), nullable=False)

    payment_status = Column(String(30), nullable=False)

    transaction_reference = Column(
        String(100),
        unique=True,
        nullable=False
    )

    description = Column(Text, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    order = relationship(
        "Order",
        back_populates="payment_ledger_entries"
    )
