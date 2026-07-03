'use client'

import React, { useState, useEffect } from 'react';
import { usePageMeta } from '../hooks/usePageMeta';
import { 
  Zap, Activity, GitBranch, Target, ShieldAlert, Cpu,
  AlertTriangle, ArrowRight, Box, Loader2, Play
} from 'lucide-react';
import { GlassCard } from '../components/UI/GlassCard';
import { GradientButton } from '../components/UI/GradientButton';
import { FocusOSApi } from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { useCountUp } from '../hooks/useCountUp';
import { useSync } from '../hooks/useSync';
import { usePathname, useSearchParams } from 'next/navigation';
import { Skeleton } from '../components/UI/Skeleton';

const AnimatedKpi = React.memo(({ value, suffix = '', label, icon: Icon, delay = 0, colorClass = "text-white" }: any) => {
  const isNumber = typeof value === 'number';
  const count = useCountUp(isNumber ? value : 0, 1.5);
return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
    >
      <GlassCard className="p-4 flex flex-col hover:-translate-y-1 transition-transform duration-300">
        <div className="flex justify-between items-start mb-2">
          <div className="p-1.5 rounded-lg bg-white/5 border border-white/10">
            <Icon className="w-4 h-4 text-gray-400" />
          </div>
        </div>
        <div>
          <div className={`text-2xl font-black mb-1 tracking-tight ${colorClass}`}>
            {isNumber ? <span ref={count.ref}>{count.value}</span> : <span>{value}</span>}
            {suffix}
          </div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">{label}</p>
        </div>
      </GlassCard>
    </motion.div>
  );
});

export const DigitalTwin: React.FC = () => {
  usePageMeta('Digital Twin');
  const [scenario, setScenario] = useState({ action: 'delay_task', task: 'React Assignment', delay_days: 1 });
  const [simulation, setSimulation] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  const searchParams = useSearchParams();
  const linkedSimulationId = searchParams.get('simulation');

  const fetchHistory = async () => {
    try {
      const res = await FocusOSApi.getDigitalTwinHistory();
      setHistory(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAnalytics = async () => {
    const res = await FocusOSApi.getAnalyticsOverview();
    setAnalytics(res.data);
  };

  useEffect(() => {
    fetchAnalytics();
    fetchHistory();
  }, []);

  useSync(['DIGITAL_TWIN_SIMULATED', 'TASK_COMPLETED', 'TASK_UPDATED'], () => {
    fetchAnalytics();
    fetchHistory();
  });

  const handleSimulate = async () => {
    setLoading(true);
    setSimulation(null);
    try {
      const res = await FocusOSApi.runDigitalTwin({ scenario });
      setSimulation(res.data);
      fetchHistory();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const applyPreset = React.useCallback((action: string, task: string, delay: number) => {
    setScenario({ action, task, delay_days: delay });
  }, []);

  return (
    <div className="space-y-8 pb-12">
      
      {/* SECTION A: Twin Intelligence KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <AnimatedKpi value={analytics?.deadline_success_rate || 0} suffix="%" label="Success Probability" icon={Target} delay={0.1} colorClass="text-emerald-400" />
        <AnimatedKpi value={analytics?.future_risk_forecast || 'Low'} label="Future Risk" icon={ShieldAlert} delay={0.2} colorClass="text-cyan-400" />
        <AnimatedKpi value={analytics?.completion_rate || 0} suffix="%" label="Schedule Stability" icon={Activity} delay={0.3} colorClass="text-white" />
        <AnimatedKpi value={analytics?.ai_confidence_score || 0} suffix="%" label="Prediction Confidence" icon={Cpu} delay={0.4} colorClass="text-purple-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Scenario Builder */}
        <div className="lg:col-span-4 space-y-6">
          <GlassCard className="border-t-2 border-t-emerald-500">
            <h2 className="text-sm font-bold text-white mb-4 uppercase tracking-widest flex items-center gap-2">
              <Box className="w-4 h-4 text-emerald-400" /> Scenario Builder
            </h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase">Simulation Vector</label>
                <select 
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white outline-none focus:border-emerald-500 transition-colors"
                  value={scenario.action}
                  onChange={(e) => setScenario({...scenario, action: e.target.value})}
                >
                  <option value="DELAY_TASK" className="bg-slate-900 text-white">Delay Task</option>
                  <option value="SKIP_TASK" className="bg-slate-900 text-white">Skip Task</option>
                  <option value="ADD_TASK" className="bg-slate-900 text-white">Add New Task</option>
                  <option value="INCREASE_WORKLOAD" className="bg-slate-900 text-white">Increase Workload</option>
                  <option value="REDUCE_HOURS" className="bg-slate-900 text-white">Reduce Available Hours</option>
                  <option value="MOVE_DEADLINE" className="bg-slate-900 text-white">Shift Deadlines</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase">Target Parameter</label>
                <input 
                  type="text" 
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white outline-none focus:border-emerald-500 transition-colors"
                  value={scenario.task}
                  onChange={(e) => setScenario({...scenario, task: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase">Multiplier / Delta</label>
                <input 
                  type="number" 
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white outline-none focus:border-emerald-500 transition-colors"
                  value={scenario.delay_days}
                  onChange={(e) => setScenario({...scenario, delay_days: Number(e.target.value)})}
                />
              </div>
            </div>

            <GradientButton className="w-full flex justify-center items-center gap-2" onClick={handleSimulate} disabled={loading}>
              {loading ? <><Loader2 className="w-4 h-4 animate-spin"/> Executing Simulation...</> : <><Play className="w-4 h-4" fill="currentColor"/> Inject Scenario</>}
            </GradientButton>
          </GlassCard>

          {/* OBSERVABILITY CARD (PHASE 8) */}
          <GlassCard className="border-t-2 border-t-purple-500">
            <h2 className="text-sm font-bold text-white mb-4 uppercase tracking-widest flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-400" /> Twin Observability
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-2 rounded bg-black/40 border border-white/5">
                <span className="text-xs font-bold text-gray-400">Simulation Engine</span>
                <span className="text-xs font-black text-emerald-400">{simulation?._inference_source === 'mistral' ? 'Mistral Fallback' : 'Local Planner'}</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-black/40 border border-white/5">
                <span className="text-xs font-bold text-gray-400">Last Execution</span>
                <span className="text-xs font-black text-white">{history.length > 0 ? new Date(history[0].timestamp).toLocaleTimeString() : 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-black/40 border border-white/5">
                <span className="text-xs font-bold text-gray-400">Total Simulations</span>
                <span className="text-xs font-black text-cyan-400">{history.length}</span>
              </div>
            </div>
          </GlassCard>

          {/* Preset Simulation Cards (PHASE 7) */}
          <GlassCard className="bg-cyan-500/5 border-cyan-500/20">
            <h2 className="text-xs font-bold text-cyan-400 mb-3 uppercase tracking-widest flex items-center gap-2">
              <Zap className="w-4 h-4" /> Quick Presets
            </h2>
            <div className="space-y-3">
              <button onClick={() => applyPreset('DELAY_TASK', 'Critical Path', 1)} className="w-full text-left p-3 rounded-lg bg-black/40 border border-white/5 hover:border-cyan-500/50 hover:bg-cyan-500/10 transition-colors group">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">Delay Critical Task</span>
                  <ArrowRight className="w-3 h-3 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  <span className="text-rose-400">Risk +18%</span>
                  <span className="text-rose-400">Success -12%</span>
                  <span className="text-amber-400">Backlog +2</span>
                </div>
              </button>
              
              <button onClick={() => applyPreset('REDUCE_HOURS', 'Daily Schedule', 4)} className="w-full text-left p-3 rounded-lg bg-black/40 border border-white/5 hover:border-cyan-500/50 hover:bg-cyan-500/10 transition-colors group">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">Miss One Day</span>
                  <ArrowRight className="w-3 h-3 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  <span className="text-rose-400">Risk +25%</span>
                  <span className="text-rose-400">Success -20%</span>
                  <span className="text-amber-400">Backlog +5</span>
                </div>
              </button>
              
              <button onClick={() => applyPreset('INCREASE_WORKLOAD', 'Deep Work', 2)} className="w-full text-left p-3 rounded-lg bg-black/40 border border-white/5 hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-colors group">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">Increase Deep Work</span>
                  <ArrowRight className="w-3 h-3 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  <span className="text-emerald-400">Risk -10%</span>
                  <span className="text-emerald-400">Success +15%</span>
                  <span className="text-emerald-400">Backlog -3</span>
                </div>
              </button>
            </div>
          </GlassCard>
        </div>

        {/* RIGHT COLUMN: Results & Dashboards */}
        <div className="lg:col-span-8 space-y-6">
          {simulation ? (
            <AnimatePresence>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                
                {/* SECTION C: Scenario Impact Dashboard (Current vs Projected) */}
                <GlassCard className="relative overflow-hidden border-rose-500/30">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-rose-500/10 pointer-events-none" />
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                      <Activity className="w-4 h-4 text-rose-400" /> Scenario Impact Delta
                    </h3>
                    {simulation?._inference_source && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest ${simulation._inference_source === 'local' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'bg-purple-500/20 text-purple-400 border border-purple-500/50'}`}>
                        {simulation._inference_source === 'local' ? 'Local Engine' : 'Mistral Fallback'}
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Visual Comparison: Success Rate */}
                    <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                      <div className="flex justify-between mb-2">
                        <span className="text-xs font-bold text-gray-500 uppercase">Success Probability</span>
                        {(() => {
                           const b = simulation?.current_state?.success_probability || 0;
                           const a = simulation?.projected_state?.success_probability || 0;
                           const d = a - b;
                           if (d === 0) return <span className="text-xs font-bold text-gray-500">Unchanged</span>;
                           return <span className={`text-xs font-black ${d > 0 ? 'text-emerald-400' : 'text-rose-500'}`}>{d > 0 ? '+' : ''}{d}%</span>;
                        })()}
                      </div>
                      <div className="space-y-2">
                        <div className="relative h-4 w-full bg-white/5 rounded overflow-hidden">
                          <div className="absolute top-0 left-0 h-full bg-gray-500" style={{ width: `${simulation?.current_state?.success_probability || 0}%` }} />
                          <span className="absolute inset-0 flex items-center justify-end pr-2 text-[9px] font-black text-white mix-blend-difference">{simulation?.current_state?.success_probability || 0}%</span>
                        </div>
                        <div className="relative h-4 w-full bg-white/5 rounded overflow-hidden">
                          <div className={`absolute top-0 left-0 h-full ${simulation?.projected_state?.success_probability > (simulation?.current_state?.success_probability || 0) ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${simulation?.projected_state?.success_probability || 0}%` }} />
                          <span className="absolute inset-0 flex items-center justify-end pr-2 text-[9px] font-black text-white mix-blend-difference">{simulation?.projected_state?.success_probability || 0}%</span>
                        </div>
                      </div>
                      <div className="flex justify-between mt-2 text-[10px] text-gray-500 font-bold uppercase">
                        <span>Before</span>
                        <span>After</span>
                      </div>
                    </div>

                    {/* Visual Comparison: Risk Score */}
                    <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                      <div className="flex justify-between mb-2">
                        <span className="text-xs font-bold text-gray-500 uppercase">Risk Score</span>
                        {(() => {
                           const b = simulation?.current_state?.risk_score || 0;
                           const a = simulation?.projected_state?.risk_score || 0;
                           const d = a - b;
                           if (d === 0) return <span className="text-xs font-bold text-gray-500">Unchanged</span>;
                           return <span className={`text-xs font-black ${d < 0 ? 'text-emerald-400' : 'text-rose-500'}`}>{d > 0 ? '+' : ''}{d}</span>;
                        })()}
                      </div>
                      <div className="space-y-2">
                        <div className="relative h-4 w-full bg-white/5 rounded overflow-hidden">
                          <div className="absolute top-0 left-0 h-full bg-gray-500" style={{ width: `${Math.min(100, (simulation?.current_state?.risk_score || 0))}%` }} />
                          <span className="absolute inset-0 flex items-center justify-end pr-2 text-[9px] font-black text-white mix-blend-difference">{simulation?.current_state?.risk_score || 0}</span>
                        </div>
                        <div className="relative h-4 w-full bg-white/5 rounded overflow-hidden">
                          <div className={`absolute top-0 left-0 h-full ${simulation?.projected_state?.risk_score < (simulation?.current_state?.risk_score || 0) ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${Math.min(100, (simulation?.projected_state?.risk_score || 0))}%` }} />
                          <span className="absolute inset-0 flex items-center justify-end pr-2 text-[9px] font-black text-white mix-blend-difference">{simulation?.projected_state?.risk_score || 0}</span>
                        </div>
                      </div>
                      <div className="flex justify-between mt-2 text-[10px] text-gray-500 font-bold uppercase">
                        <span>Before</span>
                        <span>After</span>
                      </div>
                    </div>
                  </div>
                </GlassCard>

                {/* SECTION D: Cascade Effect Visualization */}
                <GlassCard className="bg-black/20">
                  <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-widest flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-cyan-400" /> Cascade Effect Simulation
                  </h3>
                  <div className="flex flex-col items-center justify-center gap-2 py-4">
                    {simulation?.cascade?.map((node: any, idx: number) => (
                      <React.Fragment key={idx}>
                        <motion.div 
                          initial={{ y: -20, opacity: 0 }} 
                          animate={{ y: 0, opacity: 1 }} 
                          transition={{ delay: idx * 0.2 }}
                          className="w-full max-w-sm p-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 text-center shadow-[0_0_15px_rgba(34,211,238,0.05)] relative"
                        >
                          <span className="block text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-1">{node.step}</span>
                          <p className="text-sm text-white font-medium">{node.desc}</p>
                        </motion.div>
                        {idx < simulation?.cascade?.length - 1 && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }} 
                            animate={{ opacity: 1, height: 24 }} 
                            transition={{ delay: idx * 0.2 + 0.1 }}
                            className="w-0.5 bg-gradient-to-b from-cyan-500 to-transparent relative my-1"
                          >
                            <div className="absolute -bottom-1 -ml-[3px] w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-cyan-500" />
                          </motion.div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </GlassCard>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* SECTION E: Future Timeline Simulation */}
                  <GlassCard>
                    <h3 className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-widest flex items-center gap-2">
                      <Activity className="w-4 h-4 text-purple-400" /> Future Timeline Trajectory
                    </h3>
                    <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px before:h-full before:w-0.5 before:bg-white/10">
                      {simulation?.cascade?.map((c: any, idx: number) => (
                        <div key={idx} className="relative flex items-center gap-4">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center bg-black z-10 ${idx === simulation.cascade.length - 1 ? 'border-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]' : 'border-purple-500'}`}>
                            {idx === simulation.cascade.length - 1 && <AlertTriangle className="w-3 h-3 text-rose-500" />}
                          </div>
                          <div className="flex-1 bg-white/5 p-2 rounded-lg border border-white/5">
                            <span className="text-[10px] font-bold text-gray-400 uppercase">{c.step}</span>
                            <p className="text-xs text-white">{c.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </GlassCard>

                  {/* SECTION F: Twin Recommendations */}
                  <GlassCard className="bg-primary/5 border-primary/20">
                    <h3 className="text-xs font-bold text-primary mb-4 uppercase tracking-widest flex items-center gap-2">
                      <Target className="w-4 h-4" /> AI Strategy Directive
                    </h3>
                    <div className="space-y-3">
                      {simulation?.recommendations?.map((rec: any, idx: number) => (
                        <div key={idx} className="p-3 bg-black/40 rounded-lg border border-primary/20">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-black text-primary uppercase tracking-wider">AI Insight</span>
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">{rec.confidence}% Conf.</span>
                          </div>
                          <p className="text-sm text-gray-200">{rec.action}</p>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                </div>

              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="space-y-6 h-full">
              {loading ? (
                <GlassCard className="h-full min-h-[400px] flex flex-col justify-center border-2 border-dashed border-white/10 p-8 space-y-6">
                  <div className="flex flex-col items-center mb-4">
                    <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
                    <p className="text-sm font-bold uppercase tracking-widest text-emerald-400 animate-pulse">Running Physics Engine...</p>
                  </div>
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </GlassCard>
              ) : (
                <GlassCard className="border-cyan-500/20 bg-black/40 min-h-[400px]">
                  <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-widest flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-cyan-400" /> Simulation History Center
                  </h3>
                  {history.length > 0 ? (
                    <div className="space-y-4">
                      {history.map((log: any, idx: number) => {
                        const successDelta = log.projected_success_probability - log.current_success_probability;
                        return (
                          <div 
                            key={idx} 
                            id={`simulation-${log.id}`}
                            ref={el => {
                              if (el && linkedSimulationId && String(log.id) === linkedSimulationId) {
                                setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
                              }
                            }}
                            className={`p-4 bg-white/5 rounded-xl border transition-all cursor-pointer group ${linkedSimulationId && String(log.id) === linkedSimulationId ? 'border-cyan-500 ring-2 ring-cyan-500 shadow-[0_0_20px_rgba(34,211,238,0.3)] animate-pulse' : 'border-white/10 hover:border-cyan-500/50 hover:bg-cyan-500/5'}`} 
                            onClick={() => setSimulation(log.simulation_result)}
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <span className="text-sm font-black text-white uppercase group-hover:text-cyan-400 transition-colors">{log.scenario_type}</span>
                                <div className="text-[10px] text-gray-500 uppercase font-bold mt-1 tracking-widest">
                                  {new Date(log.created_at).toLocaleTimeString()} • {log.simulation_result?._inference_source === 'mistral' ? 'Mistral Fallback' : 'Local Engine'}
                                </div>
                              </div>
                              <span className={`text-[10px] font-black px-2 py-1 rounded border uppercase tracking-widest ${successDelta >= 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                                Success {successDelta >= 0 ? '+' : ''}{successDelta}%
                              </span>
                            </div>
                            <div className="flex gap-4">
                              <div className="flex-1 bg-black/40 rounded p-2 border border-white/5">
                                <span className="block text-[9px] text-gray-500 font-bold uppercase mb-1">Success Prob</span>
                                <span className="text-xs font-black text-white">{log.current_success_probability}% → {log.projected_success_probability}%</span>
                              </div>
                              <div className="flex-1 bg-black/40 rounded p-2 border border-white/5">
                                <span className="block text-[9px] text-gray-500 font-bold uppercase mb-1">Risk Change</span>
                                <span className="text-xs font-black text-white">{log.current_risk_score} → {log.projected_risk_score}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-10 text-center">
                      <Box className="w-10 h-10 text-white/10 mb-2" />
                      <p className="text-gray-500 text-sm">No scenarios simulated yet.</p>
                    </div>
                  )}
                </GlassCard>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
