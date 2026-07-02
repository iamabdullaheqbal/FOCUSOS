"""FocusOS — Document Service"""

import logging
import time
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)


class DocumentService:

    @classmethod
    def process_file(cls, file, user_id: Optional[str] = None, ai_service=None) -> Dict[str, Any]:
        import pypdf
        import docx as _docx

        filename = (file.filename or "").lower()
        text = ""

        try:
            t0 = time.time()
            if filename.endswith(".pdf"):
                reader = pypdf.PdfReader(file.file if hasattr(file, "file") else file)
                for page in reader.pages:
                    extracted = page.extract_text()
                    if extracted:
                        text += extracted + "\n"

            elif filename.endswith(".docx"):
                doc = _docx.Document(file.file if hasattr(file, "file") else file)
                for para in doc.paragraphs:
                    text += para.text + "\n"

            elif filename.endswith((".txt", ".md")):
                raw = file.file.read() if hasattr(file, "file") else file.read()
                text = raw.decode("utf-8") if isinstance(raw, bytes) else raw

            else:
                return {"error": "Unsupported file format. Use PDF, DOCX, TXT, or MD."}

            if not text.strip():
                return {"error": "Could not extract text from document."}

            from services.local_intelligence.execution_engine import ExecutionEngine
            execution = ExecutionEngine.execute(
                source="document",
                transcript=text[:2000],
                ai_service=ai_service,
                user_id=user_id,
            )

            try:
                from services.telemetry_service import TelemetryService
                TelemetryService.log_execution(
                    "Document Intelligence", "Extraction", "success", t0,
                    execution.get("confidence", 85), user_id=user_id,
                )
            except Exception:
                pass

            return {
                "filename": filename,
                "summary": execution.get("message", ""),
                "tasks": execution.get("entities", {}).get("tasks", []),
                "action_items": execution.get("entities", {}).get("action_items", []),
                "deadlines": execution.get("entities", {}).get("deadlines", []),
                "owners": execution.get("entities", {}).get("people", []),
                "inserted_task_ids": execution.get("data", {}).get("inserted_ids", []),
                "tasks_created": len(execution.get("data", {}).get("inserted_ids", [])),
                "structured_result": execution,
            }

        except Exception as e:
            logger.error("DocumentService.process_file failed: %s", e)
            return {"error": f"Processing failed: {e}"}
