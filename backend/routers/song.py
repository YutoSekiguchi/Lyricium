from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from dependency import get_db
from crud.song import (
    get_all_songs,
    get_song_by_id,
    get_songs_by_user_id,
    get_songs_by_color,
    get_songs_by_chemical_name,
    get_songs_by_style,
    create_song,
    get_random_song,
    get_recent_songs,
)
from schemas.song import SongCreate, Song
from models.song import Song as SongModel
from models.user import User as UserModel


song = APIRouter(prefix="/songs", tags=["song"])

@song.get("/get/all")
async def get_all_songs_route(db: Session = Depends(get_db)):
    songs = await get_all_songs(db)
    return songs

@song.get("/get/id/{id}")
async def get_song_by_id_route(id: int, db: Session = Depends(get_db)):
    song = await get_song_by_id(db, id)
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")
    return song

@song.get("/get/user/{user_id}")
async def get_songs_by_user_id_route(user_id: int, db: Session = Depends(get_db)):
    songs = await get_songs_by_user_id(db, user_id)
    if not songs:
        raise HTTPException(status_code=404, detail="Songs not found")
    return songs

@song.get("/get/color/{color}")
async def get_songs_by_color_route(color: str, db: Session = Depends(get_db)):
    songs = await get_songs_by_color(db, color)
    if not songs:
        raise HTTPException(status_code=404, detail="Songs not found")
    return songs

@song.get("/get/chemical_name/{chemical_name}")
async def get_songs_by_chemical_name_route(chemical_name: str, db: Session = Depends(get_db)):
    songs = await get_songs_by_chemical_name(db, chemical_name)
    if not songs:
        raise HTTPException(status_code=404, detail="Songs not found")
    return songs

@song.get("/get/style/{style}")
async def get_songs_by_style_route(style: str, db: Session = Depends(get_db)):
    songs = await get_songs_by_style(db, style)
    if not songs:
        raise HTTPException(status_code=404, detail="Songs not found")
    return songs

@song.get("/get/random")
async def get_random_song_id_route(db: Session = Depends(get_db)):
    song = await get_random_song(db)
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")
    return song.id

@song.get("/get/recent")
async def get_recent_songs_route(limit: int = 10, db: Session = Depends(get_db)):
    songs = await get_recent_songs(db, limit)
    if not songs:
        raise HTTPException(status_code=404, detail="Songs not found")
    return songs


@song.post("/create", response_model=Song)
async def create_song_route(song: SongCreate, db: Session = Depends(get_db)):
    # Check if the user exists
    user = db.query(UserModel).filter(UserModel.id == song.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Create the song
    created_song = await create_song(db, song)
    if not created_song:
        raise HTTPException(status_code=400, detail="Song already exists")
    return created_song