'use client'

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    question: "Is my data private?",
    answer: "Yes. FocusOS uses a Local-First architecture. Your core intelligence engine and personal data run securely on your device and your dedicated Neon PostgreSQL instance. We do not sell your data."
  },
  {
    question: "When does it use Mistral AI?",
    answer: "Mistral AI is used as an enhancement layer for complex semantic reasoning (like breaking down massive goals or generating complex rescue plans). The local engine decides when to securely request Mistral's assistance."
  },
  {
    question: "How is it different from Todoist or Notion?",
    answer: "Those are passive tools—they wait for you to do the work. FocusOS is an active Operating System. It predicts burnout, autonomously reschedules tasks, and generates recovery strategies when you fall behind."
  },
  {
    question: "What platforms are supported?",
    answer: "FocusOS is a responsive web application optimized for Desktop, Tablet, and Mobile devices."
  }
];

export const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24 bg-[#0A0A0B] relative border-t border-white/5">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-black text-white"
          >
            Frequently Asked Questions
          </motion.h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 * idx }}
              className="border border-white/10 rounded-2xl bg-white/[0.02] overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                className="w-full px-6 py-4 flex items-center justify-between text-left focus:outline-none"
              >
                <span className="font-bold text-white">{faq.question}</span>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${openIndex === idx ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {openIndex === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <p className="px-6 pb-4 text-gray-400 leading-relaxed">
                      {faq.answer}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
