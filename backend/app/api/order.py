
from datetime import date, datetime, time, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.order import (
    OrderCreate,
    OrderResponse,
    OrderStatusUpdate,
    DeliveryAssignment
)
from app.services.order_service import (
    create_order,
    get_owner_orders,
    get_customer_orders,
    get_delivery_partner_orders,
    update_delivery_order_status,
    cancel_customer_order,
    update_owner_order_status,
    assign_delivery_partner
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
    order_status: str | None = Query(default=None, alias="status"),
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("RESTAURANT_OWNER"))
):
    if start_date and end_date and end_date < start_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="end_date must be on or after start_date"
        )

    start_datetime = (
        datetime.combine(start_date, time.min, tzinfo=timezone.utc)
        if start_date else None
    )

    end_datetime = (
        datetime.combine(
            end_date + timedelta(days=1),
            time.min,
            tzinfo=timezone.utc
        )
        if end_date else None
    )
    return get_owner_orders(
        db=db,
        owner_id=current_user.id,
        order_status=order_status,
        start_date=start_datetime,
        end_date=end_datetime,
        page=page,
        limit=limit
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

@router.get(
    "/delivery",
    response_model=list[OrderResponse]
)
def list_delivery_partner_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("DELIVERY_PARTNER"))
):
    return get_delivery_partner_orders(
        db=db,
        delivery_partner_id=current_user.id
    )



@router.patch(
    "/{order_id}/cancel",
    response_model=OrderResponse
)
def cancel_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("CUSTOMER"))
):
    try:
        cancelled_order = cancel_customer_order(
            db=db,
            order_id=order_id,
            customer_id=current_user.id
        )

        if cancelled_order is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )

        return cancelled_order

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error)
        )


@router.patch(
    "/{order_id}/status",
    response_model=OrderResponse
)
def update_order_status(
    order_id: int,
    order_data: OrderStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("RESTAURANT_OWNER"))
):
    try:
        updated_order = update_owner_order_status(
            db=db,
            order_id=order_id,
            owner_id=current_user.id,
            new_status=order_data.status
        )

        if updated_order is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )

        return updated_order

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error)
        )

@router.patch(
    "/{order_id}/assign-delivery",
    response_model=OrderResponse
)
def assign_order_delivery_partner(
    order_id: int,
    assignment_data: DeliveryAssignment,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("RESTAURANT_OWNER"))
):
    try:
        assigned_order = assign_delivery_partner(
            db=db,
            order_id=order_id,
            owner_id=current_user.id,
            delivery_partner_id=assignment_data.delivery_partner_id
        )

        if assigned_order is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )

        return assigned_order

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error)
        ) 

@router.patch(
    "/{order_id}/delivery-status",
    response_model=OrderResponse
)
def update_delivery_status(
    order_id: int,
    order_data: OrderStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("DELIVERY_PARTNER"))
):
    try:
        updated_order = update_delivery_order_status(
            db=db,
            order_id=order_id,
            delivery_partner_id=current_user.id,
            new_status=order_data.status
        )

        if updated_order is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found or not assigned to you"
            )

        return updated_order

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error)
        )