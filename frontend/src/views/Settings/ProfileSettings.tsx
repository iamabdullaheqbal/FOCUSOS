'use client'

import React, { useState, useEffect } from 'react';
import { SettingsSection, SettingsCard } from '../../components/UI/SettingsUI';
import { useSettings } from '../../context/SettingsContext';

export const ProfileSettings: React.FC = () => {
  const { settings, updateSection, loading } = useSettings();
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    email: '',
    country: ''
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (settings.profile) {
      setFormData({
        full_name: settings.profile.full_name || '',
        username: settings.profile.username || '',
        email: settings.profile.email || '',
        country: settings.profile.country || ''
      });
    }
  }, [settings.profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setSaved(false);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSection('profile', formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !settings.profile?.id) return <div className="text-slate-400">Loading profile...</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SettingsSection 
        title="Public Profile" 
        description="This information will be displayed publicly or to workspace members."
      >
        <SettingsCard>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Avatar section */}
              <div className="flex flex-col items-center gap-3 w-32">
                <div className="w-24 h-24 rounded-full bg-indigo-500/20 border-2 border-indigo-500/50 flex items-center justify-center text-indigo-400 text-3xl font-bold">
                  {formData.full_name ? formData.full_name.charAt(0).toUpperCase() : 'U'}
                </div>
                <button type="button" className="text-xs text-indigo-400 font-medium hover:text-indigo-300">
                  Change Avatar
                </button>
              </div>
              
              {/* Form fields */}
              <div className="flex-1 space-y-4">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg text-center">
                    {error}
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-300">Full Name</label>
                    <input 
                      type="text" 
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-300">Username</label>
                    <input 
                      type="text" 
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50" 
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-300">Email Address</label>
                  <input 
                    type="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-slate-500 cursor-not-allowed" 
                  />
                  <p className="text-xs text-slate-500">Email is managed by Supabase Auth.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-300">Country</label>
                    <select 
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50" 
                    >
                      <option value="">Select Country...</option>
                      <option value="US">United States</option>
                      <option value="GB">United Kingdom</option>
                      <option value="CA">Canada</option>
                      <option value="AU">Australia</option>
                      <option value="IN">India</option>
                      <option value="DE">Germany</option>
                      <option value="FR">France</option>
                      <option value="JP">Japan</option>
                      <option value="SG">Singapore</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex items-center gap-4">
                  <button 
                    type="submit"
                    disabled={saving}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-xl font-medium transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  {saved && <span className="text-emerald-400 text-sm font-medium">Saved successfully!</span>}
                </div>
              </div>
            </div>
          </form>
        </SettingsCard>
      </SettingsSection>
    </div>
  );
};
