"""FocusOS — Documents Router"""

import os
import logging
from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File
from services.document_service import DocumentService
from utils.auth import get_current_user_id

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/documents", tags=["documents"])

ALLOWED_MIMES = {
    "application/pdf",
    "text/plain",
    "text/markdown",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
    "application/octet-stream",
}
ALLOWED_EXTS = {".pdf", ".docx", ".doc", ".txt", ".md"}


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id),
):
    ext = os.path.splitext(file.filename or "")[1].lower()
    if file.content_type not in ALLOWED_MIMES and ext not in ALLOWED_EXTS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file.content_type}. Allowed: PDF, DOCX, TXT, MD",
        )

    result = DocumentService.process_file(file)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    return {
        "status": "success",
        "message": "Document processed and intelligence extracted successfully.",
        "data": result,
    }
