"""
FocusOS — Demo Data Seeder
===========================
Populates the database with realistic demo data for a specific user.

Usage:
    python -m scripts.seed_demo --email your@email.com
"""

import asyncio
import os
import random
import sys
import uuid
from datetime import datetime, timezone, timedelta

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))


async def seed_demo_data(email: str = "demo@focusos.local") -> None:
    from database.init_db import init_db
    from database.db import AsyncSessionLocal
    from models import (
        User, Goal, Milestone, Habit, HabitLog, Task,
        Schedule, ScheduleSlot, Intervention, Notification,
    )
    from models.intelligence import AccountabilityMetrics
    from models.telemetry import TwinSimulationLog, AgentExecutionLog, OrchestratorEvent
    from sqlalchemy import select, delete

    # Ensure tables exist
    await init_db()

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if not user:
            print(f"User {email!r} not found. Creating…")
            user = User(id=str(uuid.uuid4()), email=email,
                        full_name="Demo User", username="demo_user")
            db.add(user)
            await db.commit()
            await db.refresh(user)

        uid = user.id
        now = datetime.now(timezone.utc)
        print(f"Seeding demo data for user: {uid}")

        # ── 1. Cleanup ─────────────────────────────────────────────────────────
        for Model in (Notification, OrchestratorEvent, AgentExecutionLog,
                      AccountabilityMetrics, TwinSimulationLog, Intervention,
                      ScheduleSlot, Schedule, HabitLog, Habit, Task, Milestone, Goal):
            await db.execute(delete(Model).where(Model.user_id == uid))
        await db.commit()
        print("Cleared existing demo data.")

        # ── 2. Goals & Milestones ──────────────────────────────────────────────
        goals_data = [
            {"title": "FocusOS V1 Launch",      "prog": 85,
             "milestones": [("Design Architecture", True), ("Backend API", True),
                             ("Frontend UI", True), ("Final Polish", False)]},
            {"title": "LinkedIn AI Content",     "prog": 55,
             "milestones": [("Content Calendar", True), ("Write 5 Posts", True),
                             ("Schedule Tools", False), ("Analytics Review", False)]},
            {"title": "Hackathon Preparation",   "prog": 70,
             "milestones": [("Team Formation", True), ("Pitch Deck", True),
                             ("Prototype Demo", False)]},
            {"title": "DSA Consistency",         "prog": 40,
             "milestones": [("Arrays & Strings", True), ("Trees & Graphs", False),
                             ("Dynamic Programming", False)]},
        ]
        for gd in goals_data:
            g = Goal(id=str(uuid.uuid4()), user_id=uid, title=gd["title"],
                     description=f"Demo goal: {gd['title']}", category="Career",
                     target_date=(now + timedelta(days=30)).strftime("%Y-%m-%d"),
                     progress_percentage=gd["prog"], status="Active",
                     health_score=random.randint(75, 95))
            db.add(g)
            await db.flush()
            for mt, done in gd["milestones"]:
                m = Milestone(id=str(uuid.uuid4()), user_id=uid, goal_id=g.id, title=mt,
                              target_date=(now + timedelta(days=7)).strftime("%Y-%m-%d"))
                db.add(m)
                await db.flush()
                db.add(Task(id=str(uuid.uuid4()), user_id=uid, title=f"Milestone: {mt}",
                            deadline=now + timedelta(days=3), estimated_hours=2.0,
                            category="Project", status="done" if done else "pending",
                            source="manual", goal_id=g.id, milestone_id=m.id))

        # ── 3. Habits ──────────────────────────────────────────────────────────
        habits_data = [("Deep Work", "Productivity", 12), ("DSA Practice", "Learning", 7),
                       ("Gym", "Health", 5), ("LinkedIn Writing", "Career", 3),
                       ("Documentation", "Project", 1)]
        for name, cat, streak in habits_data:
            h = Habit(id=str(uuid.uuid4()), user_id=uid, name=name, category=cat,
                      frequency="Daily", current_streak=streak, longest_streak=streak)
            db.add(h)
            await db.flush()
            for i in range(streak):
                db.add(HabitLog(id=str(uuid.uuid4()), user_id=uid, habit_id=h.id,
                                date=(now - timedelta(days=i)).strftime("%Y-%m-%d"),
                                completed=True))

        # ── 4. Historical tasks (30 days) ──────────────────────────────────────
        for i in range(30):
            t_date = now - timedelta(days=30 - i)
            db.add(Task(id=str(uuid.uuid4()), user_id=uid, title=f"Daily Sync Day {i}",
                        deadline=t_date, estimated_hours=1.0, category="Work",
                        status="done", source="manual"))
            if i % 3 == 0:
                db.add(Task(id=str(uuid.uuid4()), user_id=uid,
                            title=f"Deep Work Sprint {i}", deadline=t_date,
                            estimated_hours=3.0, category="Project",
                            status="done", source="manual"))

        # ── 5. Document / Vision tasks ─────────────────────────────────────────
        for title, src, fname, days in [
            ("Read Processed System Architecture PDF", "document", "System_Arch.pdf", 2),
            ("Implement API from Doc",                 "document", "API_Specs.pdf",   3),
            ("Transcribe Whiteboard Brainstorming",    "vision",   "whiteboard.jpg",  1),
        ]:
            db.add(Task(id=str(uuid.uuid4()), user_id=uid, title=title,
                        deadline=now + timedelta(days=days), estimated_hours=1.5,
                        category="Study", status="pending", source=src, source_file=fname))

        # ── 6. Schedules (30 days) ─────────────────────────────────────────────
        for i in range(30):
            target = (now - timedelta(days=i)).strftime("%Y-%m-%d")
            s = Schedule(id=str(uuid.uuid4()), user_id=uid, target_date=target,
                         confidence_score=random.randint(70, 95),
                         sys_confidence=random.randint(75, 99),
                         daily_summary=f"Optimised schedule for {target}",
                         strategy="Deep Work Blocks", available_hours=8,
                         generated_by="mistral", planning_brief="[]",
                         twin_simulation="null", backlog="[]")
            db.add(s)
            await db.flush()
            db.add(ScheduleSlot(id=str(uuid.uuid4()), user_id=uid, schedule_id=s.id,
                                task_title="Morning Deep Work",
                                start_time="09:00", end_time="11:00", focus_block=True))

        # ── 7. Interventions ───────────────────────────────────────────────────
        scenarios = [
            ("rescue",          "High",     "Real-Time Telemetry",     "Context switch overload. Take a break.", {"action": "break"}),
            ("twin_forecast",   "Critical", "Digital Twin",            "Major deadline approaching. Reschedule non-essentials.", {"action": "reschedule"}),
            ("procrastination", "Medium",   "Accountability Analytics","DSA habit delayed 3 days. Time block suggested.", {"action": "block_time"}),
            ("calendar_overload","High",    "Orchestrator",            "Schedule at 95% density. Burnout risk high.", {"action": "drop_tasks"}),
            ("accountability",  "Low",      "End of Week Review",      "Momentum slowing. Refocus.", {"action": "review"}),
        ]
        for i in range(1, 13):
            t_type, sev, src, msg, act = random.choice(scenarios)
            days_ago = i * 2 + random.randint(0, 1)
            db.add(Intervention(id=str(uuid.uuid4()), user_id=uid, type=t_type, severity=sev,
                                priority_score=random.randint(60, 95),
                                confidence_score=random.randint(75, 99),
                                trigger_source=src, message=msg,
                                recommended_action=act, resolved=True,
                                created_at=now - timedelta(days=days_ago),
                                resolved_at=now - timedelta(days=days_ago) + timedelta(hours=2)))
        for i, (t_type, sev, src, msg, act) in enumerate([
            ("calendar_overload", "Critical", "Real-Time Telemetry", "Zero buffer today. One slip cascades.", {"action": "rebalance"}),
            ("procrastination",   "Medium",   "Digital Twin Forecast","Trending towards skipping workout again.", {"action": "commit"}),
        ]):
            db.add(Intervention(id=str(uuid.uuid4()), user_id=uid, type=t_type, severity=sev,
                                priority_score=random.randint(85, 99),
                                confidence_score=random.randint(85, 99),
                                trigger_source=src, message=msg,
                                recommended_action=act, resolved=False,
                                created_at=now - timedelta(hours=i * 3 + 1)))

        # ── 8. Twin simulation logs ─────────────────────────────────────────────
        for i in range(15):
            scenario = random.choice(["Delay task", "Increase deep work", "Miss one day", "Complete early"])
            db.add(TwinSimulationLog(id=str(uuid.uuid4()), user_id=uid, scenario_type=scenario,
                                     scenario_payload={"action": scenario},
                                     simulation_result={"outcome": f"Simulated: {scenario}"},
                                     capacity_impact=random.randint(-15, 20),
                                     created_at=now - timedelta(days=i * 2)))

        # ── 9. Analytics metrics (30-day trend) ───────────────────────────────
        for i in range(30):
            db.add(AccountabilityMetrics(id=str(uuid.uuid4()), user_id=uid,
                completion_rate  =min(100, max(0, 48 + i * 1.5 + random.uniform(-4, 4))),
                consistency_score=min(100, max(0, 52 + i * 1.2 + random.uniform(-4, 4))),
                procrastination_score=max(5, 30 - i * 0.8 + random.uniform(-3, 3)),
                productivity_score=min(100, max(0, 50 + i * 1.4 + random.uniform(-4, 4))),
                risk_profile="Low" if i >= 15 else "High",
                key_findings=["Consistent Output"] if i >= 15 else ["Burnout Risk Elevated"],
                recommendations=["Keep up the pace."] if i >= 15 else ["Take breaks."],
                created_at=now - timedelta(days=30 - i)))

        # ── 10. Agent logs & orchestrator events ──────────────────────────────
        agents  = ["Planning Agent", "Vision Agent", "Digital Twin Agent", "Rescue Agent", "Orchestrator"]
        actions = ["Generated optimal schedule", "Extracted text from image",
                   "Forecasted schedule delay", "Detected high cognitive load",
                   "Dispatched tasks successfully"]
        for i in range(60):
            agent  = random.choice(agents)
            action = random.choice(actions)
            ts     = now - timedelta(hours=i * 12)
            db.add(AgentExecutionLog(id=str(uuid.uuid4()), user_id=uid, agent_name=agent,
                                     action=action, execution_time_ms=random.randint(800, 2500),
                                     confidence=random.randint(85, 99), status="success",
                                     created_at=ts))
            db.add(OrchestratorEvent(id=str(uuid.uuid4()), user_id=uid, agent=agent,
                                     action=action, status="success", timestamp=ts))

        # ── 11. Notifications ─────────────────────────────────────────────────
        notifs = [
            ("Goal Completed",    "You finished the DSA Goal!"),
            ("Milestone Done",    "Frontend UI milestone checked off."),
            ("Rescue Alert",      "Context switching overload detected."),
            ("Schedule Optimised","Your calendar for today has been rebuilt."),
            ("Habit Streak",      "12 days of Deep Work! Keep it up."),
            ("AI Insight",        "You work 30% faster in the mornings."),
            ("Calendar Reminder", "Team Sync in 15 mins."),
            ("Weekly Summary",    "You completed 25 tasks this week."),
        ]
        for idx, (title, msg) in enumerate(notifs):
            db.add(Notification(id=str(uuid.uuid4()), user_id=uid, title=title,
                                description=msg, module="system",
                                read=idx > 3,
                                created_at=now - timedelta(hours=idx * 5)))

        await db.commit()
        print("✅  Demo seed data generated successfully!")


if __name__ == "__main__":
    target_email = "demo@focusos.local"
    for arg in sys.argv[1:]:
        if arg.startswith("--email="):
            target_email = arg.split("=", 1)[1]
    asyncio.run(seed_demo_data(target_email))
