import os
import uuid
from typing import List
from fastapi import UploadFile, HTTPException


ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
ALLOWED_PDF_EXTENSIONS = ['.pdf']
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

def validate_file_extension(filename: str, allowed_extensions: List[str]):
    ext = os.path.splitext(filename)[1].lower()
    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file extension '{ext}'. Allowed extensions are: {', '.join(allowed_extensions)}"
        )

async def validate_file_size(file: UploadFile):
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File size exceeds the limit of {MAX_FILE_SIZE / (1024 * 1024)}MB."
        )
    await file.seek(0)
    return content

async def validate_image_security(file: UploadFile):
    validate_file_extension(file.filename, ALLOWED_IMAGE_EXTENSIONS)
    content = await validate_file_size(file)
    
    from PIL import Image
    import io
    try:
        img = Image.open(io.BytesIO(content))
        img.verify()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid or corrupted image file.")

def validate_pdf_security(filename: str):
    validate_file_extension(filename, ALLOWED_PDF_EXTENSIONS)

def get_secure_filename(filename: str) -> str:
    ext = os.path.splitext(filename)[1].lower()
    return f"{uuid.uuid4()}{ext}"
