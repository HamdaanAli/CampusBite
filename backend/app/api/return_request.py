import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.order import Order
from app.models.return_request import ReturnRequest
from app.models.restaurant import Restaurant
from app.models.payment_ledger import PaymentLedger
from app.schemas.return_request import (
    ReturnRequestCreate,
    ReturnRequestUpdate,
    ReturnRequestResponse
)
from app.core.dependencies import require_roles


router = APIRouter(
    prefix="/returns",
    tags=["Return Requests"]
)

@router.post(
    "/orders/{order_id}",
    response_model=ReturnRequestResponse,
    status_code=status.HTTP_201_CREATED
)
def create_return_request(
    order_id: int,
    request_data: ReturnRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("CUSTOMER"))
):
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.customer_id == current_user.id
    ).first()

    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    if order.status != "DELIVERED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Return requests are allowed only for delivered orders"
        )

    existing_request = db.query(ReturnRequest).filter(
        ReturnRequest.order_id == order_id
    ).first()

    if existing_request is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A return request already exists for this order"
        )

    new_request = ReturnRequest(
        order_id=order_id,
        reason=request_data.reason,
        status="PENDING"
    )

    try:
        db.add(new_request)
        db.commit()
        db.refresh(new_request)

        return new_request

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not submit return request"
        )

@router.get(
    "/my",
    response_model=list[ReturnRequestResponse]
)
def get_my_return_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("CUSTOMER"))
):
    return db.query(ReturnRequest).join(
        Order,
        ReturnRequest.order_id == Order.id
    ).filter(
        Order.customer_id == current_user.id
    ).order_by(
        ReturnRequest.created_at.desc()
    ).all()

@router.get(
    "/owner",
    response_model=list[ReturnRequestResponse]
)
def get_owner_return_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("RESTAURANT_OWNER"))
):
    return db.query(ReturnRequest).join(
        Order,
        ReturnRequest.order_id == Order.id
    ).join(
        Restaurant,
        Order.restaurant_id == Restaurant.id
    ).filter(
        Restaurant.owner_id == current_user.id
    ).order_by(
        ReturnRequest.created_at.desc()
    ).all()

@router.patch(
    "/{request_id}/review",
    response_model=ReturnRequestResponse
)
def review_return_request(
    request_id: int,
    request_data: ReturnRequestUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("RESTAURANT_OWNER"))
):
    return_request = db.query(ReturnRequest).join(
        Order,
        ReturnRequest.order_id == Order.id
    ).join(
        Restaurant,
        Order.restaurant_id == Restaurant.id
    ).filter(
        ReturnRequest.id == request_id,
        Restaurant.owner_id == current_user.id
    ).first()

    if return_request is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Return request not found"
        )

    if return_request.status != "PENDING":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This return request has already been reviewed"
        )

    order = return_request.order

    try:
        if request_data.status == "APPROVED":

            if order.payment_status == "refunded":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="This order has already been refunded"
                )

            refund = PaymentLedger(
                order_id=order.id,
                transaction_type="REFUND",
                payment_mode="MOCK",
                amount=order.total_amount,
                payment_status="refunded",
                transaction_reference=(
                    f"REFUND-{uuid.uuid4().hex[:12].upper()}"
                ),
                description="Dummy payment refund approved by restaurant owner"
            )

            db.add(refund)

            order.payment_status = "refunded"

            return_request.status = "APPROVED"

        else:
            return_request.status = "REJECTED"

        return_request.owner_response = request_data.owner_response
        return_request.reviewed_at = datetime.now(timezone.utc)

        db.commit()
        db.refresh(return_request)

        return return_request

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not review return request"
        )