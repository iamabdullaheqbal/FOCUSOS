'use client'

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { usePageMeta } from '../hooks/usePageMeta';
import { 
  Target, TrendingUp, Rocket,
  BrainCircuit, Award, Activity, ChevronRight, CheckCircle2,
  Terminal, Plus, X, Loader2, Calendar, AlertTriangle,
  MoreVertical, Edit2, Archive, Trash2, CheckSquare, Pause, Play,
  Pin, PinOff, RefreshCw, Flame
} from 'lucide-react';
import { GlassCard } from '../components/UI/GlassCard';
import { FocusOSApi } from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '../components/UI/Badge';
import { CustomDatePicker } from '../components/UI/CustomDatePicker';
import { differenceInDays, subDays, format } from 'date-fns';
import { useSync } from '../hooks/useSync';
import { usePathname, useSearchParams } from 'next/navigation';
import { Skeleton } from '../components/UI/Skeleton';

const CustomSelect = ({ value, onChange, options, label }: any) => {
  const [open, setOpen] = useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handleClickOutside);
return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{label}</label>
      <button type="button" onClick={() => setOpen(!open)} className="w-full bg-black/50 border border-white/10 hover:border-cyan-500/50 rounded-lg p-3 text-white text-left flex justify-between items-center transition-colors focus:outline-none">
        <span>{value}</span>
        <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} className="absolute z-[70] top-full mt-2 left-0 right-0 bg-[#0f0f0f] border border-white/10 rounded-xl shadow-2xl py-2">
            {options.map((opt: string) => (
              <button key={opt} type="button" onClick={() => { onChange(opt); setOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-white/5 text-gray-300 hover:text-white transition-colors">{opt}</button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ActionMenu = ({ options }: { options: {label: string, icon: any, onClick: (e: React.MouseEvent) => void, color?: string}[] }) => {
  const [open, setOpen] = useState(false);
  const btnRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, isBottom: false });

  useEffect(() => {
    if (!open) return;
    const updateCoords = () => {
      if (btnRef.current) {
        const rect = btnRef.current.getBoundingClientRect();
        const isBottom = rect.bottom > window.innerHeight - 250;
        setCoords({
          top: isBottom ? rect.top - 5 + window.scrollY : rect.bottom + 5 + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          isBottom
        });
      }
    };
    updateCoords();
    
    const handleScroll = () => { setOpen(false); };
    const handleResize = () => { setOpen(false); };
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => { 
      if (btnRef.current && btnRef.current.contains(e.target as Node)) return;
      if (menuRef.current && menuRef.current.contains(e.target as Node)) return;
      setOpen(false); 
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  return (
    <>
      <button ref={btnRef} onClick={(e) => { e.stopPropagation(); setOpen(!open); }} className="p-1 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white focus:outline-none">
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && createPortal(
        <div ref={menuRef} style={{ position: 'absolute', top: coords.isBottom ? 'auto' : coords.top, bottom: coords.isBottom ? window.innerHeight - coords.top + 10 : 'auto', left: coords.left - 192 + coords.width, zIndex: 99999 }}>
          <AnimatePresence>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-48 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl py-1 overflow-hidden">
              {options.map((opt, i) => (
                <button key={i} onClick={(e) => { e.stopPropagation(); opt.onClick(e); setOpen(false); }} className={`w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors ${opt.color || 'text-gray-300 hover:text-white hover:bg-white/5'}`}>
                  <opt.icon className="w-4 h-4" /> {opt.label}
                </button>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>,
        document.body
      )}
    </>
  );
};

const GoalCard = React.memo(({ goal, index, expanded, onToggleExpand, onUpdate, onEdit, onDelete, onArchive, onUnarchive, onPin, isLinked }: any) => {
  useEffect(() => {
    if (isLinked) {
      setTimeout(() => document.getElementById(`goal-${goal.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
    }
  }, [isLinked, goal.id]);
  const getHealthStatus = (score: number) => {
    if (score >= 90) return { label: 'Healthy', color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/30' };
    if (score >= 70) return { label: 'Good', color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/30' };
    if (score >= 40) return { label: 'Warning', color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/30' };
    return { label: 'Critical', color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/30' };
  };

  const health = getHealthStatus(goal.health_score);
  const completedMilestones = goal.milestones.filter((m: any) => m.completed).length;
  const totalMilestones = goal.milestones.length;
  const targetDate = goal.target_date ? new Date(goal.target_date) : new Date();
  const daysLeft = differenceInDays(targetDate, new Date());
  
  let deadlineBadge = "";
  if (goal.status === "COMPLETED") deadlineBadge = "Achieved";
  else if (daysLeft < 0) deadlineBadge = "Overdue";
  else if (daysLeft === 0) deadlineBadge = "Due Today";
  else deadlineBadge = `${daysLeft} Days Left`;

  const handleMilestoneClick = async (e: React.MouseEvent, m: any) => {
    e.stopPropagation();
    let nextStatus = "NOT_STARTED";
    if (m.status === "NOT_STARTED") nextStatus = "IN_PROGRESS";
    else if (m.status === "IN_PROGRESS") nextStatus = "COMPLETED";
    else nextStatus = "NOT_STARTED";
    await onUpdate(m.id, nextStatus);
  };

  const actionOptions = [
    { label: "Edit Goal", icon: Edit2, onClick: () => onEdit(goal) },
    { label: goal.pinned ? "Unpin Goal" : "Pin Goal", icon: goal.pinned ? PinOff : Pin, onClick: () => onPin(goal) },
    goal.archived 
      ? { label: "Unarchive Goal", icon: RefreshCw, onClick: () => onUnarchive(goal) }
      : { label: "Archive Goal", icon: Archive, onClick: () => onArchive(goal) },
    { label: "Delete Goal", icon: Trash2, onClick: () => onDelete(goal), color: 'text-rose-400 hover:text-rose-300 hover:bg-rose-500/10' }
  ];

  if (!expanded && !goal.pinned) {
    // Collapsed View
    return (
      <GlassCard id={`goal-${goal.id}`} className={`cursor-pointer hover:border-cyan-500/50 hover:bg-white/5 transition-all group ${isLinked ? 'ring-2 ring-primary animate-pulse shadow-[0_0_20px_rgba(139,92,246,0.3)]' : ''}`} onClick={() => onToggleExpand(goal.id)}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4 flex-1">
            <div className={`w-1.5 h-12 rounded-full ${goal.status === 'COMPLETED' ? 'bg-emerald-400' : 'bg-cyan-400'}`} />
            <div className="flex-1">
              <div className="flex gap-2 items-center mb-1">
                <h3 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">{goal.title}</h3>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${goal.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' : daysLeft < 0 ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}`}>
                  {deadlineBadge}
                </span>
                {goal.archived && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase bg-gray-500/20 text-gray-400">Archived</span>}
              </div>
              <div className="flex gap-4 text-xs font-bold text-gray-500 uppercase tracking-widest">
                <span>{goal.progress_percentage}% Done</span>
                <span className="hidden sm:inline">|</span>
                <span className="hidden sm:inline">{completedMilestones}/{totalMilestones} Milestones</span>
                {goal.status !== 'COMPLETED' && (
                  <>
                    <span className="hidden sm:inline">|</span>
                    <span className={`${health.color} hidden sm:inline`}>{health.label}</span>
                  </>
                )}
                {goal.status === 'COMPLETED' && goal.success_score && (
                  <>
                    <span className="hidden sm:inline">|</span>
                    <span className="text-emerald-400 hidden sm:inline">Score: {goal.success_score}</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:block w-32 h-1.5 bg-black/50 rounded-full overflow-hidden">
                <div className={`h-full ${goal.status === 'COMPLETED' ? 'bg-emerald-400' : 'bg-cyan-400'}`} style={{ width: `${goal.progress_percentage}%` }} />
              </div>
              <ActionMenu options={actionOptions} />
            </div>
          </div>
        </div>
      </GlassCard>
    );
  }

  // Expanded View
  return (
    <GlassCard id={`goal-${goal.id}`} className={`relative overflow-visible transition-all ${goal.pinned ? 'border-primary/50 shadow-[0_0_20px_rgba(139,92,246,0.1)]' : 'border-t-2 border-t-cyan-500/50 hover:shadow-[0_0_30px_rgba(34,211,238,0.1)]'} ${isLinked ? 'ring-2 ring-primary animate-pulse' : ''}`}>
      <div className={`absolute top-0 right-0 w-96 h-96 ${goal.pinned ? 'bg-primary/5 blur-[120px]' : 'bg-cyan-500/5 blur-[120px]'} rounded-full pointer-events-none`} />
      
      {!goal.pinned && (
        <button onClick={() => onToggleExpand(goal.id)} className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-black border border-white/10 rounded-full text-[10px] uppercase font-bold tracking-widest text-gray-400 hover:text-white transition-colors z-20 flex items-center gap-1">
          Collapse Goal
        </button>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        <div className="lg:col-span-5 space-y-5">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex gap-2 mb-2 items-center flex-wrap">
                <Badge variant="info">{goal.category}</Badge>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${goal.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' : daysLeft < 0 ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}`}>
                  {deadlineBadge}
                </span>
                {goal.priority && <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-gray-500/20 text-gray-300 border border-gray-500/30">Priority: {goal.priority}</span>}
                {goal.pinned && <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-primary/20 text-primary border border-primary/30 flex items-center gap-1"><Pin className="w-3 h-3" /> Pinned</span>}
                {goal.archived && <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-gray-500/20 text-gray-400">Archived</span>}
              </div>
              <h3 className="text-2xl font-black text-white leading-tight flex items-center gap-2">
                {goal.title}
                {goal.status === "COMPLETED" && <Award className="w-5 h-5 text-emerald-400" />}
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <div className={`px-3 py-1 rounded-lg border hidden sm:flex flex-col items-end ${health.bg} ${health.border}`}>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Risk Status</span>
                <span className={`text-sm font-black ${health.color} uppercase tracking-widest`}>{health.label}</span>
              </div>
              <ActionMenu options={actionOptions} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-black/40 p-3 rounded-lg border border-white/5">
              <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Goal Progress</span>
              <div className="flex items-end gap-2 mb-1">
                <span className="text-xl font-black text-white">{completedMilestones} / {totalMilestones}</span>
              </div>
              <div className="h-1.5 w-full bg-white/10 rounded-full">
                <div className={`h-full ${goal.status === 'COMPLETED' ? 'bg-emerald-400' : 'bg-cyan-400'} rounded-full transition-all duration-500`} style={{ width: `${goal.progress_percentage}%` }} />
              </div>
            </div>
            <div className="bg-black/40 p-3 rounded-lg border border-white/5">
              <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Planner Sync</span>
              <span className="text-xl font-black text-emerald-400 flex items-center gap-2">
                <Calendar className="w-4 h-4" /> {totalMilestones} Tasks
              </span>
            </div>
          </div>

          {goal.status === 'COMPLETED' && (
             <div className="bg-emerald-500/5 p-3 rounded-lg border border-emerald-500/20 flex flex-col gap-1">
               <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Completion Analytics</span>
               <div className="flex justify-between items-center text-sm font-bold text-white mt-1">
                 <span className="text-gray-400">Success Score:</span>
                 <span className="text-emerald-400">{goal.success_score}/100</span>
               </div>
               <div className="flex justify-between items-center text-sm font-bold text-white">
                 <span className="text-gray-400">Total Duration:</span>
                 <span className="text-white">{goal.duration || 'N/A'}</span>
               </div>
             </div>
          )}

          {goal.ai_forecast && goal.status !== 'COMPLETED' && (
            <div className="bg-primary/5 p-3 rounded-lg border border-primary/20 flex flex-col gap-3">
              <div className="flex gap-3 items-start">
                <BrainCircuit className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">AI Strategy Insight</p>
                  <p className="text-sm text-gray-300 italic">"{goal.ai_forecast.recommendations[0]}"</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-7">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Execution Roadmap</h4>
            {goal.status !== 'COMPLETED' && <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest bg-cyan-500/10 px-2 py-1 rounded animate-pulse">Click milestone to update status</span>}
          </div>
          
          <div className="flex flex-col space-y-4 relative before:absolute before:inset-0 before:ml-[1.1rem] before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-cyan-500 before:via-white/10 before:to-transparent">
            <AnimatePresence>
              {goal.milestones.map((m: any, i: number) => {
                const isCompleted = m.status === 'COMPLETED';
                const isInProgress = m.status === 'IN_PROGRESS';
                return (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 + i * 0.05 }} key={m.id} className="relative flex items-center gap-4 group cursor-pointer" onClick={(e) => handleMilestoneClick(e, m)}>
                    <div title="Click to Cycle Status: Not Started → In Progress → Completed" className={`w-9 h-9 rounded-full border-2 flex items-center justify-center shrink-0 z-10 transition-colors ${isCompleted ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : isInProgress ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.3)]' : 'bg-black border-white/20 text-gray-500 group-hover:border-cyan-400 group-hover:text-cyan-400 group-hover:shadow-[0_0_10px_rgba(34,211,238,0.2)]'}`}>
                      {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : isInProgress ? <Activity className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </div>
                    <div className={`flex-1 p-3 rounded-xl border transition-all ${isCompleted ? 'bg-emerald-500/5 border-emerald-500/20' : isInProgress ? 'bg-amber-500/5 border-amber-500/20' : 'bg-white/5 border-white/10 group-hover:border-white/20'}`}>
                      <div className="flex justify-between items-center">
                        <span className={`text-sm font-bold ${isCompleted ? 'text-emerald-400' : isInProgress ? 'text-amber-400' : 'text-gray-300'}`}>{m.title}</span>
                        <span className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded ${isCompleted ? 'bg-emerald-500/20 text-emerald-400' : isInProgress ? 'bg-amber-500/20 text-amber-400' : 'bg-white/10 text-gray-400'}`}>{m.status.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </GlassCard>
  );
});

const HabitHeatmap = ({ logs }: { logs: any[] }) => {
  // Generate last 30 days
  const days = Array.from({ length: 30 }).map((_, i) => {
    const d = subDays(new Date(), 29 - i);
    return format(d, 'yyyy-MM-dd');
  });

  const logsSet = new Set(logs.map(l => l.date));

  return (
    <div className="flex gap-1 overflow-x-auto pb-1 hide-scrollbar mt-3 opacity-80 group-hover:opacity-100 transition-opacity">
      {days.map(d => (
        <div 
          key={d} 
          title={d}
          className={`w-3 h-3 rounded-sm shrink-0 transition-colors ${logsSet.has(d) ? 'bg-purple-500 shadow-[0_0_5px_rgba(168,85,247,0.5)]' : 'bg-white/5'}`}
        />
      ))}
    </div>
  );
};

const HabitCard = React.memo(({ habit, onCheckIn, onEdit, onDelete, onArchive, onUnarchive, onStatus, isLinked }: any) => {
  useEffect(() => {
    if (isLinked) {
      setTimeout(() => document.getElementById(`habit-${habit.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
    }
  }, [isLinked, habit.id]);
  const getConsistencyStatus = (rate: number) => {
    if (rate >= 90) return { label: 'Excellent', color: 'text-emerald-400' };
    if (rate >= 70) return { label: 'Good', color: 'text-primary' };
    if (rate >= 40) return { label: 'Warning', color: 'text-amber-400' };
    return { label: 'Critical', color: 'text-rose-500' };
  };
  const status = getConsistencyStatus(habit.completion_rate);
  const [checkingIn, setCheckingIn] = useState(false);
  
  const todayStr = new Date().toISOString().split('T')[0];
  const checkedInToday = habit.last_checkin_date === todayStr;

  const handleCheckIn = async () => {
    if (checkedInToday) return;
    setCheckingIn(true);
    await onCheckIn(habit.id);
    setCheckingIn(false);
  };

  // Derived Analytics from logs
  const logs = habit.logs || [];
  const thisWeekLogs = logs.filter((l: any) => differenceInDays(new Date(), new Date(l.date)) <= 7).length;
  const thisMonthLogs = logs.filter((l: any) => differenceInDays(new Date(), new Date(l.date)) <= 30).length;

  let insight = "Keep building momentum!";
  if (habit.current_streak >= 7) insight = `${habit.current_streak} day streak maintained. Excellent.`;
  else if (thisWeekLogs === 0) insight = "No check-ins this week. Time to recover.";
  else if (habit.current_streak === habit.longest_streak && habit.current_streak > 0) insight = "Personal best streak active!";

  return (
    <GlassCard id={`habit-${habit.id}`} className={`relative overflow-visible group transition-all border-white/10 hover:border-purple-500/50 flex flex-col h-full ${habit.archived ? 'opacity-70 grayscale' : ''} ${isLinked ? 'ring-2 ring-primary animate-pulse shadow-[0_0_20px_rgba(139,92,246,0.3)]' : ''}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex gap-2 items-center mb-1">
            <h3 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors">{habit.name}</h3>
            {habit.status === 'Paused' && <span className="text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">Paused</span>}
            {habit.archived && <span className="text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-gray-500/20 text-gray-400">Archived</span>}
          </div>
          <Badge variant="neutral">{habit.frequency}</Badge>
        </div>
        <div className="flex gap-3 items-center">
          <div className="relative w-12 h-12 flex items-center justify-center group-hover:scale-110 transition-transform">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path className="text-white/10" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path className={`${status.color}`} strokeDasharray={`${habit.completion_rate}, 100`} strokeWidth="3" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            </svg>
            <span className="absolute text-[10px] font-bold text-white">{habit.completion_rate}%</span>
          </div>
          <ActionMenu options={[
            { label: "Edit Habit", icon: Edit2, onClick: () => onEdit(habit) },
            { label: habit.status === 'Paused' ? "Resume Habit" : "Pause Habit", icon: habit.status === 'Paused' ? Play : Pause, onClick: () => onStatus(habit.id, habit.status === 'Paused' ? 'Active' : 'Paused') },
            habit.archived
              ? { label: "Unarchive Habit", icon: RefreshCw, onClick: () => onUnarchive(habit) }
              : { label: "Archive Habit", icon: Archive, onClick: () => onArchive(habit) },
            { label: "Delete Habit", icon: Trash2, onClick: () => onDelete(habit), color: 'text-rose-400 hover:text-rose-300 hover:bg-rose-500/10' }
          ]} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-2">
        <div className="bg-black/30 rounded p-2 border border-white/5">
          <span className="block text-[9px] text-gray-500 uppercase font-bold mb-0.5">Streaks (Cur / Max)</span>
          <span className="text-sm font-black text-white flex items-center gap-1">
            <Flame className={`w-3 h-3 ${habit.current_streak > 0 ? 'text-amber-400' : 'text-gray-500'}`} />
            {habit.current_streak} <span className="text-gray-500 font-normal">/ {habit.longest_streak}</span>
          </span>
        </div>
        <div className="bg-black/30 rounded p-2 border border-white/5">
          <span className="block text-[9px] text-gray-500 uppercase font-bold mb-0.5">Consistency Meter</span>
          <span className={`text-sm font-black ${status.color} uppercase tracking-wider`}>{status.label}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
        <div className="text-gray-400">Last: <span className="text-white font-bold">{habit.last_checkin_date || 'Never'}</span></div>
        <div className="text-gray-400 text-right">Month: <span className="text-white font-bold">{thisMonthLogs} Check-ins</span></div>
      </div>

      <p className="text-xs text-purple-400 font-bold italic mb-2">"{insight}"</p>

      <HabitHeatmap logs={logs} />

      {!habit.archived && (
        <button 
          onClick={handleCheckIn}
          disabled={checkedInToday || checkingIn || habit.status === 'Paused'}
          className={`w-full py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors mt-4 ${checkedInToday ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : habit.status === 'Paused' ? 'bg-white/5 text-gray-500 cursor-not-allowed' : 'bg-purple-500 text-white hover:bg-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]'}`}
        >
          {checkingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckSquare className="w-4 h-4" />}
          {checkingIn ? 'Syncing...' : checkedInToday ? 'Checked In Today' : 'Check In Today'}
        </button>
      )}
    </GlassCard>
  );
});

export const Goals: React.FC = () => {
  usePageMeta('Goals & Habits');
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState<any[]>([]);
  const [habits, setHabits] = useState<any[]>([]);
  
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'Active' | 'Completed' | 'Archived'>('Active');
  
  const searchParams = useSearchParams();
  const linkedGoalId = searchParams.get('goal');
  const linkedHabitId = searchParams.get('habit');

  // Modals
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showHabitModal, setShowHabitModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, type: string, action: () => void, text: string, isDeleting?: boolean}>({isOpen: false, type: '', action: () => {}, text: '', isDeleting: false});
  
  const [isSubmittingGoal, setIsSubmittingGoal] = useState(false);
  const [isSubmittingHabit, setIsSubmittingHabit] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [isEditingHabit, setIsEditingHabit] = useState(false);
  const [currentEditId, setCurrentEditId] = useState("");

  const [newGoal, setNewGoal] = useState({ 
    title: '', description: '', category: 'General', start_date: '', target_date: '', priority: 'Medium' 
  });
  const [newHabit, setNewHabit] = useState({ 
    name: '', category: 'General', frequency: 'Daily', start_date: '', end_date: '', target_duration: '' 
  });

  const fetchData = useCallback(async () => {
    try {
      const [goalsRes, habitsRes] = await Promise.all([
        FocusOSApi.getGoals(),
        FocusOSApi.getHabits()
      ]);
      setGoals(goalsRes.data || []);
      setHabits(habitsRes.data || []);
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  }, []);

  useSync([
    'GOAL_CREATED', 'GOAL_UPDATED', 'GOAL_ARCHIVED', 'GOAL_COMPLETED',
    'HABIT_CREATED', 'HABIT_UPDATED', 'HABIT_CHECKIN', 'HABIT_STREAK_CHANGED'
  ], fetchData);
  
  useEffect(() => { fetchData(); }, [fetchData]);
  
  useEffect(() => {
    if (linkedGoalId) setExpandedGoalId(linkedGoalId);
  }, [linkedGoalId]);

  // Goal Arrays
  const pinnedGoals = useMemo(() => goals.filter(g => !g.archived && g.pinned && g.status !== 'COMPLETED'), [goals]);
  const activeGoals = useMemo(() => goals.filter(g => !g.archived && !g.pinned && g.status !== 'COMPLETED'), [goals]);
  const completedGoals = useMemo(() => goals.filter(g => !g.archived && g.status === 'COMPLETED'), [goals]);
  const archivedGoals = useMemo(() => goals.filter(g => g.archived), [goals]);

  // Habit Arrays
  const activeHabits = useMemo(() => habits.filter(h => !h.archived), [habits]);
  const archivedHabits = useMemo(() => habits.filter(h => h.archived), [habits]);

  // Habit Analytics
  const totalHabits = activeHabits.length;
  const currentActiveStreaks = activeHabits.filter(h => h.current_streak > 0).length;
  const longestOverallStreak = activeHabits.reduce((max, h) => h.longest_streak > max ? h.longest_streak : max, 0);
  const averageConsistency = totalHabits > 0 ? Math.round(activeHabits.reduce((acc, h) => acc + h.completion_rate, 0) / totalHabits) : 0;
  const checkInsThisWeek = activeHabits.reduce((acc, h) => acc + (h.logs || []).filter((l: any) => differenceInDays(new Date(), new Date(l.date)) <= 7).length, 0);

  // Goal Actions
  const handleCreateOrEditGoal = async () => {
    if (!newGoal.title || isSubmittingGoal) return;
    setIsSubmittingGoal(true); setErrorMsg("");
    try {
      if (isEditingGoal && currentEditId) await FocusOSApi.editGoal(currentEditId, newGoal);
      else await FocusOSApi.createGoal(newGoal);
      setShowGoalModal(false);
      await fetchData();
    } catch (err: any) { setErrorMsg(err.response?.data?.message || "Operation failed."); } 
    finally { setIsSubmittingGoal(false); }
  };

  const handleMilestoneUpdate = async (id: string, status: string) => {
    try { await FocusOSApi.updateMilestoneStatus(id, status); await fetchData(); } catch (e) { console.error(e); }
  };

  const openDeleteGoal = (goal: any) => {
    setConfirmModal({
      isOpen: true,
      type: 'Delete Goal',
      text: `Permanently delete "${goal.title}"? This destroys all linked planner tasks.`,
      action: async () => { 
        setConfirmModal(prev => ({...prev, isDeleting: true}));
        const backupGoals = [...goals];
        setGoals(prev => prev.filter(g => g.id !== goal.id));
        setConfirmModal(prev => ({...prev, isOpen: false, isDeleting: false}));
        try {
          await FocusOSApi.deleteGoal(goal.id); 
        } catch (err) {
          setGoals(backupGoals);
          setErrorMsg("Failed to delete goal.");
        }
      }
    });
  };

  const openArchiveGoal = (goal: any) => {
    setConfirmModal({
      isOpen: true,
      type: 'Archive Goal',
      text: `Archive "${goal.title}"?`,
      action: async () => { await FocusOSApi.archiveGoal(goal.id); await fetchData(); setConfirmModal(prev => ({...prev, isOpen: false})); }
    });
  };

  const handleUnarchiveGoal = async (goal: any) => {
    await FocusOSApi.unarchiveGoal(goal.id); await fetchData();
  };

  const handlePinGoal = async (goal: any) => {
    await FocusOSApi.pinGoal(goal.id); await fetchData();
  };

  const openEditGoal = (goal: any) => {
    setIsEditingGoal(true); setCurrentEditId(goal.id);
    setNewGoal({ title: goal.title, description: goal.description, category: goal.category || 'General', start_date: '', target_date: goal.target_date || '', priority: goal.priority || 'Medium' });
    setShowGoalModal(true);
  };

  // Habit Actions
  const handleCreateOrEditHabit = async () => {
    if (!newHabit.name || isSubmittingHabit) return;
    setIsSubmittingHabit(true); setErrorMsg("");
    try {
      if (isEditingHabit && currentEditId) await FocusOSApi.editHabit(currentEditId, newHabit);
      else await FocusOSApi.createHabit(newHabit);
      setShowHabitModal(false);
      await fetchData();
    } catch (err: any) { setErrorMsg(err.response?.data?.message || "Operation failed."); } 
    finally { setIsSubmittingHabit(false); }
  };

  const openDeleteHabit = (habit: any) => {
    setConfirmModal({
      isOpen: true,
      type: 'Delete Habit',
      text: `Permanently delete "${habit.name}"? Streak data will be erased.`,
      action: async () => { 
        setConfirmModal(prev => ({...prev, isDeleting: true}));
        const backupHabits = [...habits];
        setHabits(prev => prev.filter(h => h.id !== habit.id));
        setConfirmModal(prev => ({...prev, isOpen: false, isDeleting: false}));
        try {
          await FocusOSApi.deleteHabit(habit.id); 
        } catch (err) {
          setHabits(backupHabits);
          setErrorMsg("Failed to delete habit.");
        }
      }
    });
  };

  const openArchiveHabit = (habit: any) => {
    setConfirmModal({
      isOpen: true,
      type: 'Archive Habit',
      text: `Archive "${habit.name}"?`,
      action: async () => { await FocusOSApi.archiveHabit(habit.id); await fetchData(); setConfirmModal(prev => ({...prev, isOpen: false})); }
    });
  };

  const handleUnarchiveHabit = async (habit: any) => {
    await FocusOSApi.unarchiveHabit(habit.id); await fetchData();
  };

  const handleHabitStatus = async (id: string, status: string) => {
    await FocusOSApi.setHabitStatus(id, status); await fetchData();
  };

  const handleHabitCheckIn = async (id: string) => {
    try { await FocusOSApi.checkInHabit(id); await fetchData(); return true; } catch (e) { return false; }
  };

  const openEditHabit = (habit: any) => {
    setIsEditingHabit(true); setCurrentEditId(habit.id);
    setNewHabit({ name: habit.name, category: habit.category || 'General', frequency: habit.frequency || 'Daily', start_date: '', end_date: '', target_duration: habit.target_duration || '' });
    setShowHabitModal(true);
  };

  if (loading) {
    return (
      <div className="space-y-8 pb-12 mt-8">
        <Skeleton className="h-12 w-96 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      
      {/* GOALS ENGINE NAVIGATION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex gap-2 bg-white/5 p-1 rounded-xl">
          <button onClick={() => setActiveTab('Active')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'Active' ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-400 hover:text-white'}`}>Active Goals</button>
          <button onClick={() => setActiveTab('Completed')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'Completed' ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-400 hover:text-white'}`}>Completed Goals</button>
          <button onClick={() => setActiveTab('Archived')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'Archived' ? 'bg-gray-500/20 text-white' : 'text-gray-400 hover:text-white'}`}>Archived</button>
        </div>
        <button onClick={() => { setIsEditingGoal(false); setNewGoal({ title: '', description: '', category: 'General', start_date: '', target_date: '', priority: 'Medium' }); setShowGoalModal(true); }} className="flex items-center gap-2 px-5 py-2 bg-cyan-500 text-black text-sm font-bold rounded-lg hover:bg-cyan-400 transition-colors">
          <Plus className="w-4 h-4" /> New Goal
        </button>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        {/* ACTIVE GOALS TAB */}
        {activeTab === 'Active' && (
          <div className="space-y-8">
            {goals.filter(g => !g.archived && g.status !== 'COMPLETED').length === 0 ? (
              <GlassCard className="flex flex-col items-center justify-center py-16 border-dashed border-2 border-cyan-500/20 bg-cyan-500/5 hover:border-cyan-500/50 transition-colors cursor-pointer group" onClick={() => { setIsEditingGoal(false); setShowGoalModal(true); }}>
                <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Rocket className="w-8 h-8 text-cyan-400" />
                </div>
                <h3 className="text-xl font-black text-white mb-2">Create Your First Goal</h3>
                <p className="text-sm text-gray-400 text-center max-w-sm">Deploy the autonomous planning engine to generate a high-confidence execution roadmap.</p>
              </GlassCard>
            ) : (
              <>
                {/* Pinned Goals */}
                {pinnedGoals.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                      <Pin className="w-3 h-3" /> Pinned Goals
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      {pinnedGoals.map((goal, i) => <GoalCard key={goal.id} goal={goal} index={i} expanded={true} onToggleExpand={() => {}} onUpdate={handleMilestoneUpdate} onEdit={openEditGoal} onDelete={openDeleteGoal} onArchive={openArchiveGoal} onUnarchive={handleUnarchiveGoal} onPin={handlePinGoal} isLinked={goal.id === linkedGoalId} />)}
                    </div>
                  </div>
                )}
                {/* Active Goals */}
                {activeGoals.length > 0 && (
                  <div className="space-y-4">
                    {pinnedGoals.length > 0 && <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Active Goals</h3>}
                    <div className="grid grid-cols-1 gap-4">
                      {activeGoals.map((goal, i) => <GoalCard key={goal.id} goal={goal} index={i} expanded={expandedGoalId === goal.id} onToggleExpand={(id: string) => setExpandedGoalId(expandedGoalId === id ? null : id)} onUpdate={handleMilestoneUpdate} onEdit={openEditGoal} onDelete={openDeleteGoal} onArchive={openArchiveGoal} onUnarchive={handleUnarchiveGoal} onPin={handlePinGoal} isLinked={goal.id === linkedGoalId} />)}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* COMPLETED GOALS TAB */}
        {activeTab === 'Completed' && (
          <div className="space-y-6">
            {completedGoals.length === 0 ? (
              <GlassCard className="flex flex-col items-center justify-center py-16 border-dashed border-2 border-emerald-500/20 bg-emerald-500/5">
                <Award className="w-12 h-12 text-emerald-400/50 mb-4" />
                <h3 className="text-lg font-bold text-emerald-400">No Completed Goals Yet</h3>
                <p className="text-sm text-gray-400 text-center">Crush your active goals to see them logged here.</p>
              </GlassCard>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {completedGoals.map((goal, i) => <GoalCard key={goal.id} goal={goal} index={i} expanded={expandedGoalId === goal.id} onToggleExpand={(id: string) => setExpandedGoalId(expandedGoalId === id ? null : id)} onUpdate={handleMilestoneUpdate} onEdit={openEditGoal} onDelete={openDeleteGoal} onArchive={openArchiveGoal} onUnarchive={handleUnarchiveGoal} onPin={handlePinGoal} isLinked={goal.id === linkedGoalId} />)}
              </div>
            )}
          </div>
        )}

        {/* ARCHIVED GOALS TAB */}
        {activeTab === 'Archived' && (
          <div className="space-y-6">
            {archivedGoals.length === 0 && archivedHabits.length === 0 ? (
              <GlassCard className="flex flex-col items-center justify-center py-16 border-dashed border-2 border-white/10">
                <Archive className="w-12 h-12 text-gray-500 mb-4" />
                <h3 className="text-lg font-bold text-gray-400">No Archived Items Yet</h3>
              </GlassCard>
            ) : (
              <div className="space-y-8">
                 {archivedGoals.length > 0 && (
                   <div>
                     <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Archived Goals</h3>
                     <div className="grid grid-cols-1 gap-4">
                        {archivedGoals.map((goal, i) => <GoalCard key={goal.id} goal={goal} index={i} expanded={expandedGoalId === goal.id} onToggleExpand={(id: string) => setExpandedGoalId(expandedGoalId === id ? null : id)} onUpdate={handleMilestoneUpdate} onEdit={openEditGoal} onDelete={openDeleteGoal} onArchive={openArchiveGoal} onUnarchive={handleUnarchiveGoal} onPin={handlePinGoal} isLinked={goal.id === linkedGoalId} />)}
                     </div>
                   </div>
                 )}
                 {archivedHabits.length > 0 && (
                   <div>
                     <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Archived Habits</h3>
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {archivedHabits.map((habit) => <HabitCard key={habit.id} habit={habit} onCheckIn={handleHabitCheckIn} onEdit={openEditHabit} onDelete={openDeleteHabit} onArchive={openArchiveHabit} onUnarchive={handleUnarchiveHabit} onStatus={handleHabitStatus} isLinked={habit.id === linkedHabitId} />)}
                     </div>
                   </div>
                 )}
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* HABITS ENGINE */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="flex justify-between items-center mb-6 mt-12 border-t border-white/5 pt-8">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-purple-400" /> Advanced Streak Engine
          </h2>
          <button onClick={() => { setIsEditingHabit(false); setNewHabit({ name: '', category: 'General', frequency: 'Daily', start_date: '', end_date: '', target_duration: '' }); setShowHabitModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-widest rounded-lg transition-colors border border-purple-500/30">
            <Plus className="w-4 h-4" /> New Habit
          </button>
        </div>

        {/* Habit Analytics Panel */}
        {activeHabits.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <GlassCard className="p-4 bg-purple-500/5">
              <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider block mb-1">Total Habits</span>
              <span className="text-2xl font-black text-white">{totalHabits}</span>
            </GlassCard>
            <GlassCard className="p-4 bg-purple-500/5">
              <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider block mb-1">Active Streaks</span>
              <span className="text-2xl font-black text-white">{currentActiveStreaks}</span>
            </GlassCard>
            <GlassCard className="p-4 bg-purple-500/5">
              <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider block mb-1">Longest Streak</span>
              <span className="text-2xl font-black text-white flex items-center gap-2">{longestOverallStreak} <Flame className="w-4 h-4 text-amber-400" /></span>
            </GlassCard>
            <GlassCard className="p-4 bg-purple-500/5">
              <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider block mb-1">Avg Consistency</span>
              <span className="text-2xl font-black text-white">{averageConsistency}%</span>
            </GlassCard>
            <GlassCard className="p-4 bg-purple-500/5 col-span-2 md:col-span-1">
              <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider block mb-1">Check-ins (Week)</span>
              <span className="text-2xl font-black text-white">{checkInsThisWeek}</span>
            </GlassCard>
          </div>
        )}
        
        {activeHabits.length === 0 ? (
          <GlassCard className="flex flex-col items-center justify-center py-16 border-dashed border-2 border-purple-500/20 bg-purple-500/5 hover:border-purple-500/50 transition-colors cursor-pointer group" onClick={() => { setIsEditingHabit(false); setShowHabitModal(true); }}>
            <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-xl font-black text-white mb-2">Create Your First Habit</h3>
            <p className="text-sm text-gray-400 text-center max-w-sm">Establish recurring execution vectors to stabilize long-term momentum.</p>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
             {activeHabits.map((habit) => <HabitCard key={habit.id} habit={habit} onCheckIn={handleHabitCheckIn} onEdit={openEditHabit} onDelete={openDeleteHabit} onArchive={openArchiveHabit} onUnarchive={handleUnarchiveHabit} onStatus={handleHabitStatus} isLinked={habit.id === linkedHabitId} />)}
          </div>
        )}
      </motion.div>

    {/* CONFIRM MODAL */}
    <AnimatePresence>
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-md bg-[#0f0f0f] border border-rose-500/30 rounded-2xl p-6 shadow-2xl relative text-center">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 mx-auto flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{confirmModal.type}</h3>
            <p className="text-sm text-gray-400 mb-8">{confirmModal.text}</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setConfirmModal(prev => ({...prev, isOpen: false}))} disabled={confirmModal.isDeleting} className="px-5 py-2.5 rounded-lg text-sm font-bold text-white hover:bg-white/5 transition-colors disabled:opacity-50">Cancel</button>
              <button onClick={confirmModal.action} disabled={confirmModal.isDeleting} className="px-5 py-2.5 rounded-lg bg-rose-500 text-white text-sm font-bold hover:bg-rose-400 transition-colors disabled:opacity-50 flex items-center gap-2">
                {confirmModal.isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {confirmModal.isDeleting ? 'Processing...' : 'Confirm Action'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>

    {/* MODALS */}
    <AnimatePresence>
        {showGoalModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 shadow-2xl relative">
              <button onClick={() => !isSubmittingGoal && setShowGoalModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors disabled:opacity-50" disabled={isSubmittingGoal}><X className="w-5 h-5" /></button>
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><Target className="w-5 h-5 text-cyan-400" /> {isEditingGoal ? 'Edit Goal' : 'Define New Goal'}</h3>
              {errorMsg && (<div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center gap-2 text-rose-400 text-sm font-bold"><AlertTriangle className="w-4 h-4" /> {errorMsg}</div>)}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Title</label>
                  <input type="text" value={newGoal.title} disabled={isSubmittingGoal} onChange={(e) => setNewGoal({...newGoal, title: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500/50 disabled:opacity-50" placeholder="e.g. Build SaaS Product" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Description</label>
                  <textarea value={newGoal.description} disabled={isSubmittingGoal} onChange={(e) => setNewGoal({...newGoal, description: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500/50 min-h-[100px] disabled:opacity-50" placeholder="Detailed objective..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <CustomSelect label="Category" value={newGoal.category} options={['General', 'Software Project', 'Hackathon', 'Placement', 'Exam']} onChange={(val: string) => setNewGoal({...newGoal, category: val})} />
                  <CustomSelect label="Priority" value={newGoal.priority} options={['Low', 'Medium', 'High', 'Critical']} onChange={(val: string) => setNewGoal({...newGoal, priority: val})} />
                </div>
                <div className="grid grid-cols-2 gap-4 relative z-10">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Start Date</label>
                    <CustomDatePicker value={newGoal.start_date} onChange={(dateStr) => setNewGoal({...newGoal, start_date: dateStr})} placeholder="Start Date" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Target Date</label>
                    <CustomDatePicker value={newGoal.target_date} onChange={(dateStr) => setNewGoal({...newGoal, target_date: dateStr})} placeholder="Deadline" minDate={newGoal.start_date} />
                  </div>
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button onClick={() => setShowGoalModal(false)} disabled={isSubmittingGoal} className="px-5 py-2.5 rounded-lg text-sm font-bold text-gray-400 hover:text-white transition-colors disabled:opacity-50">Cancel</button>
                <button onClick={handleCreateOrEditGoal} disabled={!newGoal.title || isSubmittingGoal} className="px-5 py-2.5 rounded-lg bg-cyan-500 text-black text-sm font-bold hover:bg-cyan-400 transition-colors disabled:opacity-50 flex items-center gap-2">
                  {isSubmittingGoal ? <Loader2 className="w-4 h-4 animate-spin" /> : isEditingGoal ? <Edit2 className="w-4 h-4" /> : <Terminal className="w-4 h-4" />} 
                  {isSubmittingGoal ? 'Saving...' : isEditingGoal ? 'Save Changes' : 'Synthesize Goal'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showHabitModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 shadow-2xl relative">
              <button onClick={() => !isSubmittingHabit && setShowHabitModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors disabled:opacity-50" disabled={isSubmittingHabit}><X className="w-5 h-5" /></button>
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-purple-400" /> {isEditingHabit ? 'Edit Habit' : 'Define New Habit'}</h3>
              {errorMsg && (<div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center gap-2 text-rose-400 text-sm font-bold"><AlertTriangle className="w-4 h-4" /> {errorMsg}</div>)}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Habit Name</label>
                  <input type="text" value={newHabit.name} disabled={isSubmittingHabit} onChange={(e) => setNewHabit({...newHabit, name: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-purple-500/50 disabled:opacity-50" placeholder="e.g. Read 10 Pages" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <CustomSelect label="Category" value={newHabit.category} options={['General', 'Health', 'Learning', 'Work']} onChange={(val: string) => setNewHabit({...newHabit, category: val})} />
                  <CustomSelect label="Frequency" value={newHabit.frequency} options={['Daily', 'Weekly', 'Weekdays']} onChange={(val: string) => setNewHabit({...newHabit, frequency: val})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Target Duration</label>
                  <input type="text" value={newHabit.target_duration} disabled={isSubmittingHabit} onChange={(e) => setNewHabit({...newHabit, target_duration: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-purple-500/50 disabled:opacity-50" placeholder="e.g. 30 minutes" />
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button onClick={() => setShowHabitModal(false)} disabled={isSubmittingHabit} className="px-5 py-2.5 rounded-lg text-sm font-bold text-gray-400 hover:text-white transition-colors disabled:opacity-50">Cancel</button>
                <button onClick={handleCreateOrEditHabit} disabled={!newHabit.name || isSubmittingHabit} className="px-5 py-2.5 rounded-lg bg-purple-500 text-white text-sm font-bold hover:bg-purple-400 transition-colors disabled:opacity-50 flex items-center gap-2">
                  {isSubmittingHabit ? <Loader2 className="w-4 h-4 animate-spin" /> : isEditingHabit ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />} 
                  {isSubmittingHabit ? 'Saving...' : isEditingHabit ? 'Save Changes' : 'Create Habit'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
