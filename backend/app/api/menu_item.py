
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.menu_item import (
    MenuItemCreate,
    MenuItemUpdate,
    MenuItemResponse
)
from app.services.menu_item_service import (
    create_menu_item,
    get_menu_items,
    get_menu_item_by_id,
    update_menu_item,
    get_owner_menu_items
)
from app.core.dependencies import  get_current_user, require_roles
from app.services.restaurant_service import get_restaurant_by_id


router = APIRouter(
    prefix="/restaurants/{restaurant_id}/menu",
    tags=["Menu Items"]
)


@router.post(
    "/",
    response_model=MenuItemResponse,
    status_code=status.HTTP_201_CREATED
)
def create_new_menu_item(
    restaurant_id: int,
    menu_item_data: MenuItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("RESTAURANT_OWNER"))
):
    try:
        new_menu_item = create_menu_item(
            db=db,
            restaurant_id=restaurant_id,
            owner_id=current_user.id,
            menu_item_data=menu_item_data
        )

        if new_menu_item is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Restaurant not found or you do not own this restaurant"
            )

        return new_menu_item

    except HTTPException:
        raise
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not create menu item"
        )

# Public route: view available dishes at an active restaurant.
@router.get(
    "/",
    response_model=list[MenuItemResponse]
)
def list_menu_items(
    restaurant_id: int,
    db: Session = Depends(get_db)
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

    return get_menu_items(
        db=db,
        restaurant_id=restaurant_id
    )


# ==================== GET ALL MENU ITEMS FOR RESTAURANT OWNER ====================
# Backend: GET /api/v1/restaurants/{restaurant_id}/menu/owner
@router.get(
    "/owner",
    response_model=list[MenuItemResponse]
)
def list_owner_menu_items(
    restaurant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("RESTAURANT_OWNER"))
):
    # Retrieve all dishes, including unavailable ones, for this owner.
    menu_items = get_owner_menu_items(
        db=db,
        restaurant_id=restaurant_id,
        owner_id=current_user.id
    )

    if menu_items is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restaurant not found or you do not own this restaurant"
        )

    return menu_items

@router.get(
    "/{menu_item_id}",
    response_model=MenuItemResponse
)
def get_menu_item(
    restaurant_id: int,
    menu_item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    menu_item = get_menu_item_by_id(
        db=db,
        menu_item_id=menu_item_id,
        restaurant_id=restaurant_id
    )

    if menu_item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Menu item not found"
        )

    return menu_item


@router.put(
    "/{menu_item_id}",
    response_model=MenuItemResponse
)
def update_existing_menu_item(
    restaurant_id: int,
    menu_item_id: int,
    menu_item_data: MenuItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("RESTAURANT_OWNER"))
):
    updated_menu_item = update_menu_item(
        db=db,
        menu_item_id=menu_item_id,
        restaurant_id=restaurant_id,
        owner_id=current_user.id,
        menu_item_data=menu_item_data
    )

    if updated_menu_item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Menu item not found or you do not own this restaurant"
        )

    return updated_menu_item
