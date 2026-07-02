'use client'

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { BrainCircuit, ChevronRight, Play, Activity, Zap, Target, BarChart2, ShieldAlert } from 'lucide-react';
import { useDemoLogin } from '../../hooks/useDemoLogin';

export const HeroSection: React.FC = () => {
  const { handleDemoLogin, loading: demoLoading, error: demoError } = useDemoLogin();


  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0A0A0B] pt-20">
      {/* Interactive Background */}
      <div className="absolute inset-0 w-full h-full">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px] mix-blend-screen" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.02)_0%,transparent_100%)]" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
        
        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-white mb-6"
        >
          Your AI-Powered <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
            Personal Operating System
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-2xl text-lg md:text-xl text-gray-400 mb-10 font-medium leading-relaxed"
        >
          Transform chaos into momentum. FocusOS orchestrates your goals, habits, and deadlines through autonomous intelligence, digital twin simulations, and predictive recovery.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row items-center gap-4"
        >
          <Link
            href="/register"
            className="group flex items-center gap-2 px-8 py-4 bg-white text-gray-900 rounded-full font-bold text-lg hover:bg-gray-100 transition-all shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_60px_rgba(255,255,255,0.2)] hover:scale-105"
          >
            Get Started
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <button 
            onClick={handleDemoLogin}
            disabled={demoLoading}
            className="group flex items-center gap-2 px-8 py-4 bg-white/5 border border-white/10 text-white rounded-full font-bold text-lg backdrop-blur-xl hover:bg-white/10 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Play className="w-5 h-5 fill-current opacity-80 group-hover:opacity-100 transition-opacity" />
            {demoLoading ? 'Launching...' : 'Watch Demo'}
          </button>
        </motion.div>

        {/* AI OS Visualization Graphic - Premium Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mt-20 w-full max-w-5xl relative"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-500/10 to-transparent blur-3xl" />
          <div className="relative aspect-[21/10] md:aspect-[21/9] rounded-2xl border border-white/10 bg-[#0B0C10]/80 backdrop-blur-2xl shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden">
            
            {/* Window Controls */}
            <div className="h-10 border-b border-white/5 flex items-center px-4 bg-white/5 gap-2 w-full shrink-0">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
              <div className="flex-1 text-center font-mono text-xs text-gray-500 font-bold tracking-widest">DEADLINE OS — LIVE VIEW</div>
            </div>

            {/* Dashboard Content */}
            <div className="flex-1 flex gap-4 p-4 h-full relative overflow-hidden">
              
              {/* Left Column: Timeline & Goals */}
              <div className="w-1/3 flex flex-col gap-4">
                {/* Goal Card */}
                <div className="bg-white/5 border border-white/5 rounded-xl p-4 flex flex-col gap-3 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse block" />
                  </div>
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <Target className="w-4 h-4 text-emerald-400" />
                    Launch MVP
                  </div>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <motion.div 
                      animate={{ width: ['40%', '75%'] }}
                      transition={{ duration: 5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                      className="h-full bg-gradient-to-r from-emerald-500 to-green-400" 
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Progress: 75%</span>
                    <span>3 days left</span>
                  </div>
                </div>

                {/* Timeline */}
                <div className="flex-1 bg-white/5 border border-white/5 rounded-xl p-4 flex flex-col gap-3">
                  <div className="text-xs font-bold text-gray-500 tracking-wider">UPCOMING</div>
                  <div className="flex flex-col gap-2 flex-1">
                    {[
                      { t: "09:00", text: "Deep Work Block", color: "bg-purple-500" },
                      { t: "11:30", text: "Sync Meeting", color: "bg-blue-500" },
                      { t: "13:00", text: "Recovery Break", color: "bg-indigo-500" },
                    ].map((item, i) => (
                      <motion.div 
                        key={i} 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1 + i * 0.2 }}
                        className="flex items-center gap-3 bg-black/20 p-2 rounded-lg border border-white/5"
                      >
                        <span className="text-xs font-mono text-gray-500">{item.t}</span>
                        <div className={`w-1 h-full rounded-full ${item.color}`} />
                        <span className="text-xs text-gray-300 truncate">{item.text}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Middle Column: Twin & Orchestrator */}
              <div className="w-1/3 flex flex-col gap-4">
                {/* Twin Simulation */}
                <div className="flex-1 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl p-4 flex flex-col items-center justify-center relative overflow-hidden group">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute w-64 h-64 border border-indigo-500/10 rounded-full"
                  />
                  <div className="relative z-10 w-16 h-16 rounded-full bg-black/50 border border-indigo-500/30 flex items-center justify-center backdrop-blur-md shadow-[0_0_30px_rgba(99,102,241,0.2)]">
                    <Activity className="w-8 h-8 text-indigo-400 animate-pulse" />
                  </div>
                  <div className="mt-4 text-center z-10">
                    <div className="text-xs font-bold text-white mb-1">Digital Twin V2</div>
                    <div className="text-[10px] text-indigo-300 font-mono tracking-widest uppercase">Simulating Paths</div>
                  </div>
                </div>

                {/* Risk Meter */}
                <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-gray-400">Burnout Risk</span>
                    <span className="text-xs text-emerald-400 font-bold">12%</span>
                  </div>
                  <div className="flex gap-1 h-2">
                    <div className="h-full flex-1 bg-emerald-500 rounded-l-full" />
                    <div className="h-full flex-1 bg-emerald-500/20" />
                    <div className="h-full flex-1 bg-yellow-500/20" />
                    <div className="h-full flex-1 bg-orange-500/20" />
                    <div className="h-full flex-1 bg-red-500/20 rounded-r-full" />
                  </div>
                </div>
              </div>

              {/* Right Column: AI Feed & Metrics */}
              <div className="w-1/3 flex flex-col gap-4">
                {/* Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 border border-white/5 rounded-xl p-3 flex flex-col items-center justify-center">
                    <Zap className="w-4 h-4 text-yellow-400 mb-1" />
                    <span className="text-lg font-black text-white">94</span>
                    <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Momentum</span>
                  </div>
                  <div className="bg-white/5 border border-white/5 rounded-xl p-3 flex flex-col items-center justify-center">
                    <BarChart2 className="w-4 h-4 text-blue-400 mb-1" />
                    <span className="text-lg font-black text-white">12.4h</span>
                    <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Focus</span>
                  </div>
                </div>

                {/* Agent Activity Feed */}
                <div className="flex-1 bg-black/40 border border-white/5 rounded-xl p-4 overflow-hidden relative">
                  <div className="text-xs font-bold text-gray-500 tracking-wider mb-3">AGENT ORCHESTRATION</div>
                  <div className="flex flex-col gap-3 relative z-10">
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ repeat: Infinity, repeatDelay: 4, duration: 0.5 }}
                      className="flex items-start gap-2"
                    >
                      <BrainCircuit className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-purple-400">Planner Agent</p>
                        <p className="text-[10px] text-gray-400 leading-tight mt-0.5">Optimized schedule for deep work. Shifted 1 meeting.</p>
                      </div>
                    </motion.div>
                    
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 2, repeat: Infinity, repeatDelay: 4, duration: 0.5 }}
                      className="flex items-start gap-2"
                    >
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-rose-400">Recovery Agent</p>
                        <p className="text-[10px] text-gray-400 leading-tight mt-0.5">Detected focus drop. Scheduled 15m walk.</p>
                      </div>
                    </motion.div>
                  </div>
                  {/* Fade out bottom */}
                  <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/80 to-transparent z-20" />
                </div>
              </div>

            </div>
          </div>
        </motion.div>
      </div>

      {/* Demo error toast */}
      <AnimatePresence>
        {demoError && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-red-900/90 border border-red-500/30 text-red-300 text-sm font-medium px-6 py-3 rounded-2xl shadow-2xl backdrop-blur-xl max-w-md text-center"
          >
            {demoError}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
