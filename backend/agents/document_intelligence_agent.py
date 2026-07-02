"""
DeadlineOS — Document Intelligence Agent
========================================
Extracts tasks, deadlines, action items, and owners from uploaded meeting/project notes.
Includes Vector-Ready architecture, Semantic Chunking, and Document Metadata.
"""

import uuid
from typing import Dict, Any, List
from services.gemini_service import GeminiService
import logging

logger = logging.getLogger(__name__)

class DocumentIntelligenceAgent:

    def __init__(self, gemini_service):
        self.gemini = gemini_service

    def _semantic_chunking(self, text: str, chunk_size: int = 3000, overlap: int = 200) -> List[Dict[str, Any]]:
        """
        Splits a large document into semantic chunks with overlap.
        Ready for vector embedding ingestion.
        """
        chunks = []
        words = text.split()
        
        # Simple word-based chunking as a proxy for semantic boundaries for now
        # A more advanced version would use NLTK or SpaCy sentence boundaries
        start = 0
        while start < len(words):
            end = start + chunk_size
            chunk_text = " ".join(words[start:end])
            
            chunks.append({
                "chunk_id": str(uuid.uuid4()),
                "text": chunk_text,
                "token_estimate": len(chunk_text.split()),
                "embedding": None  # Placeholder for future Vector DB adapter
            })
            
            start += chunk_size - overlap
            
        return chunks

    def _generate_embedding(self, text: str) -> List[float]:
        """
        Stub for an embedding interface so a vector database can be plugged in later.
        """
        # Example: return self.gemini.embed(text)
        return []

    def parse_document(self, text: str, filename: str = "Unknown") -> Dict[str, Any]:
        """Parses raw text into structured execution items and prepares vector metadata."""
        
        # 1. Chunk the document
        chunks = self._semantic_chunking(text)
        
        # 2. Extract intelligence from the first chunk (or combine if needed)
        # For this phase, we analyze the top chunk for immediate tasks, 
        # and store all chunks for the Vector DB.
        primary_text = chunks[0]["text"] if chunks else ""
        
        prompt = f"""
        You are the Document Intelligence Agent for DeadlineOS.
        Analyze the following document chunk and extract all actionable intelligence.
        Assign a confidence score (0-100) based on how clear and actionable the extracted data is.
        
        DOCUMENT TEXT:
        {primary_text[:15000]}
        
        Extract:
        1. tasks (Array of Objects: title, estimated_hours)
        2. deadlines (Array of Strings: Any mentioned dates/times)
        3. action_items (Array of Strings: High-level action items)
        4. owners (Array of Strings: People responsible for tasks)
        5. summary (String: 2-3 sentence summary of the document's purpose)
        6. confidence (Integer: 0-100)
        """
        
        schema = {
            "type": "OBJECT",
            "properties": {
                "tasks": {
                    "type": "ARRAY",
                    "items": {
                        "type": "OBJECT",
                        "properties": {
                            "title": {"type": "STRING"},
                            "estimated_hours": {"type": "NUMBER"}
                        },
                        "required": ["title"]
                    }
                },
                "deadlines": {
                    "type": "ARRAY",
                    "items": {"type": "STRING"}
                },
                "action_items": {
                    "type": "ARRAY",
                    "items": {"type": "STRING"}
                },
                "owners": {
                    "type": "ARRAY",
                    "items": {"type": "STRING"}
                },
                "summary": {"type": "STRING"},
                "confidence": {"type": "INTEGER"}
            },
            "required": ["tasks", "deadlines", "action_items", "owners", "summary", "confidence"]
        }
        
        try:
            result = self.gemini.generate_structured(prompt, primary_text, schema)
            
            # 3. Augment result with Vector-Ready Metadata
            result["metadata"] = {
                "filename": filename,
                "total_chunks": len(chunks),
                "document_length": len(text),
                "vector_ready": True
            }
            result["chunks"] = chunks
            
            return result
            
        except Exception as e:
            logger.error(f"DocumentIntelligenceAgent Error: {e}")
            return {
                "tasks": [{"title": "Review parsed document", "estimated_hours": 1}],
                "deadlines": ["ASAP"],
                "action_items": ["Manual review required due to parsing error."],
                "owners": ["System"],
                "summary": "Document processing encountered an error.",
                "confidence": 0,
                "metadata": {"filename": filename, "error": str(e)},
                "chunks": []
            }
