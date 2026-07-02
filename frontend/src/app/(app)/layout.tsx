'use client';

export const dynamic = 'force-dynamic';

import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Layout } from '../../components/Layout/Layout';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  const devBypass =
    typeof window !== 'undefined' &&
    process.env.NODE_ENV === 'development' &&
    localStorage.getItem('dev_bypass_auth') === 'true';

  useEffect(() => {
    if (!loading && !user && !devBypass) {
      router.replace('/login');
    }
  }, [user, loading, devBypass, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-slate-300">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          <p className="text-sm font-medium tracking-wide">Authenticating Identity...</p>
        </div>
      </div>
    );
  }

  if (!user && !devBypass) return null;

  return <Layout>{children}</Layout>;
}
