'use client'

import React, { useEffect, useState, useCallback } from 'react';
import { Activity, Cpu, ChevronDown, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { FocusOSApi } from '../../api';
import { useSync } from '../../hooks/useSync';

interface FeedEvent {
  id: number;
  timestamp: string;
  agent: string;
  action: string;
  status: 'success' | 'running' | 'error' | 'warning';
}

export const AIActivityFeed: React.FC = () => {
  const [feed, setFeed] = useState<FeedEvent[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  
  const fetchFeed = useCallback(async () => {
    try {
      const res = await FocusOSApi.getOrchestrationFeed();
      setFeed(res.feed || []);
    } catch (err) {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  useSync([
    'TASK_COMPLETED', 'TASK_CREATED', 'TASK_UPDATED', 'TASK_DELETED',
    'GOAL_CREATED', 'GOAL_UPDATED', 'GOAL_COMPLETED', 'GOAL_ARCHIVED',
    'HABIT_CREATED', 'HABIT_UPDATED', 'HABIT_CHECKIN', 'HABIT_STREAK_CHANGED',
    'PLANNER_GENERATED', 'PLANNER_UPDATED', 'DIGITAL_TWIN_SIMULATED',
    'THREAT_DETECTED', 'RESCUE_EXECUTED', 'RESCUE_ROLLBACK',
    'COMMAND_CENTER_REFRESH'
  ], fetchFeed);

  const activeCount = feed.filter(f => f.status === 'running').length;
  const latestEvent = feed[0];

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'success': return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'running': return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-warning" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-danger" />;
      default: return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium hover:bg-white/10 transition-colors"
      >
        {activeCount > 0 ? (
          <Activity className="w-4 h-4 text-primary animate-pulse" />
        ) : (
          <Cpu className="w-4 h-4 text-gray-400" />
        )}
        
        <span className="hidden md:inline-block max-w-[200px] truncate text-gray-300">
          {latestEvent ? `${latestEvent.agent}: ${latestEvent.action}` : 'System Idle'}
        </span>
        
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 max-h-96 overflow-y-auto bg-[#0f172a]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-4 z-50">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/10">
            <h3 className="font-bold text-white text-sm">Real-time Orchestration</h3>
            <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full border border-primary/30">
              {activeCount} Active
            </span>
          </div>

          <div className="space-y-4">
            {feed.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No recent activity.</p>
            ) : (
              feed.map((event) => (
                <div key={event.id} className="flex gap-3 items-start">
                  <div className="mt-0.5">
                    {getStatusIcon(event.status)}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-300">
                      {event.agent} <span className="text-gray-500 font-normal ml-2">{new Date(event.timestamp).toLocaleTimeString()}</span>
                    </p>
                    <p className="text-sm text-gray-400 mt-0.5 leading-snug">{event.action}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
