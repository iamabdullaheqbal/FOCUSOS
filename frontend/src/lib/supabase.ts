/**
 * Supabase has been replaced with local PostgreSQL + JWT auth.
 * This file exists only to keep legacy imports from crashing.
 * All auth logic now lives in src/lib/auth.ts
 */

export const isSupabaseConfigured = true; // always true — we use local auth now

// Minimal shim so any leftover `supabase.auth.*` calls don't crash at runtime
export const supabase = {
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: (_event: any, _cb: any) => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signOut: async () => ({ error: null }),
    setSession: async (_s: any) => ({ error: null }),
    signInWithPassword: async (_c: any) => ({ error: { message: 'Use localAuth from src/lib/auth.ts' } }),
    signUp: async (_c: any) => ({ data: { session: null }, error: { message: 'Use localAuth from src/lib/auth.ts' } }),
  },
} as any;
