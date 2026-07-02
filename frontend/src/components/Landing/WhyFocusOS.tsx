'use client'

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ListTodo, BrainCircuit, Target, Activity, ShieldAlert, HeartPulse, Play } from 'lucide-react';

const reasons = [
  "Offline-first intelligence guarantees privacy.",
  "Deterministic local AI with Gemini fallback.",
  "Autonomous planning reduces cognitive load.",
  "Predictive simulation prevents burnout.",
  "Recovery intelligence saves failing momentum.",
  "Unified ecosystem replaces 10+ productivity apps."
];

const flowSteps = [
  { icon: ListTodo, label: "Task", color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20" },
  { icon: BrainCircuit, label: "Planning Agent", color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-400/20" },
  { icon: Target, label: "Goal Engine", color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20" },
  { icon: Activity, label: "Digital Twin", color: "text-indigo-400", bg: "bg-indigo-400/10", border: "border-indigo-400/20" },
  { icon: ShieldAlert, label: "Risk Intelligence", color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/20" },
  { icon: HeartPulse, label: "Recovery Center", color: "text-rose-400", bg: "bg-rose-400/10", border: "border-rose-400/20" },
  { icon: Play, label: "Execution", color: "text-white", bg: "bg-white/10", border: "border-white/20" }
];

export const WhyFocusOS: React.FC = () => {
  return (
    <section className="py-32 bg-[#0A0A0B] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-[2.5rem] bg-gradient-to-br from-indigo-900/10 to-purple-900/10 border border-white/5 p-8 md:p-16 relative overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)]">
          
          {/* Background Elements */}
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/3 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[100px] -translate-x-1/3 translate-y-1/3 pointer-events-none" />
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Left Column: Copy */}
            <div>
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 tracking-tight"
              >
                Why <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">FocusOS?</span>
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-lg md:text-xl text-gray-400 mb-10 leading-relaxed font-medium"
              >
                Traditional productivity apps expect you to do all the heavy lifting. FocusOS acts as your personal Chief Operating Officer, actively managing your schedule and predicting failures before they happen.
              </motion.p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {reasons.map((reason, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 * idx }}
                    className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm hover:bg-white/10 transition-colors"
                  >
                    <CheckCircle2 className="w-6 h-6 text-indigo-400 shrink-0 mt-0.5" />
                    <span className="text-sm font-medium text-gray-300 leading-snug">{reason}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Right Column: Architecture Flow */}
            <div className="relative h-[600px] flex items-center justify-center">
              <div className="absolute inset-0 flex flex-col justify-between items-center py-8">
                {flowSteps.map((step, idx) => (
                  <React.Fragment key={idx}>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 + idx * 0.15, type: 'spring' }}
                      className={`relative z-20 flex items-center gap-3 px-6 py-3 rounded-xl border backdrop-blur-md ${step.bg} ${step.border} w-64 shadow-lg`}
                    >
                      <step.icon className={`w-5 h-5 ${step.color}`} />
                      <span className="font-bold text-sm text-white tracking-wide">{step.label}</span>
                      
                      {/* Pulse effect on active node */}
                      <div className="absolute inset-0 rounded-xl bg-white/5 opacity-0 hover:opacity-100 transition-opacity" />
                    </motion.div>

                    {/* Connecting Line with animated particle */}
                    {idx < flowSteps.length - 1 && (
                      <div className="h-8 w-px bg-white/10 relative">
                        <motion.div
                          animate={{ y: [0, 32] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "linear", delay: idx * 0.2 }}
                          className={`absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-3 rounded-full ${step.color.replace('text-', 'bg-')} shadow-[0_0_10px_currentColor] opacity-70`}
                        />
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </section>
  );
};
