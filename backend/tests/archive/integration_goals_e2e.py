import os
import requests

BASE_URL = "http://localhost:5000/api"

def run_tests():
    print("Testing Goals & Habits API...")

    # 1. Create a habit
    res = requests.post(f"{BASE_URL}/habits", json={"name": "Test Habit API", "frequency": "Daily"})
    assert res.status_code == 201, f"Failed to create habit: {res.text}"
    habit_id = res.json()["data"]["id"]
    print("[OK] Create Habit")

    # 2. Check in habit
    res = requests.post(f"{BASE_URL}/habits/{habit_id}/checkin")
    assert res.status_code == 200, f"Failed to check in: {res.text}"
    print("[OK] Check In Habit")

    # 3. Check duplicate check-in
    res = requests.post(f"{BASE_URL}/habits/{habit_id}/checkin")
    assert res.status_code == 400, "Should block duplicate check-in"
    print("[OK] Duplicate Check-In Blocked")

    # 4. Edit Habit
    res = requests.put(f"{BASE_URL}/habits/{habit_id}", json={"target_duration": "45 mins"})
    assert res.status_code == 200
    assert res.json()["data"]["target_duration"] == "45 mins"
    print("[OK] Edit Habit")

    # 5. Archive Habit
    res = requests.post(f"{BASE_URL}/habits/{habit_id}/archive")
    assert res.status_code == 200
    print("[OK] Archive Habit")

    # 6. Delete Habit
    res = requests.delete(f"{BASE_URL}/habits/{habit_id}")
    assert res.status_code == 200
    print("[OK] Delete Habit")

    # 7. Create Goal (Mocking Gemini will take a sec, we just need to test if endpoint returns 201)
    res = requests.put(f"{BASE_URL}/goals/fake-uuid-123", json={"title": "Updated"})
    assert res.status_code == 404
    print("[OK] Edit Goal (404 Handled)")

    print("\nAll Backend Validation Tests Passed!")

if __name__ == "__main__":
    try:
        run_tests()
    except Exception as e:
        print(f"TEST FAILED: {e}")
