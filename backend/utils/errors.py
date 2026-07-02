"""FocusOS — Custom Exceptions"""


class APIError(Exception):
    def __init__(self, message: str, code: str = "API_ERROR", status: int = 400, details: dict = None):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status = status
        self.details = details or {}
