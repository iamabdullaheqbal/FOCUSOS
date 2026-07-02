'use client'

import React from 'react';
import { motion } from 'framer-motion';
import { FileDown, BrainCircuit, ShieldAlert, CheckCircle2 } from 'lucide-react';


export const WorkflowTimeline: React.FC = () => {
  const steps = [
    { icon: FileDown, title: "1. Capture", desc: "Upload syllabus docs, speak to Voice Copilot, or snap photos of assignments. Data is ingested instantly." },
    { icon: BrainCircuit, title: "2. Analyze", desc: "Agents extract tasks, prioritize deadlines, and calculate your exact capacity to complete them." },
    { icon: ShieldAlert, title: "3. Predict", desc: "The Digital Twin simulates your upcoming week, flagging exact days where failure is mathematically likely." },
    { icon: CheckCircle2, title: "4. Prevent", desc: "Rescue Mode triggers automatically, adjusting the Smart Calendar to ensure 100% completion." }
  ];

  return (
    <section id="workflow" className="py-32 relative z-10">
      <div className="max-w-7xl mx-auto px-6">
        
        <div className="text-center mb-20 max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-6">How It Works</h2>
          <p className="text-gray-400 text-lg">
            A fully autonomous loop designed to intercept failures.
          </p>
        </div>

        <div className="relative">
          {/* Connecting Line */}
          <motion.div 
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="hidden md:block absolute top-12 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/10 via-primary/50 to-secondary/10 origin-left" 
          />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: i * 0.4 }}
                className="relative flex flex-col items-center text-center"
              >
                {/* Step Icon */}
                <motion.div 
                  initial={{ boxShadow: "0 0 0px rgba(56,189,248,0)" }}
                  whileInView={{ boxShadow: "0 0 30px rgba(56,189,248,0.3)" }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.5, delay: i * 0.4 + 0.3 }}
                  className="w-24 h-24 rounded-2xl bg-black/50 border border-white/10 backdrop-blur-xl flex items-center justify-center mb-6 relative z-10"
                >
                  <step.icon className="w-10 h-10 text-primary" />
                </motion.div>
                
                <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed max-w-[250px]">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};
