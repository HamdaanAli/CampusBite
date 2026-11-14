
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.restaurant import Restaurant
from app.models.admin_reminder_log import AdminReminderLog
from app.schemas.admin_reminder_log import AdminReminderLogResponse
from app.core.dependencies import require_roles


router = APIRouter(
    prefix="/reminders",
    tags=["Reminders"]
)


@router.get(
    "/my",
    response_model=list[AdminReminderLogResponse]
)
def get_my_reminders(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("RESTAURANT_OWNER")
    )
):
    return (
        db.query(AdminReminderLog)
        .join(
            Restaurant,
            AdminReminderLog.restaurant_id == Restaurant.id
        )
        .filter(Restaurant.owner_id == current_user.id)
        .order_by(AdminReminderLog.created_at.desc())
        .all()
    )
