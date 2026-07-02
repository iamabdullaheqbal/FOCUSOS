import React from 'react';
import { SettingsSection, SettingsCard } from '../../components/UI/SettingsUI';

export const AboutSettings: React.FC = () => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SettingsSection 
        title="About FocusOS" 
        description="System information and legal."
      >
        <SettingsCard className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b border-slate-800/50">
            <span className="text-sm font-medium text-slate-400">Version</span>
            <span className="text-sm text-white font-mono">v1.0.0 (Release Candidate)</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-slate-800/50">
            <span className="text-sm font-medium text-slate-400">Build</span>
            <span className="text-sm text-white font-mono">2026.06.27-rc1</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-slate-800/50">
            <span className="text-sm font-medium text-slate-400">Database</span>
            <span className="text-sm text-emerald-400 font-mono">Connected (Neon Postgres)</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-slate-800/50">
            <span className="text-sm font-medium text-slate-400">AI Engine</span>
            <span className="text-sm text-indigo-400 font-mono">Gemini 2.0 Flash</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-medium text-slate-400">License</span>
            <span className="text-sm text-white font-mono">Enterprise Pro</span>
          </div>
        </SettingsCard>
      </SettingsSection>
    </div>
  );
};
