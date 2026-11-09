from sqlalchemy.orm import Session

from app.models.restaurant import Restaurant
from app.schemas.restaurant import RestaurantCreate,RestaurantUpdate


def create_restaurant(
    db: Session,
    restaurant_data: RestaurantCreate,
    owner_id: int
) -> Restaurant:

    new_restaurant = Restaurant(
        owner_id=owner_id,
        name=restaurant_data.name,
        description=restaurant_data.description,
        address=restaurant_data.address,
        phone=restaurant_data.phone
    )

    db.add(new_restaurant)
    db.commit()
    db.refresh(new_restaurant)

    return new_restaurant

#list all active restaurants for all roles, including customers and restaurant owners
def get_restaurants(db: Session) -> list[Restaurant]:
    return db.query(Restaurant).filter(
        Restaurant.is_active == True
    ).all()

#get a specific restaurant by its ID, only if it is active
def get_restaurant_by_id(
    db: Session,
    restaurant_id: int
) -> Restaurant | None:

    return db.query(Restaurant).filter(
        Restaurant.id == restaurant_id,
        Restaurant.is_active == True
    ).first()

#resturant update function for restaurant owners to update their restaurant details
def update_restaurant(
    db: Session,
    restaurant_id: int,
    owner_id: int,
    restaurant_data: RestaurantUpdate
) -> Restaurant | None:

    restaurant = db.query(Restaurant).filter(
        Restaurant.id == restaurant_id,
        Restaurant.owner_id == owner_id
    ).first()

    if restaurant is None:
        return None

    update_data = restaurant_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(restaurant, field, value)

    db.commit()
    db.refresh(restaurant)

    return restaurant