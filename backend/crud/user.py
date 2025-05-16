from sqlalchemy.orm import Session
from models.user import User
from schemas.user import UserCreate

async def get_all_users(db: Session):
    return db.query(User).all()

async def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

async def get_user_by_id(db: Session, id: int):
    return db.query(User).filter(User.id == id).first()

async def create_user(db: Session, user: UserCreate):
    """
    すでに存在するユーザーは作成しない
    """
    existing_user = await get_user_by_email(db, user.email)
    if existing_user:
        return existing_user
    db_user = User(
        name=user.name,
        display_name=user.display_name,
        email=user.email,
        image=user.image
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user