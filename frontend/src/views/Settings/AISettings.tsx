'use client'

import React from 'react';
import { SettingsSection, SettingsCard, Toggle, Select } from '../../components/UI/SettingsUI';
import { useSettings } from '../../context/SettingsContext';

export const AISettings: React.FC = () => {
  const { settings, updateSection, loading } = useSettings();

  const ai = settings.ai || {};

  const handleUpdate = async (key: string, value: any) => {
    try {
      await updateSection('ai', { [key]: value });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading && !Object.keys(ai).length) return <div className="text-slate-400">Loading...</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SettingsSection 
        title="Intelligence Engine" 
        description="Configure the core models used by FocusOS."
      >
        <SettingsCard className="space-y-4">
          <Select 
            label="Primary Model" 
            value={ai.primary_model || 'gemini-2.0-flash'} 
            onChange={(val) => handleUpdate('primary_model', val)}
            options={[
              { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (Fast)' },
              { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (Deep Reasoning)' },
              { value: 'local-llama-3', label: 'Local Llama 3 (Offline)' }
            ]}
          />
          <div className="h-px bg-slate-800 my-2" />
          <Select 
            label="Fallback Model" 
            value={ai.fallback_model || 'gemini-1.5-pro'} 
            onChange={(val) => handleUpdate('fallback_model', val)}
            options={[
              { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
              { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
              { value: 'none', label: 'No Fallback (Fail Fast)' }
            ]}
          />
          <div className="h-px bg-slate-800 my-2" />
          <Toggle 
            label="Local Intelligence" 
            description="Process sensitive tasks completely on-device. Disables some advanced features."
            checked={ai.local_intelligence_enabled ?? false}
            onChange={(val) => handleUpdate('local_intelligence_enabled', val)}
          />
        </SettingsCard>
      </SettingsSection>

      <SettingsSection 
        title="Agent Parameters" 
        description="Tune how autonomous agents behave and respond."
      >
        <SettingsCard className="space-y-4">
          <Select 
            label="Reasoning Level" 
            value={ai.reasoning_level || 'standard'} 
            onChange={(val) => handleUpdate('reasoning_level', val)}
            options={[
              { value: 'fast', label: 'Fast (Direct action)' },
              { value: 'standard', label: 'Standard (Balanced)' },
              { value: 'deep', label: 'Deep (Extensive Chain of Thought)' }
            ]}
          />
          <div className="h-px bg-slate-800 my-2" />
          <Select 
            label="Response Verbosity" 
            value={ai.response_verbosity || 'concise'} 
            onChange={(val) => handleUpdate('response_verbosity', val)}
            options={[
              { value: 'concise', label: 'Concise (Action-oriented)' },
              { value: 'detailed', label: 'Detailed (Explanatory)' }
            ]}
          />
          <div className="h-px bg-slate-800 my-2" />
          <Toggle 
            label="Auto-Summarize Documents" 
            description="Automatically generate briefings when long PDFs are uploaded."
            checked={ai.auto_summarize ?? true}
            onChange={(val) => handleUpdate('auto_summarize', val)}
          />
        </SettingsCard>
      </SettingsSection>
    </div>
  );
};
