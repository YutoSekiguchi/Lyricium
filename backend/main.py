from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from config import get_env_variable
from routers import user,song, upload

FRONTEND_URI = get_env_variable("FRONTEND_URI")

app = FastAPI()

origins = [
    "http://localhost:8080",
    "http://localhost:7770",
    "http://localhost:3000",
    FRONTEND_URI,
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"Hello": "FastAPI"}

OPEN_EXTENSIONS = {".wav", ".mp3", ".flac", ".aac", ".ogg", ".m4a", ".mp4", "jpg", "jpeg", "png", "gif", "bmp", "tiff", "tif", "svg", "webp", "ico", "heic", "webm", "ogg", "mov", "avi", "wmv", "flv", "mkv", "m4v", "3gp", "3g2", ".pdf"}

class FilteredStaticFiles(StaticFiles):
    async def get_response(self, path: str, scope):
        # ファイル拡張子をチェック
        if not any(path.lower().endswith(ext) for ext in OPEN_EXTENSIONS):
            raise HTTPException(status_code=404, detail="Not Found")
        return await super().get_response(path, scope)

# # アップロードディレクトリから画像ファイルのみを提供
app.mount("/uploads", FilteredStaticFiles(directory="uploads"), name="uploads")

routers = [user.user, song.song, upload.upload]
for router in routers:
    app.include_router(router)