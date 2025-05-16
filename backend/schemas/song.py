

from pydantic import BaseModel

class SongBase(BaseModel):
    title: str
    user_id: int
    type: str
    color: str
    symbol: str
    chemical_name: str
    style: str
    lyrics: str
    image: str
    url: str

class SongCreate(SongBase):
    pass

class Song(SongBase):
    id: int

    class Config:
        orm_mode = True