'use client'

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

const workflowSteps = [
  { id: 1, title: 'Task Capture', description: 'Drop ideas, deadlines, and raw tasks into the Command Center.' },
  { id: 2, title: 'AI Planner', description: 'The Planner schedules tasks dynamically around your available energy.' },
  { id: 3, title: 'Goals', description: 'Tasks automatically link to high-level objectives for semantic tracking.' },
  { id: 4, title: 'Habits', description: 'Repetitive tasks mutate into automated daily routines.' },
  { id: 5, title: 'Digital Twin', description: 'Your Twin simulates the upcoming week to detect potential burnout.' },
  { id: 6, title: 'Risk Analysis', description: 'The system flags overlapping deadlines and low-energy periods.' },
  { id: 7, title: 'Rescue Center', description: 'If momentum drops, the Rescue Center injects recovery interventions.' },
  { id: 8, title: 'Command Center', description: 'Execute the optimized timeline from a unified interface.' },
  { id: 9, title: 'Daily Success', description: 'Hit your deadlines with compounding predictability.' },
];

export const InteractiveWorkflow: React.FC = () => {
  return (
    <section id="workflow" className="py-32 bg-[#0A0A0B] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-4xl md:text-5xl font-black text-white mb-6"
          >
            How <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Momentum</span> is Generated
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ delay: 0.1 }}
            className="text-lg text-gray-400"
          >
            A fully deterministic pipeline that converts chaotic ideas into compounding daily execution.
          </motion.p>
        </div>

        <div className="relative max-w-4xl mx-auto">
          {/* Vertical Line */}
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-indigo-500/50 to-transparent -translate-x-1/2" />

          {workflowSteps.map((step, idx) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-20%" }}
              transition={{ duration: 0.6 }}
              className={`relative flex items-center mb-16 last:mb-0 ${
                idx % 2 === 0 ? 'md:flex-row-reverse' : 'md:flex-row'
              }`}
            >
              <div className="hidden md:block w-1/2" />
              
              {/* Node */}
              <div className="absolute left-4 md:left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#0A0A0B] border-2 border-indigo-500 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.5)] z-10">
                <div className="w-3 h-3 bg-indigo-400 rounded-full animate-pulse" />
              </div>

              {/* Content */}
              <div className={`w-full md:w-1/2 pl-12 md:pl-0 ${idx % 2 === 0 ? 'md:pr-12 text-left md:text-right' : 'md:pl-12 text-left'}`}>
                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-sm hover:bg-white/[0.05] transition-colors relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2 justify-start md:justify-[inherit]">
                    {idx === workflowSteps.length - 1 ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <span className="text-indigo-400 font-mono text-sm">0{step.id}</span>
                    )}
                    {step.title}
                  </h3>
                  <p className="text-gray-400 text-sm md:text-base leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
