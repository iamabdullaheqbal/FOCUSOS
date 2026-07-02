'use client'

import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, Network, Database, Lock } from 'lucide-react';

export const HowItThinks: React.FC = () => {
  return (
    <section className="py-24 bg-[#0A0A0B] relative overflow-hidden border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Architecture Visualization */}
          <div className="relative aspect-square md:aspect-[4/3] lg:aspect-square flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 rounded-full blur-[80px]" />
            
            <div className="relative w-full max-w-md aspect-square">
              {/* Central Core */}
              <motion.div 
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 m-auto w-32 h-32 rounded-2xl bg-gray-900 border border-white/10 shadow-2xl flex flex-col items-center justify-center z-20"
              >
                <Cpu className="w-10 h-10 text-indigo-400 mb-2" />
                <span className="text-xs font-bold text-gray-300">Local Engine</span>
              </motion.div>

              {/* Orbiting Nodes */}
              {[
                { icon: Network, label: "Gemini", delay: 0 },
                { icon: Database, label: "Neon DB", delay: -2 },
                { icon: Lock, label: "Auth", delay: -4 }
              ].map((node, idx) => (
                <motion.div
                  key={idx}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear", delay: node.delay }}
                  className="absolute inset-0 w-full h-full"
                >
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-xl bg-gray-900 border border-white/10 shadow-xl flex flex-col items-center justify-center z-30" style={{ transform: 'rotate(-360deg)' }}>
                    <node.icon className="w-5 h-5 text-purple-400 mb-1" />
                    <span className="text-[10px] font-bold text-gray-400">{node.label}</span>
                  </div>
                </motion.div>
              ))}

              {/* Rings */}
              <div className="absolute inset-4 border border-white/5 rounded-full border-dashed" />
              <div className="absolute inset-12 border border-white/5 rounded-full" />
            </div>
          </div>

          {/* Text Content */}
          <div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium mb-6"
            >
              Hybrid Architecture
            </motion.div>
            
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-5xl font-black text-white mb-6 leading-tight"
            >
              How FocusOS <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Thinks</span>
            </motion.h2>

            <div className="space-y-8">
              {[
                { title: "Local-First Intelligence", desc: "The core intelligence engine runs deterministically on your device. Your data stays private, and decisions are lightning fast without relying solely on the cloud." },
                { title: "Cloud Enhanced (Gemini)", desc: "When tasks require deep semantic reasoning, FocusOS seamlessly escalates to Google Gemini, enhancing the local engine without replacing it." },
                { title: "Digital Twin Verification", desc: "Before any strategy is executed, the Digital Twin simulates the outcome against your personal energy parameters and calendar constraints." }
              ].map((item, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 * idx }}
                >
                  <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
