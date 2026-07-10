import axios from 'axios';
import { SystemEventBus, type SystemEventPayload } from './utils/SystemEventBus';
import { getAccessToken } from './lib/auth';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

const emitEvent = (event: SystemEventPayload['event'], origin: string = 'API', data?: any) => {
  SystemEventBus.emit({
    event,
    origin,
    timestamp: new Date().toISOString(),
    version: '1.0',
    data
  });
};

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000, // 15 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(async (config) => {
  // Inject Correlation ID
  config.headers['X-Correlation-ID'] = crypto.randomUUID();

  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Circuit breaker: suppress duplicate "backend offline" toasts ──────────────
// Once a network error fires we mark the backend as offline and stop emitting
// the toast on every subsequent request.  When a successful response arrives
// we flip the flag back and optionally notify the UI that the backend is back.
let _backendOffline = false;

apiClient.interceptors.response.use(
  (response) => {
    // Backend responded — if it was marked offline, announce recovery once.
    if (_backendOffline) {
      _backendOffline = false;
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('deadline_api_error', {
          detail: 'Backend reconnected. System is back online.',
        }));
      }
    }
    return response;
  },
  (error) => {
    const isNetworkError =
      error.code === 'ERR_NETWORK' ||
      error.message === 'Network Error' ||
      error.code === 'ECONNABORTED';

    let errorMessage = 'Something went wrong. Please try again.';

    if (isNetworkError) {
      errorMessage = 'Unable to connect to the backend. Is the server running?';
    } else if (error.response) {
      const status = error.response.status;
      if (status === 401 || status === 403) {
        errorMessage = 'Your session has expired or is invalid. Please log in again.';
      } else if (status === 429) {
        errorMessage = 'Too many requests. Please try again shortly.';
      } else if (status === 400 || status === 422) {
        errorMessage = error.response.data?.error || 'Please check the highlighted fields.';
      } else if (status >= 500) {
        errorMessage = 'The service is temporarily unavailable.';
      }
    }

    console.debug('[API Error Internal]:', error);

    // Suppress toasts when:
    // 1. Dev guest mode (backend intentionally not running)
    // 2. Network error already shown — circuit breaker prevents spam
    const isDevGuest =
      process.env.NODE_ENV === 'development' &&
      typeof window !== 'undefined' &&
      localStorage.getItem('dev_bypass_auth') === 'true';

    if (!isDevGuest) {
      if (isNetworkError) {
        // Only show the "offline" toast the first time
        if (!_backendOffline) {
          _backendOffline = true;
          window.dispatchEvent(new CustomEvent('deadline_api_error', {
            detail: errorMessage,
          }));
        }
        // Subsequent network errors are silently swallowed
      } else {
        // Non-network errors (4xx, 5xx) always show
        window.dispatchEvent(new CustomEvent('deadline_api_error', {
          detail: errorMessage,
        }));
      }
    }

    const sanitizedError = new Error(errorMessage);
    (sanitizedError as any).status = error.response?.status;
    return Promise.reject(sanitizedError);
  }
);

export const FocusOSApi = {
  // ── NOTIFICATIONS ──────────────────────────────────────────────────────
  async getNotifications(params?: { limit?: number, offset?: number, unread_only?: boolean, category?: string }) {
    const response = await apiClient.get('/notifications', { params });
    return response.data;
  },

  async markNotificationRead(id: string) {
    const response = await apiClient.put(`/notifications/${id}/read`);
    emitEvent('NOTIFICATION_READ');
    return response.data;
  },

  async markAllNotificationsRead() {
    const response = await apiClient.put('/notifications/read-all');
    emitEvent('NOTIFICATION_READ');
    return response.data;
  },

  async clearAllNotifications() {
    const response = await apiClient.delete('/notifications/clear');
    emitEvent('NOTIFICATION_READ');
    return response.data;
  },

  // ── TASKS ─────────────────────────────────────────────────────────────
  
  async getTasks() {
    const response = await apiClient.get('/tasks');
    return response.data;
  },

  // ── AGENTS ────────────────────────────────────────────────────────────

  async getAgentStatus() {
    const response = await apiClient.get('/agents/status');
    return response.data;
  },

  async runPriorityAgent(payload: { title: string, deadline: string, description?: string, estimated_hours?: number }) {
    const response = await apiClient.post('/agents/prioritize', payload);
    return response.data;
  },

  async runPlanningAgent(payload: { tasks: any[], availability: any }, origin: string = 'Planner') {
    const response = await apiClient.post('/agents/plan', payload);
    emitEvent('PLANNER_GENERATED', origin);
    return response.data;
  },

  async getLatestSchedule() {
    const response = await apiClient.get(`/agents/plan/latest?_t=${Date.now()}`);
    return response.data;
  },

  async runRescueAgent(payload: { tasks: any[], availability: any }) {
    const response = await apiClient.post('/agents/rescue', payload);
    return response.data;
  },

  async getRescueHistory() {
    const response = await apiClient.get('/agents/rescue/history');
    return response.data;
  },

  async executeRescuePlan(payload: { plan_id: string, action: string }) {
    const response = await apiClient.post('/agents/rescue/execute', payload);
    emitEvent('RESCUE_EXECUTED');
    return response.data;
  },

  async runDigitalTwin(payload: { scenario: any }) {
    const response = await apiClient.post('/agents/digital-twin', payload);
    return response.data;
  },

  async getDigitalTwinHistory() {
    const response = await apiClient.get('/agents/twin/history');
    return response.data;
  },

  async runVisionAgent(file: File) {
    const formData = new FormData();
    formData.append('image', file);
    const response = await apiClient.post('/agents/vision', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000  // 60s — vision OCR + Mistral can be slow
    });
    return response.data;
  },

  async confirmVisionAgent(data: any) {
    const response = await apiClient.post('/agents/vision/confirm', data);
    return response.data;
  },

  // ── ORCHESTRATION ────────────────────────────────────────────────────────

  async getOrchestrationFeed() {
    const response = await apiClient.get('/orchestration/feed');
    return response.data;
  },

  async runOrchestrationPipeline(file: File) {
    const formData = new FormData();
    formData.append('image', file);
    const response = await apiClient.post('/orchestration/pipeline', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  async executeSystemOrchestration() {
    const response = await apiClient.post('/orchestration/execute', {}, { timeout: 60000 });
    emitEvent('COMMAND_CENTER_REFRESH');
    return response.data;
  },

  // ── ANALYTICS ────────────────────────────────────────────────────────────

  async getAnalyticsOverview() {
    const response = await apiClient.get('/analytics/overview');
    return response.data;
  },

  async getAnalyticsBriefing() {
    const response = await apiClient.get('/analytics/briefing');
    return response.data;
  },

  async getAnalyticsProductivity() {
    const response = await apiClient.get('/analytics/productivity');
    return response.data;
  },

  async getAnalyticsContributions() {
    const response = await apiClient.get('/analytics/contributions');
    return response.data;
  },

  async getAnalyticsIntelligence() {
    const response = await apiClient.get('/analytics/intelligence');
    return response.data;
  },

  async getAnalyticsHeatmap() {
    const response = await apiClient.get('/analytics/heatmap');
    return response.data;
  },

  async getAnalyticsVoice() {
    const response = await apiClient.get('/analytics/voice');
    return response.data;
  },

  async getAnalyticsVision() {
    const response = await apiClient.get('/analytics/vision');
    return response.data;
  },

  async getAnalyticsDocuments() {
    const response = await apiClient.get('/analytics/documents');
    return response.data;
  },

  async getAnalyticsInterventions() {
    const response = await apiClient.get('/analytics/interventions');
    return response.data;
  },

  async getAnalyticsTwinAccuracy() {
    const response = await apiClient.get('/analytics/twin-accuracy');
    return response.data;
  },

  async getAnalyticsInsights() {
    const response = await apiClient.get('/analytics/insights');
    return response.data;
  },

  async downloadReport() {
    const response = await apiClient.get('/reports/download', { responseType: 'blob' });
    return response.data;
  },

  // ── CALENDAR ─────────────────────────────────────────────────────────────

  async getCalendarEvents() {
    const response = await apiClient.get('/calendar/events');
    return response.data;
  },

  async getCalendarIntelligence() {
    const response = await apiClient.get('/calendar/intelligence');
    return response.data;
  },

  async rescheduleCalendarEvent(id: string, start: string, end: string) {
    const response = await apiClient.post('/calendar/reschedule', { id, start, end });
    return response.data;
  },

  // ── INTERVENTIONS ────────────────────────────────────────────────────────

  async getInterventionThreats() {
    const response = await apiClient.get('/interventions/threats');
    return response.data;
  },

  async scanInterventions() {
    const response = await apiClient.post('/interventions/scan');
    return response.data;
  },

  async executeInterventionStrategy(payload: { strategy_name: string, actions: any[] }) {
    const response = await apiClient.post('/interventions/execute', payload);
    return response.data;
  },

  async undoIntervention(executionId: string) {
    const response = await apiClient.post(`/interventions/undo/${executionId}`);
    return response.data;
  },

  // ── GOALS & HABITS ───────────────────────────────────────────────────────

  async getGoals() {
    const response = await apiClient.get('/goals');
    return response.data;
  },

  async getHabits() {
    const response = await apiClient.get('/habits');
    return response.data;
  },

  async createGoal(payload: { title: string, description?: string, category?: string, target_date?: string }) {
    const response = await apiClient.post('/goals', payload);
    emitEvent('GOAL_CREATED');
    return response.data;
  },

  async createHabit(payload: { name: string, category?: string, frequency?: string }) {
    const response = await apiClient.post('/habits', payload);
    emitEvent('HABIT_CREATED');
    return response.data;
  },

  async editGoal(goalId: string, payload: any) {
    const response = await apiClient.put(`/goals/${goalId}`, payload);
    emitEvent('GOAL_UPDATED');
    return response.data;
  },

  async archiveGoal(goalId: string) {
    const response = await apiClient.post(`/goals/${goalId}/archive`);
    emitEvent('GOAL_ARCHIVED');
    return response.data;
  },

  async unarchiveGoal(goalId: string) {
    const response = await apiClient.post(`/goals/${goalId}/unarchive`);
    return response.data;
  },

  async pinGoal(goalId: string) {
    const response = await apiClient.post(`/goals/${goalId}/pin`);
    return response.data;
  },

  async deleteGoal(goalId: string) {
    const response = await apiClient.delete(`/goals/${goalId}`);
    emitEvent('GOAL_UPDATED');
    return response.data;
  },

  async updateMilestoneStatus(milestoneId: string, status: string) {
    const response = await apiClient.put(`/milestones/${milestoneId}/status`, { status });
    emitEvent('GOAL_UPDATED');
    return response.data;
  },

  async editHabit(habitId: string, payload: any) {
    const response = await apiClient.put(`/habits/${habitId}`, payload);
    emitEvent('HABIT_UPDATED');
    return response.data;
  },

  async archiveHabit(habitId: string) {
    const response = await apiClient.post(`/habits/${habitId}/archive`);
    return response.data;
  },

  async unarchiveHabit(habitId: string) {
    const response = await apiClient.post(`/habits/${habitId}/unarchive`);
    return response.data;
  },

  async deleteHabit(habitId: string) {
    const response = await apiClient.delete(`/habits/${habitId}`);
    return response.data;
  },

  async setHabitStatus(habitId: string, status: string) {
    const response = await apiClient.post(`/habits/${habitId}/status`, { status });
    emitEvent('HABIT_UPDATED');
    return response.data;
  },

  async checkInHabit(habitId: string) {
    const response = await apiClient.post(`/habits/${habitId}/checkin`);
    emitEvent('HABIT_CHECKIN');
    return response.data;
  },

  // ── DOCUMENTS ────────────────────────────────────────────────────────────

  async uploadDocument(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000  // 60s — Mistral analysis can be slow
    });
    return response.data;
  },

  // ── VOICE COPILOT ────────────────────────────────────────────────────────

  async processVoiceTranscript(transcript: string, timezone?: string) {
    const response = await apiClient.post('/voice/process', {
      transcript,
      timezone: timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
    return response.data;
  },

  // ── DEMO/SIMULATION ──────────────────────────────────────────────────────
  
  async runDigitalTwinSimulation(userId: string) {
    const response = await apiClient.post(`/demo/simulate-twin/${userId}`, {});
    return response.data;
  },

  // ── SETTINGS & PROFILE ───────────────────────────────────────────────────

  async getProfile() {
    const response = await apiClient.get('/settings/profile');
    return response.data;
  },

  async updateProfile(data: any) {
    const response = await apiClient.put('/settings/profile', data);
    return response.data;
  },

  async getSettings(section: string) {
    const response = await apiClient.get(`/settings/${section}`);
    return response.data;
  },

  async updateSettings(section: string, data: any) {
    const response = await apiClient.put(`/settings/${section}`, data);
    return response.data;
  },

  async getSessions() {
    const response = await apiClient.get('/settings/sessions');
    return response.data;
  },

  async deleteSession(sessionId: string) {
    const response = await apiClient.delete(`/settings/session/${sessionId}`);
    return response.data;
  },

  async getConnectedAccounts() {
    const response = await apiClient.get('/settings/accounts');
    return response.data;
  },

  async updateConnectedAccounts(data: any) {
    const response = await apiClient.put('/settings/accounts', data);
    return response.data;
  },

  async exportData() {
    const response = await apiClient.post('/settings/export', {});
    return response.data;
  },

  async deleteAccount() {
    const response = await apiClient.delete('/account');
    return response.data;
  }
};
