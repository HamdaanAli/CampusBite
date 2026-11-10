
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.order import Order
from app.models.restaurant import Restaurant


def get_restaurant_statistics(db: Session, owner_id: int):
    restaurants = db.query(Restaurant).filter(
        Restaurant.owner_id == owner_id
    ).all()

    statistics = []

    for restaurant in restaurants:
        total_orders = db.query(func.count(Order.id)).filter(
            Order.restaurant_id == restaurant.id
        ).scalar()

        total_revenue = db.query(
            func.coalesce(func.sum(Order.total_amount), 0)
        ).filter(
            Order.restaurant_id == restaurant.id,
            Order.status == "DELIVERED"
        ).scalar()

        pending_orders = db.query(func.count(Order.id)).filter(
            Order.restaurant_id == restaurant.id,
            Order.status == "PLACED"
        ).scalar()

        completed_orders = db.query(func.count(Order.id)).filter(
            Order.restaurant_id == restaurant.id,
            Order.status == "DELIVERED"
        ).scalar()

        cancelled_orders = db.query(func.count(Order.id)).filter(
            Order.restaurant_id == restaurant.id,
            Order.status == "CANCELLED"
        ).scalar()

        statistics.append({
            "restaurant_id": restaurant.id,
            "restaurant_name": restaurant.name,
            "total_orders": total_orders,
            "total_revenue": total_revenue,
            "pending_orders": pending_orders,
            "completed_orders": completed_orders,
            "cancelled_orders": cancelled_orders
        })

    return statistics
