'use client'

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Target, Activity, ShieldAlert, Terminal, FileText, Mic, Camera } from 'lucide-react';

const features = [
  {
    icon: Calendar,
    title: "AI Planner",
    description: "Autonomous scheduling that adapts to your energy levels and dynamic priorities.",
    color: "from-blue-400 to-indigo-500"
  },
  {
    icon: Target,
    title: "Goals & Habits",
    description: "Break massive goals into micro-habits with deterministic success tracking.",
    color: "from-emerald-400 to-teal-500"
  },
  {
    icon: Activity,
    title: "Digital Twin",
    description: "Simulate your future trajectory before committing to a plan of action.",
    color: "from-purple-400 to-pink-500"
  },
  {
    icon: ShieldAlert,
    title: "Rescue Center",
    description: "Detect off-track momentum and instantly generate intelligent recovery strategies.",
    color: "from-orange-400 to-red-500"
  },
  {
    icon: Terminal,
    title: "AI Command Center",
    description: "Execute complex workflows using natural language in a unified CLI.",
    color: "from-gray-400 to-slate-500"
  },
  {
    icon: FileText,
    title: "Document Intelligence",
    description: "Extract insights, summaries, and action items from your PDFs and documents.",
    color: "from-amber-400 to-orange-500"
  },
  {
    icon: Mic,
    title: "Voice Copilot",
    description: "Hands-free voice intelligence that captures ideas while you're on the move.",
    color: "from-cyan-400 to-blue-500"
  },
  {
    icon: Camera,
    title: "Vision Intelligence",
    description: "Analyze whiteboards and handwritten notes to generate digital plans.",
    color: "from-rose-400 to-pink-500"
  }
];

export const ProductShowcase: React.FC = () => {
  return (
    <section id="features" className="py-32 bg-[#0A0A0B] relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-1/4 -right-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -left-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-4xl md:text-5xl font-black text-white mb-6"
          >
            A Complete Unified <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Ecosystem</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ delay: 0.1 }}
            className="text-lg text-gray-400"
          >
            FocusOS replaces a dozen fragmented tools with a single, highly-integrated AI operating system designed to guarantee momentum.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="group relative p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:bg-white/[0.04] transition-all hover:-translate-y-1 overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500`} />
                <div className="relative z-10">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white mb-6 shadow-lg shadow-black/20 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
