"""
FocusOS — Presentation Seed Script
=====================================
Seeds rich, realistic demo data for Abdullah's account so every
frontend page looks fully populated during the teacher presentation.

Usage:
    cd backend
    python -m scripts.seed_presentation
"""

import asyncio
import os
import random
import sys
import uuid
from datetime import datetime, timezone, timedelta

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

TARGET_EMAIL = "abdullaheqbalhere@gmail.com"


async def seed() -> None:
    from database.init_db import init_db
    from database.db import AsyncSessionLocal
    from models.user import User
    from models.goal import Goal, Milestone, Habit, HabitLog
    from models.task import Task
    from models.schedule import Schedule, ScheduleSlot
    from models.intervention import Intervention, Threat, RescuePlan
    from models.notification import Notification
    from models.calendar_event import CalendarEvent
    from models.intelligence import AccountabilityMetrics
    from models.telemetry import TwinSimulationLog, AgentExecutionLog, OrchestratorEvent
    from sqlalchemy import select, delete

    await init_db()

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.email == TARGET_EMAIL))
        user = result.scalar_one_or_none()
        if not user:
            print(f"User {TARGET_EMAIL!r} not found. Aborting.")
            return

        uid = user.id
        now = datetime.now(timezone.utc)
        today = now.date()
        print(f"Seeding presentation data for: {user.full_name} ({uid})")

        # ── CLEANUP ────────────────────────────────────────────────────────────
        for Model in (Notification, OrchestratorEvent, AgentExecutionLog,
                      AccountabilityMetrics, TwinSimulationLog,
                      RescuePlan, Threat, Intervention,
                      ScheduleSlot, Schedule, CalendarEvent,
                      HabitLog, Habit, Task, Milestone, Goal):
            await db.execute(delete(Model).where(Model.user_id == uid))
        await db.commit()
        print("Cleared existing data.")

        # ── 1. GOALS & MILESTONES ──────────────────────────────────────────────
        goals_data = [
            {
                "title": "FocusOS AI Platform — V1 Launch",
                "desc": "Build and launch the complete FocusOS productivity OS with AI agents.",
                "prog": 82, "cat": "Project", "priority": "High", "health": 88,
                "days": 14,
                "milestones": [
                    ("System Architecture Design", True, "done"),
                    ("Backend API Development",    True, "done"),
                    ("AI Agent Integration",       True, "done"),
                    ("Frontend Dashboard",         True, "done"),
                    ("Testing & QA",               False, "in_progress"),
                    ("Production Deployment",      False, "NOT_STARTED"),
                ],
            },
            {
                "title": "DSA Mastery — LeetCode 150",
                "desc": "Solve 150 curated DSA problems to crack FAANG interviews.",
                "prog": 54, "cat": "Learning", "priority": "High", "health": 72,
                "days": 45,
                "milestones": [
                    ("Arrays & Hashing (20/20)",    True, "done"),
                    ("Two Pointers & Sliding Window",True, "done"),
                    ("Binary Search & Trees",        False, "in_progress"),
                    ("Graphs & BFS/DFS",             False, "NOT_STARTED"),
                    ("Dynamic Programming",          False, "NOT_STARTED"),
                ],
            },
            {
                "title": "Personal Brand on LinkedIn",
                "desc": "Grow LinkedIn presence to 2K followers posting AI/tech content.",
                "prog": 38, "cat": "Career", "priority": "Medium", "health": 65,
                "days": 60,
                "milestones": [
                    ("Content Strategy Document", True, "done"),
                    ("First 10 Posts Published",  True, "done"),
                    ("Reach 500 Followers",        False, "in_progress"),
                    ("Reach 1K Followers",         False, "NOT_STARTED"),
                    ("Reach 2K Followers",         False, "NOT_STARTED"),
                ],
            },
            {
                "title": "Final Year Project Thesis",
                "desc": "Complete and submit the FYP thesis with full documentation.",
                "prog": 65, "cat": "Academic", "priority": "High", "health": 80,
                "days": 30,
                "milestones": [
                    ("Literature Review",      True, "done"),
                    ("Methodology Chapter",    True, "done"),
                    ("Implementation Chapter", False, "in_progress"),
                    ("Results & Analysis",     False, "NOT_STARTED"),
                    ("Final Submission",       False, "NOT_STARTED"),
                ],
            },
        ]

        goal_ids = []
        for gd in goals_data:
            g = Goal(
                id=str(uuid.uuid4()), user_id=uid,
                title=gd["title"], description=gd["desc"],
                category=gd["cat"], priority=gd["priority"],
                target_date=(today + timedelta(days=gd["days"])).isoformat(),
                progress_percentage=gd["prog"], health_score=gd["health"],
                status="Active", success_score=gd["prog"],
                pinned=(gd["priority"] == "High"),
            )
            db.add(g)
            await db.flush()
            goal_ids.append(g.id)
            for mt, done, mstatus in gd["milestones"]:
                m = Milestone(
                    id=str(uuid.uuid4()), user_id=uid, goal_id=g.id,
                    title=mt, status=mstatus, completed=done,
                    target_date=(today + timedelta(days=7)).isoformat(),
                    completed_at=(now - timedelta(days=random.randint(1, 10))) if done else None,
                )
                db.add(m)
                await db.flush()
                # Attach tasks to milestones
                db.add(Task(
                    id=str(uuid.uuid4()), user_id=uid,
                    title=f"{mt}",
                    description=f"Complete: {mt} for goal '{gd['title']}'",
                    deadline=now + timedelta(days=random.randint(1, gd["days"])),
                    estimated_hours=random.choice([1.5, 2.0, 2.5, 3.0]),
                    category=gd["cat"], status="done" if done else "pending",
                    source="manual", goal_id=g.id, milestone_id=m.id,
                    priority_score=random.randint(70, 95),
                    ai_confidence=random.randint(88, 98),
                ))
        await db.commit()
        print("Goals, milestones & milestone tasks created.")

        # ── 2. ACTIVE TASKS (today + this week) ───────────────────────────────
        active_tasks = [
            # Today — urgent
            ("Fix AvailabilityService DB query bug",         "Project",  "in_progress", 0,  1.0,  95, 92),
            ("Prepare FocusOS demo walkthrough script",      "Project",  "pending",      0,  1.5,  90, 95),
            ("Review AI agent integration test results",     "Project",  "pending",      1,  2.0,  85, 88),
            # This week
            ("Implement Digital Twin scenario editor UI",    "Project",  "pending",      1,  3.0,  88, 91),
            ("Write 3 LeetCode tree problems",               "Learning", "pending",      1,  1.5,  80, 85),
            ("Draft LinkedIn post: AI agents in productivity","Career",  "pending",      2,  1.0,  75, 82),
            ("FYP implementation chapter — section 3.2",     "Academic", "pending",      2,  2.5,  92, 94),
            ("Code review: voice copilot agent module",      "Project",  "pending",      3,  1.5,  85, 89),
            ("Solve 5 binary search problems on LeetCode",   "Learning", "pending",      3,  1.0,  78, 83),
            ("Update project README and API docs",           "Project",  "pending",      4,  1.0,  70, 80),
            ("Gym session — upper body",                     "Health",   "pending",      4,  1.0,  65, 75),
            ("FYP results chapter draft",                    "Academic", "pending",      5,  3.0,  90, 93),
            ("Schedule meeting with FYP supervisor",         "Academic", "pending",      5,  0.5,  88, 90),
            ("Deploy backend to staging environment",        "Project",  "pending",      6,  2.0,  92, 96),
            ("Write unit tests for planning agent",          "Project",  "pending",      7,  2.0,  85, 88),
        ]
        for title, cat, status, days_due, est_hrs, priority, confidence in active_tasks:
            db.add(Task(
                id=str(uuid.uuid4()), user_id=uid, title=title,
                deadline=now + timedelta(days=days_due, hours=random.randint(0, 8)),
                estimated_hours=est_hrs, category=cat, status=status,
                source="manual", priority_score=priority, ai_confidence=confidence,
                goal_id=random.choice(goal_ids),
            ))

        # ── 3. COMPLETED TASKS — 30-day history ───────────────────────────────
        completed_pool = [
            "Morning deep work sprint", "Backend API endpoint implementation",
            "LeetCode problem solved", "LinkedIn post drafted", "Code review completed",
            "Team standup notes", "FYP research reading", "Database schema migration",
            "Unit test suite update", "Documentation updated", "Bug fix deployed",
            "AI model prompt tuning", "Frontend component built", "API integration tested",
            "Planning session", "Weekly review & reflection",
        ]
        for i in range(40):
            t_date = now - timedelta(days=random.randint(1, 30))
            db.add(Task(
                id=str(uuid.uuid4()), user_id=uid,
                title=random.choice(completed_pool),
                deadline=t_date + timedelta(hours=2),
                estimated_hours=random.choice([0.5, 1.0, 1.5, 2.0, 2.5, 3.0]),
                actual_hours=random.choice([0.5, 1.0, 1.5, 2.0, 2.5, 3.0]),
                category=random.choice(["Project", "Learning", "Academic", "Career", "Health"]),
                status="done", source="manual",
                priority_score=random.randint(60, 90),
                ai_confidence=random.randint(80, 98),
                goal_id=random.choice(goal_ids),
            ))

        await db.commit()
        print("Tasks created.")

        # ── 4. HABITS ──────────────────────────────────────────────────────────
        habits_data = [
            ("Deep Work Block",    "Productivity", 14, 92),
            ("LeetCode Daily",     "Learning",      9, 85),
            ("Gym / Exercise",     "Health",        5, 70),
            ("LinkedIn Post",      "Career",        3, 60),
            ("FYP Writing",        "Academic",      7, 78),
            ("Morning Planning",   "Productivity", 21, 95),
            ("Evening Reflection", "Productivity", 11, 88),
        ]
        for name, cat, streak, comp_rate in habits_data:
            h = Habit(
                id=str(uuid.uuid4()), user_id=uid, name=name, category=cat,
                frequency="Daily", current_streak=streak, longest_streak=max(streak, streak + random.randint(0, 5)),
                completion_rate=comp_rate, momentum_score=comp_rate,
                status="Active", last_checkin_date=today.isoformat(),
            )
            db.add(h)
            await db.flush()
            for i in range(streak):
                db.add(HabitLog(
                    id=str(uuid.uuid4()), user_id=uid, habit_id=h.id,
                    date=(today - timedelta(days=i)).isoformat(), completed=True,
                ))
            # A few skipped days before the streak for realistic history
            for i in range(streak, streak + 5):
                db.add(HabitLog(
                    id=str(uuid.uuid4()), user_id=uid, habit_id=h.id,
                    date=(today - timedelta(days=i)).isoformat(),
                    completed=random.choice([True, False]),
                ))

        await db.commit()
        print("Habits created.")

        # ── 5. TODAY'S SCHEDULE — rich planner view ───────────────────────────
        today_str = today.isoformat()
        s = Schedule(
            id=str(uuid.uuid4()), user_id=uid, target_date=today_str,
            confidence_score=91, sys_confidence=94,
            daily_summary=(
                "High-focus day ahead. Deep work blocks locked in for FocusOS demo prep "
                "and FYP writing. Afternoon reserved for LeetCode + LinkedIn. "
                "Buffer slots added to absorb interruptions."
            ),
            strategy="Deep Work Blocks",
            available_hours=8, generated_by="mistral",
            planning_brief='[]', twin_simulation='null', backlog='[]',
        )
        db.add(s)
        await db.flush()

        today_slots = [
            ("07:00", "07:30", "Morning Planning & Review",     False, True),
            ("07:30", "08:00", "Inbox Zero + Priority Triage",  False, False),
            ("08:00", "10:00", "Deep Work: FocusOS Demo Prep",  True,  False),
            ("10:00", "10:15", "Break",                         False, True),
            ("10:15", "12:15", "Deep Work: FYP Impl. Ch. 3.2", True,  False),
            ("12:15", "13:00", "Lunch Break",                   False, True),
            ("13:00", "14:30", "LeetCode — Binary Search x3",   True,  False),
            ("14:30", "15:30", "Code Review: Voice Copilot",    False, False),
            ("15:30", "15:45", "Short Break",                   False, True),
            ("15:45", "16:45", "LinkedIn Post Draft",           False, False),
            ("16:45", "17:30", "Evening Reflection + Planning", False, False),
        ]
        for start, end, title, focus, is_break in today_slots:
            db.add(ScheduleSlot(
                id=str(uuid.uuid4()), user_id=uid, schedule_id=s.id,
                task_title=title, start_time=start, end_time=end,
                focus_block=focus, is_break=is_break,
            ))

        # ── Past 29 days of schedules (for analytics/history) ─────────────────
        for i in range(1, 30):
            past_date = (today - timedelta(days=i)).isoformat()
            ps = Schedule(
                id=str(uuid.uuid4()), user_id=uid, target_date=past_date,
                confidence_score=random.randint(78, 96),
                sys_confidence=random.randint(80, 98),
                daily_summary=f"AI-optimised schedule for {past_date}.",
                strategy=random.choice(["Deep Work Blocks", "Time Boxing", "Energy-Based"]),
                available_hours=8, generated_by="mistral",
                planning_brief='[]', twin_simulation='null', backlog='[]',
            )
            db.add(ps)
            await db.flush()
            for start, end, title, focus, is_break in random.sample(today_slots, k=random.randint(4, 7)):
                db.add(ScheduleSlot(
                    id=str(uuid.uuid4()), user_id=uid, schedule_id=ps.id,
                    task_title=title, start_time=start, end_time=end,
                    focus_block=focus, is_break=is_break,
                ))

        await db.commit()
        print("Schedules created.")

        # ── 6. CALENDAR EVENTS ────────────────────────────────────────────────
        calendar_events = [
            # Today
            ("FYP Supervisor Meeting",   "Progress update on implementation chapter.", "meeting",    0,  9,  10),
            ("FocusOS Team Sync",        "Demo walkthrough and final QA checklist.",   "meeting",    0, 14,  15),
            ("Deep Work Block",          "No interruptions — FocusOS demo prep.",      "focus_block",0, 8,  10),
            # This week
            ("LeetCode Study Session",   "Binary search & tree problems.",             "appointment",1, 13,  14, 30),
            ("GitHub Review Session",    "Code review with team.",                     "meeting",    2, 11,  12),
            ("LinkedIn Content Shoot",   "Record short-form video for LinkedIn.",      "appointment",3, 16,  17),
            ("FYP Mock Presentation",    "Practice run of final year project demo.",   "meeting",    4, 10,  12),
            # Next week
            ("Final Submission Deadline","FYP thesis due date.",                       "reminder",   7,  9,   9, 30),
            ("FocusOS Launch Demo",      "Live demo to professor and classmates.",     "meeting",    7, 14,  16),
            ("Weekly Reflection",        "Review weekly OKRs and plan next week.",     "appointment",6, 17,  18),
        ]
        for ev in calendar_events:
            title, desc, etype = ev[0], ev[1], ev[2]
            days_offset, start_h, end_h = ev[3], ev[4], ev[5]
            start_m = ev[6] if len(ev) > 6 else 0
            end_m   = ev[7] if len(ev) > 7 else 0
            ev_date = today + timedelta(days=days_offset)
            db.add(CalendarEvent(
                id=str(uuid.uuid4()), user_id=uid,
                title=title, description=desc, event_type=etype, source="manual",
                start_time=datetime(ev_date.year, ev_date.month, ev_date.day,
                                    start_h, start_m, tzinfo=timezone.utc),
                end_time=datetime(ev_date.year, ev_date.month, ev_date.day,
                                  end_h, end_m, tzinfo=timezone.utc),
            ))

        await db.commit()
        print("Calendar events created.")

        # ── 7. INTERVENTIONS ──────────────────────────────────────────────────
        resolved_interventions = [
            ("deadline_collision", "Critical", "Digital Twin",         "FYP submission overlaps with FocusOS demo. Rescheduled 3 tasks.",    {"action": "reschedule"}),
            ("procrastination",    "High",     "Accountability Agent", "LeetCode skipped 2 days. Time block inserted at 1 PM.",              {"action": "block_time"}),
            ("calendar_overload",  "High",     "Orchestrator",         "Thursday at 94% schedule density. Dropped 2 low-priority tasks.",    {"action": "drop_tasks"}),
            ("context_switch",     "Medium",   "Rescue Agent",         "5 context switches in 2 hours. Pomodoro mode activated.",            {"action": "pomodoro"}),
            ("energy_drop",        "Medium",   "Real-Time Telemetry",  "Productivity dip detected at 3 PM. Suggested short walk break.",     {"action": "break"}),
            ("habit_slip",         "Low",      "Momentum Agent",       "Gym habit missed 2 days. Reminder set for tomorrow 7 AM.",           {"action": "remind"}),
        ]
        for i, (itype, sev, src, msg, act) in enumerate(resolved_interventions):
            db.add(Intervention(
                id=str(uuid.uuid4()), user_id=uid, type=itype, severity=sev,
                priority_score=random.randint(65, 95), confidence_score=random.randint(82, 98),
                trigger_source=src, message=msg, recommended_action=act,
                resolved=True,
                created_at=now - timedelta(days=i + 1, hours=random.randint(1, 8)),
                resolved_at=now - timedelta(days=i + 1),
            ))

        active_interventions = [
            ("calendar_overload", "Critical", "Real-Time Telemetry",  "Today is at 92% schedule density. One missed task cascades into tomorrow.", {"action": "rebalance"}),
            ("deadline_collision","High",     "Digital Twin Forecast", "FocusOS demo and FYP submission both on Day 7. Merge prep sessions.",       {"action": "merge_sessions"}),
        ]
        for itype, sev, src, msg, act in active_interventions:
            db.add(Intervention(
                id=str(uuid.uuid4()), user_id=uid, type=itype, severity=sev,
                priority_score=random.randint(88, 99), confidence_score=random.randint(88, 99),
                trigger_source=src, message=msg, recommended_action=act,
                resolved=False, created_at=now - timedelta(hours=random.randint(1, 4)),
            ))

        # Threats for Rescue page
        threats = [
            ("overload",   "High",   "Orchestrator", "Schedule density exceeds safe threshold (92%)."),
            ("deadline",   "Critical","Digital Twin", "Two high-priority deadlines converge in 7 days."),
        ]
        for ttype, tsev, tsrc, tmsg in threats:
            db.add(Threat(
                id=str(uuid.uuid4()), user_id=uid, type=ttype, severity=tsev,
                source=tsrc, message=tmsg, status="active",
                details={"tasks_at_risk": 3, "recommended": "Reduce scope or extend timeline"},
            ))

        await db.commit()
        print("Interventions & threats created.")

        # ── 8. ANALYTICS — 30-day accountability metrics ──────────────────────
        for i in range(30):
            day_offset = 30 - i
            db.add(AccountabilityMetrics(
                id=str(uuid.uuid4()), user_id=uid,
                completion_rate  =min(100, max(20, 42 + i * 1.8 + random.uniform(-5, 5))),
                consistency_score=min(100, max(20, 45 + i * 1.5 + random.uniform(-4, 4))),
                procrastination_score=max(2, 35 - i * 0.9 + random.uniform(-3, 3)),
                productivity_score=min(100, max(20, 44 + i * 1.7 + random.uniform(-5, 5))),
                risk_profile="Low" if i >= 18 else ("Medium" if i >= 10 else "High"),
                key_findings=(
                    ["Consistent deep work", "Habit streaks holding"] if i >= 18
                    else (["Improving momentum"] if i >= 10 else ["Procrastination detected", "Burnout risk"])
                ),
                recommendations=(
                    ["Maintain current pace", "Stretch LeetCode goal"] if i >= 18
                    else (["Stay consistent"] if i >= 10 else ["Add buffer time", "Take breaks"])
                ),
                created_at=now - timedelta(days=day_offset),
            ))

        await db.commit()
        print("Analytics metrics created.")

        # ── 9. TWIN SIMULATION LOGS ────────────────────────────────────────────
        twin_scenarios = [
            ("DELAY_TASK",         78, 62, 28, 45, -12, 70),
            ("ADD_TASK",           78, 65, 28, 42, -10, 72),
            ("MOVE_DEADLINE",      78, 85, 28, 15,  +8, 88),
            ("REDUCE_HOURS",       78, 55, 28, 50, -18, 65),
            ("INCREASE_WORKLOAD",  78, 48, 28, 68, -22, 58),
            ("SKIP_TASK",          78, 82, 28, 18,  +5, 85),
            ("EXECUTE_INTERVENTION",78,88, 28, 12, +14, 92),
        ]
        for i, (stype, cur_succ, proj_succ, cur_risk, proj_risk, cap_impact, stability) in enumerate(twin_scenarios):
            db.add(TwinSimulationLog(
                id=str(uuid.uuid4()), user_id=uid, scenario_type=stype,
                current_success_probability=cur_succ, projected_success_probability=proj_succ,
                current_risk_score=cur_risk, projected_risk_score=proj_risk,
                capacity_impact=cap_impact, schedule_stability=stability,
                scenario_payload={"action": stype, "task": "FocusOS Demo Prep"},
                simulation_result={
                    "outcome": f"Simulated {stype}",
                    "recommendation": "Proceed with caution" if proj_succ < 70 else "Safe to proceed",
                    "delta_success": proj_succ - cur_succ,
                },
                created_at=now - timedelta(days=i * 2),
            ))

        await db.commit()
        print("Twin simulation logs created.")

        # ── 10. AGENT EXECUTION LOGS & ORCHESTRATOR EVENTS ───────────────────
        agent_actions = [
            ("Planning Agent",      "Generated optimised daily schedule",        2100, 93),
            ("Digital Twin Agent",  "Ran scenario: DELAY_TASK — risk assessed",  3400, 91),
            ("Rescue Agent",        "Detected context-switch overload",           1800, 88),
            ("Momentum Agent",      "Analysed 7-day habit streak trends",        1200, 95),
            ("Accountability Agent","Computed 30-day productivity score",         2200, 92),
            ("Vision Agent",        "Extracted tasks from whiteboard image",      4100, 87),
            ("Coach Agent",         "Generated personalised weekly briefing",     2800, 90),
            ("Orchestrator",        "Dispatched 6 agents — all completed",        5200, 96),
        ]
        for i in range(60):
            agent, action, ms, conf = random.choice(agent_actions)
            ts = now - timedelta(hours=i * 8)
            db.add(AgentExecutionLog(
                id=str(uuid.uuid4()), user_id=uid, agent_name=agent,
                action=action, execution_time_ms=ms + random.randint(-300, 300),
                confidence=conf + random.randint(-3, 3), status="success",
                created_at=ts,
            ))
            db.add(OrchestratorEvent(
                id=str(uuid.uuid4()), user_id=uid,
                agent=agent, action=action, status="success", timestamp=ts,
            ))

        await db.commit()
        print("Agent logs created.")

        # ── 11. NOTIFICATIONS ─────────────────────────────────────────────────
        notifications = [
            # Unread — show as badges
            ("Critical: Schedule Overload",     "Today is 92% full. FocusOS auto-rebalanced 2 tasks.",         "critical", "rescue",       False,  0),
            ("Deadline Alert",                  "FocusOS Demo & FYP submission converge in 7 days.",            "warning",  "planner",      False,  1),
            ("Deep Work Block Starting",        "Your 08:00 focus block begins in 5 minutes. Go!",             "info",     "planner",      False,  2),
            ("LeetCode Streak: 9 Days!",        "You've solved problems 9 days in a row. Keep it up.",         "success",  "goals",        False,  3),
            # Read — history
            ("AI Schedule Generated",           "Today's plan built by Mistral. Confidence: 91%.",             "info",     "planner",      True,   5),
            ("Habit Milestone: 14-day streak",  "Deep Work streak hit 14 days — personal record!",             "success",  "goals",        True,   10),
            ("Twin Simulation Complete",        "Scenario 'Delay Task' ran. Risk increased by 17%.",           "warning",  "digital_twin", True,   15),
            ("Weekly Review Ready",             "Your Week 28 accountability report is available.",            "info",     "analytics",    True,   24),
            ("Goal 78% Complete",               "FocusOS V1 Launch is 82% done. Final stretch!",               "success",  "goals",        True,   30),
            ("Rescue Intervention Resolved",    "Context-switch overload resolved. Back on track.",            "success",  "rescue",       True,   48),
            ("New AI Insight",                  "You're 34% more productive in morning focus blocks.",         "info",     "analytics",    True,   72),
            ("FYP Chapter Submitted",           "Implementation chapter saved. Good progress!",                "success",  "goals",        True,   96),
        ]
        for title, desc, severity, module, read, hours_ago in notifications:
            db.add(Notification(
                id=str(uuid.uuid4()), user_id=uid,
                title=title, description=desc, severity=severity,
                priority=severity, module=module, read=read,
                created_at=now - timedelta(hours=hours_ago),
            ))

        await db.commit()
        print("Notifications created.")

        # ── FINAL SUMMARY ─────────────────────────────────────────────────────
        print("\n✅  Presentation seed data loaded successfully!")
        print(f"   User  : {user.full_name} ({TARGET_EMAIL})")
        print(f"   Date  : {today}")
        print("   Pages covered: Dashboard · Goals · Planner · Analytics ·")
        print("                  Digital Twin · Rescue · Calendar · Notifications")


if __name__ == "__main__":
    asyncio.run(seed())
