
import uuid
from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.menu_item import MenuItem
from app.models.restaurant import Restaurant
from app.models.payment_ledger import PaymentLedger
from app.schemas.order import OrderCreate

def get_owner_orders(db: Session, owner_id: int):
    orders = db.query(Order).join(
        Restaurant,
        Order.restaurant_id == Restaurant.id
    ).filter(
        Restaurant.owner_id == owner_id
    ).order_by(
        Order.created_at.desc()
    ).all()

    return orders

def get_customer_orders(db: Session, customer_id: int):
    orders = db.query(Order).filter(
        Order.customer_id == customer_id
    ).order_by(
        Order.created_at.desc()
    ).all()

    return orders

def create_order(
    db: Session,
    customer_id: int,
    restaurant_id: int,
    order_data: OrderCreate
) -> Order | None:
    restaurant = db.query(Restaurant).filter(
        Restaurant.id == restaurant_id,
        Restaurant.is_active == True
    ).first()

    if restaurant is None:
        return None

    order_items = []
    total_amount = Decimal("0.00")

    for requested_item in order_data.items:
        menu_item = db.query(MenuItem).filter(
            MenuItem.id == requested_item.menu_item_id,
            MenuItem.restaurant_id == restaurant_id,
            MenuItem.is_available == True
        ).first()

        if menu_item is None:
            raise ValueError(
                f"Menu item {requested_item.menu_item_id} is unavailable or does not belong to this restaurant"
            )

        subtotal = menu_item.price * requested_item.quantity
        total_amount += subtotal

        order_items.append(
            OrderItem(
                menu_item_id=menu_item.id,
                item_name=menu_item.name,
                quantity=requested_item.quantity,
                unit_price=menu_item.price,
                subtotal=subtotal
            )
        )

    try:
        new_order = Order(
            customer_id=customer_id,
            restaurant_id=restaurant_id,
            total_amount=total_amount,
            status="PLACED",
            payment_status="mock_paid",
            delivery_address=order_data.delivery_address,
            special_instructions=order_data.special_instructions
        )

        db.add(new_order)
        db.flush()

        for item in order_items:
            item.order_id = new_order.id
            db.add(item)

        payment = PaymentLedger(
            order_id=new_order.id,
            transaction_type="PAYMENT",
            payment_mode="MOCK",
            amount=total_amount,
            payment_status="mock_paid",
            transaction_reference=f"MOCK-{uuid.uuid4().hex[:12].upper()}",
            description="CampusBite dummy payment"
        )

        db.add(payment)
        db.commit()
        db.refresh(new_order)

        return new_order

    except Exception:
        db.rollback()
        raise
