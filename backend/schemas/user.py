from pydantic import BaseModel

class UserBase(BaseModel):
    name: str
    display_name: str
    email: str
    image: str

class UserCreate(UserBase):
    pass

class User(UserBase):
    id: int

    class Config:
        orm_mode = True
    