"""
DeadlineOS — Vision Agent
=============================
An intelligent productivity analyst capable of converting visual 
information (screenshots, handwritten notes, timetables) into 
actionable structured tasks.
"""

import json
import logging
import io
import os
import re
import cv2
import numpy as np
from PIL import Image
from typing import Dict, Any

from services.ocr.tesseract_provider import TesseractProvider
from services.ocr.gemini_provider import GeminiProvider

try:
    import pillow_heif
    pillow_heif.register_heif_opener()
except ImportError:
    pass

try:
    import dateparser
except ImportError:
    dateparser = None

logger = logging.getLogger(__name__)

VISION_PROMPT_TEMPLATE = """You are the Vision Agent in DeadlineOS — an intelligent productivity analyst capable of converting visual information into actionable tasks.
Analyze the provided image (which could be a screenshot, handwritten note, timetable, meeting note, or study plan).

CORE RESPONSIBILITIES:
1. Extract all identifiable tasks, assignments, and obligations.
2. Extract any visible deadlines or due dates (convert to YYYY-MM-DD if possible).
3. Extract any specific action items or sub-tasks.
4. Automatically generate priority recommendations ("High", "Medium", "Low") based on the implied urgency or context of the document.
5. Provide a brief executive summary of what was found.

Output EXACTLY according to the following JSON schema:
{schema_json}
"""

VISION_SCHEMA = {
    "type": "object",
    "properties": {
        "tasks": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "deadline": {"type": "string", "description": "YYYY-MM-DD or 'None'"},
                    "priority": {"type": "string", "enum": ["High", "Medium", "Low"], "description": "Recommended priority"}
                },
                "required": ["title", "deadline", "priority"]
            }
        },
        "deadlines": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "task": {"type": "string"},
                    "date": {"type": "string"}
                },
                "required": ["task", "date"]
            }
        },
        "action_items": {
            "type": "array",
            "items": {
                "type": "string"
            }
        },
        "summary": {
            "type": "string"
        }
    },
    "required": ["tasks", "deadlines", "action_items", "summary"]
}

class VisionAgent:
    """Agent responsible for multimodal task extraction from images."""
    
    def __init__(self, gemini_service):
        self.gemini = gemini_service
        self.tesseract = TesseractProvider()
        self.gemini_ocr = GeminiProvider(gemini_service, VISION_PROMPT_TEMPLATE, VISION_SCHEMA)
        
        # Configuration
        self.conf_threshold = float(os.getenv("OCR_CONFIDENCE_THRESHOLD", "75")) / 100.0

    def preprocess_image(self, image_bytes: bytes) -> bytes:
        """Resizes and normalizes image for OCR and Gemini."""
        try:
            # Load with PIL (supports HEIC via pillow_heif)
            img = Image.open(io.BytesIO(image_bytes))
            if img.mode != 'RGB':
                img = img.convert('RGB')
                
            # Resize if too large
            max_size = 1600
            if img.width > max_size or img.height > max_size:
                img.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
                
            # Convert PIL to OpenCV format (numpy array)
            cv_img = np.array(img)
            cv_img = cv_img[:, :, ::-1].copy() # RGB to BGR
            
            # 1. Grayscale
            gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)
            
            # 2. Auto Deskew
            coords = np.column_stack(np.where(gray > 0))
            if len(coords) > 0:
                angle = cv2.minAreaRect(coords)[-1]
                if angle < -45:
                    angle = -(90 + angle)
                else:
                    angle = -angle
                if abs(angle) > 0.5:
                    (h, w) = gray.shape[:2]
                    center = (w // 2, h // 2)
                    M = cv2.getRotationMatrix2D(center, angle, 1.0)
                    gray = cv2.warpAffine(gray, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
            
            # 3. Contrast Enhancement & 4. Noise Reduction
            blurred = cv2.GaussianBlur(gray, (5, 5), 0)
            
            # 5. Adaptive Thresholding
            thresh = cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
            
            # Convert back to bytes for Tesseract / Gemini
            success, encoded_img = cv2.imencode('.png', thresh)
            if success:
                return encoded_img.tobytes()
                
            # Fallback to pure PIL
            buffer = io.BytesIO()
            img.save(buffer, format="JPEG", quality=85)
            return buffer.getvalue()
        except Exception as e:
            logger.warning("Image preprocessing failed, using original: %s", e)
            return image_bytes

    def _calculate_blur_score(self, cv_image: np.ndarray) -> float:
        """Returns the variance of the Laplacian (higher means sharper)."""
        return cv2.Laplacian(cv_image, cv2.CV_64F).var()

    def extract_tasks_via_ocr(self, image_bytes: bytes) -> tuple[Dict[str, Any], float]:
        """Runs local OCR and regex extraction with intelligent Gemini fallback."""
        try:
            # Reconstruct cv_image from preprocessed bytes for density / blur checks
            np_arr = np.frombuffer(image_bytes, np.uint8)
            cv_image = cv2.imdecode(np_arr, cv2.IMREAD_GRAYSCALE)
            
            if cv_image is None or not self.tesseract.is_available:
                logger.info("Tesseract unavailable or image corrupted. Using Gemini Fallback.")
                gemini_res = self.extract_tasks_from_image(image_bytes, "image/png")
                return {
                    "raw_text": gemini_res.get("summary", "Extracted via Gemini Vision"),
                    "parsed_preview": gemini_res
                }, 1.0

            blur_score = self._calculate_blur_score(cv_image)
            
            # 1. Run Tesseract
            full_text, avg_conf = self.tesseract.extract_text(image_bytes, cv_image)
            
            # 2. Heuristics
            text_len = len(full_text.strip())
            area = cv_image.shape[0] * cv_image.shape[1]
            density = text_len / area if area > 0 else 0
            
            # 3. Intelligent Decision Engine
            is_reliable = True
            
            if avg_conf < self.conf_threshold:
                is_reliable = False
            elif text_len < 10:
                is_reliable = False
            elif blur_score < 50.0:
                is_reliable = False
                
            if not is_reliable:
                logger.info("OCR deemed unreliable (conf: %.2f, len: %d, blur: %.1f). Falling back to Gemini.", avg_conf, text_len, blur_score)
                # Fallback transparently inside this method so routes remain unchanged
                gemini_res = self.extract_tasks_from_image(image_bytes, "image/png")
                return {
                    "raw_text": gemini_res.get("summary", "Extracted via Gemini Vision"),
                    "parsed_preview": gemini_res
                }, 1.0
                
            # Reliable: Parse structured preview
            return {
                "raw_text": full_text,
                "parsed_preview": self.parse_raw_text(full_text)
            }, avg_conf
            
        except Exception as e:
            logger.error("Intelligent OCR engine failed cleanly: %s", e)
            # Failsafe fallback
            gemini_res = self.extract_tasks_from_image(image_bytes, "image/png")
            return {
                "raw_text": gemini_res.get("summary", "Extracted via Gemini Vision"),
                "parsed_preview": gemini_res
            }, 1.0

    def parse_raw_text(self, full_text: str) -> Dict[str, Any]:
        """Parses structured tasks and deadlines from raw text."""
        tasks = []
        deadlines = []
        action_items = []
        
        lines = full_text.split("\n")
        for line in lines:
            line = line.strip()
            if not line or len(line) < 4:
                continue
                
            task_text = re.sub(r"^([-*•]|\d+\.|\[[ xX]\])\s*", "", line).strip()
            
            if task_text.lower() not in ["meeting agenda", "doctor's note", "messy whiteboard"]:
                # Try Dateparser first
                parsed_date = None
                if dateparser:
                    parsed_date_obj = dateparser.parse(task_text, settings={'STRICT_PARSING': False})
                    if parsed_date_obj:
                        parsed_date = parsed_date_obj.strftime("%Y-%m-%d")
                
                # Regex Fallback
                if not parsed_date:
                    date_match = re.search(r"(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2}|\d{4}-\d{2}-\d{2}", task_text, re.IGNORECASE)
                    if date_match:
                        parsed_date = date_match.group(0)
                        
                deadline_val = parsed_date if parsed_date else "None"
                
                if deadline_val != "None":
                    deadlines.append({"task": task_text, "date": deadline_val})
                    
                tasks.append({
                    "title": task_text[:100],
                    "deadline": deadline_val,
                    "priority": "Medium"
                })
                action_items.append(task_text)
                
        return {
            "tasks": tasks,
            "deadlines": deadlines,
            "events": [],
            "action_items": action_items,
            "priorities": [t["priority"] for t in tasks]
        }

    def extract_tasks_from_image(self, image_bytes: bytes, mime_type: str) -> Dict[str, Any]:
        """
        Analyzes an image and extracts structured tasks, deadlines, and action items.
        (Called directly by routes for pure-AI vision or internally as a fallback)
        """
        logger.info("Vision Agent analyzing %s image (%d bytes) with Gemini", mime_type, len(image_bytes))
        # Delegate to the Gemini Provider to fulfill abstraction
        return self.gemini_ocr.extract_tasks_directly(image_bytes, mime_type)
