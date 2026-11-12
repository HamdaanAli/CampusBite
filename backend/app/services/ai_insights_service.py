
from sqlalchemy.orm import Session

from app.services.order_service import get_customer_orders


def get_customer_order_history(
    db: Session,
    customer_id: int
):
    return get_customer_orders(
        db=db,
        customer_id=customer_id
    )



def prepare_order_data(orders):
    prepared_orders = []

    for order in orders:
        prepared_orders.append({
            "restaurant": order.restaurant.name,
            "order_date": order.created_at.isoformat(),
            "items": [
                {
                    "name": item.item_name,
                    "quantity": item.quantity,
                    "unit_price": float(item.unit_price),
                    "subtotal": float(item.subtotal)
                }
                for item in order.order_items
            ],
            "total_amount": float(order.total_amount),
            "status": order.status,
            "payment_status": order.payment_status
        })

    return prepared_orders


def generate_mock_summary(prepared_orders):
    if not prepared_orders:
        return (
            "You have not placed any orders yet. "
            "Start exploring restaurants on CampusBite!"
        )

    total_orders = len(prepared_orders)

    total_spent = sum(
        order["total_amount"]
        for order in prepared_orders
    )

    item_quantities = {}

    for order in prepared_orders:
        for item in order["items"]:
            item_name = item["name"]

            item_quantities[item_name] = (
                item_quantities.get(item_name, 0)
                + item["quantity"]
            )

    favorite_item = max(
        item_quantities,
        key=item_quantities.get
    )

    return (
        f"You have placed {total_orders} orders. "
        f"Your total spending is Rs.{total_spent:.2f}. "
        f"Your most ordered item is {favorite_item}."
    )
