"""Test priority agent handles None description correctly."""
import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

class MockAI:
    def generate_structured(self, **kwargs):
        raise Exception("Should not reach Mistral")

from agents.priority_agent import PriorityAgent

agent = PriorityAgent(MockAI())

# Task WITH description
r1 = agent.analyze_task({"title": "Fix bug", "deadline": "2026-07-10T20:00:00+00:00", "description": "Fix the bug", "estimated_hours": 1.0}, 5)
assert r1["_inference_source"] == "local", f"Expected local, got: {r1}"
print("PASS: task with description ->", r1["priority_score"])

# Task with None description (this was crashing)
r2 = agent.analyze_task({"title": "Deploy backend", "deadline": "2026-07-11T10:00:00+00:00", "description": None, "estimated_hours": 2.0}, 5)
assert r2["_inference_source"] == "local", f"Expected local, got: {r2}"
print("PASS: task with None description ->", r2["priority_score"])

# Task with no description key at all
r3 = agent.analyze_task({"title": "Write tests", "deadline": "2026-07-12T10:00:00+00:00", "estimated_hours": 1.5}, 3)
assert r3["_inference_source"] == "local", f"Expected local, got: {r3}"
print("PASS: task with no description key ->", r3["priority_score"])

print("\nAll priority agent tests passed. No Mistral calls needed.")
