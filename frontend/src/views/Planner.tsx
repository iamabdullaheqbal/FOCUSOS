'use client'

import React, { useState, useEffect } from 'react';
import { usePageMeta } from '../hooks/usePageMeta';
import { 
  CalendarClock, BrainCircuit, Activity, Clock, Zap, Target, 
  ShieldAlert, Coffee, Settings2, Play, Loader2, CheckCircle2,
  AlertTriangle, Server, Archive, BarChart2, ListX, Lock, Unlock, Plus
} from 'lucide-react';
import { GlassCard } from '../components/UI/GlassCard';
import { GradientButton } from '../components/UI/GradientButton';
import { Badge } from '../components/UI/Badge';
import { Skeleton } from '../components/UI/Skeleton';
import { FocusOSApi } from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { useCountUp } from '../hooks/useCountUp';
import { useSync } from '../hooks/useSync';
import { usePathname, useSearchParams } from 'next/navigation';

const AnimatedKpi = ({ value, suffix = '', label, icon: Icon, delay = 0, colorClass = "text-white" }: any) => {
  const isNumber = typeof value === 'number';
  const count = useCountUp(isNumber ? value : 0, 1.5);
return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
    >
      <GlassCard className="p-4 flex flex-col hover:-translate-y-1 transition-transform duration-300 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
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
};

export const Planner: React.FC = () => {
  usePageMeta('AI Planner');
  const [tasks, setTasks] = useState<any[]>([]);
  const [schedule, setSchedule] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);
  
  const [availableHours, setAvailableHours] = useState(6);
  const [deepWorkFocus, setDeepWorkFocus] = useState(true);
  const [breakDuration, setBreakDuration] = useState(15);
  const [strategy, setStrategy] = useState('Balanced');
  
  // Drag and Drop State
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const searchParams = useSearchParams();
  const linkedTaskId = searchParams.get('task');

  const handleDragStart = (e: React.DragEvent, idx: number) => {
    setDraggedIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === idx) return;

    const newSched = [...schedule.schedule];
    const temp = newSched[draggedIdx];
    newSched[draggedIdx] = newSched[idx];
    newSched[idx] = temp;
    
    setSchedule({ ...schedule, schedule: newSched });
    setDraggedIdx(null);
  };
  
  const toggleLock = (idx: number) => {
     if (!schedule || !schedule.schedule) return;
     const newSched = [...schedule.schedule];
     newSched[idx].locked = !newSched[idx].locked;
     setSchedule({ ...schedule, schedule: newSched });
  };

  const extendDuration = (idx: number) => {
     console.log("Extend duration for slot", idx);
     alert("Duration extension requested! (Timeline Recalculation Pending)");
  };

  const fetchData = async () => {
    try {
      const [tasksRes, analyticsRes, scheduleRes] = await Promise.all([
        FocusOSApi.getTasks(),
        FocusOSApi.getAnalyticsOverview(),
        FocusOSApi.getLatestSchedule()
      ]);
      setTasks(tasksRes.tasks || []);
      setAnalytics(analyticsRes.data || null);
      if (scheduleRes.data) {
        setSchedule(scheduleRes.data);
        if (scheduleRes.data.available_hours) setAvailableHours(scheduleRes.data.available_hours);
        if (scheduleRes.data.strategy) setStrategy(scheduleRes.data.strategy);
      }
    } catch (err) {}
  };

  useEffect(() => {
    fetchData();
  }, []);

  useSync([
    'TASK_CREATED', 'TASK_UPDATED', 'TASK_COMPLETED', 'TASK_DELETED',
    'PLANNER_GENERATED', 'PLANNER_UPDATED', 'RESCUE_EXECUTED', 'RESCUE_ROLLBACK'
  ], fetchData, { ignoreOrigin: 'Planner' });

  const handleGeneratePlan = async () => {
    setLoading(true);
    try {
      const result = await FocusOSApi.runPlanningAgent({
        tasks,
        availability: { 
          daily_available_hours: availableHours, 
          preferred_work_hours: { start: "09:00", end: "21:00" },
          strategy,
          deepWorkFocus,
          breakDuration
        }
      });
      setSchedule(result.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculatePlannedHours = () => {
    if (!schedule || !schedule.schedule) return 0;
    let totalMins = 0;
    schedule.schedule.forEach((s: any) => {
      if (s.is_break || s.task.toLowerCase().includes('break')) return;
      const [sh, sm] = s.start_time.split(':').map(Number);
      const [eh, em] = s.end_time.split(':').map(Number);
      let mins = (eh * 60 + em) - (sh * 60 + sm);
      if (mins < 0) mins += 24 * 60;
      totalMins += mins;
    });
    return Math.round((totalMins / 60) * 10) / 10;
  };

  const calculateDuration = (start: string, end: string) => {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    let mins = (eh * 60 + em) - (sh * 60 + sm);
    if (mins < 0) mins += 24 * 60;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  };

  const plannedHours = calculatePlannedHours();
  const capacityUtilization = availableHours > 0 ? Math.round((plannedHours / availableHours) * 100) : 0;
  const backlogCount = schedule?.backlog?.length || 0;
  const focusScore = schedule?.confidence_score || (analytics?.productivity_score || 0);
  
  // Schedule Health Status unified logic
  let healthStatus = "Optimal";
  if (capacityUtilization > 95 || backlogCount > 0) healthStatus = "Critical";
  else if (capacityUtilization > 85) healthStatus = "Warning";
  else if (capacityUtilization > 70) healthStatus = "Healthy";

  const riskLevel = backlogCount > 0 ? 'High' : (capacityUtilization > 85 ? 'Medium' : 'Low');

  // Formatted date for header
  const generatedDate = schedule?.created_at ? new Date(schedule.created_at).toLocaleString() : "Not Generated";
  const generatedBy = schedule?.generated_by || "No Execution Yet";
  const efficiency = schedule?.sys_confidence || schedule?._system_confidence || 0;

  const hasScheduleData = !!schedule;

  return (
    <div className="space-y-6 pb-12">
      
      {/* SECTION 1: LIGHTWEIGHT HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 px-2">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <CalendarClock className="w-8 h-8 text-amber-400" /> AI Planner
          </h1>
          <p className="text-gray-400 text-sm font-medium mt-1">Autonomous Schedule Optimization</p>
        </div>
        
        <div className="flex flex-wrap gap-3 items-center">
          {schedule && (
            <>
              <Badge variant={healthStatus === "Critical" ? "danger" : healthStatus === "Warning" ? "warning" : "success"}>
                {healthStatus} Health
              </Badge>
              {backlogCount > 0 ? (
                <Badge variant="danger">Backlog Present</Badge>
              ) : (
                <Badge variant="success">Capacity Safe</Badge>
              )}
              {schedule.strategy === "Deep Focus" && <Badge variant="warning">Deep Work Enabled</Badge>}
              <Badge variant="neutral">Priority Optimized</Badge>
            </>
          )}
        </div>
      </div>

      {/* SECTION 2: KPI COMMAND BAR (Simplified to 6) */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <AnimatedKpi value={availableHours} suffix="h" label="Available Hours" icon={Clock} delay={0.1} colorClass="text-white" />
        <AnimatedKpi value={plannedHours} suffix="h" label="Planned Hours" icon={Activity} delay={0.15} colorClass="text-amber-400" />
        <AnimatedKpi value={capacityUtilization} suffix="%" label="Capacity Used" icon={BarChart2} delay={0.2} colorClass={capacityUtilization > 90 ? "text-rose-400" : "text-cyan-400"} />
        <AnimatedKpi value={backlogCount} label="Backlog Tasks" icon={ListX} delay={0.25} colorClass={backlogCount > 0 ? "text-rose-400" : "text-emerald-400"} />
        <AnimatedKpi value={focusScore} suffix="%" label="Confidence" icon={Target} delay={0.3} colorClass="text-emerald-400" />
        <AnimatedKpi value={riskLevel} label="Risk Level" icon={AlertTriangle} delay={0.35} colorClass={riskLevel === 'High' ? 'text-rose-400' : riskLevel === 'Medium' ? 'text-amber-400' : 'text-emerald-400'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* SECTION 3: TIMELINE CENTERPIECE OR EMPTY STATE */}
        <div className="lg:col-span-8 space-y-6">
          {loading ? (
            <GlassCard className="h-auto bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.35)] p-6">
              <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
                <Skeleton className="h-8 w-64" />
              </div>
              <div className="space-y-6">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex gap-6 items-center">
                    <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ))}
              </div>
            </GlassCard>
          ) : hasScheduleData ? (
            <GlassCard className="h-auto bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
              <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
                <h2 className="text-xl font-black text-white flex items-center gap-3">
                  <CalendarClock className="w-6 h-6 text-amber-400" /> Executive Daily Timeline
                </h2>
              </div>

              <div className="space-y-6 relative max-h-[800px] overflow-y-auto overflow-x-hidden pr-2 custom-scrollbar before:absolute before:inset-0 before:ml-[1.2rem] before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-amber-500 before:via-white/10 before:to-transparent">
                <AnimatePresence>
                  {(schedule.schedule || []).map((slot: any, idx: number) => {
                    const isBreak = slot.is_break || slot.task.toLowerCase().includes('break');
                    const isFocus = slot.focus_block;
                    const durationStr = calculateDuration(slot.start_time, slot.end_time);
                    
                    return (
                      <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        key={idx} 
                        className="relative flex items-start gap-6 group"
                      >
                        {/* Timeline Node */}
                        <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0 z-10 shadow-lg transition-colors ${
                          isBreak ? 'bg-black border-gray-600 text-gray-400' :
                          isFocus ? 'bg-black border-amber-500 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]' :
                          'bg-black border-indigo-500 text-indigo-400'
                        }`}>
                          {isBreak ? <Coffee className="w-4 h-4" /> : isFocus ? <Zap className="w-4 h-4" /> : <Target className="w-4 h-4" />}
                        </div>
                        
                        {/* Timeline Card */}
                        <div 
                          id={`planner-task-${idx}`}
                          ref={el => {
                            if (el && linkedTaskId && (slot.task_id === linkedTaskId || slot.task.includes(linkedTaskId))) {
                              setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
                            }
                          }}
                          draggable={!slot.locked}
                          onDragStart={(e) => handleDragStart(e, idx)}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, idx)}
                          className={`flex-1 p-5 rounded-2xl border transition-all duration-300 ${!slot.locked ? 'cursor-grab active:cursor-grabbing hover:-translate-y-1' : 'cursor-not-allowed opacity-80'} ${
                          isBreak ? 'bg-white/5 border-white/10 opacity-70' :
                          isFocus ? 'bg-amber-500/5 border-amber-500/30 shadow-[0_4px_20px_rgba(245,158,11,0.1)]' :
                          'bg-white/[0.03] border-white/10 hover:bg-white/[0.05]'
                        } ${(linkedTaskId && slot.task_id === linkedTaskId) || (linkedTaskId && slot.task.includes(linkedTaskId)) ? 'ring-2 ring-primary ring-offset-2 ring-offset-black animate-pulse shadow-[0_0_20px_rgba(139,92,246,0.3)]' : ''}`}>
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-3">
                              <span className={`text-sm font-black tracking-wider ${isBreak ? 'text-gray-400' : 'text-white'}`}>
                                {slot.start_time} <span className="text-gray-600 mx-1">—</span> {slot.end_time}
                              </span>
                              <Badge variant="neutral">{durationStr}</Badge>
                            </div>
                            <div className="flex gap-2 items-center opacity-0 group-hover:opacity-100 transition-opacity">
                              {!isBreak && (
                                <>
                                  <button onClick={() => toggleLock(idx)} className={`p-1 rounded-md transition-colors ${slot.locked ? 'bg-rose-500/20 text-rose-400' : 'hover:bg-white/10 text-gray-400'}`}>
                                    {slot.locked ? <Lock className="w-4 h-4"/> : <Unlock className="w-4 h-4"/>}
                                  </button>
                                  <button onClick={() => extendDuration(idx)} className="p-1 rounded-md hover:bg-white/10 text-gray-400 transition-colors">
                                    <Plus className="w-4 h-4"/>
                                  </button>
                                </>
                              )}
                              {isFocus && <Badge variant="warning">Deep Work</Badge>}
                              {!isBreak && <Badge variant="neutral">Priority</Badge>}
                            </div>
                          </div>
                          <h3 className={`text-lg font-bold ${isBreak ? 'text-gray-500' : 'text-white'}`}>{slot.task}</h3>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            </GlassCard>
          ) : (
            <GlassCard className="h-[400px] flex flex-col items-center justify-center text-center bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.35)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
              
              <div className="relative z-10">
                <CalendarClock className="w-16 h-16 text-white/10 mb-6 mx-auto" />
                <h2 className="text-2xl font-black text-white mb-2">No Schedule Generated Yet</h2>
                <p className="text-gray-400 max-w-sm mx-auto mb-6">
                  Configure your planning constraints and click <span className="text-amber-400 font-bold">"Synthesize Plan"</span> to generate an optimized execution plan.
                </p>
                <div className="flex flex-wrap justify-center gap-4 text-xs font-bold uppercase tracking-widest">
                  <span className="flex items-center gap-2 text-emerald-400"><CheckCircle2 className="w-4 h-4"/> Local Engine Ready</span>
                  <span className="flex items-center gap-2 text-fuchsia-400"><Server className="w-4 h-4"/> Gemini Fallback</span>
                </div>
              </div>
            </GlassCard>
          )}
        </div>
        
        {/* RIGHT COLUMN: CONTROLS & INTELLIGENCE */}
        <div className="lg:col-span-4 space-y-6">
          
          <GlassCard className="border-t-2 border-t-amber-400 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
            <h2 className="text-sm font-bold text-white mb-4 uppercase tracking-widest flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-amber-400" /> Engine Constraints
            </h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="flex justify-between text-xs font-bold text-gray-400 mb-1.5 uppercase">
                  <span>Available Hours</span>
                  <span className="text-amber-400">{availableHours}h</span>
                </label>
                <input 
                  type="range" 
                  min="1" max="16" 
                  value={availableHours} 
                  onChange={(e) => setAvailableHours(parseInt(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase">Strategy Payload</label>
                <select 
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white outline-none focus:border-amber-500 transition-colors"
                  value={strategy}
                  onChange={(e) => setStrategy(e.target.value)}
                >
                  <option value="Balanced" className="bg-slate-900 text-white">Balanced</option>
                  <option value="Deep Work" className="bg-slate-900 text-white">Deep Work</option>
                  <option value="Exam Mode" className="bg-slate-900 text-white">Exam Mode</option>
                  <option value="Placement Mode" className="bg-slate-900 text-white">Placement Mode</option>
                  <option value="Hackathon Mode" className="bg-slate-900 text-white">Hackathon Mode</option>
                  <option value="Recovery Mode" className="bg-slate-900 text-white">Recovery Mode</option>
                </select>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase">Break Limit</label>
                  <div className="flex items-center bg-black/40 border border-white/10 rounded-lg overflow-hidden">
                    <input 
                      type="number" 
                      value={breakDuration} 
                      onChange={(e) => setBreakDuration(parseInt(e.target.value))}
                      className="w-full bg-transparent p-2 text-sm text-white outline-none"
                    />
                    <span className="pr-3 text-xs text-gray-500">min</span>
                  </div>
                </div>
                <div className="flex-1 flex flex-col justify-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="rounded bg-white/10 border-white/20 text-amber-500 w-4 h-4 accent-amber-500"
                      checked={deepWorkFocus}
                      onChange={(e) => setDeepWorkFocus(e.target.checked)}
                    />
                    <span className="text-xs font-bold text-gray-300">Deep Work</span>
                  </label>
                </div>
              </div>
            </div>

            <GradientButton className="w-full flex justify-center items-center gap-2 py-3" onClick={handleGeneratePlan} disabled={loading}>
              {loading ? <><Loader2 className="w-4 h-4 animate-spin"/> Processing...</> : <><Play className="w-4 h-4" fill="currentColor"/> Synthesize Plan</>}
            </GradientButton>
          </GlassCard>

          {/* ALWAYS VISIBLE: SCHEDULE HEALTH MONITOR */}
          <GlassCard className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
            <h2 className="text-sm font-bold text-white mb-4 uppercase tracking-widest flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400" /> Schedule Health
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-400 uppercase">Schedule Status</span>
                <span className={`text-sm font-black ${healthStatus === 'Critical' ? 'text-rose-400' : healthStatus === 'Warning' ? 'text-amber-400' : 'text-emerald-400'}`}>{healthStatus}</span>
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-gray-400">Capacity Usage</span>
                  <span className="text-white">{capacityUtilization}%</span>
                </div>
                <div className="h-1.5 w-full bg-black/50 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(capacityUtilization, 100)}%` }}
                    transition={{ duration: 1 }}
                    className={`h-full rounded-full ${capacityUtilization > 90 ? 'bg-rose-500' : capacityUtilization > 75 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                  />
                </div>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-white/10">
                <span className="text-xs font-bold text-gray-400 uppercase">Risk Score</span>
                <span className="text-sm font-bold text-white">{riskLevel}</span>
              </div>
            </div>
          </GlassCard>

          {/* ALWAYS VISIBLE: LOCAL INTELLIGENCE MONITOR */}
          <GlassCard className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
            <h2 className="text-sm font-bold text-white mb-4 uppercase tracking-widest flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-400" /> Intelligence Monitor
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-white/10">
                <span className="text-xs font-bold text-gray-400 uppercase">Execution Mode</span>
                <Badge variant={generatedBy === "LOCAL_FALLBACK_RECOVERY" ? "danger" : generatedBy === "gemini" ? "warning" : "success"}>
                  {generatedBy === "LOCAL_FALLBACK_RECOVERY" ? "Local Recovery" : generatedBy === "gemini" ? "Gemini" : "Local"}
                </Badge>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-white/10">
                <span className="text-xs font-bold text-gray-400 uppercase">Confidence</span>
                <span className="text-sm font-black text-white">{efficiency}%</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-white/10">
                <span className="text-xs font-bold text-gray-400 uppercase">Fallback Used</span>
                <span className="text-sm font-bold text-gray-300">{efficiency < 75 || generatedBy === "gemini" ? "Yes" : "No"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-400 uppercase">Generated At</span>
                <span className="text-sm font-bold text-gray-300 truncate ml-2 text-right">{generatedDate}</span>
              </div>
              {generatedBy === "LOCAL_FALLBACK_RECOVERY" && schedule?.fallback_reason && (
                <div className="mt-2 p-2 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-400 font-bold">
                  Reason: {schedule.fallback_reason}
                </div>
              )}
            </div>
          </GlassCard>

          {/* ONLY VISIBLE IF SCHEDULE EXISTS */}
          {hasScheduleData && (
            <>
              {/* BACKLOG INTELLIGENCE */}
              <GlassCard className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
                <h2 className="text-sm font-bold text-white mb-4 uppercase tracking-widest flex items-center gap-2">
                  <Archive className="w-4 h-4 text-rose-400" /> Backlog Intelligence
                </h2>
                <div className="space-y-3">
                  {backlogCount === 0 ? (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span className="text-sm font-bold text-emerald-400">All tasks scheduled successfully.</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center pb-2 border-b border-white/10">
                        <span className="text-xs font-bold text-gray-400 uppercase">Deferred Tasks</span>
                        <Badge variant="danger">{backlogCount}</Badge>
                      </div>
                      {schedule.backlog.map((b: any, idx: number) => (
                        <div key={idx} className="p-3 bg-black/40 rounded-lg border border-rose-500/20">
                          <h4 className="text-sm font-bold text-white mb-1 truncate">{b.title}</h4>
                          <p className="text-xs text-rose-400 mb-2">{b.reason}</p>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-500">Suggested Action:</span>
                            <span className="font-bold text-gray-300">{b.suggested_day}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </GlassCard>

              {/* PLANNING INSIGHTS */}
              <GlassCard className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.35)] border-l-2 border-l-indigo-500">
                <h2 className="text-sm font-bold text-indigo-400 mb-4 uppercase tracking-widest flex items-center gap-2">
                  <BrainCircuit className="w-4 h-4" /> Planning Insights
                </h2>
                <div className="space-y-3">
                  {schedule?.planning_brief?.length > 0 && schedule.planning_brief.map((brief: any, idx: number) => (
                    <div key={idx} className="p-3 bg-black/40 rounded-lg border border-white/5">
                      <div className="flex justify-between items-start mb-1">
                        <span className={`text-xs font-bold uppercase ${brief.type === 'warning' ? 'text-amber-400' : 'text-emerald-400'}`}>{brief.title}</span>
                      </div>
                      <p className="text-sm text-gray-300">{brief.content}</p>
                    </div>
                  ))}
                </div>
              </GlassCard>

              {/* TWIN IMPACT ANALYSIS */}
              <GlassCard className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.35)] border-l-2 border-l-cyan-500">
                <h2 className="text-sm font-bold text-cyan-400 mb-3 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" /> Twin Impact Analysis
                </h2>
                <p className="text-xs text-gray-400 mb-4 italic">"{schedule?.twin_simulation?.message}"</p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-black/40 border border-cyan-500/10">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Impact Level</span>
                    <span className={`text-sm font-black ${schedule?.twin_simulation?.impact_level === 'CRITICAL' ? 'text-rose-400' : schedule?.twin_simulation?.impact_level === 'MODERATE' ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {schedule?.twin_simulation?.impact_level || "UNKNOWN"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-black/40 border border-cyan-500/10">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Risk Increase</span>
                    <span className="text-lg font-black text-white">{schedule?.twin_simulation?.risk_increase || "0%"}</span>
                  </div>
                </div>
              </GlassCard>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
