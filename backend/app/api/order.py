
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.order import OrderCreate, OrderResponse
from app.services.order_service import (
    create_order,
    get_owner_orders,
    get_customer_orders
)
from app.core.dependencies import require_roles


router = APIRouter(
    prefix="/orders",
    tags=["Orders"]
)


@router.post(
    "/restaurants/{restaurant_id}",
    response_model=OrderResponse,
    status_code=status.HTTP_201_CREATED
)
def place_new_order(
    restaurant_id: int,
    order_data: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("CUSTOMER"))
):
    try:
        new_order = create_order(
            db=db,
            customer_id=current_user.id,
            restaurant_id=restaurant_id,
            order_data=order_data
        )

        if new_order is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Restaurant not found or inactive"
            )

        return new_order

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error)
        )
    except HTTPException:
        raise
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not place order"
        )

@router.get(
    "/owner",
    response_model=list[OrderResponse]
)
def list_owner_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("RESTAURANT_OWNER"))
):
    return get_owner_orders(
        db=db,
        owner_id=current_user.id
    )

#customer orders history
@router.get(
    "/my",
    response_model=list[OrderResponse]
)
def list_my_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("CUSTOMER"))
):
    return get_customer_orders(
        db=db,
        customer_id=current_user.id
    )