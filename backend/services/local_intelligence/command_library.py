from typing import Dict, List, Any

class CommandLibrary:
    """
    Central repository of all recognized OS commands and their metadata.
    """
    
    COMMANDS = [
        {
            "intent": "meeting_scheduling",
            "keywords": [
                # explicit schedule/book/arrange
                "schedule a meeting", "schedule me a meeting", "set up a meeting",
                "book a meeting", "arrange a meeting", "schedule meeting with",
                "add meeting", "create meeting", "set a meeting", "meeting with",
                "schedule an appointment", "book an appointment",
                # natural "with <person> at/on" patterns
                "schedule my meeting with", "schedule a call with", "schedule call with",
                "book a call with", "set up a call with", "arrange a call with",
                # just "meeting" + time/person triggers
                "meeting at", "meeting on", "meeting tomorrow", "meeting today",
                "meeting next", "appointment with", "appointment at", "appointment on",
                # common voice phrasings
                "i need to meet", "i want to meet", "set meeting", "fix a meeting",
                "put a meeting", "add a meeting", "add appointment",
                "schedule with", "meet with",
            ],
            "agent": "MeetingScheduler",
            "required_entities": [],
            "optional_entities": ["attendee", "target_name", "target_date", "duration"],
            "minimum_confidence": 65,
            "execution_strategy": "synchronous",
            "description": "Schedules a meeting or appointment and saves it to the calendar."
        },
        {
            "intent": "planning",
            "keywords": ["plan my week", "generate weekly plan", "schedule my tasks", "plan my day", "open planner", "plan tasks for today"],
            "agent": "PlanningAgent",
            "required_entities": [],
            "optional_entities": ["target_date"],
            "minimum_confidence": 75,
            "execution_strategy": "synchronous",
            "description": "Generates an automated schedule based on the user's pending tasks."
        },
        {
            "intent": "rescue",
            "keywords": ["rescue plan", "im falling behind", "i am falling behind", "open rescue center", "need a rescue plan"],
            "agent": "RescueAgent",
            "required_entities": [],
            "optional_entities": [],
            "minimum_confidence": 75,
            "execution_strategy": "synchronous",
            "description": "Analyzes the user's workload to detect burnout or failure risks."
        },
        {
            "intent": "task_creation",
            "keywords": ["add task", "create a task", "remind me to", "new task"],
            "agent": "TaskService",
            "required_entities": ["target_name"],
            "optional_entities": ["target_date", "priority"],
            "minimum_confidence": 65,
            "execution_strategy": "synchronous",
            "description": "Creates a new task in the user's workspace."
        },
        {
            "intent": "goal_creation",
            "keywords": ["add goal", "create goal", "new goal", "set a goal"],
            "agent": "GoalService",
            "required_entities": ["target_name"],
            "optional_entities": ["target_date"],
            "minimum_confidence": 70,
            "execution_strategy": "synchronous",
            "description": "Creates a new long-term goal."
        },
        {
            "intent": "calendar_query",
            "keywords": ["show my calendar", "open calendar", "move my meeting", "reschedule meeting", "today's meetings"],
            "agent": "Navigation",
            "required_entities": [],
            "optional_entities": ["target_date"],
            "minimum_confidence": 75,
            "execution_strategy": "navigation",
            "description": "Navigates to the calendar or processes calendar adjustments."
        },
        {
            "intent": "analytics_query",
            "keywords": ["show analytics", "analyze my productivity", "open analytics", "productivity stats"],
            "agent": "Navigation",
            "required_entities": [],
            "optional_entities": [],
            "minimum_confidence": 75,
            "execution_strategy": "navigation",
            "description": "Navigates to the analytics dashboard."
        },
        {
            "intent": "digital_twin",
            "keywords": ["simulate what happens if", "digital twin", "simulate deadline", "open digital twin"],
            "agent": "DigitalTwinAgent",
            "required_entities": [],
            "optional_entities": ["target_name"],
            "minimum_confidence": 75,
            "execution_strategy": "synchronous",
            "description": "Runs a digital twin simulation for task shifts."
        },
        {
            "intent": "navigation",
            "keywords": ["open dashboard", "go to dashboard", "show dashboard", "go to settings", "open settings", "show goals", "open goals", "open documents", "open vision"],
            "agent": "Navigation",
            "required_entities": ["target_name"],
            "optional_entities": [],
            "minimum_confidence": 70,
            "execution_strategy": "navigation",
            "description": "Navigates to a specific frontend route."
        },
        {
            "intent": "document_query",
            "keywords": ["upload document", "analyze this document", "read document"],
            "agent": "DocumentIntelligence",
            "required_entities": [],
            "optional_entities": ["document_name"],
            "minimum_confidence": 75,
            "execution_strategy": "asynchronous",
            "description": "Triggers the document intelligence processor."
        },
        {
            "intent": "vision_query",
            "keywords": ["analyze this image", "what is in this picture", "vision intelligence"],
            "agent": "VisionIntelligence",
            "required_entities": [],
            "optional_entities": ["image_reference"],
            "minimum_confidence": 75,
            "execution_strategy": "asynchronous",
            "description": "Triggers the vision intelligence processor."
        },
        {
            "intent": "focus_mode",
            "keywords": ["start focus mode", "enter focus mode", "focus time"],
            "agent": "FocusMode",
            "required_entities": [],
            "optional_entities": ["duration"],
            "minimum_confidence": 80,
            "execution_strategy": "navigation",
            "description": "Activates focus mode."
        }
    ]

    @classmethod
    def get_all_commands(cls) -> List[Dict[str, Any]]:
        return cls.COMMANDS

    @classmethod
    def get_command_by_intent(cls, intent: str) -> Dict[str, Any]:
        for cmd in cls.COMMANDS:
            if cmd["intent"] == intent:
                return cmd
        return None
