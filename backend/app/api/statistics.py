
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.core.dependencies import require_roles
from app.services.statistics_service import get_restaurant_statistics


router = APIRouter(
    prefix="/statistics",
    tags=["Restaurant Statistics"]
)


@router.get("/owner")
def get_owner_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("RESTAURANT_OWNER"))
):
    return get_restaurant_statistics(
        db=db,
        owner_id=current_user.id
    )
