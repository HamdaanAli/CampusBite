
import uuid
from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.menu_item import MenuItem
from app.models.restaurant import Restaurant
from app.models.user import User
from app.models.payment_ledger import PaymentLedger
from app.schemas.order import OrderCreate


def get_owner_orders(
    db: Session,
    owner_id: int,
    order_status: str | None = None,
    start_date=None,
    end_date=None,
    page: int = 1,
    limit: int = 10
):
    query = db.query(Order).join(
        Restaurant,
        Order.restaurant_id == Restaurant.id
    ).filter(
        Restaurant.owner_id == owner_id
    )

    if order_status:
        query = query.filter(Order.status == order_status)

    if start_date:
        query = query.filter(Order.created_at >= start_date)

    if end_date:
        query = query.filter(Order.created_at < end_date)

    orders = query.order_by(
        Order.created_at.desc()
    ).offset(
        (page - 1) * limit
    ).limit(limit).all()

    return orders

def get_customer_orders(db: Session, customer_id: int):
    orders = db.query(Order).filter(
        Order.customer_id == customer_id
    ).order_by(
        Order.created_at.desc()
    ).all()

    return orders

def get_delivery_partner_orders(db: Session, delivery_partner_id: int):
    orders = db.query(Order).filter(
        Order.delivery_partner_id == delivery_partner_id
    ).order_by(
        Order.created_at.desc()
    ).all()

    return orders

def update_delivery_order_status(
    db: Session,
    order_id: int,
    delivery_partner_id: int,
    new_status: str
):
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.delivery_partner_id == delivery_partner_id
    ).first()

    if order is None:
        return None

    allowed_transitions = {
        "ASSIGNED": "OUT_FOR_DELIVERY",
        "OUT_FOR_DELIVERY": "DELIVERED"
    }

    expected_status = allowed_transitions.get(order.status)

    if expected_status != new_status:
        raise ValueError(
            f"Invalid status transition. Current status: {order.status}"
        )

    try:
        order.status = new_status

        db.commit()
        db.refresh(order)

        return order

    except Exception:
        db.rollback()
        raise

def cancel_customer_order(
    db: Session,
    order_id: int,
    customer_id: int
):
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.customer_id == customer_id
    ).first()

    if order is None:
        return None

    if order.status != "PLACED":
        raise ValueError(
            "Only orders with PLACED status can be cancelled"
        )

    try:
        order.status = "CANCELLED"
        order.payment_status = "refunded"

        refund = PaymentLedger(
            order_id=order.id,
            transaction_type="REFUND",
            payment_mode="MOCK",
            amount=order.total_amount,
            payment_status="refunded",
            transaction_reference=f"REFUND-{uuid.uuid4().hex[:12].upper()}",
            description="Dummy payment refund for cancelled order"
        )

        db.add(refund)
        db.commit()
        db.refresh(order)

        return order

    except Exception:
        db.rollback()
        raise

def update_owner_order_status(
    db: Session,
    order_id: int,
    owner_id: int,
    new_status: str
):
    order = db.query(Order).join(
        Restaurant,
        Order.restaurant_id == Restaurant.id
    ).filter(
        Order.id == order_id,
        Restaurant.owner_id == owner_id
    ).first()

    if order is None:
        return None

    allowed_transitions = {
        "PLACED": "ACCEPTED",
        "ACCEPTED": "PREPARING",
        "PREPARING": "READY"
    }

    expected_status = allowed_transitions.get(order.status)

    if expected_status != new_status:
        raise ValueError(
            f"Invalid status transition. Current status: {order.status}"
        )

    try:
        order.status = new_status

        db.commit()
        db.refresh(order)

        return order

    except Exception:
        db.rollback()
        raise


def assign_delivery_partner(
    db: Session,
    order_id: int,
    owner_id: int,
    delivery_partner_id: int
):
    order = db.query(Order).join(
        Restaurant,
        Order.restaurant_id == Restaurant.id
    ).filter(
        Order.id == order_id,
        Restaurant.owner_id == owner_id
    ).first()

    if order is None:
        return None

    if order.status != "READY":
        raise ValueError(
            "Delivery partner can only be assigned to READY orders"
        )

    delivery_partner = db.query(User).filter(
        User.id == delivery_partner_id,
        User.role == "DELIVERY_PARTNER",
        User.is_active == True
    ).first()

    if delivery_partner is None:
        raise ValueError(
            "Invalid or inactive delivery partner"
        )

    try:
        order.delivery_partner_id = delivery_partner.id
        order.status = "ASSIGNED"

        db.commit()
        db.refresh(order)

        return order

    except Exception:
        db.rollback()
        raise


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
