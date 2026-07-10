"""Test orchestrator priority scoring directly to diagnose the crash."""
import sys, os, logging
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
logging.basicConfig(level=logging.DEBUG)

# Simulate what the endpoint does
from services.orchestrator import OrchestratorService
from services.mistral_service import MistralService
from dotenv import load_dotenv
load_dotenv()

ai_service = MistralService(
    api_key=os.environ["MISTRAL_API_KEY"],
    model=os.environ.get("MISTRAL_MODEL", "mistral-large-latest"),
    vision_model="pixtral-12b-latest",
    max_retries=1,
    retry_delay=0.5,
    timeout=5.0,   # short timeout for test
)

orchestrator = OrchestratorService(ai_service)

USER_ID = "61e81e62-4491-4858-b5ff-56801b23220e"

print("Running evaluate_system_state...")
try:
    result = orchestrator.evaluate_system_state(USER_ID)
    print("Result status:", result.get("status"))
    print("Failed stage:", result.get("failed_stage", "none"))
    print("Tasks evaluated:", result.get("tasks_evaluated"))
    print("Trace:", result.get("trace"))
except Exception as e:
    import traceback
    print("UNHANDLED CRASH:", type(e).__name__, e)
    traceback.print_exc()
