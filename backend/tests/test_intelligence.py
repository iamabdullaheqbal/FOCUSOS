import os
import requests
import uuid
import time
from dotenv import load_dotenv

load_dotenv()
API_URL = "http://localhost:5000/api"
DEMO_EMAIL = os.environ.get("DEMO_USER_EMAIL")
DEMO_PASS = os.environ.get("DEMO_USER_PASSWORD")

# Get Demo Token
print("=== Intelligence Engine Audit ===")
res = requests.post(f"{API_URL}/demo/start", json={"email": DEMO_EMAIL, "password": DEMO_PASS})
if res.status_code == 200:
    token = res.json().get("token")
    headers = {"Authorization": f"Bearer {token}"}
else:
    print("❌ Failed to get Demo Token. Aborting.")
    exit(1)

def log_result(module, test_name, status, details=""):
    print(f"[{module}] {test_name}: {'[PASS]' if status else '[FAIL]'} {details}")
    return status

all_passed = True

# 1. Voice Intelligence
print("\n--- Testing Voice ---")
try:
    # Good intent
    res = requests.post(f"{API_URL}/voice/process", headers=headers, json={"transcript": "Create a task to buy groceries tomorrow"})
    log_result("VOICE", "Task Intent Extraction", res.status_code == 200 and res.json()["nlu"]["intent"] == "task_creation")

    # Unknown intent
    res = requests.post(f"{API_URL}/voice/process", headers=headers, json={"transcript": "What is the meaning of life the universe and everything?"})
    log_result("VOICE", "Unknown Intent Fallback", res.status_code == 200 and res.json()["nlu"]["intent"] == "unknown")

    # Empty transcript
    res = requests.post(f"{API_URL}/voice/process", headers=headers, json={"transcript": ""})
    log_result("VOICE", "Empty Transcript Handling", res.status_code in [400, 200], res.status_code)
except Exception as e:
    log_result("VOICE", "Exceptions", False, str(e))
    all_passed = False

# 2. Document Intelligence
print("\n--- Testing Document ---")
try:
    files = {'file': ('dummy.txt', b'Agenda:\n1. Buy groceries tomorrow\n2. Call Mom on Friday', 'text/plain')}
    res = requests.post(f"{API_URL}/documents/upload", headers=headers, files=files)
    if res.status_code == 200:
        data = res.json()
        log_result("DOCUMENT", "Valid Text Parsing", len(data.get("tasks", [])) > 0, f"Found {len(data.get('tasks', []))} tasks")
        log_result("DOCUMENT", "Confidence Scoring", data.get("confidence", 0) > 0)
    else:
        log_result("DOCUMENT", "Valid Text Parsing", False, res.status_code)
        all_passed = False

    # Corrupt binary file
    files = {'file': ('corrupt.pdf', b'NOT_A_PDF_STRING\0\1\2\3', 'application/pdf')}
    res = requests.post(f"{API_URL}/documents/upload", headers=headers, files=files)
    log_result("DOCUMENT", "Corrupt File Handling", res.status_code == 200, "Safely ignored")
except Exception as e:
    log_result("DOCUMENT", "Exceptions", False, str(e))
    all_passed = False

# 3. Vision Intelligence
print("\n--- Testing Vision ---")
try:
    # Small 1x1 black pixel (valid PNG but useless)
    pixel = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\rIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82'
    files = {'file': ('test.png', pixel, 'image/png')}
    res = requests.post(f"{API_URL}/vision/upload", headers=headers, files=files)
    if res.status_code == 200:
        data = res.json()
        log_result("VISION", "Preprocessing Limits & Fallback", data["agent"] == "vision", f"OCR Conf: {data.get('confidence')}")
    else:
        log_result("VISION", "Image Upload", False, res.status_code)
except Exception as e:
    log_result("VISION", "Exceptions", False, str(e))
    all_passed = False

print(f"\nFinal Result: {'[PASS] ALL PASSED' if all_passed else '[FAIL] FAILURES DETECTED'}")
