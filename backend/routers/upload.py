

from fastapi import APIRouter, File, UploadFile
from fastapi.responses import JSONResponse
import os
from uuid import uuid4

upload = APIRouter(prefix="/upload", tags=["upload"])

UPLOAD_DIR = "uploads"

@upload.post("/audio")
async def upload_audio(file: UploadFile = File(...)):
    if not os.path.exists(UPLOAD_DIR):
        os.makedirs(UPLOAD_DIR)

    file_extension = os.path.splitext(file.filename)[1]
    file_name = f"{uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, file_name)

    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())

    return JSONResponse(content={"path": file_path})