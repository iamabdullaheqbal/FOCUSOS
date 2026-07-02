'use client'

import React from 'react';
import { motion } from 'framer-motion';
import { Clock, ShieldAlert, Cpu, Mic, FileText, CalendarClock, ArrowRight } from 'lucide-react';
import { GlassCard } from '../UI/GlassCard';

export const FeatureGrid: React.FC = () => {
  const features = [
    { icon: Clock, title: "Predictive Intelligence", desc: "Simulate future workloads and accurately forecast deadline failures before they occur.", color: "text-blue-400" },
    { icon: ShieldAlert, title: "Rescue Mode", desc: "Emergency AI strategist generates actionable recovery plans for at-risk projects instantly.", color: "text-rose-400" },
    { icon: Cpu, title: "Digital Twin", desc: "A simulated clone of your execution capability. Test out scenarios to see future outcomes.", color: "text-cyan-400" },
    { icon: Mic, title: "Voice Copilot", desc: "Manage tasks, check status, and trigger rescue interventions using natural speech commands.", color: "text-violet-400" },
    { icon: FileText, title: "Meeting Intelligence", desc: "Automatically extract action items, deadlines, and requirements from unstructured documents.", color: "text-teal-400" },
    { icon: CalendarClock, title: "Smart Calendar", desc: "An execution timeline that continuously optimizes itself based on your speed and capacity.", color: "text-emerald-400" }
  ];

  return (
    <section id="features" className="py-32 relative z-10">
      <div className="max-w-7xl mx-auto px-6">
        
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-6">Execution, Supercharged.</h2>
          <p className="text-gray-400 text-lg">
            FocusOS replaces passive lists with proactive intelligence. 
            It doesn't just record what you have to do—it ensures you actually do it.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="group"
            >
              <GlassCard className="h-full flex flex-col p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(56,189,248,0.15)] hover:border-primary/30 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-500" />
                
                <feature.icon className={`w-10 h-10 ${feature.color} mb-6`} />
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed mb-8 flex-1">
                  {feature.desc}
                </p>
                
                <div className="flex items-center text-sm font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  Learn More <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
