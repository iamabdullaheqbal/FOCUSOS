'use client'

import React, { createContext, useContext, useEffect, useState } from 'react';
import { localAuth, type AuthUser, clearSession } from '../lib/auth';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser]       = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session from localStorage on mount
    const session = localAuth.getSession();
    if (session) {
      setUser(session.user);
    }
    setLoading(false);
  }, []);

  const signOut = () => {
    clearSession();
    setUser(null);
  };

  // Expose a way for Login/Register pages to update context after sign-in
  // by watching localStorage changes (same-tab via custom event)
  useEffect(() => {
    const handler = () => {
      const session = localAuth.getSession();
      setUser(session?.user ?? null);
    };
    window.addEventListener('dos_auth_change', handler);
    return () => window.removeEventListener('dos_auth_change', handler);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

/** Call this after a successful login/register to update the AuthContext. */
export function notifyAuthChange() {
  window.dispatchEvent(new Event('dos_auth_change'));
}
