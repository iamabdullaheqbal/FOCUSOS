'use client'

import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { GradientButton } from '../UI/GradientButton';
import { useRouter } from 'next/navigation';

export const FinalCTA: React.FC = () => {
  const router = useRouter();

  return (
    <section className="py-32 relative z-10 overflow-hidden">
      {/* Decorative center glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/20 blur-[150px] rounded-[100%]" />
      
      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-5xl md:text-7xl font-black tracking-tight text-white mb-8 leading-tight">
            Your Deadlines Shouldn't <br className="hidden md:block" /> Surprise You.
          </h2>
          
          <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-2xl mx-auto font-light">
            Let 11 AI agents continuously plan, forecast and protect your schedule.
          </p>
          
          <GradientButton size="lg" onClick={() => router.push('/dashboard')} className="text-lg px-10 py-5">
            Initialize FocusOS <ChevronRight className="w-6 h-6 ml-2" />
          </GradientButton>
        </motion.div>
      </div>
    </section>
  );
};
