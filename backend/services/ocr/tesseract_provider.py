import logging
import shutil
from typing import Tuple, Dict, Any
import numpy as np

from .provider import OCRProvider

logger = logging.getLogger(__name__)

class TesseractProvider(OCRProvider):
    """OCR Provider utilizing pytesseract."""
    
    def __init__(self):
        self.is_available = shutil.which("tesseract") is not None
        if not self.is_available:
            logger.warning("Tesseract executable not found on system. Tesseract OCR will be skipped.")
            
    def extract_text(self, image_bytes: bytes, cv_image: np.ndarray) -> Tuple[str, float]:
        if not self.is_available:
            return "", 0.0
            
        try:
            import pytesseract
            # Run tesseract configured for OEM 3 and PSM 6
            data = pytesseract.image_to_data(cv_image, output_type=pytesseract.Output.DICT, config='--oem 3 --psm 6')
            
            text_parts = []
            confidences = []
            
            for i in range(len(data['text'])):
                word = data['text'][i].strip()
                conf = data['conf'][i]
                # Filter out empty text and invalid (-1) confidences
                if word and int(conf) != -1:
                    text_parts.append(word)
                    confidences.append(float(conf) / 100.0)
                    
            full_text = " ".join(text_parts)
            avg_conf = sum(confidences) / len(confidences) if confidences else 0.0
            
            return full_text, avg_conf
            
        except ImportError:
            logger.error("pytesseract module not installed.")
            return "", 0.0
        except Exception as e:
            logger.error("Tesseract extraction failed: %s", e)
            return "", 0.0
            
    def extract_tasks_directly(self, image_bytes: bytes, mime_type: str) -> Dict[str, Any]:
        """Tesseract does not natively parse JSON tasks, so this returns empty."""
        return {}
