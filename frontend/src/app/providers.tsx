'use client';

import { AuthProvider } from '../context/AuthContext';
import { SettingsProvider } from '../context/SettingsContext';
import { GlobalErrorToast } from '../components/GlobalErrorToast';
import { ErrorBoundary } from '../components/ErrorBoundary';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SettingsProvider>
          {children}
          <GlobalErrorToast />
        </SettingsProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
