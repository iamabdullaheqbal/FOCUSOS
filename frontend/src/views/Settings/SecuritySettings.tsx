'use client'

import React, { useState } from 'react';
import { SettingsSection, SettingsCard, Toggle } from '../../components/UI/SettingsUI';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export const SecuritySettings: React.FC = () => {
  const { settings, updateSection, loading } = useSettings();
  const { user } = useAuth();
  
  const [resetLoading, setResetLoading] = useState(false);
  const [resetStatus, setResetStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState<string | null>(null);
  const [changePasswordSuccess, setChangePasswordSuccess] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const sec = settings.security || {};

  const handleUpdate = async (key: string, value: any) => {
    try {
      await updateSection('security', { [key]: value });
    } catch (err) {
      console.error(err);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    
    setResetLoading(true);
    setResetStatus('idle');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/settings/security`,
      });
      if (error) throw error;
      setResetStatus('success');
    } catch (err) {
      console.error(err);
      setResetStatus('error');
    } finally {
      setResetLoading(false);
      setTimeout(() => {
        setResetStatus('idle');
      }, 5000);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setChangePasswordError('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setChangePasswordError('Password must be at least 6 characters');
      return;
    }
    setChangePasswordLoading(true);
    setChangePasswordError(null);
    setChangePasswordSuccess(false);

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setChangePasswordSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setChangePasswordSuccess(false), 5000);
    } catch (err: any) {
      console.error(err);
      setChangePasswordError(err.message || 'Failed to update password');
    } finally {
      setChangePasswordLoading(false);
    }
  };

  if (loading && !Object.keys(sec).length) return <div className="text-slate-400">Loading...</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SettingsSection 
        title="Authentication" 
        description="Manage your account security and login methods."
      >
        <SettingsCard className="space-y-4">
          <Toggle 
            label="Two-Factor Authentication (2FA)" 
            description="Require a secondary code from an authenticator app when logging in."
            checked={sec.two_factor_enabled ?? false}
            onChange={(val) => handleUpdate('two_factor_enabled', val)}
          />
          <Toggle 
            label="Email Login Alerts" 
            description="Get notified when a new device logs into your account."
            checked={sec.login_alerts ?? true}
            onChange={(val) => handleUpdate('login_alerts', val)}
          />
        </SettingsCard>
      </SettingsSection>
      
      <SettingsSection 
        title="Password Management" 
        description="Update your password directly, or send a reset link to your email."
      >
        <SettingsCard className="space-y-6">
          <form onSubmit={handleChangePassword} className="space-y-4">
            <h3 className="text-sm font-semibold text-white mb-2">Change Password</h3>
            {changePasswordError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-2 rounded-md">
                {changePasswordError}
              </div>
            )}
            {changePasswordSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-2 rounded-md">
                Password updated successfully.
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">New Password</label>
                <input 
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  placeholder="New Password"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Confirm Password</label>
                <input 
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  placeholder="Confirm Password"
                />
              </div>
            </div>
            <div>
              <button 
                type="submit"
                disabled={changePasswordLoading || !newPassword || !confirmPassword}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {changePasswordLoading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
          
          <div className="h-px bg-slate-800 my-4" />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white font-medium">Forgot Password?</p>
              <p className="text-xs text-slate-400 mt-1">A secure link will be sent to {user?.email || 'your email'}.</p>
            </div>
            <div className="flex items-center gap-3">
              {resetStatus === 'success' && (
                <span className="text-emerald-400 text-xs font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Link Sent
                </span>
              )}
              {resetStatus === 'error' && (
                <span className="text-red-400 text-xs font-medium flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> Error sending link
                </span>
              )}
              <button 
                onClick={handlePasswordReset}
                disabled={resetLoading}
                className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {resetLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </div>
          </div>
        </SettingsCard>
      </SettingsSection>
    </div>
  );
};
