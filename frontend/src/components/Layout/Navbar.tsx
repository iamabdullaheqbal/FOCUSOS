'use client';

import React, { useState } from 'react';
import { Bell, User } from 'lucide-react';
import { NotificationDropdown } from './NotificationDropdown';
import { ProfileDropdown } from '../Navigation/ProfileDropdown';
import { usePathname } from 'next/navigation';
import { useSettings } from '../../context/SettingsContext';

const getRouteDetails = (pathname: string) => {
  switch (pathname) {
    case '/dashboard':
      return { title: 'Executive Dashboard', subtitle: 'Real-Time Productivity Intelligence' };
    case '/command-center':
      return { title: 'AI Command Center', subtitle: 'Palantir-style AI Operations Console' };
    case '/planner':
      return { title: 'AI Planner', subtitle: 'Autonomous Schedule Optimization' };
    case '/rescue':
      return { title: 'Rescue Operations Center', subtitle: 'Crisis Detection & Mitigation' };
    case '/goals':
      return { title: 'Goals & Habits Intelligence', subtitle: 'Long-term Objectives' };
    case '/digital-twin':
      return { title: 'Digital Twin Laboratory', subtitle: 'Behavioral Simulation' };
    case '/documents':
      return { title: 'Document Intelligence Command Center', subtitle: 'PDF & Text Ingestion' };
    case '/voice':
      return { title: 'Executive Voice Operations Center', subtitle: 'NLU Intent Parsing' };
    case '/vision':
      return { title: 'Vision Intelligence Center', subtitle: 'Visual Task Extraction' };

    case '/calendar':
      return { title: 'Executive Calendar Intelligence', subtitle: 'Schedule Orchestration' };
    case '/analytics':
      return { title: 'Executive Intelligence Observatory', subtitle: 'Operational Analytics' };
    default:
      return { title: 'System Overview', subtitle: 'All Systems Operational' };
  }
};

export const Navbar: React.FC = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const pathname = usePathname();
  const { settings } = useSettings();

  const { title, subtitle } = getRouteDetails(pathname || '');
  const initial = settings.profile?.full_name ? settings.profile.full_name.charAt(0).toUpperCase() : 'U';

  return (
    <header className="h-20 border-b border-white/10 bg-background/50 backdrop-blur-xl flex items-center justify-between px-8 sticky top-0 z-10">
      <div className="flex flex-col">
        <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
        <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">{subtitle}</p>
      </div>

      <div className="flex items-center gap-6 relative">
        
        <button 
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative p-2 text-gray-400 hover:text-white transition-colors"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 text-[10px] font-bold text-white rounded-full bg-rose-500 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        <NotificationDropdown 
          isOpen={showNotifications} 
          onClose={() => setShowNotifications(false)} 
          setUnreadCount={setUnreadCount} 
        />
        
        <div 
          onClick={() => setShowProfile(!showProfile)}
          className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center p-[2px] cursor-pointer hover:scale-105 transition-transform"
        >
          <div className="w-full h-full bg-background rounded-full flex items-center justify-center">
            {settings.profile?.full_name ? (
              <span className="text-white font-bold">{initial}</span>
            ) : (
              <User className="w-5 h-5 text-gray-300" />
            )}
          </div>
        </div>
        
        <ProfileDropdown 
          isOpen={showProfile} 
          onClose={() => setShowProfile(false)} 
        />
      </div>
    </header>
  );
};
