'use client'

import React, { useEffect, useState } from 'react';
import { usePageMeta } from '../hooks/usePageMeta';
import { motion } from 'framer-motion';
import { Target, Activity, ShieldAlert, Cpu, Brain, CheckCircle2, Clock, Box } from 'lucide-react';
import { GlassCard } from '../components/UI/GlassCard';
import { Badge } from '../components/UI/Badge';
import { FocusOSApi } from '../api';
import { useCountUp } from '../hooks/useCountUp';

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
  return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
};

const AnimatedKpi = ({ value, suffix = '', label, icon: Icon, delay = 0, colorClass = "text-white" }: any) => {
  const isNumber = typeof value === 'number';
  const count = useCountUp(isNumber ? value : 0, 1.5);
return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
    >
      <GlassCard className="p-5 flex flex-col hover:-translate-y-1 transition-transform duration-300">
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 rounded-lg bg-white/5 border border-white/10">
            <Icon className="w-5 h-5 text-gray-400" />
          </div>
        </div>
        <div>
          <div className={`text-3xl font-black mb-1 tracking-tight ${colorClass}`}>
            {isNumber ? <span ref={count.ref}>{count.value}</span> : <span>{value}</span>}
            {suffix}
          </div>
          <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">{label}</p>
        </div>
      </GlassCard>
    </motion.div>
  );
};

export const Dashboard: React.FC = () => {
  usePageMeta('Dashboard');
  const [tasks, setTasks] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [feed, setFeed] = useState<any[]>([]);
  const [briefing, setBriefing] = useState<string>('');
  const [agentStatus, setAgentStatus] = useState<any>({ active_agents: 0, online_agents: 12 });
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tasksRes, analyticsRes, feedRes, briefingRes, agentRes] = await Promise.all([
          FocusOSApi.getTasks().catch(() => ({ tasks: [] })),
          FocusOSApi.getAnalyticsOverview().catch(() => ({ data: null })),
          FocusOSApi.getOrchestrationFeed().catch(() => ({ feed: [] })),
          FocusOSApi.getAnalyticsBriefing().catch(() => ({ data: 'System operations are currently offline.' })),
          FocusOSApi.getAgentStatus().catch(() => ({ data: { active_agents: 0, online_agents: 0 } }))
        ]);
        
        setTasks(tasksRes?.tasks || []);
        setAnalytics(analyticsRes?.data || {
          productivity_score: 0,
          deadline_success_rate: 0,
          current_risk_level: "Unknown",
          future_risk_forecast: "Unknown",
          ai_confidence_score: 0
        });
        setFeed(feedRes?.feed || []);
        setBriefing(briefingRes?.data || 'System operations are optimal. Future risk is Low.');
        setAgentStatus(agentRes?.data || { active_agents: 0, online_agents: 0 });
      } catch (err) {
        console.error("Failed to load dashboard data", err);
        setError("Failed to synchronize with FocusOS. Displaying offline metrics.");
        setAnalytics({
          productivity_score: 0,
          deadline_success_rate: 0,
          current_risk_level: "Unknown",
          future_risk_forecast: "Unknown",
          ai_confidence_score: 0
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleDownloadReport = async () => {
    setDownloading(true);
    try {
      const blob = await FocusOSApi.downloadReport();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'FocusOS_Intelligence_Report.pdf');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err) {
      console.error("Failed to download report", err);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-primary uppercase tracking-widest animate-pulse">Initializing OS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5" />
            <span className="font-semibold">{error}</span>
          </div>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-sm font-bold transition-colors">
            Retry Connection
          </button>
        </div>
      )}

      {/* 1. Header & AI Chief-of-Staff Briefing */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col gap-6"
      >
        <div className="rounded-2xl p-6 bg-[#0a0f1d]/80 backdrop-blur-xl border border-cyan-500/30 shadow-[0_0_30px_rgba(168,85,247,0.15)] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-purple-500/10 pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                <h2 className="text-xs font-black text-white uppercase tracking-[0.2em] opacity-90">AI Chief-of-Staff Briefing</h2>
              </div>
              <p className="text-xl text-white font-semibold leading-relaxed max-w-3xl drop-shadow-md">
                {briefing}
              </p>
            </div>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleDownloadReport}
              disabled={downloading}
              className="shrink-0 px-6 py-3 rounded-xl bg-white text-black hover:bg-gray-100 font-bold shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-colors whitespace-nowrap disabled:opacity-50"
            >
              {downloading ? 'Generating PDF...' : 'Generate Full Report'}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* 2. Executive Intelligence Cards (5 KPIs) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <AnimatedKpi value={analytics?.productivity_score ?? 0} suffix="%" label="Productivity Score" icon={Activity} delay={0.1} colorClass="text-emerald-400" />
        <AnimatedKpi value={analytics?.deadline_success_rate ?? 0} suffix="%" label="Success Probability" icon={Target} delay={0.2} colorClass="text-primary" />
        <AnimatedKpi value={analytics?.future_risk_forecast || "Unknown"} label="Future Risk" icon={ShieldAlert} delay={0.3} colorClass={analytics?.future_risk_forecast === 'High' ? 'text-rose-400' : 'text-emerald-400'} />
        <AnimatedKpi value={analytics?.ai_confidence_score ?? 0} suffix="%" label="AI Confidence" icon={Brain} delay={0.4} colorClass="text-indigo-400" />
        <AnimatedKpi value={agentStatus?.active_agents ?? 0} suffix={`/${agentStatus?.online_agents ?? 0}`} label="Active Agents" icon={Cpu} delay={0.5} colorClass="text-white" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Execution Radar & Agent Timeline */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Today's Execution Radar */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" /> Today's Execution Radar
            </h3>
            <div className="space-y-3">
              {(tasks || []).length > 0 ? (tasks || []).map((task, i) => (
                <GlassCard key={task?.id || i} className="p-4 hover:bg-white/5 transition-colors border-l-4" style={{ borderLeftColor: (task?.priority_score || 0) > 80 ? '#f43f5e' : '#38bdf8' }}>
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-bold text-white text-lg">{task.title}</span>
                        <Badge variant={task.status === 'in_progress' ? 'info' : task.status === 'done' ? 'success' : 'neutral'}>
                          {task.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-semibold text-gray-400">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Due: {new Date(task.deadline).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1"><Brain className="w-3 h-3 text-indigo-400" /> AI Confidence: {task.ai_confidence || 92}%</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold text-gray-500">Priority</span>
                        <span className="text-lg font-black text-rose-400">{task.priority_score}</span>
                      </div>
                      <div className="w-full sm:w-24 h-1.5 bg-black/50 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" 
                          style={{ width: `${task.completed_hours && task.estimated_hours ? Math.min((task.completed_hours / task.estimated_hours) * 100, 100) : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </GlassCard>
              )) : (
                <GlassCard className="p-8 text-center flex flex-col items-center">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-3" />
                  <p className="text-white font-bold">Radar Clear</p>
                  <p className="text-sm text-gray-400">No active tasks require immediate execution.</p>
                </GlassCard>
              )}
            </div>
          </motion.div>

          {/* Multi-Agent Activity Timeline */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-400" /> Multi-Agent Activity Timeline
            </h3>
            <GlassCard className="p-6">
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
                {((feed || []).slice(0, 5)).map((event, i) => {
                  const colors = getAgentColor(event?.agent || 'unknown');
                  return (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      key={event.id || i} 
                      className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
                    >
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 bg-black shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-md ${colors}`}>
                        <Cpu className="w-4 h-4" />
                      </div>
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-white/5 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-colors shadow-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-xs font-bold uppercase tracking-wider ${colors.split(' ')[0]}`}>{event.agent}</span>
                        </div>
                        <p className="text-sm text-gray-300">{event.action}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </GlassCard>
          </motion.div>

        </div>

        {/* RIGHT COLUMN: Forecasts */}
        <div className="space-y-6">
          
          {/* Digital Twin Forecast */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}>
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Box className="w-5 h-5 text-cyan-400" /> Digital Twin Forecast
            </h3>
            <GlassCard className="p-6 border-cyan-500/20 shadow-[0_0_30px_rgba(34,211,238,0.05)]">
              <div className="mb-6">
                <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-1">Scenario Simulation</p>
                <p className="text-sm text-white leading-relaxed">
                  "If you delay 1 critical task today, how does it affect tomorrow?"
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <span className="text-sm text-gray-300 font-medium">Current Success Rate</span>
                  <span className="text-lg font-black text-emerald-400">92%</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
                  <span className="text-sm text-gray-300 font-medium">Predicted Success Rate</span>
                  <span className="text-lg font-black text-rose-400">68%</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/10">
                  <span className="text-sm text-gray-300 font-medium">Risk Increase</span>
                  <span className="text-lg font-black text-white">+24%</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10">
                <p className="text-xs text-cyan-400 font-semibold mb-2">Forecast Summary:</p>
                <p className="text-sm text-gray-400">
                  Delaying tasks today creates a severe bottleneck tomorrow due to overlapping meeting schedules. 
                  <strong className="text-white font-semibold"> Do not delay.</strong>
                </p>
              </div>
            </GlassCard>
          </motion.div>

          {/* Workload Forecast */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 }}>
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-amber-400" /> Workload Forecast
            </h3>
            <GlassCard className="p-6">
              <div className="space-y-5">
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-300 font-medium">Today Load</span>
                    <span className="text-white font-bold">85%</span>
                  </div>
                  <div className="h-2 w-full bg-black/50 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: "85%" }}
                      transition={{ duration: 1, delay: 0.8 }}
                      className="h-full bg-gradient-to-r from-emerald-400 to-amber-400 rounded-full" 
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-300 font-medium">Tomorrow Load</span>
                    <span className="text-white font-bold">45%</span>
                  </div>
                  <div className="h-2 w-full bg-black/50 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: "45%" }}
                      transition={{ duration: 1, delay: 0.9 }}
                      className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full" 
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-300 font-medium">Weekly Load</span>
                    <span className="text-white font-bold">92%</span>
                  </div>
                  <div className="h-2 w-full bg-black/50 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: "92%" }}
                      transition={{ duration: 1, delay: 1.0 }}
                      className="h-full bg-gradient-to-r from-amber-400 to-rose-500 rounded-full" 
                    />
                  </div>
                </div>

              </div>
            </GlassCard>
          </motion.div>

        </div>
      </div>
    </div>
  );
};
