'use client'

import React from 'react';
import { motion } from 'framer-motion';
import { Network, ArrowRight } from 'lucide-react';
import { GlassCard } from '../UI/GlassCard';

export const AgentEcosystem: React.FC = () => {
  const connections = [
    { title: "Input Processing", agents: ["Vision Agent", "Document Agent", "Voice Copilot"] },
    { title: "Core Engine", agents: ["Priority Agent", "Planning Agent"] },
    { title: "Execution & Monitoring", agents: ["Accountability Agent", "Coach Agent", "Reflection Agent"] },
    { title: "Risk Prevention", agents: ["Rescue Agent", "Digital Twin Agent"] },
    { title: "Long-Term", agents: ["Goal Agent"] }
  ];

  return (
    <section id="agents" className="py-32 relative z-10 bg-black/40">
      <div className="max-w-7xl mx-auto px-6">
        
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/10 border border-secondary/20 text-sm text-secondary font-medium mb-6">
            <Network className="w-4 h-4" />
            <span>Multi-Agent Architecture</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-white mb-6">Meet Your AI Chief-of-Staff Team</h2>
          <p className="text-gray-400 text-lg">
            FocusOS doesn't rely on a single LLM call. It orchestrates 11 specialized, communicating agents that cross-check data and manage your execution autonomously.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-center justify-center relative">
          
          {connections.map((group, index) => (
            <React.Fragment key={index}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                className="flex-1 w-full"
              >
                <GlassCard className="p-6 h-full border-t-2 border-t-primary/50 relative">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 text-center">
                    {group.title}
                  </h3>
                  <div className="flex flex-col gap-3">
                    {group.agents.map((agent, i) => (
                      <div key={i} className="bg-white/5 border border-white/10 rounded-lg p-3 text-center hover:bg-white/10 transition-colors cursor-default">
                        <span className="text-sm font-bold text-gray-200">{agent}</span>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </motion.div>
              
              {/* Connector Arrow (Hidden on mobile) */}
              {index < connections.length - 1 && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.3 + 0.2 }}
                  className="hidden lg:flex items-center justify-center text-primary/50"
                >
                  <ArrowRight className="w-6 h-6" />
                </motion.div>
              )}
            </React.Fragment>
          ))}
          
        </div>

      </div>
    </section>
  );
};
