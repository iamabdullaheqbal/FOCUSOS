"""
DeadlineOS — Rescue Agent Unit Tests
"""

import unittest
from unittest.mock import MagicMock

from agents.rescue_agent import RescueAgent


class TestRescueAgent(unittest.TestCase):
    def setUp(self):
        """Set up a mocked GeminiService and initialize RescueAgent."""
        self.mock_gemini = MagicMock()
        self.agent = RescueAgent(self.mock_gemini)

    def test_generate_recovery_plan_empty_tasks(self):
        """Verify behavior when no tasks are provided."""
        result = self.agent.generate_recovery_plan([], {})
        self.assertFalse(result["risk_detected"])
        self.assertEqual(result["strategies"], [])
        self.mock_gemini.generate_structured.assert_not_called()

    def test_generate_recovery_plan_structure(self):
        """Verify the agent returns the 3 deterministic strategies."""
        from unittest.mock import patch

        tasks = [
            {
                "id": "123",
                "title": "React Assignment",
                "deadline": "2026-06-25T18:00:00",
                "estimated_hours": 8,
                "completed_hours": 2,
                "priority_score": 92
            }
        ]
        
        availability = {
            "daily_available_hours": 3
        }

        self.mock_gemini.generate_structured.return_value = {
            "risk_detected": True,
            "risk_level": "High",
            "strategies": [{"name": "Safe"}, {"name": "Balanced"}, {"name": "Aggressive"}]
        }

        with patch("agents.digital_twin_agent.DigitalTwinAgent.simulate_scenario", return_value={"projected_state": {"success_probability": 85}}):
            result = self.agent.generate_recovery_plan(tasks, availability)

        self.assertTrue(result["risk_detected"])
        self.assertEqual(result["risk_level"], "High")
        self.assertEqual(len(result["strategies"]), 3)
        self.assertEqual(result["strategies"][0]["name"], "Safe")
        self.assertEqual(result["strategies"][1]["name"], "Balanced")
        self.assertEqual(result["strategies"][2]["name"], "Aggressive")


if __name__ == "__main__":
    unittest.main()
