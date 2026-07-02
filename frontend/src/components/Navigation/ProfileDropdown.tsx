'use client'

import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { 
  User, Settings, Bell, HelpCircle, LogOut, 
  ChevronRight, CheckCircle2 
} from 'lucide-react';

interface ProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ isOpen, onClose }) => {
  const { user, signOut } = useAuth();
  const { settings } = useSettings();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Close on ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  const userEmail = user?.email || 'user@focusos.com';
  const fullName = settings.profile?.full_name || 'Executive User';

  const menuItems = [
    { icon: User, label: 'My Profile', path: '/settings/profile' },
    { icon: Settings, label: 'Account Settings', path: '/settings/appearance' },
    { icon: Bell, label: 'Notifications', path: '/settings/notifications' },
    { icon: HelpCircle, label: 'Help Center', path: '/settings/about' },
  ];

  const handleNavigate = (path: string) => {
    router.push(path);
    onClose();
  };

  const handleLogout = async () => {
    onClose();
    await signOut();
    router.push('/login');
  };

  return (
    <AnimatePresence>
      <motion.div
        ref={dropdownRef}
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="absolute top-14 right-8 w-80 bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-50 origin-top-right backdrop-blur-xl"
      >
        {/* Header Section */}
        <div className="p-5 border-b border-white/5 bg-gradient-to-br from-indigo-500/10 to-transparent">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center text-white text-lg font-bold shadow-inner">
              {fullName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-white font-semibold truncate text-sm">{fullName}</h4>
              <p className="text-slate-400 text-xs truncate">{userEmail}</p>
            </div>
          </div>
          
          <div className="mt-4 flex items-center justify-between bg-black/20 rounded-lg p-2.5 border border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-xs text-slate-300 font-medium">Online</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-indigo-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Pro License
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-2">
          {menuItems.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleNavigate(item.path)}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 text-slate-300 hover:text-white transition-colors group"
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-slate-500" />
            </button>
          ))}
          
          <div className="h-px bg-white/5 my-2 mx-2" />
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors group"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Log out</span>
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
