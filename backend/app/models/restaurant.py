
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import relationship

from app.database import Base


class Restaurant(Base):
    __tablename__ = "restaurants"

    id = Column(Integer, primary_key=True, index=True)

    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    address = Column(Text, nullable=False)
    phone = Column(String(20), nullable=True)

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

    owner = relationship(
        "User",
        back_populates="owned_restaurants"
    )

    menu_items = relationship(
        "MenuItem",
        back_populates="restaurant"
    )

    orders = relationship(
        "Order",
        back_populates="restaurant"
    )

    reminder_logs = relationship(
    "AdminReminderLog",
    back_populates="restaurant"
)
