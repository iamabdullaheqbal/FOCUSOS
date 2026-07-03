<div align="center">

# 🧠 FocusOS
### The AI-Powered Productivity Operating System

**An enterprise-grade AI executive intelligence platform that moves beyond passive task tracking into active schedule orchestration — acting as your autonomous Chief of Staff.**

[![Python](https://img.shields.io/badge/Python-3.13-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-16.2-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Local-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Mistral AI](https://img.shields.io/badge/Mistral_AI-Large-FF7000?style=for-the-badge)](https://mistral.ai)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

</div>

---

## 📋 Table of Contents

1. [Executive Overview](#1-executive-overview)
2. [Key Features](#2-key-features)
3. [Screenshots](#3-screenshots)
4. [AI Architecture](#4-ai-architecture)
5. [Tech Stack](#5-tech-stack)
6. [Folder Structure](#6-folder-structure)
7. [Installation](#7-installation)
8. [Environment Variables](#8-environment-variables)
9. [Running the Application](#9-running-the-application)
10. [API Reference](#10-api-reference)
11. [Performance](#11-performance)
12. [Security](#12-security)
13. [Roadmap](#13-roadmap)

---

## 1. Executive Overview

### What is FocusOS?

FocusOS is a comprehensive, AI-native productivity operating system. It moves beyond passive task tracking into **active schedule orchestration**, simulating future workload capacity against real-world constraints to act as an **autonomous Chief of Staff**.

Unlike traditional tools that wait for you to miss deadlines, FocusOS **predicts burnout before it happens**, autonomously reschedules tasks, and generates intelligent recovery strategies when you fall behind.

### The Problem Solved

| Problem | How FocusOS Solves It |
|---|---|
| Decision fatigue from daily task prioritisation | AI Priority Agent assigns scores automatically using urgency × importance |
| Deadline blindness — no visibility into collisions | Digital Twin simulates the future and warns before failure |
| Context switching between multiple tools | Single unified OS for tasks, goals, calendar, habits, and AI |
| Manual scheduling taking 30–45 minutes/day | AI Planner generates a full optimised schedule in under 3 seconds |
| Physical notes and whiteboards going untracked | Vision Agent extracts tasks from images via OCR + Mistral Vision |

### Target Users

Engineered for **high-performance individuals, university students, founders, and professional teams** who require predictive analytics to avoid burnout and missed milestones.

### Key Differentiators

- **🔮 Proactive Interventions** — Evaluates schedule integrity to intercept workload collisions before they happen
- **🎤 Multimodal Intelligence** — Accepts commands via Voice, Vision (screenshots/whiteboards), and Documents
- **🧬 Digital Twin Simulation** — Mathematically models your success rate on upcoming goals using real workload data
- **🏎️ Local-First Speed** — 90%+ of NLP processing happens locally with <150ms latency; Mistral AI called only when confidence is low
- **🛡️ Privacy-First** — All data stays on your local PostgreSQL instance; no cloud data sharing

---

## 2. Key Features

### 🤖 AI Planning & Coordination

#### AI Planner
Auto-schedules all your tasks by finding calendar whitespace without violating burnout thresholds. Supports **8 intelligent scheduling strategies**:

| Strategy | Description |
|---|---|
| `Balanced` | Default — even distribution across the day |
| `Deep Work` | Maximises uninterrupted 2-hour focus blocks |
| `Exam Mode` | Prioritises study tasks; shorter breaks |
| `Placement Mode` | Prioritises interview prep and work tasks |
| `Hackathon Mode` | Aggressive 16-hour scheduling with minimal breaks |
| `Recovery Mode` | Light schedule, caps high-stress tasks |
| `Deep Work Focus` | Chunks tasks into long consecutive sessions |
| `Custom` | User-defined availability and preferences |

#### Goals & Habits
- Create a long-term goal in plain English → AI auto-generates 3–5 logical milestones
- Each milestone automatically creates a linked scheduled task
- Habit tracker with **streak counter**, momentum score, and daily check-in
- Archive, pin, progress tracking, and pause/resume functionality

#### Smart Calendar
- Real-time aggregation of goals, tasks, deadlines, meetings, and schedule slots into a single timeline
- Voice-booked meetings appear automatically
- Drag-to-reschedule with instant backend sync
- Calendar Intelligence panel: capacity %, current risk level, next deadline

---

### 🌐 Multimodal Intelligence

#### 🎤 Voice Copilot
Hands-free natural language interface with full CRUD capability:
```
"Add Deploy Backend to my tasks for Friday at 3pm"
"Schedule a meeting with Ali on Wednesday at 2pm for 1 hour"
"I'm falling behind — give me a rescue plan"
"What happens if I delay the React deadline by 2 days?"
```
- Local-first NLU engine (intent classification + entity extraction)
- Mistral AI fallback for complex/ambiguous commands
- Text input fallback for offline or network-restricted environments
- Real-time pipeline trace showing every processing step

#### 👁️ Vision Intelligence
Extracts structured tasks from any image:
- Photographs of **whiteboards, handwritten notes, printed timetables**
- Screenshots of project boards or meeting notes
- Hybrid pipeline: Tesseract OCR → confidence check → Mistral Pixtral Vision fallback
- User confirms extracted tasks before committing to database
- Auto-preprocessing: deskew, adaptive threshold, blur detection

#### 📄 Document Intelligence
Semantic extraction from uploaded documents:
- Supports **PDF, DOCX, TXT, MD** formats
- Extracts tasks, deadlines, action items, and responsible owners
- Results auto-scheduled into the Planner
- Ideal for: university syllabi, meeting minutes, assignment briefs, project specs

---

### 🛡️ Executive Defense System

#### Digital Twin
Predictive simulation engine that models consequences before decisions are made:
- "What if I delay my most critical task by 1 day?" → risk calculated in <2s
- Visual delta bars: current success probability vs projected
- Cascade effect visualisation across the entire week
- AI Strategy Directives with confidence percentages
- Simulation history with click-to-replay

#### Rescue Center
Emergency productivity strategy generator:
- Detects overload: total estimated hours > daily capacity
- Generates **3 ranked recovery strategies**: Safe, Balanced, Aggressive
- Each strategy validated against Digital Twin simulation
- Mistral AI adds coaching advice and empathetic reasoning
- One-click strategy execution applies changes to the schedule

#### Intervention Engine
Automated threat detection running continuously:
- Scans for overdue tasks, capacity overload, and deadline collisions
- Creates `Threat` records with severity levels (Critical / High / Medium)
- One-click resolution with full audit trail
- Escalates to Rescue Agent automatically when severity is Critical

#### AI Command Center
Global orchestration terminal:
- Execute full 7-agent pipeline with one button
- Live pipeline visualisation: each agent status in real time
- Intelligence Source Monitor: Local vs Mistral usage and cost metrics
- System Execution Monitor: tasks evaluated, risks detected, interventions generated

---

### 📊 Observability & Reporting

#### Analytics Dashboard
- Productivity Score, Completion Rate, AI Confidence Score, Future Risk Forecast
- 30-day productivity trend charts
- Agent contribution breakdown
- Intervention resolution metrics
- Digital Twin accuracy tracking

#### PDF Intelligence Report
- One-click downloadable PDF report
- Includes AI Chief-of-Staff briefing, KPI table, and risk forecast
- Suitable for academic or professional submission

#### Notifications
- Real-time in-app notification system with categories
- Mark as read, clear all, filter by type
- Tied to agent execution events and threat detection

---

## 3. Screenshots

### Landing Page
![Landing Page](images/Landing_page.png)

---

### Dashboard
The AI Chief-of-Staff Briefing, Executive KPIs, Today's Execution Radar, and Multi-Agent Activity Timeline.

![Dashboard](images/dashboard.png)

---

### AI Planner
Auto-generated daily schedule with focus blocks, breaks, backlog management, and strategy selection.

![Planner](images/planner.png)

---

### Goals & Habits
Long-term goals broken into milestones, habit streak tracking, and progress visualisation.

![Goals](images/goals.png)

---

### Smart Calendar
Unified timeline of all tasks, goals, meetings, and schedule slots with drag-to-reschedule.

![Calendar](images/calendar.png)

---

### Voice Copilot
Natural language command interface with real-time NLU pipeline trace and AI response synthesis.

![Voice](images/voice.png)

---

### Vision Intelligence
Image upload → OCR processing → structured task extraction → user confirmation flow.

![Vision](images/vision.png)

---

### Document Intelligence
PDF/DOCX upload → semantic extraction → auto-scheduled tasks.

![Documents](images/documents.png)

---

### Digital Twin
What-if scenario simulation with cascade effect visualisation and AI strategy directives.

![Digital Twin](images/digital-twin.png)

---

### Rescue Center
Emergency recovery strategy generator with Safe / Balanced / Aggressive options.

![Rescue](images/rescue.png)

---

### AI Command Center
Global orchestration terminal with live agent pipeline and Intelligence Source Monitor.

![Command Center](images/command-center.png)

---

### Interventions
Automated threat detection panel with severity levels and one-click resolution.

![Interventions](images/interventions.png)

---

### Analytics
Executive observatory with productivity trends, agent contributions, and AI confidence metrics.

![Analytics](images/analytics.png)

---

## 4. AI Architecture

FocusOS uses a **Hybrid Inference Model** — all intelligence flows through a unified Execution Engine that decides locally vs cloud routing at runtime.

```
┌─────────────────────────────────────────────────────────────────────┐
│                         INPUT LAYER                                  │
│                                                                      │
│   🎤 Voice Input    👁️ Vision OCR    📄 Document Upload             │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  LOCAL INTELLIGENCE ENGINE                            │
│                                                                      │
│   IntentEngine → EntityExtractor → ConfidenceScorer                 │
│   RapidFuzz NLP  │  dateparser  │  Command Library                  │
│                  │              │                                    │
│   Confidence ≥ threshold?                                           │
│        YES ──────────────────────► Execution Engine                 │
│        NO  ──────────────────────► Mistral AI Fallback              │
└─────────────────────────────────────────────────────────────────────┘
                                          │
              ┌───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────────┐
│              MISTRAL AI FALLBACK  (mistral-large-latest)             │
│                                                                      │
│   Complex semantic reasoning, goal decomposition,                   │
│   coaching advice, vision extraction (pixtral-12b-latest)           │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      EXECUTION ENGINE                                │
│                                                                      │
│   Agent Registry lookup → Executor function → DB context            │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       AGENT REGISTRY                                 │
│                                                                      │
│   TaskService │ GoalService │ PlanningAgent │ RescueAgent           │
│   DigitalTwin │ MeetingScheduler │ Navigation │ FocusMode           │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│              PostgreSQL DATABASE CONTEXT                             │
│                                                                      │
│   Tasks │ Goals │ Habits │ Schedules │ CalendarEvents               │
│   Interventions │ Threats │ Telemetry │ AgentLogs                   │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
                    ✅  ACTION RESULT
```

### Agent Roster

| Agent | Responsibility | Inference Mode |
|---|---|---|
| **Priority Agent** | Calculates urgency × importance score for each task | Hybrid (local heuristics → Mistral) |
| **Planning Agent** | Generates optimised daily schedule from task list | Hybrid (local scheduler → Mistral) |
| **Rescue Agent** | Detects overload and generates 3 recovery strategies | Hybrid (Digital Twin validation → Mistral coaching) |
| **Digital Twin Agent** | Simulates what-if scenarios against cloned schedule state | Hybrid (local planner clone → Mistral narrative) |
| **Vision Agent** | Extracts tasks from images via OCR + vision model | Tesseract OCR → Mistral Pixtral fallback |
| **Voice Copilot Agent** | Parses natural language transcripts into structured intents | Local NLU → Mistral fallback |
| **Goal Agent** | Decomposes goals into milestones and tasks | Hybrid (template matching → Mistral) |
| **Accountability Agent** | Analyses task history to generate productivity metrics | Mistral (structured output) |
| **Coach Agent** | Provides personalised coaching based on workload and metrics | Mistral (structured output) |
| **Reflection Agent** | Generates end-of-day reflection report | Mistral (structured output) |
| **Document Intelligence Agent** | Chunks and extracts structured data from documents | Local parser → Mistral semantic fallback |
| **Momentum Agent** | Tracks velocity and consistency across time | Local analytics |

### Hybrid Inference Engine

The `hybrid_inference.execute_hybrid()` function is the core routing primitive:

```python
def execute_hybrid(local_func, ai_func, threshold: int):
    """
    1. Run local inference first (fast, private, <10ms)
    2. If _system_confidence >= threshold → return local result
    3. Otherwise → call Mistral AI for enhancement
    4. If Mistral fails → gracefully fall back to local result
    """
```

**Confidence thresholds by agent:**
- Priority Agent: `80` — local heuristics handle most cases
- Planning Agent: `75` — local scheduler is highly capable
- Rescue Agent: `75` — local risk detection is reliable
- Digital Twin: `85` — simulation requires high fidelity

---

## 5. Tech Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| **Next.js** | 16.2.9 | React framework with App Router, SSR, and file-based routing |
| **React** | 19.2 | Component-based UI library |
| **TypeScript** | 5.9 | Type safety across the entire frontend codebase |
| **Tailwind CSS** | 4.3 | Utility-first CSS framework |
| **Framer Motion** | 12.4 | Declarative animations and transitions |
| **Axios** | 1.18 | HTTP client with interceptors for auth and error handling |
| **Recharts** | 3.9 | Composable charting for analytics dashboards |
| **Lucide React** | 1.23 | Icon library |
| **date-fns** | 4.4 | Date formatting and manipulation |
| **Sentry React** | 10.6 | Frontend error tracking and performance monitoring |

### Backend

| Technology | Version | Purpose |
|---|---|---|
| **Python** | 3.13 | Core backend language |
| **FastAPI** | 0.115 | Async REST API framework with automatic OpenAPI docs |
| **Uvicorn** | 0.30 | ASGI server with hot-reload support |
| **SQLAlchemy** | 2.0 (async) | ORM with full async support via asyncpg |
| **Pydantic** | 2.8 | Request/response validation and schema enforcement |
| **asyncpg** | 0.30 | High-performance async PostgreSQL driver |
| **psycopg2-binary** | 2.9 | Sync PostgreSQL driver for service-layer operations |
| **PyJWT** | 2.9 | Stateless JWT token creation and verification |
| **Werkzeug** | 3.1 | Password hashing (`generate_password_hash` / `check_password_hash`) |
| **SlowAPI** | 0.1.9 | Rate limiting middleware for FastAPI |
| **python-dotenv** | 1.0 | Environment variable loading from `.env` |
| **Sentry SDK** | 2.14 | Backend error tracking with FastAPI integration |

### AI & Intelligence

| Technology | Version | Purpose |
|---|---|---|
| **Mistral AI SDK** | 1.0+ | Primary AI: `mistral-large-latest` for structured reasoning |
| **Pixtral** | `pixtral-12b-latest` | Vision model for image-to-task extraction |
| **Tesseract OCR** | 0.3.13 (pytesseract) | Local OCR engine for image preprocessing |
| **OpenCV** | 4.10 (headless) | Image preprocessing: deskew, thresholding, blur detection |
| **Pillow** | 10.4 | Image loading and conversion (including HEIC via pillow-heif) |
| **RapidFuzz** | 3.9 | Fuzzy string matching for local NLU intent classification |
| **dateparser** | 1.2 | Natural language date/time parsing from transcripts |
| **python-dateutil** | 2.9 | Robust date arithmetic and ISO 8601 parsing |
| **cachetools** | 5.4 | TTL cache for Mistral API response memoisation |
| **numpy** | 1.26 | Numerical operations in vision preprocessing |

### Document Processing

| Technology | Version | Purpose |
|---|---|---|
| **pypdf** | 4.0 | PDF text extraction |
| **python-docx** | 1.1 | DOCX document parsing |
| **pillow-heif** | 0.18 | HEIC/HEIF image format support |
| **reportlab** | 4.2 | PDF report generation for intelligence reports |

### Database

| Technology | Purpose |
|---|---|
| **PostgreSQL** (local) | Primary relational database — all user data, tasks, goals, schedules, telemetry |
| **asyncpg** | Async connection pool for FastAPI routes |
| **psycopg2** | Sync connection pool for service-layer and agent operations |
| **SQLAlchemy Async** | ORM with `DeclarativeBase`, relationship loading, and migration support |

### Package Management

| Tool | Purpose |
|---|---|
| **uv** | Ultra-fast Python package manager and virtual environment tool |
| **hatchling** | Build backend for the Python package |

---

## 6. Folder Structure

```
FOCUSOS/
│
├── backend/                        # Python FastAPI application
│   ├── agents/                     # AI agent implementations
│   │   ├── accountability_agent.py # Productivity metrics generation
│   │   ├── coach_agent.py          # Personalised coaching insights
│   │   ├── digital_twin_agent.py   # What-if scenario simulation
│   │   ├── document_intelligence_agent.py
│   │   ├── goal_agent.py           # Goal decomposition into milestones
│   │   ├── hybrid_inference.py     # Local ↔ Mistral routing engine
│   │   ├── momentum_agent.py       # Velocity and consistency tracking
│   │   ├── planning_agent.py       # Daily schedule generation
│   │   ├── priority_agent.py       # Task urgency × importance scoring
│   │   ├── reflection_agent.py     # End-of-day reflection reports
│   │   ├── rescue_agent.py         # Emergency recovery strategy generator
│   │   ├── vision_agent.py         # Image → structured task extraction
│   │   └── voice_copilot_agent.py  # Natural language command parser
│   │
│   ├── api/                        # FastAPI route handlers
│   │   ├── agents.py               # /api/agents/* — all AI agent endpoints
│   │   ├── analytics.py            # /api/analytics/*
│   │   ├── auth.py                 # /api/auth/* — register, login, refresh, me
│   │   ├── calendar.py             # /api/calendar/*
│   │   ├── demo.py                 # /api/demo/* — demo user creation
│   │   ├── documents.py            # /api/documents/*
│   │   ├── goals.py                # /api/goals/* and /api/habits/*
│   │   ├── health.py               # /api/health/*
│   │   ├── interventions.py        # /api/interventions/*
│   │   ├── notifications.py        # /api/notifications/*
│   │   ├── orchestration.py        # /api/orchestration/*
│   │   ├── reports.py              # /api/reports/download
│   │   ├── settings.py             # /api/settings/*
│   │   ├── tasks.py                # /api/tasks/*
│   │   ├── users.py                # /api/account
│   │   └── voice.py                # /api/voice/*
│   │
│   ├── database/
│   │   ├── db.py                   # Async engine, session factory, get_db dependency
│   │   └── init_db.py              # Table creation and optional seeding
│   │
│   ├── models/                     # SQLAlchemy ORM models
│   │   ├── calendar_event.py
│   │   ├── goal.py                 # Goal, Milestone, Habit, HabitLog
│   │   ├── intelligence.py         # AccountabilityMetrics, CoachReport, ReflectionReport
│   │   ├── intervention.py         # Intervention, Threat, RescuePlan, RescueExecution
│   │   ├── notification.py
│   │   ├── schedule.py             # Schedule, ScheduleSlot
│   │   ├── task.py
│   │   ├── telemetry.py            # AgentExecutionLog, OrchestratorEvent, TwinSimulationLog
│   │   ├── user.py
│   │   ├── user_session.py
│   │   └── user_settings.py
│   │
│   ├── services/                   # Core business & AI execution logic
│   │   ├── local_intelligence/     # Local NLP engine
│   │   │   ├── agent_registry.py   # Maps intents → executor functions
│   │   │   ├── command_library.py  # Known command patterns
│   │   │   ├── confidence_engine.py
│   │   │   ├── execution_engine.py # Unified entry point for all NLP pipelines
│   │   │   ├── intent_engine.py    # RapidFuzz intent classification
│   │   │   ├── learning_service.py # Command log and feedback loop
│   │   │   └── router.py           # Local routing decisions
│   │   ├── ocr/                    # OCR provider abstractions
│   │   │   ├── provider.py         # Abstract base class
│   │   │   ├── tesseract_provider.py
│   │   │   └── vision_provider.py  # Mistral Pixtral vision OCR
│   │   ├── analytics_service.py
│   │   ├── availability_service.py
│   │   ├── calendar_service.py
│   │   ├── document_service.py
│   │   ├── goal_service.py
│   │   ├── intervention_engine.py
│   │   ├── mistral_service.py      # Central Mistral AI SDK wrapper
│   │   ├── notification_service.py
│   │   ├── orchestrator.py         # Multi-agent pipeline coordinator
│   │   ├── telemetry_service.py
│   │   └── voice_service.py
│   │
│   ├── utils/
│   │   ├── auth.py                 # JWT Bearer dependency for FastAPI routes
│   │   ├── errors.py               # APIError custom exception
│   │   ├── responses.py            # Standardised response helpers
│   │   └── validation.py           # Input validation utilities
│   │
│   ├── tests/                      # pytest test suite
│   ├── scripts/                    # DB migration and seed scripts
│   ├── config.py                   # Settings loaded from environment variables
│   ├── main.py                     # FastAPI app factory + lifespan
│   └── pyproject.toml              # Dependencies managed by uv
│
├── frontend/                       # Next.js 16 application
│   ├── src/
│   │   ├── app/                    # Next.js App Router
│   │   │   ├── (app)/              # Authenticated route group
│   │   │   │   ├── dashboard/
│   │   │   │   ├── planner/
│   │   │   │   ├── goals/
│   │   │   │   ├── calendar/
│   │   │   │   ├── analytics/
│   │   │   │   ├── voice/
│   │   │   │   ├── vision/
│   │   │   │   ├── documents/
│   │   │   │   ├── digital-twin/
│   │   │   │   ├── rescue/
│   │   │   │   ├── command-center/
│   │   │   │   ├── interventions/
│   │   │   │   └── settings/
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx            # Landing page
│   │   │
│   │   ├── components/
│   │   │   ├── Landing/            # Landing page sections
│   │   │   ├── Layout/             # App shell (sidebar, header)
│   │   │   ├── Navigation/         # Nav components
│   │   │   └── UI/                 # Reusable UI primitives (GlassCard, Badge, etc.)
│   │   │
│   │   ├── context/
│   │   │   ├── AuthContext.tsx     # JWT session management
│   │   │   └── SettingsContext.tsx # User preference state
│   │   │
│   │   ├── hooks/                  # Custom React hooks
│   │   ├── lib/                    # Auth utilities
│   │   ├── utils/
│   │   │   └── SystemEventBus.ts   # Cross-component event system
│   │   ├── views/                  # Page-level React components
│   │   └── api.ts                  # Axios client + FocusOSApi object
│   │
│   └── package.json
│
├── images/                         # Project screenshots
│   ├── Landing_page.png
│   ├── dashboard.png
│   ├── planner.png
│   ├── goals.png
│   ├── calendar.png
│   ├── voice.png
│   ├── vision.png
│   ├── documents.png
│   ├── digital-twin.png
│   ├── rescue.png
│   ├── command-center.png
│   ├── interventions.png
│   └── analytics.png
│
├── presentation/
│   └── index.html                  # HCI course presentation (responsive)
│
└── README.md
```

---

## 7. Installation

### Prerequisites

Make sure the following are installed on your machine:

| Tool | Version | Download |
|---|---|---|
| Python | 3.13+ | [python.org](https://python.org) |
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| PostgreSQL | 14+ | [postgresql.org](https://postgresql.org) |
| uv (Python pkg manager) | latest | `pip install uv` |
| Tesseract OCR | 5.x | [UB Mannheim builds (Windows)](https://github.com/UB-Mannheim/tesseract/wiki) |
| Git | any | [git-scm.com](https://git-scm.com) |

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/focusos.git
cd focusos
```

### 2. PostgreSQL Database Setup

Create a local database for FocusOS:

```sql
-- Run in psql or pgAdmin
CREATE DATABASE focusos;
CREATE USER focusos_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE focusos TO focusos_user;
```

> **Note:** FocusOS auto-creates all tables on first startup via `init_db()`. No manual migration scripts needed.

### 3. Backend Setup

```bash
cd backend

# Create virtual environment and install dependencies with uv
uv venv
uv pip install -e .

# Activate the virtual environment
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# Copy and configure environment variables
copy .env.example .env      # Windows
# cp .env.example .env      # macOS/Linux

# Edit .env with your values (see Environment Variables section)
```

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy and configure environment variables
copy .env.example .env.local   # Windows
# cp .env.example .env.local   # macOS/Linux
```

---

## 8. Environment Variables

### Backend — `backend/.env`

```env
# ── PostgreSQL ─────────────────────────────────────────────────────────────
# Format: postgresql+asyncpg://user:password@host:port/dbname
# URL-encode special characters in password (e.g. @ → %40, # → %23)
DATABASE_URL=postgresql+asyncpg://postgres:yourpassword@localhost:5432/focusos

# ── Auth ───────────────────────────────────────────────────────────────────
# Generate a strong random secret: python -c "import secrets; print(secrets.token_hex(32))"
APP_SECRET_KEY=your-long-random-secret-key-here

# ── Mistral AI ─────────────────────────────────────────────────────────────
# Get your key from: https://console.mistral.ai/api-keys
MISTRAL_API_KEY=your_mistral_api_key
MISTRAL_MODEL=mistral-large-latest
MISTRAL_VISION_MODEL=pixtral-12b-latest

# ── CORS ───────────────────────────────────────────────────────────────────
CORS_ORIGINS=http://localhost:3000

# ── App ────────────────────────────────────────────────────────────────────
APP_ENV=development
LOG_LEVEL=INFO
PORT=8000
TZ=Asia/Karachi

# ── Optional ───────────────────────────────────────────────────────────────
# SENTRY_DSN=https://your-sentry-dsn@sentry.io/project
```

### Frontend — `frontend/.env.local`

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
```

> **Security note:** Never commit `.env` files to version control. Both are listed in `.gitignore`.

### Password URL Encoding

If your PostgreSQL password contains special characters, encode them:

| Character | Encoded |
|---|---|
| `@` | `%40` |
| `#` | `%23` |
| `$` | `%24` |
| `!` | `%21` |
| `&` | `%26` |

Example: Password `P@ss#word` becomes `P%40ss%23word` in the DATABASE_URL.

---

## 9. Running the Application

### Start the Backend

```bash
cd backend

# Development mode (hot-reload)
uvicorn main:app --reload --port 8000

# Or using the entry point directly
python main.py

# Production mode
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

On successful startup you will see:

```
==================================================
  FOCUSOS BACKEND
==================================================
  Env:      development
  Timezone: Asia/Karachi (UTC+5 / PKT)
  Database: localhost:5432/focusos
  Mistral:  Connected
  Docs:     http://localhost:8000/api/docs
  Server:   http://localhost:8000
==================================================

[START] FocusOS backend starting…
[DB] Tables ready.
[MISTRAL] MistralService ready | model=mistral-large-latest
[OK] FocusOS backend ready on port 8000
```

### Start the Frontend

```bash
cd frontend

# Development mode
npm run dev

# Production build
npm run build
npm start
```

The application will be available at **http://localhost:3000**

### API Documentation

Interactive Swagger docs are available in development mode at:
```
http://localhost:8000/api/docs
http://localhost:8000/api/redoc
```

### Running Tests

```bash
cd backend

# Run full test suite
pytest

# Run with verbose output
pytest -v

# Run specific test file
pytest tests/test_planning_agent.py -v

# Run with coverage
pytest --cov=. --cov-report=html
```

---

## 10. API Reference

All endpoints are prefixed with `/api`. Authentication uses `Authorization: Bearer <token>`.

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Create new account |
| `POST` | `/api/auth/login` | Login with email + password |
| `POST` | `/api/auth/refresh` | Refresh access token |
| `GET` | `/api/auth/me` | Get current user profile |

### Tasks

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/tasks` | List tasks (filter by status, category, sort) |
| `POST` | `/api/tasks` | Create task |
| `GET` | `/api/tasks/{id}` | Get single task |
| `PUT` | `/api/tasks/{id}` | Update task |
| `DELETE` | `/api/tasks/{id}` | Delete task |
| `POST` | `/api/tasks/{id}/progress` | Log hours and update status |

### Goals & Habits

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/goals` | List all goals with milestones |
| `POST` | `/api/goals` | Create goal (triggers AI milestone generation) |
| `PUT` | `/api/goals/{id}` | Update goal |
| `DELETE` | `/api/goals/{id}` | Delete goal |
| `POST` | `/api/goals/{id}/archive` | Archive goal |
| `POST` | `/api/goals/{id}/pin` | Toggle pin |
| `PUT` | `/api/milestones/{id}/status` | Update milestone status |
| `GET` | `/api/habits` | List habits |
| `POST` | `/api/habits` | Create habit |
| `POST` | `/api/habits/{id}/checkin` | Daily check-in (increments streak) |

### AI Agents

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/agents/status` | All agent states |
| `POST` | `/api/agents/prioritize` | Run Priority Agent on task(s) |
| `POST` | `/api/agents/plan` | Run Planning Agent → generate schedule |
| `GET` | `/api/agents/plan/latest` | Get latest generated schedule |
| `POST` | `/api/agents/rescue` | Run Rescue Agent → recovery strategies |
| `POST` | `/api/agents/digital-twin` | Run Digital Twin simulation |
| `POST` | `/api/agents/vision` | Upload image → extract tasks |
| `POST` | `/api/agents/vision/confirm` | Confirm and save extracted tasks |
| `POST` | `/api/agents/accountability` | Generate accountability metrics |
| `POST` | `/api/agents/coach` | Generate coaching insights |
| `POST` | `/api/agents/reflection` | Generate daily reflection |

### Orchestration

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/orchestration/feed` | Get agent activity feed |
| `POST` | `/api/orchestration/pipeline` | Run full vision → agent pipeline |
| `POST` | `/api/orchestration/execute` | Execute system-wide orchestration |

### Voice

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/voice/process` | Process voice transcript → execute command |

### Documents

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/documents/upload` | Upload PDF/DOCX/TXT → extract intelligence |

### Analytics

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/analytics/overview` | Productivity KPIs |
| `GET` | `/api/analytics/productivity` | 30-day productivity trends |
| `GET` | `/api/analytics/insights` | AI-generated insights |
| `GET` | `/api/analytics/briefing` | Chief-of-Staff daily briefing text |
| `GET` | `/api/reports/download` | Download PDF intelligence report |

### Health

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health check |
| `GET` | `/api/health/db` | Database connectivity check |
| `GET` | `/api/health/ai` | Mistral AI connectivity check |

---

## 11. Performance

FocusOS is engineered for perceived and absolute speed:

### Local-First AI
- **90%+ of NLP operations** happen locally via RapidFuzz intent classification and rule-based entity extraction
- Local inference latency: **<10ms** for simple commands, **<150ms** for complex scheduling
- Mistral AI is invoked **only when local confidence drops below threshold** — typically complex goal decomposition or nuanced coaching

### Database
- **Async SQLAlchemy** with `asyncpg` driver — non-blocking DB operations throughout FastAPI routes
- Connection pool: `pool_size=10, max_overflow=20, pool_recycle=1800`
- `pool_pre_ping=True` — validates connections before use, preventing stale connection errors
- Sync `psycopg2` pool used only in service-layer operations that cannot be made async

### Caching
- Mistral API responses cached with **TTL cache** (default 5 minutes, 100 entries)
- Cache keyed by SHA-256 of system prompt + user prompt — deterministic and collision-resistant
- Prevents redundant API calls for repeated or similar queries

### Frontend
- **Next.js App Router** with route-level code splitting — initial bundle <300KB
- `loading="lazy"` on all images — no blocking render
- **Framer Motion** animations use CSS transforms only — no layout thrashing
- `SystemEventBus` for cross-component communication — avoids unnecessary re-renders

### API Design
- **Correlation IDs** (`X-Correlation-ID`) on every request for end-to-end tracing
- Request timeouts: 15s default, 60s for vision/document uploads
- Circuit breaker in frontend — suppresses repeated "offline" toasts

---

## 12. Security

### Authentication
- **Stateless JWT** — no server-side session storage
- Access tokens: 24-hour TTL; Refresh tokens: 30-day TTL
- `PyJWT` with `HS256` algorithm; secret key loaded from environment variable only
- Passwords hashed with `werkzeug.security.generate_password_hash` (PBKDF2 + SHA-256 + salt)

### API Security
- **Rate limiting** via SlowAPI: 1000 requests/hour per IP by default
- **CORS** — strictly configured to allowed origins only
- **Security headers** on every response:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains`
  - `Referrer-Policy: strict-origin-when-cross-origin`

### Database
- All queries use **SQLAlchemy parameterised statements** — no raw SQL string interpolation
- User data isolation — every query filters by `user_id` from the verified JWT payload
- No credentials committed — `.env` excluded via `.gitignore`

### Input Validation
- **Pydantic v2** models on all request bodies — strict type coercion and field validation
- File upload validation: MIME type and extension whitelist for vision and document endpoints
- SQL injection impossible via ORM parameterisation

### Environment
- `.env` files are git-ignored at root and backend level
- Sensitive values (API keys, DB passwords) accessed only via `os.getenv()`
- Sentry DSN loaded from environment — never hardcoded

---

## 13. Roadmap

### v1.0 — Core Operating System ✅ *Completed*
- [x] Full task management with AI priority scoring
- [x] AI Planning Agent with 8 scheduling strategies
- [x] Digital Twin predictive simulation engine
- [x] Rescue Agent with Safe/Balanced/Aggressive recovery strategies
- [x] Voice Copilot with local NLU + Mistral fallback
- [x] Vision Agent with Tesseract OCR + Mistral Pixtral
- [x] Document Intelligence for PDF/DOCX/TXT
- [x] Goals & Habits with AI milestone generation
- [x] Smart Calendar with drag-to-reschedule
- [x] Analytics dashboard with PDF report export
- [x] AI Command Center with live pipeline visualisation
- [x] Intervention Engine with automated threat detection
- [x] Local PostgreSQL with full async support
- [x] JWT authentication with refresh token rotation
- [x] Sentry error monitoring integration

### v1.1 — Connectivity & Integration *(Planned)*
- [ ] Google Calendar OAuth sync (two-way)
- [ ] Webhook ingestion API for external task sources
- [ ] Microsoft Outlook calendar integration
- [ ] Slack bot for voice commands
- [ ] Email digest — daily briefing sent to inbox

### v2.0 — Team & Mobile *(Planned)*
- [ ] Native mobile apps (React Native — iOS & Android)
- [ ] Multi-tenant team workspaces
- [ ] Shared calendars and team capacity views
- [ ] Manager dashboard — team productivity overview
- [ ] AI-assisted meeting scheduling across team members

### v3.0 — Advanced Intelligence *(Research)*
- [ ] Long-term memory — AI learns from past performance
- [ ] Personalised scheduling based on historical productivity peaks
- [ ] Autonomous task delegation suggestions
- [ ] Integration with GitHub Issues, Jira, Linear
- [ ] Browser extension for one-click task capture

---

## 14. Contributing

Contributions are welcome. Please follow these steps:

```bash
# 1. Fork the repository
# 2. Create a feature branch
git checkout -b feature/your-feature-name

# 3. Make your changes
# 4. Run the test suite
cd backend && pytest -v

# 5. Commit with a clear message
git commit -m "feat: add your feature description"

# 6. Push and open a pull request
git push origin feature/your-feature-name
```

### Code Style
- **Python**: Follow PEP 8. Type hints on all function signatures.
- **TypeScript**: Strict mode enabled. No `any` types except where unavoidable.
- **Commits**: Use [Conventional Commits](https://conventionalcommits.org) format.

---

## 15. Acknowledgements

- [Mistral AI](https://mistral.ai) — For the `mistral-large-latest` and `pixtral-12b-latest` models
- [FastAPI](https://fastapi.tiangolo.com) — For the elegant async Python framework
- [Next.js](https://nextjs.org) — For the App Router and SSR capabilities
- [Framer Motion](https://framer.com/motion) — For the smooth, declarative animations
- [Laws of UX](https://lawsofux.com) — For the HCI principles that guided every design decision
- [Tesseract OCR](https://github.com/tesseract-ocr/tesseract) — For the open-source OCR engine

---

<div align="center">

**Built with ❤️ by Abdullah & Sharina Khan**

*FocusOS — Stop managing tasks. Start executing at elite level.*

</div>
