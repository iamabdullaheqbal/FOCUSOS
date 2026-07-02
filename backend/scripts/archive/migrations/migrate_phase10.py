import os
import uuid
from sqlalchemy import text
from app import create_app
from database.db import db
from models.user import User

app = create_app()

tables = [
    "tasks", "goals", "milestones", "habits", "habit_logs", 
    "schedules", "schedule_slots", "interventions", "threats",
    "rescue_plans", "system_snapshots", "rescue_executions",
    "notifications", "accountability_metrics", "coach_reports",
    "reflection_reports", "execution_profiles", "weekly_reviews",
    "agent_execution_logs", "twin_simulation_logs", "orchestrator_events"
]

def migrate():
    with app.app_context():
        print("Creating users table...")
        db.create_all() # This creates the `users` table if not exists
        
        # Create default user
        default_user_id = "test-user-id" # We'll use a fixed UUID for local mock, or we can just gen one
        
        user = User.query.filter_by(username="sujith").first()
        if not user:
            print("Creating default user 'sujith'...")
            user = User(id=default_user_id, username="sujith", email="sujith@example.com", full_name="Sujith")
            db.session.add(user)
            db.session.commit()
            print(f"Default user created with ID: {user.id}")
        else:
            default_user_id = user.id
            print(f"Default user already exists with ID: {default_user_id}")

        for table in tables:
            print(f"Migrating table {table}...")
            # Check if column exists
            try:
                # Use raw connection to execute DDL safely
                with db.engine.connect() as conn:
                    # 1. Add column if not exists
                    conn.execute(text(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS user_id VARCHAR(36)"))
                    
                    # 2. Update existing rows
                    conn.execute(text(f"UPDATE {table} SET user_id = :uid WHERE user_id IS NULL"), {"uid": default_user_id})
                    
                    # 3. Alter to NOT NULL
                    conn.execute(text(f"ALTER TABLE {table} ALTER COLUMN user_id SET NOT NULL"))
                    
                    # 4. Add foreign key if not exists (Postgres specific check)
                    fk_name = f"fk_{table}_user"
                    fk_check = conn.execute(text(f"SELECT 1 FROM pg_constraint WHERE conname = '{fk_name}'")).fetchone()
                    if not fk_check:
                        conn.execute(text(f"ALTER TABLE {table} ADD CONSTRAINT {fk_name} FOREIGN KEY (user_id) REFERENCES users(id)"))
                    
                    conn.commit()
            except Exception as e:
                print(f"Error migrating {table}: {e}")
        print("Migration complete!")

if __name__ == "__main__":
    migrate()
