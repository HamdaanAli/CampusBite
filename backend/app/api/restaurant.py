from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.restaurant import RestaurantCreate, RestaurantUpdate, RestaurantResponse
from app.services.restaurant_service import (create_restaurant, get_restaurants,
get_restaurant_by_id,update_restaurant)
from app.core.dependencies import get_current_user, require_roles


router = APIRouter(
    prefix="/restaurants",
    tags=["Restaurants"]
)


@router.post(
    "/",
    response_model=RestaurantResponse,
    status_code=status.HTTP_201_CREATED
)
def create_new_restaurant(
    restaurant_data: RestaurantCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("RESTAURANT_OWNER"))
):
    try:
        new_restaurant = create_restaurant(
            db=db,
            restaurant_data=restaurant_data,
            owner_id=current_user.id
        )
        return new_restaurant

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not create restaurant"
        )

@router.get(
    "/",
    response_model=list[RestaurantResponse]
)

#register a route to list all active restaurants for all roles, including customers and restaurant owners
def list_restaurants(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_restaurants(db)

#register a route to get a specific restaurant by its ID, only if it is active
@router.get(
    "/{restaurant_id}",
    response_model=RestaurantResponse
)
def get_restaurant(
    restaurant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    restaurant = get_restaurant_by_id(
        db=db,
        restaurant_id=restaurant_id
    )

    if restaurant is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restaurant not found"
        )

    return restaurant

#update resturant details
@router.put(
    "/{restaurant_id}",
    response_model=RestaurantResponse
)
def update_existing_restaurant(
    restaurant_id: int,
    restaurant_data: RestaurantUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("RESTAURANT_OWNER"))
):
    updated_restaurant = update_restaurant(
        db=db,
        restaurant_id=restaurant_id,
        owner_id=current_user.id,
        restaurant_data=restaurant_data
    )

    if updated_restaurant is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restaurant not found or you do not own this restaurant"
        )

    return updated_restaurant