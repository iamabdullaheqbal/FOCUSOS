'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { AlertTriangle, ShieldAlert, Target, Activity, RefreshCw, CheckCircle2, Trash2 } from 'lucide-react';
import { FocusOSApi } from '../../api';
import { useRouter } from 'next/navigation';
import { useSync } from '../../hooks/useSync';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  setUnreadCount: (count: number) => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ isOpen, onClose, setUnreadCount }) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await FocusOSApi.getNotifications({
        limit: 50,
        unread_only: filter === 'unread'
      });
      if (res && res.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unread_count || 0);
      }
    } catch (err: any) {
      console.error("Failed to load notifications", err);
      setError("Failed to load notifications. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [setUnreadCount, filter]);

  // Use the new SystemEventBus for real-time synchronization instead of polling
  useSync('NOTIFICATION_CREATED', fetchNotifications);
  useSync('SYSTEM_HEALTH_CHANGED', fetchNotifications);
  useSync('THREAT_DETECTED', fetchNotifications);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const handleMarkAllRead = async () => {
    try {
      await FocusOSApi.markAllNotificationsRead();
      fetchNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearAll = async () => {
    try {
      await FocusOSApi.clearAllNotifications();
      fetchNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  const handleNotificationClick = async (notif: any) => {
    if (!notif.read) {
      try {
        await FocusOSApi.markNotificationRead(notif.id);
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
        setUnreadCount(Math.max(0, notifications.filter(n => !n.read).length - 1));
      } catch (e) {
        console.error(e);
      }
    }

    if (notif.action_url) {
      onClose();
      router.push(notif.action_url);
    }
  };

  if (!isOpen) return null;

  return (
    <div ref={dropdownRef} className="absolute top-16 right-8 w-96 max-h-[32rem] flex flex-col bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          Notifications
          {notifications.filter(n => !n.read).length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold">
              {notifications.filter(n => !n.read).length} new
            </span>
          )}
        </h3>
        <div className="flex items-center gap-3">
          <button onClick={handleMarkAllRead} className="text-gray-400 hover:text-white transition-colors" title="Mark all read">
            <CheckCircle2 className="w-4 h-4" />
          </button>
          <button onClick={handleClearAll} className="text-gray-400 hover:text-rose-400 transition-colors" title="Clear all">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="flex gap-4 px-4 py-2 border-b border-white/5 text-xs font-medium">
        <button 
          onClick={() => setFilter('all')} 
          className={`${filter === 'all' ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-gray-200'} pb-1 transition-colors`}
        >
          All
        </button>
        <button 
          onClick={() => setFilter('unread')} 
          className={`${filter === 'unread' ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-gray-200'} pb-1 transition-colors`}
        >
          Unread
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {loading && notifications.length === 0 ? (
          <div className="p-4 flex justify-center">
            <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />
          </div>
        ) : error ? (
          <div className="p-4 text-center flex flex-col items-center">
            <p className="text-rose-500 text-sm mb-3">{error}</p>
            <button 
              onClick={fetchNotifications} 
              className="flex items-center gap-2 mx-auto px-4 py-2 bg-rose-500/20 text-rose-400 rounded-lg hover:bg-rose-500/30 transition-colors text-xs font-bold"
            >
              <RefreshCw className="w-3 h-3" /> Retry
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-6 h-6 text-gray-500" />
            </div>
            <p className="text-gray-300 text-sm font-medium">You're all caught up!</p>
            <p className="text-gray-500 text-xs mt-1">No {filter === 'unread' ? 'unread ' : ''}notifications right now.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {notifications.map((n) => {
              let Icon = Activity;
              let iconColor = 'text-gray-400';
              
              if (n.icon === 'AlertTriangle' || n.severity === 'critical') {
                Icon = AlertTriangle;
                iconColor = 'text-rose-500';
              } else if (n.icon === 'ShieldAlert' || n.severity === 'high') {
                Icon = ShieldAlert;
                iconColor = 'text-amber-500';
              } else if (n.icon === 'Target' || n.category === 'Goals') {
                Icon = Target;
                iconColor = 'text-emerald-500';
              }

              return (
                <div 
                  key={n.id} 
                  onClick={() => handleNotificationClick(n)}
                  className={`flex gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors cursor-pointer border-l-2 ${n.read ? 'border-transparent opacity-70' : 'border-primary bg-white/5'}`}
                >
                  <div className={`mt-0.5 ${iconColor}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold truncate ${n.read ? 'text-gray-400' : 'text-gray-200'}`}>
                      {n.title}
                    </p>
                    <p className={`text-xs mt-1 line-clamp-2 ${n.read ? 'text-gray-500' : 'text-gray-400'}`}>
                      {n.description || n.message}
                    </p>
                    <p className="text-[10px] text-gray-600 mt-2 flex items-center gap-2">
                      {new Date(n.created_at || n.timestamp).toLocaleString(undefined, {
                        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                      })}
                      {n.category && (
                        <>
                          <span>•</span>
                          <span>{n.category}</span>
                        </>
                      )}
                    </p>
                  </div>
                  {!n.read && (
                    <div className="w-2 h-2 rounded-full bg-primary mt-1 flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
