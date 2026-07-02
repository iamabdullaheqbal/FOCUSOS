'use client'

import React, { useState, useEffect } from 'react';
import { SettingsSection, SettingsCard } from '../../components/UI/SettingsUI';
import { FocusOSApi } from '../../api';
import { Smartphone, Monitor, Globe, Shield, Trash2 } from 'lucide-react';

export const SessionsSettings: React.FC = () => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    FocusOSApi.getSessions().then(data => {
      setSessions(data || []);
      setLoading(false);
    }).catch(console.error);
  }, []);

  const handleRevoke = async (id: string) => {
    await FocusOSApi.deleteSession(id);
    setSessions(prev => prev.filter(s => s.id !== id));
  };

  if (loading) return <div className="text-slate-400">Loading sessions...</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SettingsSection 
        title="Active Sessions" 
        description="Devices currently logged into your account."
      >
        <SettingsCard className="space-y-4">
          {sessions.length === 0 ? (
            <p className="text-slate-400 text-sm">No active sessions tracked.</p>
          ) : (
            sessions.map((session: any) => (
              <div key={session.id} className="flex items-center justify-between p-4 bg-slate-950/50 rounded-xl border border-slate-800">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${session.is_current ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-400'}`}>
                    {session.os?.toLowerCase().includes('mac') || session.os?.toLowerCase().includes('windows') 
                      ? <Monitor className="w-5 h-5" /> 
                      : <Smartphone className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-white flex items-center gap-2">
                      {session.browser} on {session.os}
                      {session.is_current && <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Current</span>}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                      <Globe className="w-3 h-3" /> {session.location} • {session.ip_address}
                    </p>
                  </div>
                </div>
                
                {!session.is_current && (
                  <button 
                    onClick={() => handleRevoke(session.id)}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Revoke Session"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                {session.is_current && (
                  <Shield className="w-4 h-4 text-emerald-500 mr-2" />
                )}
              </div>
            ))
          )}
        </SettingsCard>
      </SettingsSection>
    </div>
  );
};
