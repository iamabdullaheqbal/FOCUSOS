'use client'

import React, { useState, useEffect, useRef } from 'react';
import { usePageMeta } from '../hooks/usePageMeta';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  Network, CheckCircle2, Loader2, Cpu, Activity, AlertOctagon, Box,
  Play, Eye, FileText, Mic, Gauge, LineChart
} from 'lucide-react';
import { GradientButton } from '../components/UI/GradientButton';
import { Badge } from '../components/UI/Badge';
import { FocusOSApi } from '../api';
import { useSync } from '../hooks/useSync';

const PREMIUM_GLASS_CARD = "bg-[#0a0a0a]/50 backdrop-blur-2xl border border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.6)] ring-1 ring-white/10 rounded-2xl relative overflow-hidden after:absolute after:inset-0 after:border-t after:border-white/20 after:rounded-2xl after:pointer-events-none before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/[0.06] before:to-transparent before:pointer-events-none";

const AI_PIPELINE = [
  'Tasks',
  'Priority Engine',
  'Planning Engine',
  'Rescue Engine',
  'Digital Twin',
  'Intervention Engine'
];

const ProgressRing = ({ radius, stroke, progress, color, label, valueText }: any) => {
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - ((progress || 0) / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center relative">
      <svg height={radius * 2} width={radius * 2} className="rotate-[-90deg]">
        <circle stroke="rgba(255,255,255,0.05)" fill="transparent" strokeWidth={stroke} r={normalizedRadius} cx={radius} cy={radius} />
        <motion.circle 
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          stroke={color} fill="transparent" strokeWidth={stroke} strokeDasharray={circumference + ' ' + circumference} strokeLinecap="round" r={normalizedRadius} cx={radius} cy={radius} 
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center inset-0 top-[-20px]">
        <span className="text-sm font-black text-white">{valueText || `${progress}%`}</span>
      </div>
      <span className="text-[9px] text-gray-500 uppercase tracking-widest mt-2 text-center whitespace-nowrap">{label}</span>
    </div>
  );
};

export const CommandCenter: React.FC = () => {
  usePageMeta('AI Command Center');
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [feed, setFeed] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [trace, setTrace] = useState<any[]>([]);
  const [executionResult, setExecutionResult] = useState<any>(null);

  const fetchInitialData = async () => {
    try {
      const analyticsRes = await FocusOSApi.getAnalyticsOverview();
      setAnalytics(analyticsRes.data || {
        productivity_score: 0, deadline_success_rate: 0, current_risk_level: "Low", future_risk_forecast: "Low", ai_confidence_score: 0
      });
    } catch (err) {
      console.error("Failed to load initial data", err);
    }
  };

  const fetchFeed = async () => {
    try {
      const res = await FocusOSApi.getOrchestrationFeed();
      if (res.feed) setFeed(res.feed);
    } catch (err) {}
  };

  const fetched = useRef(false);
  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    fetchInitialData();
    fetchFeed();
  }, []);

  useSync([
    'TASK_COMPLETED', 'TASK_CREATED', 'TASK_UPDATED', 'TASK_DELETED',
    'GOAL_CREATED', 'GOAL_UPDATED', 'GOAL_COMPLETED', 'GOAL_ARCHIVED',
    'HABIT_CREATED', 'HABIT_UPDATED', 'HABIT_CHECKIN', 'HABIT_STREAK_CHANGED',
    'PLANNER_GENERATED', 'PLANNER_UPDATED', 'DIGITAL_TWIN_SIMULATED',
    'THREAT_DETECTED', 'RESCUE_EXECUTED', 'RESCUE_ROLLBACK',
    'COMMAND_CENTER_REFRESH'
  ], () => {
    fetchFeed();
    fetchInitialData();
  });

  const handleExecuteOrchestration = async () => {
    setLoading(true);
    setTrace([]); // Reset trace
    setExecutionResult(null);
    try {
      const res = await FocusOSApi.executeSystemOrchestration();
      setExecutionResult(res);
      if (res.trace) {
        setTrace(res.trace);
      }
      
      // Refresh Analytics after execution
      
      const analyticsRes = await FocusOSApi.getAnalyticsOverview();
      if (analyticsRes.data) setAnalytics(analyticsRes.data);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getAgentColor = (agentName: string) => {
    const name = agentName.toLowerCase();
    if (name.includes('vision')) return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
    if (name.includes('priority')) return 'text-rose-400 bg-rose-400/10 border-rose-400/20';
    if (name.includes('planning')) return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
    if (name.includes('accountability')) return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
    if (name.includes('coach')) return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
    if (name.includes('rescue')) return 'text-red-500 bg-red-500/10 border-red-500/20';
    if (name.includes('twin')) return 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20';
    if (name.includes('reflection')) return 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20';
    if (name.includes('goal')) return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
    if (name.includes('document')) return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
    if (name.includes('voice')) return 'text-violet-400 bg-violet-400/10 border-violet-400/20';
    if (name.includes('intervention')) return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
    if (name.includes('calendar')) return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
  };

  const getNodeState = (nodeName: string) => {
    if (nodeName === 'Tasks') {
      if (executionResult) return 'Completed';
      if (loading) return 'Extracting';
      return 'Ready';
    }

    const searchTerm = nodeName.toLowerCase().replace(' engine', '').replace(' agent', '');
    const traceEvent = trace.find((t: any) => t.agent.toLowerCase().includes(searchTerm));
    if (traceEvent) {
      if (traceEvent.status === 'success') {
          if (traceEvent.data?._inference_source === 'LOCAL_FALLBACK_RECOVERY') return 'Recovered';
          return traceEvent.data?._inference_source === 'gemini' ? 'Fallback' : 'Completed';
      }
      if (traceEvent.status === 'error' || traceEvent.status === 'failed') return 'Failed';
      if (traceEvent.status === 'warning') return 'Completed'; 
    }
    if (loading) {
      // Find current running node
      const lastCompletedIndex = AI_PIPELINE.findIndex(n => {
          if (n === 'Tasks') return false; // Handled
          return !trace.find((t: any) => t.agent.toLowerCase().includes(n.toLowerCase().replace(' engine', '').replace(' agent', '')));
      });
      const nodeIndex = AI_PIPELINE.indexOf(nodeName);
      if (nodeIndex === lastCompletedIndex) {
          if (nodeName.includes('Priority')) return 'Analyzing';
          if (nodeName.includes('Planning')) return 'Processing';
          if (nodeName.includes('Digital Twin')) return 'Simulating';
          return 'Running';
      }
    }
    return 'Standby';
  };


  // Format time ago for Last Execution
  const getTimeAgo = (dateStr: string) => {
      const ms = Date.now() - new Date(dateStr).getTime();
      const mins = Math.floor(ms / 60000);
      if (mins < 1) return 'Just now';
      if (mins < 60) return `${mins}m ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs}h ago`;
      return `${Math.floor(hrs / 24)}d ago`;
  };

  // Telemetry Calculations
  const fallbackEvent = trace.find((t: any) => t.data && t.data.fallback_triggered);
  const geminiEvent = trace.find((t: any) => t.data && t.data._inference_source === 'gemini');
  
  const sourceName = fallbackEvent ? (fallbackEvent.data.fallback_failed ? 'Local Recovery' : 'Gemini Fallback') : (geminiEvent ? 'Gemini Fallback' : (trace.length > 0 ? 'Local Engine' : '—'));
  const fallbackTriggered = (fallbackEvent || geminiEvent) ? 'Yes' : (trace.length > 0 ? 'No' : '—');
  const fallbackReason = fallbackEvent ? (fallbackEvent.data.fallback_reason || 'API Error') : (geminiEvent ? 'Confidence < Threshold' : (trace.length > 0 ? '—' : '—'));
  
  const confidences = trace.map((t: any) => t.data?._system_confidence).filter(Boolean);
  const avgConfidence = confidences.length ? Math.round(confidences.reduce((a:number, b:number) => a + b, 0) / confidences.length) : null;
  const sysConfidenceDisplay = avgConfidence ? `${avgConfidence}%` : '—';

  const localExecutionsToday = trace.filter((t: any) => t.data && (t.data._inference_source === 'local' || t.data._inference_source === 'LOCAL_FALLBACK_RECOVERY')).length;
  const geminiFallbacksToday = trace.filter((t: any) => t.data && t.data._inference_source === 'gemini').length;
  const totalExecs = localExecutionsToday + geminiFallbacksToday;
  const fallbackRate = totalExecs > 0 ? Math.round((geminiFallbacksToday / totalExecs) * 100) : 0;
  const costReduction = totalExecs > 0 ? Math.round((localExecutionsToday / totalExecs) * 100) : 0;
return (
    <div className="space-y-6 pb-12">
      
      {/* 3-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Launchpad & Controls */}
        <div className="space-y-6">
          <div className={`${PREMIUM_GLASS_CARD} p-6 border-l-4 border-l-indigo-500`}>
            <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-widest flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400" /> Mission Control Launchpad
            </h3>
            
            <div className="space-y-4">
              <div onClick={() => router.push('/vision')} className="flex items-center justify-between p-4 bg-white/[0.03] rounded-xl border border-white/10 hover:bg-white/10 hover:-translate-y-1 hover:shadow-[0_4px_20px_rgba(168,85,247,0.2)] transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 group-hover:shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all"><Eye className="w-5 h-5 text-purple-400" /></div>
                  <div>
                    <p className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">Launch Vision Intelligence</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Process images & whiteboards</p>
                  </div>
                </div>
              </div>

              <div onClick={() => router.push('/documents')} className="flex items-center justify-between p-4 bg-white/[0.03] rounded-xl border border-white/10 hover:bg-white/10 hover:-translate-y-1 hover:shadow-[0_4px_20px_rgba(245,158,11,0.2)] transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-amber-500/20 rounded-lg group-hover:bg-amber-500/30 group-hover:shadow-[0_0_15px_rgba(245,158,11,0.4)] transition-all"><FileText className="w-5 h-5 text-amber-400" /></div>
                  <div>
                    <p className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">Launch Document Intelligence</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Parse PDFs & Syllabi</p>
                  </div>
                </div>
              </div>

              <div onClick={() => router.push('/voice')} className="flex items-center justify-between p-4 bg-white/[0.03] rounded-xl border border-white/10 hover:bg-white/10 hover:-translate-y-1 hover:shadow-[0_4px_20px_rgba(6,182,212,0.2)] transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-cyan-500/20 rounded-lg group-hover:bg-cyan-500/30 group-hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all"><Mic className="w-5 h-5 text-cyan-400" /></div>
                  <div>
                    <p className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">Launch Voice Copilot</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Voice dictation & commands</p>
                  </div>
                </div>
              </div>
            </div>

            <GradientButton 
              className="w-full mt-8 flex justify-center items-center gap-2 py-3 text-sm tracking-wide shadow-[0_0_20px_rgba(79,70,229,0.3)]" 
              onClick={handleExecuteOrchestration} 
              disabled={loading}
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin"/> Evaluating System State...</> : <><Play className="w-4 h-4" fill="currentColor"/> Execute System Orchestration</>}
            </GradientButton>
          </div>

          {/* Intelligence Source Monitor */}
          <div className={`${PREMIUM_GLASS_CARD} p-5 border-t-4 border-t-purple-500`}>
             <h3 className="text-xs font-bold text-purple-400 mb-4 uppercase tracking-widest flex items-center gap-2">
              <Cpu className="w-4 h-4" /> Intelligence Source Monitor
            </h3>
            <div className="space-y-3">
               <div className="flex justify-between items-center bg-[#050505] p-3 rounded-lg border border-white/5">
                 <span className="text-xs text-gray-400 font-mono">Inference Source</span>
                 <span className={`text-sm font-bold ${sourceName === 'Local Engine' ? 'text-emerald-400' : (sourceName === 'Gemini Fallback' ? 'text-amber-400' : 'text-gray-500')}`}>{sourceName}</span>
               </div>
               <div className="flex justify-between items-center bg-[#050505] p-3 rounded-lg border border-white/5">
                 <span className="text-xs text-gray-400 font-mono">System Confidence</span>
                 <span className="text-sm font-bold text-cyan-400">{sysConfidenceDisplay}</span>
               </div>
               <div className="flex justify-between items-center bg-[#050505] p-3 rounded-lg border border-white/5">
                 <span className="text-xs text-gray-400 font-mono">Fallback Triggered</span>
                 <span className={`text-sm font-bold ${fallbackTriggered === 'Yes' ? 'text-amber-400' : 'text-emerald-400'}`}>{fallbackTriggered}</span>
               </div>
               <div className="flex justify-between items-center bg-[#050505] p-3 rounded-lg border border-white/5">
                 <span className="text-xs text-gray-400 font-mono">Fallback Reason</span>
                 <span className="text-xs font-bold text-gray-300">{fallbackReason}</span>
               </div>
            </div>
          </div>

          {/* AI Cost Optimization */}
          <div className={`${PREMIUM_GLASS_CARD} p-5 border-t-4 border-t-amber-500`}>
             <h3 className="text-xs font-bold text-amber-400 mb-4 uppercase tracking-widest flex items-center gap-2">
              <LineChart className="w-4 h-4" /> AI Cost Optimization
            </h3>
            
            <div className="flex justify-around items-center mb-6 mt-4">
              <ProgressRing radius={40} stroke={6} progress={fallbackRate} color="#f43f5e" label="Fallback Rate" />
              <ProgressRing radius={40} stroke={6} progress={costReduction} color="#10b981" label="Cost Reduct" />
            </div>

            <div className="grid grid-cols-2 gap-3">
               <div className="bg-[#050505] border border-white/5 p-3 rounded-lg flex flex-col justify-center items-center">
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 text-center">Local Execs</span>
                  <span className="text-lg font-mono font-bold text-emerald-400">{localExecutionsToday}</span>
               </div>
               <div className="bg-[#050505] border border-white/5 p-3 rounded-lg flex flex-col justify-center items-center">
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 text-center">Gemini Fallbacks</span>
                  <span className="text-lg font-mono font-bold text-amber-400">{geminiFallbacksToday}</span>
               </div>
            </div>
          </div>
        </div>

        {/* CENTER COLUMN: System Execution Monitor & AI Execution Pipeline */}
        <div className="space-y-6">
          
           {/* System Execution Monitor */}
          <div className={`${PREMIUM_GLASS_CARD} p-5 border-t-4 border-t-emerald-500`}>
             <h3 className="text-xs font-bold text-emerald-400 mb-4 uppercase tracking-widest flex items-center gap-2">
              <Gauge className="w-4 h-4" /> System Execution Monitor
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
               <div className="bg-[#050505] border border-white/5 p-3 rounded-lg flex flex-col justify-center items-center text-center">
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Active Tasks</span>
                  <span className="text-lg font-mono font-bold text-white">{executionResult?.tasks_evaluated ?? '—'}</span>
               </div>
               <div className="bg-[#050505] border border-white/5 p-3 rounded-lg flex flex-col justify-center items-center text-center">
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Priority Upd</span>
                  <span className="text-lg font-mono font-bold text-rose-400">{executionResult?.priority_tasks?.length ?? '—'}</span>
               </div>
               <div className="bg-[#050505] border border-white/5 p-3 rounded-lg flex flex-col justify-center items-center text-center">
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Risks Detect</span>
                  <span className={`text-lg font-mono font-bold ${executionResult?.risk_level === 'High' ? 'text-red-500' : 'text-emerald-400'}`}>{executionResult?.risk_level || '—'}</span>
               </div>
               <div className="bg-[#050505] border border-white/5 p-3 rounded-lg flex flex-col justify-center items-center text-center">
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Interventions</span>
                  <span className="text-lg font-mono font-bold text-amber-400">{executionResult?.interventions_generated ?? '—'}</span>
               </div>
               <div className="bg-[#050505] border border-white/5 p-3 rounded-lg flex flex-col justify-center items-center text-center">
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Twin Conf</span>
                  <span className="text-lg font-mono font-bold text-cyan-400">{analytics?.ai_confidence_score ? `${analytics.ai_confidence_score}%` : '—'}</span>
               </div>
               <div className="bg-[#050505] border border-white/5 p-3 rounded-lg flex flex-col justify-center items-center text-center">
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Exec Time</span>
                  <span className="text-lg font-mono font-bold text-indigo-400">{executionResult?.execution_time_ms ? `${executionResult.execution_time_ms}ms` : '—'}</span>
               </div>
            </div>
          </div>

          {/* Pipeline Execution Metrics */}
          <div className={`${PREMIUM_GLASS_CARD} p-5 border-t-4 border-t-indigo-500`}>
             <h3 className="text-xs font-bold text-indigo-400 mb-4 uppercase tracking-widest flex items-center gap-2">
              <Activity className="w-4 h-4" /> Pipeline Execution Metrics
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
               <div className="bg-[#050505] border border-white/5 p-3 rounded-lg flex flex-col justify-center items-center text-center">
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Total Tasks</span>
                  <span className="text-lg font-mono font-bold text-white">{executionResult?.tasks_evaluated ?? '—'}</span>
               </div>
               <div className="bg-[#050505] border border-white/5 p-3 rounded-lg flex flex-col justify-center items-center text-center">
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Avg Confidence</span>
                  <span className="text-lg font-mono font-bold text-cyan-400">{sysConfidenceDisplay}</span>
               </div>
               <div className="bg-[#050505] border border-white/5 p-3 rounded-lg flex flex-col justify-center items-center text-center">
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Avg Exec Time</span>
                  <span className="text-lg font-mono font-bold text-indigo-400">{executionResult?.execution_time_ms ? Math.round(executionResult.execution_time_ms / (trace.length || 1)) + 'ms' : '—'}</span>
               </div>
               <div className="bg-[#050505] border border-white/5 p-3 rounded-lg flex flex-col justify-center items-center text-center">
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Last Exec Dur</span>
                  <span className="text-lg font-mono font-bold text-emerald-400">{executionResult?.execution_time_ms ? executionResult.execution_time_ms + 'ms' : '—'}</span>
               </div>
               <div className="bg-[#050505] border border-white/5 p-3 rounded-lg flex flex-col justify-center items-center text-center">
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Last Success</span>
                  <span className="text-sm font-mono font-bold text-gray-300">{executionResult?.status === 'success' ? getTimeAgo(executionResult.created_at || new Date().toISOString()) : '—'}</span>
               </div>
               <div className="bg-[#050505] border border-white/5 p-3 rounded-lg flex flex-col justify-center items-center text-center">
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Last Failure</span>
                  <span className="text-sm font-mono font-bold text-gray-300">{executionResult?.status === 'error' ? getTimeAgo(executionResult.created_at || new Date().toISOString()) : '—'}</span>
               </div>
            </div>
          </div>

          {/* AI Execution Pipeline Graph */}
          <div className={`${PREMIUM_GLASS_CARD} p-6 flex flex-col`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                <Network className="w-4 h-4 text-emerald-400" /> AI Execution Pipeline
              </h3>
              {loading && <Badge variant="info" className="animate-pulse">Evaluating</Badge>}
            </div>
            
            <div className="relative">
              {/* Central Glowing Line */}
              <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-white/10 shadow-[0_0_10px_rgba(255,255,255,0.1)]" />
              
              <div className="space-y-4">
                {AI_PIPELINE.map((node) => {
                  const status = getNodeState(node);
                  const isRunning = ['Running', 'Extracting', 'Analyzing', 'Processing', 'Simulating'].includes(status);
                  const isCompleted = status === 'Completed';
                  const isFailed = status === 'Failed';
                  const isFallback = status === 'Fallback';
                  const isRecovered = status === 'Recovered';
                  
                  let badgeVariant: any = 'neutral';
                  let iconColor = 'text-gray-500 bg-gray-500/10 border-gray-500/20';
                  
                  if (isRunning) {
                    badgeVariant = 'info';
                    iconColor = 'text-sky-400 bg-sky-400/20 border-sky-400/40 shadow-[0_0_15px_rgba(56,189,248,0.5)]';
                  } else if (isCompleted) {
                    badgeVariant = 'success';
                    iconColor = 'text-emerald-400 bg-emerald-400/20 border-emerald-400/40 shadow-[0_0_10px_rgba(52,211,153,0.3)]';
                  } else if (isFallback) {
                    badgeVariant = 'warning';
                    iconColor = 'text-amber-400 bg-amber-400/20 border-amber-400/40 shadow-[0_0_10px_rgba(251,191,36,0.3)]';
                  } else if (isRecovered) {
                    badgeVariant = 'warning';
                    iconColor = 'text-fuchsia-400 bg-fuchsia-400/20 border-fuchsia-400/40 shadow-[0_0_10px_rgba(217,70,239,0.3)]';
                  } else if (isFailed) {
                    badgeVariant = 'error';
                    iconColor = 'text-rose-400 bg-rose-400/20 border-rose-400/40 shadow-[0_0_10px_rgba(244,63,94,0.3)]';
                  }

                  return (
                    <div key={node} className="relative flex items-center gap-4 group">
                      <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center z-10 transition-all duration-300 ${iconColor}`}>
                        {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : 
                         isFallback ? <Cpu className="w-5 h-5" /> :
                         isRecovered ? <Cpu className="w-5 h-5" /> :
                         isRunning ? <Loader2 className="w-5 h-5 animate-spin" /> : 
                         isFailed ? <AlertOctagon className="w-5 h-5" /> :
                         <Cpu className="w-5 h-5 opacity-50" />}
                      </div>
                      <div className={`flex-1 p-3 rounded-xl border transition-all duration-300 ${isRunning ? 'bg-sky-500/10 border-sky-500/30 shadow-sm' : 'bg-white/[0.02] border-white/10'}`}>
                        <div className="flex justify-between items-center">
                          <span className={`text-sm font-bold tracking-wide ${isRunning ? 'text-white' : 'text-gray-300'}`}>{node}</span>
                          <Badge variant={badgeVariant} className={isRunning ? 'animate-pulse' : ''}>{status}</Badge>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Feeds & Interventions */}
        <div className="space-y-6">
          
          {/* Mission Log (Telemetry) */}
          <div className={`${PREMIUM_GLASS_CARD} p-5 flex flex-col h-[320px] bg-[#050505]/80`}>
            <h3 className="text-[11px] font-bold text-gray-400 mb-3 uppercase tracking-widest flex items-center gap-2 shrink-0">
              <Activity className="w-3.5 h-3.5 text-emerald-500" /> Mission Log
            </h3>
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent font-mono text-xs">
              {feed.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-600">
                  <Activity className="w-6 h-6 mb-2 opacity-30" />
                  <p>—</p>
                </div>
              ) : (
                feed.map((event, i) => {
                  const colors = getAgentColor(event.agent);
                  const isLocal = event.data?._inference_source === 'local';
                  const isFallback = event.data?._inference_source === 'gemini';
                  const sysConf = event.data?._system_confidence;
                  
                  return (
                    <motion.div 
                      key={event.id || i}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-3 bg-white/[0.02] border border-white/5 rounded-lg flex flex-col gap-1.5 relative overflow-hidden"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-gray-500 font-mono">[{new Date(event.timestamp).toLocaleTimeString([], {hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit'})}]</span>
                        {(isLocal || isFallback) && (
                          <span className={`text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded ${isLocal ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                            {isLocal ? '[LOCAL]' : '[FALLBACK]'}
                          </span>
                        )}
                      </div>
                      <span className={`font-bold text-[13px] ${colors.split(' ')[0]}`}>{event.agent}</span>
                      
                      {sysConf !== undefined && (
                        <div className="text-[10px] text-cyan-400 font-mono mt-0.5">Confidence: {sysConf}%</div>
                      )}
                      
                      <p className={`text-xs truncate ${isFallback ? 'text-amber-200/70' : 'text-gray-400'}`} title={event.action}>
                        {isFallback ? 'Delegated to Gemini: ' + event.action : event.action}
                      </p>
                    </motion.div>
                  )
                })
              )}
            </div>
          </div>

          {/* Twin Forecast Risk Expanded */}
          <div className={`${PREMIUM_GLASS_CARD} p-5 border-t-4 border-t-cyan-500/50`}>
            <h3 className="text-xs font-bold text-cyan-400 mb-4 flex items-center gap-2 uppercase tracking-widest">
              <Box className="w-4 h-4" /> Twin Forecast Risk
            </h3>
            <div className="flex justify-around items-center mt-6">
              <ProgressRing 
                radius={45} 
                stroke={8} 
                progress={analytics?.future_risk_forecast === 'High' ? 80 : analytics?.future_risk_forecast === 'Medium' ? 50 : 20} 
                color={analytics?.future_risk_forecast === 'High' ? '#f43f5e' : '#10b981'} 
                label="Predicted Risk" 
                valueText={analytics?.future_risk_forecast || 'N/A'}
              />
              <ProgressRing 
                radius={45} 
                stroke={8} 
                progress={analytics?.ai_confidence_score || 0} 
                color="#818cf8" 
                label="AI Confidence" 
                valueText={analytics?.ai_confidence_score ? `${analytics.ai_confidence_score}%` : 'N/A'}
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

