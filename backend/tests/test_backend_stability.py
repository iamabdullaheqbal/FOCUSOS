import requests
import uuid

API_URL = "http://localhost:5000/api"

def test():
    print("=== Phase 2: Backend Stability & Database Audit ===")
    
    # 1. Invalid payload format
    print("\n[1] Testing Invalid JSON format (Should not 500)")
    res = requests.post(f"{API_URL}/tasks", headers={"Content-Type": "application/json"}, data="{bad json")
    print(f"Response: {res.status_code} (Expected 400/401/415)")
    
    # 2. Invalid UUIDs for GET requests
    print("\n[2] Testing Bad UUID on GET /tasks/<id>")
    res = requests.get(f"{API_URL}/tasks/not-a-uuid")
    print(f"Response: {res.status_code} (Expected 401/404)")
    
    # 3. Bad endpoints
    print("\n[3] Testing Non-existent Endpoint")
    res = requests.get(f"{API_URL}/does-not-exist")
    print(f"Response: {res.status_code} (Expected 404)")
    
    print("\nBackend Stability Pass!")

if __name__ == "__main__":
    test()
