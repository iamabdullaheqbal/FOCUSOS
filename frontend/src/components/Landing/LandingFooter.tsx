'use client'

import React from 'react';
import { Brain } from 'lucide-react';
import Link from 'next/link';

export const LandingFooter: React.FC = () => {
  return (
    <footer className="bg-[#0A0A0B] border-t border-white/5 pt-16 pb-8 relative z-10 w-full">
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between gap-12 mb-12">
          
          <div className="max-w-md">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white">
                <Brain className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">FocusOS</span>
            </div>
            <p className="text-gray-400 max-w-sm">
              Your AI-Powered Personal Operating System. Built for high performers who refuse to burn out.
            </p>
          </div>

          <div className="flex gap-16 md:gap-32">
            <div>
              <h4 className="font-bold text-white mb-4">Product</h4>
              <ul className="space-y-3">
                <li><a href="#features" className="text-gray-400 hover:text-white transition-colors">Features</a></li>
                <li><a href="#agents" className="text-gray-400 hover:text-white transition-colors">Agents</a></li>
                <li><a href="#workflow" className="text-gray-400 hover:text-white transition-colors">Workflow</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4">Legal</h4>
              <ul className="space-y-3">
                <li><Link href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</Link></li>
                <li><a href="https://github.com" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white transition-colors">GitHub (OSS)</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} FocusOS. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-mono text-gray-500">All Systems Operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
