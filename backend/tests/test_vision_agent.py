"""
DeadlineOS — Vision Agent Unit Tests
"""

import unittest
from unittest.mock import MagicMock

from agents.vision_agent import VisionAgent


class TestVisionAgent(unittest.TestCase):
    def setUp(self):
        """Set up a mocked GeminiService and initialize VisionAgent."""
        self.mock_gemini = MagicMock()
        self.agent = VisionAgent(self.mock_gemini)

    def test_extract_tasks_structure(self):
        """Verify the agent correctly formats the prompt and returns structured data."""
        # Setup mock return value based on requirements
        mock_response = {
            "tasks": [
                {
                    "title": "React Assignment",
                    "deadline": "2026-06-25",
                    "priority": "High"
                }
            ],
            "deadlines": [
                {
                    "task": "React Assignment",
                    "date": "2026-06-25"
                }
            ],
            "action_items": [
                "Build dashboard UI",
                "Implement charts"
            ],
            "summary": "Assignment with high urgency detected."
        }
        self.mock_gemini.generate_vision.return_value = mock_response

        # Input data
        image_bytes = b"fakeimagebytes12345"
        mime_type = "image/png"

        # Execute
        result = self.agent.extract_tasks_from_image(image_bytes, mime_type)

        # Assertions
        self.assertEqual(len(result["tasks"]), 1)
        self.assertEqual(result["tasks"][0]["title"], "React Assignment")
        self.assertEqual(result["tasks"][0]["priority"], "High")
        self.assertEqual(len(result["deadlines"]), 1)
        self.assertEqual(len(result["action_items"]), 2)

        # Verify GeminiService was called with the correct parameters
        self.mock_gemini.generate_vision.assert_called_once()
        call_kwargs = self.mock_gemini.generate_vision.call_args.kwargs
        
        # Verify inputs
        self.assertEqual(call_kwargs["image_bytes"], image_bytes)
        self.assertEqual(call_kwargs["mime_type"], mime_type)
        self.assertTrue(call_kwargs["structured"])
        
        # Verify prompts
        self.assertIn("intelligent productivity analyst", call_kwargs["prompt"])
        self.assertIn("generate priority recommendations", call_kwargs["prompt"])
        
        # Verify schema string is embedded in the prompt
        self.assertIn("tasks", call_kwargs["prompt"])
        self.assertIn("deadlines", call_kwargs["prompt"])


if __name__ == "__main__":
    unittest.main()
