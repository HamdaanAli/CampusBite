from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user import UserCreate, UserLogin
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token
)


def register_user(db: Session, user_data: UserCreate) -> User:
    # Check whether the email already exists
    existing_user = db.query(User).filter(
        User.email == user_data.email
    ).first()

    if existing_user:
        raise ValueError("Email is already registered")

    # Hash the user's password
    hashed_password = hash_password(user_data.password)

    # Create the new user
    new_user = User(
        full_name=user_data.full_name,
        email=user_data.email,
        phone=user_data.phone,
        hashed_password=hashed_password,
        role=user_data.role
    )

    # Save the user to the database
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


def login_user(db: Session, user_data: UserLogin) -> dict:
    # Find user by email
    user = db.query(User).filter(
        User.email == user_data.email
    ).first()

    # Verify credentials
    if not user or not verify_password(
        user_data.password,
        user.hashed_password
    ):
        raise ValueError("Invalid email or password")

    # Check account status
    if not user.is_active:
        raise ValueError("Account is inactive")

    # Generate JWT access token
    access_token = create_access_token({
        "sub": str(user.id),
        "role": user.role
    })

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }