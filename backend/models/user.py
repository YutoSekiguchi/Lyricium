from sqlalchemy import Column, Integer, String, Boolean, DateTime
from database.database import Base
from datetime import datetime
from modules.jst import JST

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    display_name = Column(String)
    email = Column(String)
    image = Column(String)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(JST))
