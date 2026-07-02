'use client'

import React, { useEffect, useRef } from 'react';
import { motion, useInView, useSpring, useTransform } from 'framer-motion';

const AnimatedCounter: React.FC<{ value: number; duration?: number }> = ({ value, duration = 2 }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const spring = useSpring(0, { duration: duration * 1000, bounce: 0 });
  const displayValue = useTransform(spring, (current) => Math.floor(current).toLocaleString());

  useEffect(() => {
    if (inView) {
      spring.set(value);
    }
  }, [inView, spring, value]);

  return <motion.span ref={ref}>{displayValue}</motion.span>;
};

export const TrustedMetrics: React.FC = () => {
  const metrics = [
    { label: "AI Modules", value: 8, suffix: "+" },
    { label: "Intelligent Agents", value: 6, suffix: "" },
    { label: "Simulations Run", value: 24500, suffix: "+" },
    { label: "Goals Managed", value: 12000, suffix: "+" }
  ];

  return (
    <section className="py-24 bg-[#0A0A0B] relative border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {metrics.map((metric, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-sm"
            >
              <div className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 to-purple-400 mb-2">
                <AnimatedCounter value={metric.value} />
                {metric.suffix}
              </div>
              <div className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                {metric.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
