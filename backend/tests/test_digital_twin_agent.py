"""
DeadlineOS — Digital Twin Agent Unit Tests
"""

import unittest
from unittest.mock import MagicMock

from agents.digital_twin_agent import DigitalTwinAgent


class TestDigitalTwinAgent(unittest.TestCase):
    def setUp(self):
        """Set up a mocked GeminiService and initialize DigitalTwinAgent."""
        self.mock_gemini = MagicMock()
        self.agent = DigitalTwinAgent(self.mock_gemini)

    def test_simulate_scenario_empty(self):
        """Verify baseline behavior when no tasks or scenario are provided."""
        result = self.agent.simulate_scenario([], {}, {})
        self.assertEqual(result["projected_state"]["success_probability"], 100)
        self.assertEqual(result["projected_state"]["risk_level"], "Low")
        self.mock_gemini.generate_structured.assert_not_called()

    def test_simulate_scenario_structure(self):
        """Verify the agent returns proper twin structure."""
        from unittest.mock import patch
        
        mock_response = {
            "current_state": {"success_probability": 80, "risk_score": 20},
            "projected_state": {"success_probability": 70, "risk_level": "Medium", "risk_score": 30},
            "cascade": [{"step": "Test", "desc": "Test"}],
            "risk_factors": ["Test"],
            "recommendations": [{"action": "Test", "confidence": 100}],
            "success_probability": 70,
            "schedule_stability": 70,
            "capacity_impact": 10
        }
        self.mock_gemini.generate_structured.return_value = mock_response

        # Input data
        tasks = [
            {
                "title": "React Assignment",
                "deadline": "2026-06-25T18:00:00",
                "estimated_hours": 8,
                "completed_hours": 2,
                "priority_score": 92
            }
        ]
        
        scenario = {
            "action": "DELAY_TASK",
            "task_id": "1",
            "delay_days": 2
        }
        
        availability = {
            "daily_available_hours": 4
        }

        with patch("agents.digital_twin_agent.execute_hybrid", side_effect=lambda local, gemini, threshold: gemini()):
            result = self.agent.simulate_scenario(tasks, scenario, availability)

        self.assertIn("projected_state", result)
        self.assertEqual(result["projected_state"]["success_probability"], 70)
        self.assertIn("cascade", result)
        self.assertIn("recommendations", result)


if __name__ == "__main__":
    unittest.main()
