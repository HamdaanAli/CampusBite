
from sqlalchemy.orm import Session

from app.models.menu_item import MenuItem
from app.models.restaurant import Restaurant
from app.schemas.menu_item import MenuItemCreate, MenuItemUpdate


def create_menu_item(
    db: Session,
    restaurant_id: int,
    owner_id: int,
    menu_item_data: MenuItemCreate
) -> MenuItem | None:
    restaurant = db.query(Restaurant).filter(
        Restaurant.id == restaurant_id,
        Restaurant.owner_id == owner_id
    ).first()

    if restaurant is None:
        return None

    new_menu_item = MenuItem(
        restaurant_id=restaurant_id,
        name=menu_item_data.name,
        description=menu_item_data.description,
        price=menu_item_data.price,
        image_url=menu_item_data.image_url,
        category=menu_item_data.category
    )

    db.add(new_menu_item)
    db.commit()
    db.refresh(new_menu_item)

    return new_menu_item


def get_menu_items(
    db: Session,
    restaurant_id: int
) -> list[MenuItem]:
    return db.query(MenuItem).filter(
        MenuItem.restaurant_id == restaurant_id,
        MenuItem.is_available == True
    ).all()


def get_menu_item_by_id(
    db: Session,
    menu_item_id: int,
    restaurant_id: int
) -> MenuItem | None:
    return db.query(MenuItem).filter(
        MenuItem.id == menu_item_id,
        MenuItem.restaurant_id == restaurant_id,
        MenuItem.is_available == True
    ).first()


def update_menu_item(
    db: Session,
    menu_item_id: int,
    restaurant_id: int,
    owner_id: int,
    menu_item_data: MenuItemUpdate
) -> MenuItem | None:
    menu_item = db.query(MenuItem).join(
        Restaurant,
        MenuItem.restaurant_id == Restaurant.id
    ).filter(
        MenuItem.id == menu_item_id,
        MenuItem.restaurant_id == restaurant_id,
        Restaurant.owner_id == owner_id
    ).first()

    if menu_item is None:
        return None

    update_data = menu_item_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(menu_item, field, value)

    db.commit()
    db.refresh(menu_item)

    return menu_item
