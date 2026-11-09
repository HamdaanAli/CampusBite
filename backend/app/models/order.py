
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


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)

    customer_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    restaurant_id = Column(
        Integer,
        ForeignKey("restaurants.id"),
        nullable=False
    )

    delivery_partner_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True
    )

    total_amount = Column(Numeric(10, 2), nullable=False)

    status = Column(String(30), nullable=False, default="PLACED")

    payment_status = Column(
        String(30),
        nullable=False,
        default="PENDING"
    )

    delivery_address = Column(Text, nullable=False)
    special_instructions = Column(Text, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

    customer = relationship(
        "User",
        foreign_keys=[customer_id],
        back_populates="customer_orders"
    )

    delivery_partner = relationship(
        "User",
        foreign_keys=[delivery_partner_id],
        back_populates="delivery_orders"
    )

    restaurant = relationship(
        "Restaurant",
        back_populates="orders"
    )

    order_items = relationship(
        "OrderItem",
        back_populates="order"
    )

    review = relationship(
        "Review",
        back_populates="order",
        uselist=False
    )

    payment_ledger_entries = relationship(
        "PaymentLedger",
        back_populates="order"
    )

    return_request = relationship(
        "ReturnRequest",
        back_populates="order",
        uselist=False
    )

    reminder_logs = relationship(
        "AdminReminderLog",
        back_populates="order"
    )
