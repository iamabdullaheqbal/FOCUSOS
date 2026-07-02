import os
from io import BytesIO
import time
from app import create_app
from database.db import db
from models.task import Task
from models.telemetry import AgentExecutionLog
from PIL import Image, ImageDraw, ImageFont

app = create_app()

def make_test_image(text, filename, noise=False):
    img = Image.new('RGB', (800, 600), color=(255, 255, 255))
    d = ImageDraw.Draw(img)
    # Simple clear text
    if not noise:
        d.text((50, 50), text, fill=(0, 0, 0))
    else:
        # Messy handwriting simulation (low confidence)
        d.text((50, 50), text, fill=(100, 100, 100))
        for i in range(100):
            d.line([(i*10, 0), (i*10, 600)], fill=(200, 200, 200), width=2)
    img.save(filename)
    return filename

def run_tests():
    print("========================================")
    print("HYBRID VISION PIPELINE VALIDATION")
    print("========================================")
    
    with app.test_client() as client:
        with app.app_context():
            visions = [
                ("screenshot.png", "- Typed Task 1\n- Typed Task 2\n- Review budget by Next Tuesday", False),
                ("agenda.png", "Meeting Agenda\n* Discuss Q3 Goals by Tomorrow 2 PM\n* Assign tickets to team", False),
            ]
            
            for fname, text, noise in visions:
                make_test_image(text, fname, noise=noise)
                
                print(f"\nTesting Upload Phase: {fname}")
                with open(fname, 'rb') as f:
                    data = {'image': (f, fname)}
                    res = client.post('/api/agents/vision', data=data, content_type='multipart/form-data')
                
                os.remove(fname)
                
                if res.status_code == 200:
                    resp_data = res.get_json()
                    raw_text = resp_data.get("raw_text", "")
                    parsed = resp_data.get("parsed_preview", {})
                    tasks = parsed.get("tasks", [])
                    print(f"SUCCESS (Upload): Extracted raw text. Confidence: {resp_data.get('confidence')}")
                    
                    print(f"Testing Confirm Phase for: {fname}")
                    confirm_payload = {
                        "raw_text": raw_text,
                        "confirmed_tasks": tasks
                    }
                    res_confirm = client.post('/api/agents/vision/confirm', json=confirm_payload)
                    
                    if res_confirm.status_code == 200:
                        conf_data = res_confirm.get_json()
                        print(f"SUCCESS (Confirm): Persisted {len(conf_data.get('inserted_task_ids', []))} tasks.")
                    else:
                        print(f"FAIL (Confirm): Returned {res_confirm.status_code}.")
                else:
                    print(f"FAIL (Upload): Returned {res.status_code}.")

            print("\n--- ANALYTICS & TELEMETRY CHECK ---")
            res = client.get('/api/analytics/vision')
            if res.status_code == 200:
                data = res.get_json().get("data", {})
                print(f"OCR Processed Images: {data.get('ocr_processed_images', 0)}")
                print(f"Gemini Processed Images: {data.get('gemini_processed_images', 0)}")
                print(f"OCR Fallback Rate: {data.get('ocr_fallback_rate')}%")
            else:
                print("Failed to get analytics.")

if __name__ == "__main__":
    run_tests()
