"""
DeadlineOS — Planning Agent Unit Tests
"""

import unittest
from unittest.mock import MagicMock

from agents.planning_agent import PlanningAgent


class TestPlanningAgent(unittest.TestCase):
    def setUp(self):
        """Set up a mocked GeminiService and initialize PlanningAgent."""
        self.mock_gemini = MagicMock()
        self.agent = PlanningAgent(self.mock_gemini)

    def test_generate_plan_empty_tasks(self):
        """Verify behavior when no tasks are provided."""
        result = self.agent.generate_plan([], {})
        self.assertEqual(result["schedule"], [])
        self.assertEqual(result["confidence_score"], 100)
        self.mock_gemini.generate_structured.assert_not_called()

    def test_generate_plan_structure(self):
        """Verify the agent correctly formats the prompt and returns structured data."""
        # Setup mock return value based on requirements
        mock_response = {
            "schedule": [
                {
                    "date": "2026-06-24",
                    "task": "React Assignment",
                    "start_time": "09:00",
                    "end_time": "11:00",
                    "focus_block": True
                },
                {
                    "date": "2026-06-24",
                    "task": "Interview Preparation",
                    "start_time": "11:30",
                    "end_time": "13:00",
                    "focus_block": True
                }
            ],
            "daily_summary": "Complete React Assignment before noon and start Interview Preparation.",
            "confidence_score": 92
        }
        self.mock_gemini.generate_structured.return_value = mock_response

        # Input data
        tasks = [
            {
                "title": "React Assignment",
                "deadline": "2026-06-25T18:00:00",
                "estimated_hours": 4,
                "priority_score": 92
            },
            {
                "title": "Interview Preparation",
                "deadline": "2026-06-27T10:00:00",
                "estimated_hours": 3,
                "priority_score": 85
            }
        ]
        
        availability = {
            "daily_available_hours": 6,
            "preferred_work_hours": {
                "start": "09:00",
                "end": "21:00"
            }
        }

        # Execute
        result = self.agent.generate_plan(tasks, availability)

        # Assertions
        self.assertEqual(len(result["schedule"]), 2)
        self.assertEqual(result["schedule"][0]["task"], "React Assignment")
        self.assertEqual(result["confidence_score"], 92)

        # Verify GeminiService was called with the correct parameters
        self.mock_gemini.generate_structured.assert_called_once()
        call_kwargs = self.mock_gemini.generate_structured.call_args.kwargs
        
        # Verify prompts
        self.assertIn("executive assistant", call_kwargs["system_prompt"])
        self.assertIn("React Assignment", call_kwargs["user_prompt"])
        self.assertIn("09:00", call_kwargs["user_prompt"])
        
        # Verify schema presence
        self.assertEqual(call_kwargs["schema"]["type"], "object")
        self.assertIn("schedule", call_kwargs["schema"]["required"])


if __name__ == "__main__":
    unittest.main()
