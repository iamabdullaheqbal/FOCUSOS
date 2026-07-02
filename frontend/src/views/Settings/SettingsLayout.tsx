'use client';

import React from 'react';
import { usePageMeta } from '../../hooks/usePageMeta';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  User, Shield, Bell, Palette, Cpu, CalendarClock, 
  Trash2, Info, Smartphone, Link as LinkIcon, Database 
} from 'lucide-react';
import { motion } from 'framer-motion';

export const SettingsLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  usePageMeta('Settings');
  const pathname = usePathname();
  const menuItems = [
    { name: 'Profile', path: '/settings/profile', icon: User },
    { name: 'Appearance', path: '/settings/appearance', icon: Palette },
    { name: 'Notifications', path: '/settings/notifications', icon: Bell },
    { name: 'Planner Preferences', path: '/settings/planner', icon: CalendarClock },
    { name: 'AI Preferences', path: '/settings/ai', icon: Cpu },
    { name: 'Security', path: '/settings/security', icon: Shield },
    { name: 'Sessions', path: '/settings/sessions', icon: Smartphone },
    { name: 'Connected Accounts', path: '/settings/accounts', icon: LinkIcon },
    { name: 'Data Management', path: '/settings/data', icon: Database },
    { name: 'Delete Account', path: '/settings/delete', icon: Trash2, danger: true },
    { name: 'About', path: '/settings/about', icon: Info },
  ];
return (
    <div className="p-8 max-w-6xl mx-auto min-h-screen">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Settings</h1>
        <p className="text-slate-400">Manage your FocusOS experience and security preferences.</p>
      </motion.div>

      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 flex-shrink-0 space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-inner'
                    : item.danger
                      ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </aside>

        <main className="flex-1 min-w-0">
          <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden min-h-[500px]">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 pointer-events-none" />
            <div className="relative z-10">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
