from sqlalchemy.orm import Session
from sqlalchemy import func
from models.song import Song
from schemas.song import SongCreate

async def get_all_songs(db: Session):
    return db.query(Song).all()

async def get_song_by_id(db: Session, id: int):
    return db.query(Song).filter(Song.id == id).first()

async def get_songs_by_user_id(db: Session, user_id: int):
    return db.query(Song).filter(Song.user_id == user_id).order_by(func.random()).all()

async def get_songs_by_color(db: Session, color: str):
    return db.query(Song).filter(Song.color == color).order_by(func.random()).all()

async def get_songs_by_chemical_name(db: Session, chemical_name: str):
    return db.query(Song).filter(Song.chemical_name == chemical_name).order_by(func.random()).all()

async def get_songs_by_style(db: Session, style: str):
    return db.query(Song).filter(Song.style == style).order_by(func.random()).all()


# idをランダムで取得する
async def get_random_song(db: Session):
    return db.query(Song).order_by(func.random()).first()


# 直近追加された曲を取得
async def get_recent_songs(db: Session, limit: int = 10):
    """
    Retrieve the most recently added songs, ordered by creation time descending.
    """
    return db.query(Song).order_by(Song.created_at.desc()).limit(limit).all()



async def create_song(db: Session, song: SongCreate):
    db_song = Song(
        title=song.title,
        user_id=song.user_id,
        type=song.type,
        color=song.color,
        symbol=song.symbol,
        chemical_name=song.chemical_name,
        style=song.style,
        lyrics=song.lyrics,
        image=song.image,
        url=song.url
    )
    db.add(db_song)
    db.commit()
    db.refresh(db_song)
    return db_song