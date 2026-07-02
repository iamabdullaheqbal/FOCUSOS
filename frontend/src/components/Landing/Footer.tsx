'use client'

import React from 'react';
import { Zap } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-white/10 bg-black/40 py-12 relative z-10">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
        
        <div className="flex flex-col items-center md:items-start gap-2">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            <span className="text-xl font-bold tracking-tight text-white">Deadline<span className="text-primary">OS</span></span>
          </div>
          <p className="text-gray-500 text-sm">AI Productivity Operating System</p>
        </div>

        <div className="flex items-center gap-6 text-sm font-medium text-gray-400">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#agents" className="hover:text-white transition-colors">Agents</a>
          <a href="/analytics" className="hover:text-white transition-colors">Analytics</a>
          <a href="/command-center" className="hover:text-white transition-colors">Command Center</a>
        </div>

      </div>
    </footer>
  );
};
