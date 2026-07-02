'use client'

import React, { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, ChevronDown } from 'lucide-react';

export const SettingsSection: React.FC<{ title: string, description: string, children: ReactNode }> = ({ title, description, children }) => (
  <motion.section 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="mb-12"
  >
    <div className="mb-6">
      <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
      <p className="text-slate-400 text-sm mt-1">{description}</p>
    </div>
    <div className="space-y-4">
      {children}
    </div>
  </motion.section>
);

export const SettingsCard: React.FC<{ children: ReactNode, className?: string }> = React.memo(({ children, className = "" }) => (
  <div className={`bg-slate-900/50 border border-slate-800 rounded-2xl p-6 ${className}`}>
    {children}
  </div>
));
SettingsCard.displayName = 'SettingsCard';

export const Toggle: React.FC<{ label: string, description?: string, checked: boolean, onChange: (val: boolean) => void }> = React.memo(({ label, description, checked, onChange }) => (
  <div className="flex items-center justify-between py-2 cursor-pointer group" onClick={() => onChange(!checked)}>
    <div>
      <div className="text-sm font-medium text-white group-hover:text-indigo-300 transition-colors">{label}</div>
      {description && <div className="text-xs text-slate-500 mt-1">{description}</div>}
    </div>
    <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-indigo-500' : 'bg-slate-700'}`}>
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </div>
  </div>
));
Toggle.displayName = 'Toggle';

export const Select: React.FC<{ label: string, value: string, options: {value: string, label: string}[], onChange: (val: string) => void }> = ({ label, value, options, onChange }) => (
  <div className="flex items-center justify-between py-2">
    <div className="text-sm font-medium text-white">{label}</div>
    <div className="relative">
      <select 
        value={value} 
        onChange={e => onChange(e.target.value)}
        className="appearance-none bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-xl pl-4 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-w-[150px] cursor-pointer"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
    </div>
  </div>
);

export const DangerZone: React.FC<{ title: string, description: string, buttonText: string, onAction: () => void, loading?: boolean }> = ({ title, description, buttonText, onAction, loading }) => (
  <div className="border border-red-500/20 bg-red-500/5 rounded-2xl p-6 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
    <div>
      <h3 className="text-red-400 font-semibold mb-1 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4" /> {title}
      </h3>
      <p className="text-sm text-slate-400">{description}</p>
    </div>
    <button 
      onClick={onAction}
      disabled={loading}
      className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 px-6 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
    >
      {loading ? "Processing..." : buttonText}
    </button>
  </div>
);
