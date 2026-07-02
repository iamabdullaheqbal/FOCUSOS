import logging
import json
from typing import Tuple, Dict, Any
import numpy as np

from .provider import OCRProvider

logger = logging.getLogger(__name__)

class GeminiProvider(OCRProvider):
    """OCR Provider utilizing Google Gemini Vision API."""
    
    def __init__(self, gemini_service, prompt_template: str, schema: dict):
        self.gemini = gemini_service
        self.prompt_template = prompt_template
        self.schema = schema
        
    def extract_text(self, image_bytes: bytes, cv_image: np.ndarray) -> Tuple[str, float]:
        """
        Extract raw text only. Uses Gemini as an OCR fallback.
        In this implementation, it's more efficient to just extract the tasks directly.
        """
        # If forced to extract raw text, we just call the structured extraction 
        # and pull out the 'summary' or raw text equivalent.
        res = self.extract_tasks_directly(image_bytes, "image/png")
        return res.get("summary", ""), 1.0

    def extract_tasks_directly(self, image_bytes: bytes, mime_type: str) -> Dict[str, Any]:
        """Uses Gemini Vision API to analyze image and return structured tasks."""
        if not self.gemini:
            logger.error("GeminiService is not available.")
            return {"tasks": [], "deadlines": [], "action_items": [], "summary": ""}
            
        full_prompt = self.prompt_template.format(
            schema_json=json.dumps(self.schema, indent=2)
        )
        
        try:
            gemini_res = self.gemini.generate_vision(
                image_bytes=image_bytes,
                prompt=full_prompt,
                mime_type=mime_type,
                structured=True,
                temperature=0.2
            )
            return gemini_res if gemini_res else {"tasks": [], "deadlines": [], "action_items": [], "summary": "Gemini fallback failed"}
        except Exception as e:
            logger.error("Gemini Vision extraction failed: %s", e)
            return {"tasks": [], "deadlines": [], "action_items": [], "summary": f"Extraction failed: {e}"}
