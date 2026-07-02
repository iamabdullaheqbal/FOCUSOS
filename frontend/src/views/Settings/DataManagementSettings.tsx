'use client'

import React, { useState } from 'react';
import { SettingsSection, SettingsCard } from '../../components/UI/SettingsUI';
import { FocusOSApi } from '../../api';
import { Download, CheckCircle2 } from 'lucide-react';

export const DataManagementSettings: React.FC = () => {
  const [downloading, setDownloading] = useState(false);
  const [done, setDone] = useState(false);

  const handleExport = async () => {
    setDownloading(true);
    try {
      const data = await FocusOSApi.exportData();
      
      // Create a blob and download
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `deadline_os_export_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SettingsSection 
        title="Data Export" 
        description="Download a copy of your data stored in FocusOS."
      >
        <SettingsCard>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-white">Export Account Data</h4>
              <p className="text-xs text-slate-400 mt-1">Includes profile, tasks, goals, and settings in JSON format.</p>
            </div>
            <button 
              onClick={handleExport}
              disabled={downloading}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              {done ? <CheckCircle2 className="w-4 h-4" /> : <Download className="w-4 h-4" />}
              {downloading ? "Preparing..." : done ? "Downloaded" : "Export Data"}
            </button>
          </div>
        </SettingsCard>
      </SettingsSection>
    </div>
  );
};
