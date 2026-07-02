'use client'

import React from 'react';
import { motion } from 'framer-motion';
import { useCountUp } from '../../hooks/useCountUp';

export const MetricsSection: React.FC = () => {
  const m1 = useCountUp(92, 2, 0);
  const m2 = useCountUp(3.2, 2, 1);
  const m3 = useCountUp(11, 2, 0);
  const m4 = useCountUp(24, 2, 0);

  const metrics = [
    { ref: m1.ref, value: m1.value, suffix: "%", label: "Prediction Accuracy" },
    { ref: m2.ref, value: m2.value, suffix: "x", label: "Execution Efficiency" },
    { ref: m3.ref, value: m3.value, suffix: "", label: "AI Agents Active" },
    { ref: m4.ref, value: m4.value, suffix: "/7", label: "Risk Monitoring" },
  ];

  return (
    <section className="py-20 border-y border-white/5 bg-black/20 backdrop-blur-sm relative z-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 text-center">
          {metrics.map((metric, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="flex flex-col items-center justify-center"
            >
              <div ref={metric.ref} className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tight">
                {metric.value}{metric.suffix}
              </div>
              <div className="text-sm md:text-base text-gray-400 font-medium uppercase tracking-wider">
                {metric.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
