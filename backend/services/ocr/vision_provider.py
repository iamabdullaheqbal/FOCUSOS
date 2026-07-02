"""FocusOS — Vision OCR Provider (uses MistralService generate_vision)"""

import json
import logging
from typing import Tuple, Dict, Any
import numpy as np

from .provider import OCRProvider

logger = logging.getLogger(__name__)


class VisionProvider(OCRProvider):
    """OCR Provider using Mistral Pixtral vision model."""

    def __init__(self, ai_service, prompt_template: str, schema: dict):
        self.ai_service = ai_service
        self.prompt_template = prompt_template
        self.schema = schema

    def extract_text(self, image_bytes: bytes, cv_image: np.ndarray) -> Tuple[str, float]:
        res = self.extract_tasks_directly(image_bytes, "image/png")
        return res.get("summary", ""), 1.0

    def extract_tasks_directly(self, image_bytes: bytes, mime_type: str) -> Dict[str, Any]:
        if not self.ai_service:
            logger.error("AI service not available.")
            return {"tasks": [], "deadlines": [], "action_items": [], "summary": ""}

        full_prompt = self.prompt_template.format(
            schema_json=json.dumps(self.schema, indent=2)
        )
        try:
            result = self.ai_service.generate_vision(
                image_bytes=image_bytes,
                prompt=full_prompt,
                mime_type=mime_type,
                structured=True,
                temperature=0.2,
            )
            return result if result else {"tasks": [], "deadlines": [], "action_items": [], "summary": "Vision extraction returned empty"}
        except Exception as e:
            logger.error("Vision extraction failed: %s", e)
            return {"tasks": [], "deadlines": [], "action_items": [], "summary": f"Extraction failed: {e}"}
