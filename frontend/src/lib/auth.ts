/**
 * FocusOS — Local Auth Client
 * ================================
 * Replaces @supabase/supabase-js for auth.
 * Tokens are stored in localStorage and sent as Bearer headers.
 */

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

export interface AuthUser {
  id: string;
  email: string;
  username?: string;
  full_name?: string;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  user: AuthUser;
}

const KEYS = {
  access:  'dos_access_token',
  refresh: 'dos_refresh_token',
  user:    'dos_user',
};

// ── Storage helpers ───────────────────────────────────────────────────────────

export function saveSession(session: AuthSession) {
  localStorage.setItem(KEYS.access,  session.access_token);
  localStorage.setItem(KEYS.refresh, session.refresh_token);
  localStorage.setItem(KEYS.user,    JSON.stringify(session.user));
}

export function clearSession() {
  localStorage.removeItem(KEYS.access);
  localStorage.removeItem(KEYS.refresh);
  localStorage.removeItem(KEYS.user);
}

export function getAccessToken(): string | null {
  return localStorage.getItem(KEYS.access);
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(KEYS.user);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

// ── API calls ─────────────────────────────────────────────────────────────────

async function post(path: string, body: object): Promise<any> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    // Backend returns { "error": { "code": "...", "message": "..." } }
    const msg =
      typeof data?.error === 'string'        ? data.error :
      typeof data?.error?.message === 'string' ? data.error.message :
      typeof data?.message === 'string'      ? data.message :
      `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

// ── Public API ────────────────────────────────────────────────────────────────

export const localAuth = {
  async signUp(email: string, password: string, full_name?: string): Promise<AuthSession> {
    const data = await post('/auth/register', { email, password, full_name });
    saveSession(data);
    return data;
  },

  async signIn(email: string, password: string): Promise<AuthSession> {
    const data = await post('/auth/login', { email, password });
    saveSession(data);
    return data;
  },

  async signInDemo(): Promise<AuthSession> {
    const data = await post('/demo/start', {});
    saveSession(data);
    return data;
  },

  async refreshSession(): Promise<AuthSession | null> {
    const refresh_token = localStorage.getItem(KEYS.refresh);
    if (!refresh_token) return null;
    try {
      const data = await post('/auth/refresh', { refresh_token });
      saveSession(data);
      return data;
    } catch {
      clearSession();
      return null;
    }
  },

  signOut() {
    clearSession();
  },

  getSession(): { access_token: string; user: AuthUser } | null {
    const token = getAccessToken();
    const user  = getStoredUser();
    if (!token || !user) return null;
    return { access_token: token, user };
  },
};
