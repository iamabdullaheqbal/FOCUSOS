'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { localAuth } from '../lib/auth';
import { notifyAuthChange } from '../context/AuthContext';

interface UseDemoLoginReturn {
  handleDemoLogin: () => Promise<void>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useDemoLogin(): UseDemoLoginReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const router = useRouter();

  const handleDemoLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await localAuth.signInDemo();
      notifyAuthChange();
      router.push('/dashboard');
    } catch (err: any) {
      setError('Demo service unavailable. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return { handleDemoLogin, loading, error, clearError: () => setError(null) };
}
