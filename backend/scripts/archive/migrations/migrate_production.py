import os
import sys

# Ensure backend is in python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app import create_app
from database.db import db
import logging

# Import all models to ensure they are registered
from models.task import Task
from models.schedule import Schedule, ScheduleSlot
from models.goal import Goal, Milestone
from models.intervention import Intervention, RescuePlan, RescueExecution
from models.telemetry import AgentExecutionLog, TwinSimulationLog, OrchestratorEvent
from models.intelligence import ExecutionProfile, WeeklyReview

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def run_production_migration():
    logger.info("Initializing production migration protocol...")
    app = create_app()
    with app.app_context():
        try:
            logger.info("Creating all missing tables...")
            db.create_all()
            logger.info("Database schema hardened successfully.")
            
            # Seed default ExecutionProfile if none exists
            if ExecutionProfile.query.count() == 0:
                profile = ExecutionProfile()
                db.session.add(profile)
                db.session.commit()
                logger.info("Seeded default ExecutionProfile.")
                
        except Exception as e:
            logger.error(f"Migration Failed: {e}")
            sys.exit(1)

if __name__ == "__main__":
    run_production_migration()
