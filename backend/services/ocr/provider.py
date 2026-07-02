from abc import ABC, abstractmethod
from typing import Dict, Any, Tuple
import numpy as np

class OCRProvider(ABC):
    """Abstract base class for OCR extraction providers."""
    
    @abstractmethod
    def extract_text(self, image_bytes: bytes, cv_image: np.ndarray) -> Tuple[str, float]:
        """
        Extract text from an image.
        
        Args:
            image_bytes: Raw bytes of the image (often used by Gemini).
            cv_image: Preprocessed OpenCV image (numpy array, often used by Tesseract).
            
        Returns:
            Tuple[str, float]: The extracted text and a confidence score between 0.0 and 1.0.
        """
        pass

    @abstractmethod
    def extract_tasks_directly(self, image_bytes: bytes, mime_type: str) -> Dict[str, Any]:
        """
        Directly extract structured tasks, deadlines, and summaries.
        (Usually only implemented fully by GeminiProvider).
        """
        pass
