import os
import sys
import uuid
import random
from datetime import datetime, timezone, timedelta

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from database.db import db
from models.user import User
from models.goal import Goal, Milestone, Habit, HabitLog
from models.task import Task
from models.schedule import Schedule, ScheduleSlot
from models.intervention import Intervention
from models.intelligence import AccountabilityMetrics
from models.telemetry import TwinSimulationLog, AgentExecutionLog, OrchestratorEvent
from models.notification import Notification

def seed_demo_data():
    app = create_app()
    with app.app_context():
        email = "sujith@gmail.com"
        user = User.query.filter_by(email=email).first()
        
        if not user:
            print(f"Error: Target user {email} not found in database. Please log in once first.")
            return

        uid = user.id
        now = datetime.now(timezone.utc)
        print(f"Starting seed for demo user: {uid}")

        # 1. CLEANUP (Idempotency)
        Notification.query.filter_by(user_id=uid).delete()
        OrchestratorEvent.query.filter_by(user_id=uid).delete()
        AgentExecutionLog.query.filter_by(user_id=uid).delete()
        AccountabilityMetrics.query.filter_by(user_id=uid).delete()
        TwinSimulationLog.query.filter_by(user_id=uid).delete()
        Intervention.query.filter_by(user_id=uid).delete()
        ScheduleSlot.query.filter_by(user_id=uid).delete()
        Schedule.query.filter_by(user_id=uid).delete()
        HabitLog.query.filter_by(user_id=uid).delete()
        Habit.query.filter_by(user_id=uid).delete()
        Task.query.filter_by(user_id=uid).delete()
        Milestone.query.filter_by(user_id=uid).delete()
        Goal.query.filter_by(user_id=uid).delete()
        db.session.commit()
        print("Cleared existing demo data.")

        # 2. GOALS & MILESTONES
        goals_data = [
            {"title": "DeadlineOS V1 Launch", "prog": 85, "milestones": [("Design Architecture", True), ("Backend API", True), ("Frontend UI", True), ("Final Polish", False)]},
            {"title": "LinkedIn AI Content Series", "prog": 55, "milestones": [("Content Calendar", True), ("Write 5 Posts", True), ("Schedule Tools", False), ("Analytics Review", False)]},
            {"title": "Hackathon Preparation", "prog": 70, "milestones": [("Team Formation", True), ("Pitch Deck", True), ("Prototype Demo", False)]},
            {"title": "DSA Consistency", "prog": 40, "milestones": [("Arrays & Strings", True), ("Trees & Graphs", False), ("Dynamic Programming", False)]}
        ]
        
        goal_map = {}
        for gd in goals_data:
            g = Goal(
                user_id=uid, title=gd["title"], description=f"Demo goal for {gd['title']}", category="Career",
                target_date=(now + timedelta(days=30)).isoformat(), progress_percentage=gd["prog"],
                status="Active", health_score=random.randint(75, 95)
            )
            db.session.add(g)
            db.session.flush()
            goal_map[gd["title"]] = g.id
            
            for mt, m_done in gd["milestones"]:
                m = Milestone(user_id=uid, goal_id=g.id, title=mt, target_date=(now + timedelta(days=7)).isoformat())
                db.session.add(m)
                db.session.flush()
                # Create Task for milestone
                status = "done" if m_done else "pending"
                t = Task(user_id=uid, title=f"Milestone Task: {mt}", description="", deadline=now + timedelta(days=3),
                         estimated_hours=2.0, category="Project", status=status, source="manual", goal_id=g.id, milestone_id=m.id)
                db.session.add(t)

        # 3. HABITS
        habits_data = [
            ("Deep Work", "Productivity", 12),
            ("DSA Practice", "Learning", 7),
            ("Gym", "Health", 5),
            ("LinkedIn Writing", "Career", 3),
            ("Documentation", "Project", 1)
        ]
        for name, cat, streak in habits_data:
            h = Habit(user_id=uid, name=name, category=cat, frequency="daily", current_streak=streak, longest_streak=streak)
            db.session.add(h)
            db.session.flush()
            for i in range(streak):
                log_date = (now - timedelta(days=i)).strftime("%Y-%m-%d")
                db.session.add(HabitLog(user_id=uid, habit_id=h.id, date=log_date, completed=True))

        # 4. CALENDAR EVENTS & TASKS (30 days historical)
        for i in range(30):
            day_offset = 30 - i
            t_date = now - timedelta(days=day_offset)
            db.session.add(Task(user_id=uid, title=f"Daily Sync Day {i}", deadline=t_date, estimated_hours=1.0,
                                category="Work", status="done", source="manual"))
            if i % 3 == 0:
                db.session.add(Task(user_id=uid, title=f"Deep Work Sprint {i}", deadline=t_date, estimated_hours=3.0,
                                    category="Project", status="done", source="manual"))

        # 5. DOCUMENT / VISION INTELLIGENCE TASKS
        db.session.add(Task(user_id=uid, title="Read Processed System Architecture PDF", deadline=now + timedelta(days=2),
                            estimated_hours=1.5, category="Study", status="pending", source="document", source_file="System_Arch.pdf"))
        db.session.add(Task(user_id=uid, title="Implement API from Doc", deadline=now + timedelta(days=3),
                            estimated_hours=3.0, category="Work", status="pending", source="document", source_file="API_Specs.pdf"))
        db.session.add(Task(user_id=uid, title="Transcribe Whiteboard Brainstorming", deadline=now + timedelta(days=1),
                            estimated_hours=1.0, category="Project", status="pending", source="vision", source_file="whiteboard_session.jpg"))

        # 6. PLANNER SESSIONS (30 days of schedules)
        for i in range(30):
            target = (now - timedelta(days=i)).strftime("%Y-%m-%d")
            s = Schedule(user_id=uid, target_date=target, confidence_score=random.randint(70, 95),
                         sys_confidence=random.randint(75, 99), daily_summary=f"Optimized schedule for {target}",
                         strategy="Deep Work Blocks", available_hours=8, generated_by="gemini")
            db.session.add(s)
            db.session.flush()
            db.session.add(ScheduleSlot(user_id=uid, schedule_id=s.id, task_title="Morning Deep Work",
                                        start_time="09:00", end_time="11:00", focus_block=True))

        # 7. RESCUE EVENTS (Historical Interventions)
        intervention_scenarios = [
            ("rescue", "High", "Context Switch Overload", "Detected excessive context switching. Suggesting a 15min break.", {"action": "break", "duration": 15}),
            ("twin_forecast", "Critical", "Deadline Approaching", "Major deadline in 2 days but 60% of milestone incomplete. Recommended rescheduling non-essentials.", {"action": "reschedule"}),
            ("procrastination", "Medium", "Accountability Analytics", "You have delayed the 'DSA Practice' habit for 3 consecutive days. Time blocking suggested.", {"action": "block_time"}),
            ("calendar_overload", "High", "Orchestrator", "Schedule density is at 95% today. Burnout risk elevated. Consider dropping low-priority tasks.", {"action": "drop_tasks"}),
            ("accountability", "Low", "End of Week Review", "Momentum is slowing down slightly compared to last week. Let's regain focus.", {"action": "review"}),
            ("rescue", "Critical", "Continuous Work Session", "You've been working for 4 hours straight without a break. Cognitive fatigue imminent.", {"action": "mandatory_break"}),
            ("twin_forecast", "High", "Schedule Slippage", "Projected 35% chance of missing 'DeadlineOS V1 Launch' if velocity doesn't increase.", {"action": "increase_velocity"}),
        ]
        
        # Add 12 resolved historical interventions
        for i in range(1, 13):
            days_ago = i * 2 + random.randint(0, 1)
            t_type, sev, src, msg, act = random.choice(intervention_scenarios)
            db.session.add(Intervention(
                user_id=uid, type=t_type, severity=sev, priority_score=random.randint(60, 95),
                confidence_score=random.randint(75, 99), trigger_source=src, message=msg,
                recommended_action=act, resolved=True,
                created_at=now - timedelta(days=days_ago),
                resolved_at=now - timedelta(days=days_ago) + timedelta(hours=random.randint(1, 4))
            ))

        # Add 2 currently ACTIVE interventions for the dashboard
        active_scenarios = [
            ("calendar_overload", "Critical", "Real-Time Telemetry", "Today's schedule has 0 buffer time. One slip will cascade through the entire day. Please review.", {"action": "rebalance"}),
            ("procrastination", "Medium", "Digital Twin Forecast", "You are trending towards skipping your workout again today based on current trajectory.", {"action": "commit"})
        ]
        for idx, (t_type, sev, src, msg, act) in enumerate(active_scenarios):
            db.session.add(Intervention(
                user_id=uid, type=t_type, severity=sev, priority_score=random.randint(85, 99),
                confidence_score=random.randint(85, 99), trigger_source=src, message=msg,
                recommended_action=act, resolved=False,
                created_at=now - timedelta(hours=idx * 3 + 1)
            ))
        sims = ["Delay task", "Increase deep work", "Miss one day", "Extend deadline", "Complete milestone early"]
        for i in range(15):
            s = random.choice(sims)
            db.session.add(TwinSimulationLog(user_id=uid, scenario_type=s,
                                             scenario_payload={"action": s},
                                             simulation_result={"outcome": f"Simulated outcome if you {s.lower()}."},
                                             capacity_impact=random.randint(-15, 20),
                                             created_at=now - timedelta(days=i * 2)))

        # 9. ANALYTICS (30-day realistic progressive trend)
        base_completion = 48.0
        base_consistency = 52.0
        base_prod = 50.0

        for i in range(30):
            day_offset = 30 - i
            
            # Trend upward with ±4% noise
            comp = base_completion + (i * 1.5) + random.uniform(-4, 4)
            cons = base_consistency + (i * 1.2) + random.uniform(-4, 4)
            prod = base_prod + (i * 1.4) + random.uniform(-4, 4)
            
            # Bound values between 0 and 100
            comp = min(100.0, max(0.0, comp))
            cons = min(100.0, max(0.0, cons))
            prod = min(100.0, max(0.0, prod))
            
            procrastination = max(5.0, 30.0 - (i * 0.8) + random.uniform(-3, 3))
            
            findings = ["Burnout Risk Elevated", "High Context Switching"] if i < 15 else ["Consistent Output", "Deep Work Optimized"]
            
            db.session.add(AccountabilityMetrics(
                user_id=uid, 
                completion_rate=comp, 
                consistency_score=cons,
                procrastination_score=procrastination, 
                productivity_score=prod, 
                risk_profile="Low" if i >= 15 else "High",
                key_findings=findings,
                created_at=now - timedelta(days=day_offset)
            ))

        # 10. AI ACTIVITY TIMELINE & COMMAND CENTER (Agent Execution Logs - 60 over 30 days)
        agents = ["Planning Agent", "Vision Agent", "Digital Twin Agent", "Rescue Agent", "Orchestrator"]
        actions = ["Generated optimal schedule", "Extracted text from image", "Forecasted schedule delay", "Detected high cognitive load", "Dispatched tasks successfully"]
        for i in range(60):
            agent = random.choice(agents)
            action_desc = random.choice(actions)
            t = now - timedelta(hours=i * 12)
            db.session.add(AgentExecutionLog(user_id=uid, agent_name=agent, action=action_desc,
                                             execution_time_ms=random.randint(800, 2500), confidence=random.randint(85, 99),
                                             status="success", created_at=t))
            db.session.add(OrchestratorEvent(user_id=uid, agent=agent, action=action_desc, status="success",
                                             timestamp=t))

        # 11. NOTIFICATIONS
        notifs = [
            ("Goal Completed", "You finished the DSA Goal!"),
            ("Milestone Completed", "Frontend UI milestone checked off."),
            ("Rescue Alert", "Context switching overload detected."),
            ("Schedule Optimized", "Your calendar for today has been rebuilt."),
            ("Habit Streak", "12 days of Deep Work! Keep it up."),
            ("AI Insight", "You work 30% faster in the mornings."),
            ("Calendar Reminder", "Team Sync in 15 mins."),
            ("Weekly Summary", "You completed 25 tasks this week.")
        ]
        for idx, (title, msg) in enumerate(notifs):
            db.session.add(Notification(user_id=uid, title=title, description=msg, module="system",
                                        read=idx > 3, created_at=now - timedelta(hours=idx*5)))

        db.session.commit()
        print("Demo seed data successfully generated!")

if __name__ == "__main__":
    seed_demo_data()
