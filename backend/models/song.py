from sqlalchemy import Column, Integer, String, Boolean, DateTime
from database.database import Base
from datetime import datetime
from modules.jst import JST

class Song(Base):
    __tablename__ = "songs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer)
    title = Column(String)
    type = Column(String)
    color = Column(String)
    symbol = Column(String)
    chemical_name = Column(String)
    style = Column(String)
    lyrics = Column(String)
    url = Column(String)
    image = Column(String)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(JST))
