
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.order import Order
from app.models.review import Review
from app.schemas.review import ReviewCreate, ReviewResponse
from app.core.dependencies import require_roles
from app.models.restaurant import Restaurant


router = APIRouter(
    prefix="/reviews",
    tags=["Reviews"]
)


@router.post(
    "/orders/{order_id}",
    response_model=ReviewResponse,
    status_code=status.HTTP_201_CREATED
)
def create_order_review(
    order_id: int,
    review_data: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("CUSTOMER"))
):
    # Find the order belonging to the logged-in customer
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.customer_id == current_user.id
    ).first()

    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    # Only delivered orders can be reviewed
    if order.status != "DELIVERED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only delivered orders can be reviewed"
        )

    # Check whether the order already has a review
    existing_review = db.query(Review).filter(
        Review.order_id == order_id
    ).first()

    if existing_review is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This order has already been reviewed"
        )

    # Create the review
    new_review = Review(
        order_id=order_id,
        rating=review_data.rating,
        comment=review_data.comment
    )

    try:
        db.add(new_review)
        db.commit()
        db.refresh(new_review)

        return new_review

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not submit review"
        )

@router.get(
    "/restaurants/{restaurant_id}",
    response_model=list[ReviewResponse]
)
def get_restaurant_reviews(
    restaurant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(
        "CUSTOMER",
        "RESTAURANT_OWNER",
        "DELIVERY_PARTNER"
    ))
):
    restaurant = db.query(Restaurant).filter(
        Restaurant.id == restaurant_id,
        Restaurant.is_active == True
    ).first()

    if restaurant is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restaurant not found"
        )

    reviews = db.query(Review).join(
        Order,
        Review.order_id == Order.id
    ).filter(
        Order.restaurant_id == restaurant_id
    ).order_by(
        Review.created_at.desc()
    ).all()

    return reviews