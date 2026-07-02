type SystemEvent =
  | 'TASK_CREATED'
  | 'TASK_UPDATED'
  | 'TASK_COMPLETED'
  | 'TASK_DELETED'
  | 'GOAL_CREATED'
  | 'GOAL_UPDATED'
  | 'GOAL_COMPLETED'
  | 'GOAL_ARCHIVED'
  | 'HABIT_CREATED'
  | 'HABIT_UPDATED'
  | 'HABIT_CHECKIN'
  | 'HABIT_STREAK_CHANGED'
  | 'PLANNER_GENERATED'
  | 'PLANNER_UPDATED'
  | 'DIGITAL_TWIN_SIMULATED'
  | 'THREAT_DETECTED'
  | 'RESCUE_EXECUTED'
  | 'RESCUE_ROLLBACK'
  | 'NOTIFICATION_CREATED'
  | 'NOTIFICATION_READ'
  | 'SYSTEM_HEALTH_CHANGED'
  | 'COMMAND_CENTER_REFRESH';

export interface SystemEventPayload {
  event: SystemEvent;
  origin: string;
  timestamp: string;
  entityType?: string;
  entityId?: string;
  version: string;
  data?: any;
}

type EventCallback = (payload: SystemEventPayload) => void;

class EventBus {
  private listeners: Map<SystemEvent, Set<EventCallback>> = new Map();

  subscribe(event: SystemEvent, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.listeners.delete(event);
        }
      }
    };
  }

  emit(payload: SystemEventPayload) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[EventBus] Emitting ${payload.event} (v${payload.version}) from ${payload.origin}`, payload);
    }
    const callbacks = this.listeners.get(payload.event);
    if (callbacks) {
      callbacks.forEach((cb) => {
        try {
          cb(payload);
        } catch (e) {
          console.error(`[EventBus] Error in callback for ${payload.event}`, e);
        }
      });
    }
  }
}

export const SystemEventBus = new EventBus();
