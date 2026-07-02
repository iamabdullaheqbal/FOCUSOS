'use client'

import React from 'react';
import { motion } from 'framer-motion';
import { CalendarClock, Target, Activity, ShieldAlert, Zap, Terminal } from 'lucide-react';

const agents = [
  { icon: CalendarClock, name: "Planner Agent", desc: "Autonomously schedules and reschedules tasks." },
  { icon: Target, name: "Goal Agent", desc: "Deconstructs large goals into executable steps." },
  { icon: Activity, name: "Habit Engine", desc: "Tracks consistency and builds automated routines." },
  { icon: Activity, name: "Digital Twin", desc: "Simulates your schedule to prevent burnout." },
  { icon: ShieldAlert, name: "Rescue Agent", desc: "Generates interventions when momentum drops." },
  { icon: Zap, name: "Momentum Agent", desc: "Analyzes daily telemetry to optimize execution." },
  { icon: Terminal, name: "Command Center", desc: "The unified interface for natural language control." }
];

export const AgentsSection: React.FC = () => {
  return (
    <section id="agents" className="py-32 bg-[#0A0A0B] relative border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-black text-white mb-6"
          >
            A Team of <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-orange-400">Intelligent Agents</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-gray-400"
          >
            FocusOS is not just a tool; it's a team of specialized, autonomous agents working 24/7 to guarantee your success.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {agents.map((agent, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
              whileHover={{ y: -5 }}
              className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:bg-white/[0.05] transition-all flex flex-col items-center text-center group cursor-default"
            >
              <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform group-hover:bg-rose-500/20">
                <agent.icon className="w-6 h-6 text-gray-400 group-hover:text-rose-400 transition-colors" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{agent.name}</h3>
              <p className="text-sm text-gray-400">{agent.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
