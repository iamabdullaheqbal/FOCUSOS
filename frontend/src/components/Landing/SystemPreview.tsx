'use client'

import React from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '../UI/GlassCard';
import { Camera, CalendarClock, ShieldAlert, Cpu, ActivitySquare, Target, FileText, Mic, AlertOctagon, RefreshCw } from 'lucide-react';
import { useCountUp } from '../../hooks/useCountUp';

export const SystemPreview: React.FC = () => {
  const agents = [
    { name: 'Vision', icon: Camera, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { name: 'Priority', icon: AlertOctagon, color: 'text-rose-400', bg: 'bg-rose-400/10' },
    { name: 'Planning', icon: CalendarClock, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { name: 'Accountability', icon: ActivitySquare, color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { name: 'Coach', icon: Target, color: 'text-orange-400', bg: 'bg-orange-400/10' },
    { name: 'Rescue', icon: ShieldAlert, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    { name: 'Digital Twin', icon: Cpu, color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
    { name: 'Reflection', icon: RefreshCw, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
    { name: 'Goal', icon: Target, color: 'text-pink-400', bg: 'bg-pink-400/10' },
    { name: 'Document', icon: FileText, color: 'text-teal-400', bg: 'bg-teal-400/10' },
    { name: 'Voice', icon: Mic, color: 'text-violet-400', bg: 'bg-violet-400/10' },
  ];

  const successProb = useCountUp(92, 1.5);
  const prodScore = useCountUp(88, 1.5);

  return (
    <div className="relative w-full max-w-lg mx-auto">
      {/* Decorative Glow */}
      <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 to-secondary/30 blur-2xl rounded-3xl" />
      
      <GlassCard className="relative p-6 border-white/20 shadow-[0_0_40px_rgba(56,189,248,0.15)] rounded-2xl bg-black/40 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-pulse" />
            <span className="text-sm font-bold text-white uppercase tracking-wider">System Active</span>
          </div>
          <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded-md font-mono">
            11 Agents Online
          </span>
        </div>

        {/* Agent Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          {agents.map((agent, i) => (
            <motion.div
              key={agent.name}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.1 + (i * 0.1), duration: 0.4 }}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border border-white/5 ${agent.bg} hover:bg-white/10 transition-colors`}
            >
              <agent.icon className={`w-5 h-5 ${agent.color} mb-2`} />
              <span className="text-[10px] font-medium text-gray-300 text-center">{agent.name}</span>
            </motion.div>
          ))}
        </div>

        {/* KPI Widgets */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col items-center">
            <span ref={successProb.ref} className="text-emerald-400 text-xl font-black mb-1">{successProb.value}%</span>
            <span className="text-[8px] text-gray-400 uppercase font-bold text-center">Success Probability</span>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col items-center">
            <span ref={prodScore.ref} className="text-primary text-xl font-black mb-1">{prodScore.value}%</span>
            <span className="text-[8px] text-gray-400 uppercase font-bold text-center">Productivity Score</span>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col items-center relative overflow-hidden">
            <div className="absolute inset-0 bg-emerald-500/10" />
            <span className="text-emerald-400 text-xl font-black mb-1 z-10">Low</span>
            <span className="text-[8px] text-gray-400 uppercase font-bold text-center z-10">Future Risk</span>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};
