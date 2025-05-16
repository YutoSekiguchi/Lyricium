from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from dependency import get_db
from crud.user import get_all_users, get_user_by_email, create_user, get_user_by_id
from schemas.user import UserCreate

user = APIRouter(prefix="/users", tags=["user"])

@user.get("/get/all")
async def get_all_users_route(db: Session = Depends(get_db)):
    users = await get_all_users(db)
    return users

@user.get("/get/email/{email}")
async def get_user_by_email_route(email: str, db: Session = Depends(get_db)):
    user = await get_user_by_email(db, email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@user.get("/get/id/{id}")
async def get_user_by_id_route(id: int, db: Session = Depends(get_db)):
    user = await get_user_by_id(db, id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@user.post("/create")
async def create_user_route(user: UserCreate, db: Session = Depends(get_db)):
    created_user = await create_user(db, user)
    if not created_user:
        raise HTTPException(status_code=400, detail="User already exists")
    return created_user