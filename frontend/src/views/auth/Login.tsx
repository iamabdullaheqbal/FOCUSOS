'use client';

import React, { useState } from 'react';
import { usePageMeta } from '../../hooks/usePageMeta';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { localAuth } from '../../lib/auth';
import { notifyAuthChange } from '../../context/AuthContext';
import { Lock, Mail, ArrowRight, ShieldCheck, Zap, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Background } from '../../components/Landing/Background';

export const Login: React.FC = () => {
  usePageMeta('Login');
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [loading, setLoading]       = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { user }  = useAuth();

  React.useEffect(() => {
    if (user) router.push('/dashboard');
  }, [user, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await localAuth.signIn(email, password);
      notifyAuthChange();
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setDemoLoading(true);
    setError(null);
    try {
      await localAuth.signInDemo();
      notifyAuthChange();
      router.push('/dashboard');
    } catch (err: any) {
      setError('Demo unavailable: ' + (err.message || 'backend not running'));
    } finally {
      setDemoLoading(false);
    }
  };

  const handleGuestAccess = () => {
    localStorage.setItem('dev_bypass_auth', 'true');
    window.location.href = '/dashboard';
  };

  const isLoading    = loading || demoLoading;

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 relative overflow-hidden">
      <Background />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 pointer-events-none" />

          <div className="relative z-10">
            <div className="flex justify-center mb-8">
              <div className="bg-indigo-500/10 p-4 rounded-2xl border border-indigo-500/20">
                <ShieldCheck className="w-10 h-10 text-indigo-400" />
              </div>
            </div>

            <h2 className="text-3xl font-bold text-center text-slate-100 mb-2">Welcome Back</h2>
            <p className="text-center text-slate-400 mb-8">Sign in to access your FocusOS Dashboard</p>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg mb-6 text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    type="email" required value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-slate-700 rounded-xl bg-slate-900/50 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'} required value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 py-3 border border-slate-700 rounded-xl bg-slate-900/50 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit" disabled={isLoading}
                  className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all group"
                >
                  {loading ? 'Authenticating...' : 'Sign In'}
                  {!loading && <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                </button>
              </div>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-800 space-y-3">
              <button
                onClick={handleDemoLogin} type="button" disabled={isLoading}
                className="w-full flex items-center justify-center py-3 px-4 border border-slate-700 rounded-xl shadow-sm text-sm font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Zap className="mr-2 w-4 h-4 text-yellow-400" />
                {demoLoading ? 'Launching Demo...' : 'Quick Access (Demo Account)'}
              </button>

              {process.env.NODE_ENV === 'development' && (
                <button
                  onClick={handleGuestAccess} type="button"
                  className="w-full flex items-center justify-center py-3 px-4 border border-slate-700/50 rounded-xl text-sm font-medium text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 focus:outline-none transition-all"
                >
                  Continue as Guest (dev only — no backend needed)
                </button>
              )}
            </div>

            <p className="mt-8 text-center text-sm text-slate-400">
              Don't have an account?{' '}
              <Link href="/register" className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
                Create one now
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
