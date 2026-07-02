'use client'

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';

export const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 80; // 80px offset for sticky nav
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-background/80 backdrop-blur-md border-b border-white/10 py-3' 
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        
        {/* Logo */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Deadline<span className="text-primary">OS</span></span>
        </div>

        {/* Center Links (Desktop only) */}
        <div className="hidden md:flex items-center gap-8">
          {['Features', 'Agents', 'Workflow', 'Why FocusOS'].map((item) => {
            const id = item.toLowerCase().replace(' ', '-');
            return (
              <a 
                key={item} 
                href={`#${id}`}
                onClick={(e) => handleScrollTo(e, id)}
                className="text-sm font-medium text-gray-400 hover:text-white transition-colors duration-200"
              >
                {item}
              </a>
            );
          })}
        </div>

        {/* Right CTA */}
        <div>
          <button 
            onClick={() => router.push('/command-center')}
            className="px-4 py-2 text-sm font-bold text-white bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 rounded-lg backdrop-blur-md transition-all duration-300 shadow-[0_0_15px_rgba(255,255,255,0.05)] hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:-translate-y-0.5"
          >
            Command Center
          </button>
        </div>
      </div>
    </motion.nav>
  );
};
