
from sqlalchemy import Boolean, Column, DateTime, Integer, String, func
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    full_name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    phone = Column(String(20), nullable=True)

    hashed_password = Column(String(255), nullable=False)

    role = Column(String(30), nullable=False)

    is_active = Column(Boolean, default=True, nullable=False)

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

    owned_restaurants = relationship(
        "Restaurant",
        back_populates="owner"
    )

    customer_orders = relationship(
        "Order",
        foreign_keys="Order.customer_id",
        back_populates="customer"
    )

    delivery_orders = relationship(
        "Order",
        foreign_keys="Order.delivery_partner_id",
        back_populates="delivery_partner"
    )
