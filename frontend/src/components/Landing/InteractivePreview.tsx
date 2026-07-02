'use client'

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Calendar, Activity, Play, RotateCw, CheckCircle2 } from 'lucide-react';

interface SimulationStep {
  text: string;
  type: 'input' | 'system' | 'agent' | 'success' | 'error';
  delay: number; // simulated delay after this step
}

const simulationSequence: SimulationStep[] = [
  { text: "Initializing execution sequence...", type: 'system', delay: 800 },
  { text: "Thinking...", type: 'system', delay: 1200 },
  { text: "→ Invoking Planner Agent...", type: 'agent', delay: 1000 },
  { text: "→ Goal Engine engaged. Building roadmap...", type: 'agent', delay: 1500 },
  { text: "→ Digital Twin spinning up simulation...", type: 'agent', delay: 1200 },
  { text: "→ Running Risk Analysis... Burnout risk: Low.", type: 'system', delay: 1000 },
  { text: "→ Calendar Optimization complete. Rescheduled 2 conflicts.", type: 'agent', delay: 1200 },
  { text: "→ Committing changes to Command Center...", type: 'system', delay: 800 },
  { text: "[SUCCESS] Execution Complete. 1 Goal Created, 5 Tasks Scheduled.", type: 'success', delay: 0 }
];

export const InteractivePreview: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'command' | 'planner' | 'twin'>('command');
  const [inputText, setInputText] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationLog, setSimulationLog] = useState<SimulationStep[]>([]);
  const targetText = "Create a goal to launch MVP";

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleExecute = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    
    setIsSimulating(true);
    
    const initialInput: SimulationStep = {
      text: "> " + (inputText || targetText),
      type: 'input',
      delay: 500
    };
    
    setSimulationLog([initialInput]);
    
    let currentStep = 0;

    const runNextStep = () => {
      if (currentStep >= simulationSequence.length) {
        setIsSimulating(false);
        return;
      }

      const step = simulationSequence[currentStep];
      setSimulationLog(prev => [...prev, step]);
      
      if (step.delay > 0) {
        timerRef.current = setTimeout(() => {
          currentStep++;
          runNextStep();
        }, step.delay);
      } else {
        setIsSimulating(false);
      }
    };

    timerRef.current = setTimeout(() => {
      runNextStep();
    }, initialInput.delay);
  };

  const tabs = [
    { id: 'command', icon: Terminal, label: 'Command Center' },
    { id: 'planner', icon: Calendar, label: 'AI Planner' },
    { id: 'twin', icon: Activity, label: 'Digital Twin' }
  ] as const;

  const renderLogEntry = (log: SimulationStep, i: number) => {
    const text = log?.text ?? '';
    let textColor = 'text-gray-400';
    if (log?.type === 'success') textColor = 'text-emerald-400 mt-2 font-bold';
    if (log?.type === 'agent') textColor = 'text-purple-400';
    if (log?.type === 'input') textColor = 'text-white font-bold mb-2';

    return (
      <motion.div key={i} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
        <p className={textColor}>
          {text}
        </p>
      </motion.div>
    );
  };

  return (
    <section className="py-24 bg-[#0A0A0B] relative overflow-hidden border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-black text-white mb-6"
          >
            Experience the <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">Interface</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-gray-400"
          >
            A premium, distraction-free environment built for hyper-focus.
          </motion.p>
        </div>

        {/* Browser Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="relative max-w-5xl mx-auto rounded-2xl border border-white/10 bg-gray-900/50 backdrop-blur-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden"
        >
          {/* Header */}
          <div className="h-12 border-b border-white/10 flex items-center px-4 bg-black/20 gap-2">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            
            <div className="mx-auto flex gap-1 bg-black/40 p-1 rounded-lg">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-1 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.id ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content Area */}
          <div className="relative h-[400px] md:h-[600px] bg-[#0A0A0B] p-6 overflow-hidden">
            <AnimatePresence mode="wait">
              {activeTab === 'command' && (
                <motion.div
                  key="command"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="h-full flex flex-col"
                >
                  <div className="flex-1 bg-black/40 border border-white/5 rounded-xl p-6 font-mono text-sm text-gray-300 overflow-y-auto shadow-inner relative">
                    <div className="absolute top-0 right-0 p-4">
                       {isSimulating && (
                         <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-500/20">
                           <RotateCw className="w-3 h-3 animate-spin" />
                           SYSTEM ACTIVE
                         </div>
                       )}
                       {!isSimulating && simulationLog.length > 0 && simulationLog[simulationLog.length - 1]?.type === 'success' && (
                         <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
                           <CheckCircle2 className="w-3 h-3" />
                           IDLE
                         </div>
                       )}
                    </div>
                    
                    <p className="text-emerald-400 mb-6 text-xs uppercase tracking-widest font-bold">FocusOS v11.0.0-prod</p>
                    
                    {simulationLog.map((log, i) => renderLogEntry(log, i))}
                    
                    {!isSimulating && simulationLog.length === 0 && (
                      <p className="text-gray-500 mt-2">Waiting for commands...</p>
                    )}
                    {isSimulating && simulationLog[simulationLog.length - 1]?.type !== 'success' && (
                      <div className="flex items-center gap-2 mt-4 text-indigo-400">
                        <span className="w-1.5 h-4 bg-indigo-400 animate-pulse" />
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 h-14 bg-white/5 border border-white/10 rounded-xl flex items-center px-4 font-mono text-gray-200 focus-within:border-indigo-500/50 focus-within:bg-indigo-500/5 transition-all shadow-lg shadow-black/20">
                      <span className="text-green-400 mr-3 text-lg">❯</span>
                      <input 
                        type="text" 
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Type a command or press Execute..."
                        className="bg-transparent border-none outline-none flex-1 placeholder-gray-600 w-full"
                        disabled={isSimulating}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !isSimulating) {
                            if (!inputText) setInputText(targetText);
                            handleExecute();
                          }
                        }}
                      />
                    </div>
                    <button 
                      onClick={() => {
                        if (!inputText) setInputText(targetText);
                        handleExecute();
                      }}
                      disabled={isSimulating}
                      className="h-14 px-8 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(99,102,241,0.2)] hover:shadow-[0_0_30px_rgba(99,102,241,0.4)]"
                    >
                      {isSimulating ? <RotateCw className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />} 
                      {isSimulating ? 'Executing...' : 'Execute'}
                    </button>
                  </div>
                </motion.div>
              )}

              {activeTab === 'planner' && (
                <motion.div
                  key="planner"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="h-full flex gap-6"
                >
                  {/* Left: Schedule */}
                  <div className="w-1/2 flex flex-col gap-4 overflow-y-auto pr-2">
                    <div className="text-sm font-bold text-gray-500 mb-2">TODAY'S SCHEDULE</div>
                    {[
                      { time: "09:00", title: "Daily Sync", type: "meeting" },
                      { time: "10:00", title: "Deep Work: Architecture", type: "focus" },
                      { time: "12:30", title: "Lunch & Walk", type: "recovery" },
                      { time: "13:30", title: "Code Review", type: "task" },
                    ].map((slot, i) => (
                      <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white/5 border border-white/5 rounded-xl p-4 flex items-center gap-4 hover:bg-white/10 transition-colors cursor-pointer group"
                      >
                        <div className="w-12 text-center text-xs font-mono text-gray-400 group-hover:text-indigo-400 transition-colors">{slot.time}</div>
                        <div className={`w-1 h-8 rounded-full ${slot.type === 'focus' ? 'bg-purple-500' : slot.type === 'meeting' ? 'bg-blue-500' : slot.type === 'recovery' ? 'bg-emerald-500' : 'bg-gray-500'}`} />
                        <div className="flex-1 text-sm text-gray-200">{slot.title}</div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Right: AI Insights */}
                  <div className="w-1/2 flex flex-col gap-4">
                    <div className="text-sm font-bold text-gray-500 mb-2">AI PLANNER INSIGHTS</div>
                    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-6 flex flex-col gap-4 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-2xl rounded-full" />
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-indigo-400">Deep Work Allocated</span>
                        <span className="text-xl font-black text-white">4.5h</span>
                      </div>
                      <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                        <motion.div 
                          animate={{ width: "65%" }} 
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          className="h-full bg-indigo-500" 
                        />
                      </div>
                    </div>
                    
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6 flex flex-col gap-4 relative overflow-hidden flex-1">
                      <div className="absolute bottom-0 right-0 w-32 h-32 bg-emerald-500/10 blur-2xl rounded-full" />
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        </div>
                        <span className="font-bold text-white">Schedule Optimized</span>
                      </div>
                      <p className="text-sm text-emerald-200/70">
                        Shifted "Code Review" by 30m to protect your afternoon momentum peak.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'twin' && (
                <motion.div
                  key="twin"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="h-full flex gap-6"
                >
                  {/* Left: Simulation Wheel */}
                  <div className="w-1/2 flex flex-col items-center justify-center relative">
                    <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/5 to-transparent rounded-full blur-3xl" />
                    <div className="w-64 h-64 rounded-full border border-purple-500/20 relative flex items-center justify-center">
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 rounded-full border-t border-purple-500" 
                      />
                      <motion.div 
                        animate={{ rotate: -360 }}
                        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-4 rounded-full border-b border-indigo-500/50" 
                      />
                      <div className="text-center z-10 bg-[#0A0A0B]/80 p-4 rounded-full backdrop-blur-md">
                        <Activity className="w-8 h-8 text-purple-400 mx-auto mb-2 animate-pulse" />
                        <div className="text-2xl font-black text-white">92%</div>
                        <div className="text-[10px] uppercase tracking-widest text-purple-300 font-bold">Success Rate</div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Metrics */}
                  <div className="w-1/2 flex flex-col gap-4 justify-center">
                    <div className="bg-white/5 border border-white/5 rounded-xl p-5">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-sm font-bold text-gray-300">Burnout Risk Projection</span>
                        <span className="text-sm font-bold text-emerald-400">Low (14%)</span>
                      </div>
                      <div className="flex gap-1 h-3">
                        <div className="h-full w-1/4 bg-emerald-500 rounded-l-full relative overflow-hidden">
                          <motion.div className="absolute inset-0 bg-white/20" animate={{ x: ['-100%', '100%'] }} transition={{ duration: 2, repeat: Infinity }} />
                        </div>
                        <div className="h-full w-1/4 bg-emerald-500/20" />
                        <div className="h-full w-1/4 bg-yellow-500/20" />
                        <div className="h-full w-1/4 bg-red-500/20 rounded-r-full" />
                      </div>
                    </div>

                    <div className="bg-white/5 border border-white/5 rounded-xl p-5">
                      <div className="text-sm font-bold text-gray-300 mb-4">Monte Carlo Paths Evaluated</div>
                      <div className="flex items-end gap-2 h-20">
                        {[40, 60, 45, 80, 50, 90, 70].map((h, i) => (
                          <motion.div 
                            key={i}
                            initial={{ height: 0 }}
                            animate={{ height: `${h}%` }}
                            transition={{ duration: 1, delay: i * 0.1 }}
                            className="flex-1 bg-gradient-to-t from-indigo-500/20 to-purple-500/50 rounded-t-sm"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
