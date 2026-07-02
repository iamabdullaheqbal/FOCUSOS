'use client'

import React from 'react';
import { SettingsSection, SettingsCard, Toggle, Select } from '../../components/UI/SettingsUI';
import { useSettings } from '../../context/SettingsContext';

export const PlannerSettings: React.FC = () => {
  const { settings, updateSection, loading } = useSettings();

  const p = settings.planner || {};

  const handleUpdate = async (key: string, value: any) => {
    try {
      await updateSection('planner', { [key]: value });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading && !Object.keys(p).length) return <div className="text-slate-400">Loading...</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SettingsSection 
        title="Schedule Orchestration" 
        description="Configure how the AI Planner allocates your time."
      >
        <SettingsCard className="space-y-4">
          <Select 
            label="Default Planning Horizon" 
            value={p.default_planning_horizon || '7'} 
            onChange={(val) => handleUpdate('default_planning_horizon', val)}
            options={[
              { value: '1', label: '1 Day (Tactical)' },
              { value: '3', label: '3 Days (Balanced)' },
              { value: '7', label: '7 Days (Strategic)' },
              { value: '14', label: '14 Days (Long-term)' }
            ]}
          />
          <div className="h-px bg-slate-800 my-2" />
          <Select 
            label="AI Planning Mode" 
            value={p.ai_planning_mode || 'balanced'} 
            onChange={(val) => handleUpdate('ai_planning_mode', val)}
            options={[
              { value: 'safe', label: 'Safe (Padding between tasks)' },
              { value: 'balanced', label: 'Balanced (Standard)' },
              { value: 'aggressive', label: 'Aggressive (Maximum density)' }
            ]}
          />
          <div className="h-px bg-slate-800 my-2" />
          <Select 
            label="Priority Strategy" 
            value={p.priority_strategy || 'eisenhower'} 
            onChange={(val) => handleUpdate('priority_strategy', val)}
            options={[
              { value: 'eisenhower', label: 'Eisenhower Matrix (Urgent/Important)' },
              { value: 'impact', label: 'Impact / Effort Ratio' },
              { value: 'deadline', label: 'Strict Deadline Proximity' }
            ]}
          />
        </SettingsCard>
      </SettingsSection>

      <SettingsSection 
        title="Time Boundaries" 
        description="Set guardrails for task scheduling."
      >
        <SettingsCard className="space-y-4">
          <Toggle 
            label="Auto-Scheduling" 
            description="Allow the AI to move tasks automatically to optimize your day."
            checked={p.auto_scheduling ?? true}
            onChange={(val) => handleUpdate('auto_scheduling', val)}
          />
          <Toggle 
            label="Weekend Planning" 
            description="Allow tasks to be scheduled on Saturdays and Sundays."
            checked={p.weekend_planning ?? false}
            onChange={(val) => handleUpdate('weekend_planning', val)}
          />
          <Toggle 
            label="Calendar Sync" 
            description="Prevent tasks from overlapping with Google Calendar events."
            checked={p.calendar_sync ?? true}
            onChange={(val) => handleUpdate('calendar_sync', val)}
          />
          <Toggle 
            label="Deadline Buffer" 
            description="Force tasks to be scheduled at least 24h before their actual deadline."
            checked={p.deadline_buffer ?? true}
            onChange={(val) => handleUpdate('deadline_buffer', val)}
          />
        </SettingsCard>
      </SettingsSection>
    </div>
  );
};
