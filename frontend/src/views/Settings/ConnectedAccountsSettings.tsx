import React from 'react';
import { SettingsSection, SettingsCard } from '../../components/UI/SettingsUI';
import { useAuth } from '../../context/AuthContext';
import { Link as LinkIcon, Calendar, Globe } from 'lucide-react';

export const ConnectedAccountsSettings: React.FC = () => {
  const { user } = useAuth();
  
  // identities not available in local auth — always empty
  const identities: any[] = [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SettingsSection 
        title="Connected Accounts" 
        description="Link external services to enhance AI capabilities."
      >
        <SettingsCard className="space-y-4">
          {identities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mb-4 border border-slate-700">
                <LinkIcon className="w-6 h-6 text-slate-500" />
              </div>
              <h3 className="text-white font-medium mb-2">No Connected Accounts</h3>
              <p className="text-sm text-slate-400 max-w-sm mx-auto">
                You haven't linked any external services yet. Account linking (e.g., Google Calendar, GitHub) will become available in a future update once OAuth flows are fully configured.
              </p>
            </div>
          ) : (
            identities.map((acc, idx) => (
              <div key={idx} className="flex items-center justify-between py-3 border-b border-slate-800/50 last:border-0 last:pb-0">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center border border-slate-800">
                    {acc.provider === 'google' ? <Calendar className="w-5 h-5 text-indigo-400" /> : 
                     <Globe className="w-5 h-5 text-slate-400" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-white capitalize">{acc.provider}</h4>
                    <p className="text-xs text-emerald-400 font-medium">{acc.identity_data?.email || 'Connected'}</p>
                  </div>
                </div>
                <button 
                  disabled
                  className="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors bg-slate-800 text-slate-500 cursor-not-allowed"
                >
                  Connected
                </button>
              </div>
            ))
          )}
        </SettingsCard>
      </SettingsSection>
    </div>
  );
};
