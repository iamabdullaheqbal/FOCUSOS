'use client'

import React from 'react';
import { SettingsSection, SettingsCard, Toggle, Select } from '../../components/UI/SettingsUI';
import { useSettings } from '../../context/SettingsContext';

export const AppearanceSettings: React.FC = () => {
  const { settings, updateSection, loading } = useSettings();

  const appearance = settings.appearance || {};

  const handleUpdate = async (key: string, value: any) => {
    try {
      await updateSection('appearance', { [key]: value });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading && !Object.keys(appearance).length) return <div className="text-slate-400">Loading...</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SettingsSection 
        title="Appearance" 
        description="Customize the aesthetic and layout of FocusOS."
      >
        <SettingsCard>
          <Select 
            label="Theme" 
            value={appearance.theme || 'system'} 
            onChange={(val) => handleUpdate('theme', val)}
            options={[
              { value: 'dark', label: 'Dark Mode' },
              { value: 'light', label: 'Light Mode' },
              { value: 'system', label: 'System Default' }
            ]}
          />
          <div className="h-px bg-slate-800 my-2" />
          <Select 
            label="Accent Color" 
            value={appearance.accent_color || 'indigo'} 
            onChange={(val) => handleUpdate('accent_color', val)}
            options={[
              { value: 'indigo', label: 'Indigo (Default)' },
              { value: 'emerald', label: 'Emerald' },
              { value: 'rose', label: 'Rose' },
              { value: 'amber', label: 'Amber' }
            ]}
          />
        </SettingsCard>
      </SettingsSection>

      <SettingsSection 
        title="Accessibility & Layout" 
        description="Fine-tune how FocusOS elements are rendered."
      >
        <SettingsCard className="space-y-4">
          <Toggle 
            label="Compact Mode" 
            description="Reduce padding and margin for higher data density."
            checked={appearance.compact_mode || false}
            onChange={(val) => handleUpdate('compact_mode', val)}
          />
          <Toggle 
            label="Reduced Motion" 
            description="Disable non-essential animations and transitions."
            checked={appearance.reduced_motion || false}
            onChange={(val) => handleUpdate('reduced_motion', val)}
          />
          <Toggle 
            label="Sidebar Collapse" 
            description="Automatically collapse the main navigation sidebar."
            checked={appearance.sidebar_collapse || false}
            onChange={(val) => handleUpdate('sidebar_collapse', val)}
          />
        </SettingsCard>
      </SettingsSection>
    </div>
  );
};
