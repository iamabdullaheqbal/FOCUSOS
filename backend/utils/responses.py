"""FocusOS — Standardized response helpers"""

from typing import Any
from fastapi.responses import JSONResponse


def success_response(data: Any = None, message: str = "Success", status_code: int = 200) -> JSONResponse:
    body = {"status": "success", "message": message}
    if data is not None:
        body["data"] = data
    return JSONResponse(content=body, status_code=status_code)


def error_response(message: str, code: str = "INTERNAL_ERROR", status_code: int = 500, details: dict = None) -> JSONResponse:
    err = {"code": code, "message": message}
    if details:
        err["details"] = details
    return JSONResponse(content={"status": "error", "error": err}, status_code=status_code)
