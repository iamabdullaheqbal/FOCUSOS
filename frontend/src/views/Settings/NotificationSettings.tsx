'use client'

import React from 'react';
import { SettingsSection, SettingsCard, Toggle } from '../../components/UI/SettingsUI';
import { useSettings } from '../../context/SettingsContext';

export const NotificationSettings: React.FC = () => {
  const { settings, updateSection, loading } = useSettings();

  const n = settings.notifications || {};

  const handleUpdate = async (key: string, value: any) => {
    try {
      await updateSection('notifications', { [key]: value });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading && !Object.keys(n).length) return <div className="text-slate-400">Loading...</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SettingsSection 
        title="Delivery Methods" 
        description="Choose how you receive notifications from FocusOS."
      >
        <SettingsCard className="space-y-4">
          <Toggle 
            label="Email Notifications" 
            description="Receive daily summaries and critical alerts via email."
            checked={n.email_notifications ?? true}
            onChange={(val) => handleUpdate('email_notifications', val)}
          />
          <Toggle 
            label="Push Notifications" 
            description="Receive real-time push notifications on this device."
            checked={n.push_notifications ?? false}
            onChange={(val) => handleUpdate('push_notifications', val)}
          />
        </SettingsCard>
      </SettingsSection>

      <SettingsSection 
        title="Notification Types" 
        description="Select which events trigger a notification."
      >
        <SettingsCard className="space-y-4">
          <Toggle 
            label="AI Alerts" 
            description="Intelligence briefings and context shifts."
            checked={n.ai_alerts ?? true}
            onChange={(val) => handleUpdate('ai_alerts', val)}
          />
          <Toggle 
            label="Goal Reminders" 
            description="Updates on long-term objectives."
            checked={n.goal_reminders ?? true}
            onChange={(val) => handleUpdate('goal_reminders', val)}
          />
          <Toggle 
            label="Planner Reminders" 
            description="Upcoming tasks and schedule changes."
            checked={n.planner_reminders ?? true}
            onChange={(val) => handleUpdate('planner_reminders', val)}
          />
          <Toggle 
            label="Calendar Reminders" 
            description="Meeting alerts and Smart Calendar syncs."
            checked={n.calendar_reminders ?? true}
            onChange={(val) => handleUpdate('calendar_reminders', val)}
          />
          <Toggle 
            label="Rescue Alerts" 
            description="Critical alerts when system detects productivity threats."
            checked={n.rescue_alerts ?? true}
            onChange={(val) => handleUpdate('rescue_alerts', val)}
          />
          <Toggle 
            label="Weekly Summary" 
            description="End-of-week productivity analytics report."
            checked={n.weekly_summary ?? true}
            onChange={(val) => handleUpdate('weekly_summary', val)}
          />
        </SettingsCard>
      </SettingsSection>
    </div>
  );
};
