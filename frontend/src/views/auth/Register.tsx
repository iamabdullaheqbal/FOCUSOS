'use client';

import React, { useState } from 'react';
import { usePageMeta } from '../../hooks/usePageMeta';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { localAuth } from '../../lib/auth';
import { notifyAuthChange } from '../../context/AuthContext';
import { Lock, Mail, ArrowRight, UserPlus, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Background } from '../../components/Landing/Background';

export const Register: React.FC = () => {
  usePageMeta('Register');
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName]     = useState('');
  const [showPassword, setShowPassword]         = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const router = useRouter();

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { label: '', color: 'bg-slate-700' };
    if (pass.length < 6) return { label: 'Weak', color: 'bg-red-500' };
    if (pass.length >= 8 && /[A-Z]/.test(pass) && /[0-9]/.test(pass)) return { label: 'Very Strong', color: 'bg-emerald-500' };
    if (pass.length >= 6 && /[0-9]/.test(pass)) return { label: 'Strong', color: 'bg-green-500' };
    return { label: 'Medium', color: 'bg-yellow-500' };
  };

  const strength       = getPasswordStrength(password);
  const passwordsMatch = password && confirmPassword ? password === confirmPassword : null;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    setLoading(true);
    setError(null);
    try {
      await localAuth.signUp(email, password, fullName || undefined);
      notifyAuthChange();
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

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
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-indigo-500/5 pointer-events-none" />

          <div className="relative z-10">
            <div className="flex justify-center mb-8">
              <div className="bg-purple-500/10 p-4 rounded-2xl border border-purple-500/20">
                <UserPlus className="w-10 h-10 text-purple-400" />
              </div>
            </div>

            <h2 className="text-3xl font-bold text-center text-slate-100 mb-2">Create Account</h2>
            <p className="text-center text-slate-400 mb-8">Join FocusOS and take back your time</p>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg mb-6 text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Full Name (optional)</label>
                <div className="relative">
                  <input
                    type="text" value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="block w-full px-4 py-3 border border-slate-700 rounded-xl bg-slate-900/50 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="Jane Smith"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    type="email" required value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-slate-700 rounded-xl bg-slate-900/50 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
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
                    className="block w-full pl-10 pr-10 py-3 border border-slate-700 rounded-xl bg-slate-900/50 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors focus:outline-none">
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {password && (
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex gap-1 w-full max-w-[120px]">
                      <div className={`h-1.5 w-1/4 rounded-full ${password.length >= 1 ? strength.color : 'bg-slate-700'}`} />
                      <div className={`h-1.5 w-1/4 rounded-full ${['Medium','Strong','Very Strong'].includes(strength.label) ? strength.color : 'bg-slate-700'}`} />
                      <div className={`h-1.5 w-1/4 rounded-full ${['Strong','Very Strong'].includes(strength.label) ? strength.color : 'bg-slate-700'}`} />
                      <div className={`h-1.5 w-1/4 rounded-full ${strength.label === 'Very Strong' ? strength.color : 'bg-slate-700'}`} />
                    </div>
                    <span className="text-xs text-slate-400 font-medium">{strength.label}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Confirm Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'} required value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`block w-full pl-10 pr-10 py-3 border rounded-xl bg-slate-900/50 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${
                      passwordsMatch === false ? 'border-red-500' : passwordsMatch === true ? 'border-emerald-500' : 'border-slate-700'
                    }`}
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors focus:outline-none">
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {confirmPassword && (
                  <div className="mt-2 flex items-center gap-1.5">
                    {passwordsMatch
                      ? <><CheckCircle2 className="w-4 h-4 text-emerald-500" /><span className="text-xs text-emerald-500 font-medium">Passwords match</span></>
                      : <><XCircle className="w-4 h-4 text-red-500" /><span className="text-xs text-red-500 font-medium">Passwords do not match</span></>
                    }
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit" disabled={loading}
                  className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all group"
                >
                  {loading ? 'Creating Account...' : 'Sign Up'}
                  {!loading && <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                </button>
              </div>
            </form>

            <p className="mt-8 text-center text-sm text-slate-400">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-purple-400 hover:text-purple-300 transition-colors">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
