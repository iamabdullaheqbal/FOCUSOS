'use client'

import React from 'react';
import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';

const testimonials = [
  {
    quote: "FocusOS is the only productivity tool that actually pushes back when I schedule too much. It's like having a COO for my life.",
    author: "Early Access User",
    role: "Product Manager"
  },
  {
    quote: "The Rescue Center saved my momentum last week. Instead of burning out, it generated a realistic recovery plan.",
    author: "Beta Tester",
    role: "Software Engineer"
  },
  {
    quote: "I've replaced Notion, Todoist, and Google Calendar with just the Command Center. The AI scheduling is flawless.",
    author: "Founder",
    role: "Startup CEO"
  }
];

export const Testimonials: React.FC = () => {
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
            Built for High <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">Performers</span>
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((test, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 * idx }}
              className="p-8 rounded-2xl bg-white/[0.02] border border-white/10 relative group"
            >
              <Quote className="w-10 h-10 text-white/10 absolute top-4 right-4" />
              <p className="text-gray-300 leading-relaxed mb-6 italic relative z-10">"{test.quote}"</p>
              <div>
                <p className="font-bold text-white">{test.author}</p>
                <p className="text-sm text-gray-500">{test.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
