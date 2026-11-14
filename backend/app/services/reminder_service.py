
from datetime import datetime, timedelta, timezone

from app.database import SessionLocal
from app.models.order import Order
from app.models.admin_reminder_log import AdminReminderLog


def generate_order_reminders():
    db = SessionLocal()

    try:
        cutoff_time = datetime.now(timezone.utc) - timedelta(minutes=15)

        delayed_orders = db.query(Order).filter(
            Order.status.in_(["PLACED", "ACCEPTED"]),
            Order.updated_at < cutoff_time
        ).all()

        reminders_created = 0

        for order in delayed_orders:
            existing_reminder = db.query(AdminReminderLog).filter(
                AdminReminderLog.order_id == order.id
            ).first()

            if existing_reminder:
                continue

            reminder = AdminReminderLog(
                order_id=order.id,
                restaurant_id=order.restaurant_id,
                message=(
                    f"Order #{order.id} has remained in "
                    f"{order.status} status for more than 15 minutes."
                )
            )

            db.add(reminder)
            reminders_created += 1

        db.commit()

        return reminders_created

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()
