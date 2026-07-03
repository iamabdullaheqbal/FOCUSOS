'use client'

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle, X } from 'lucide-react';

interface ToastState {
  message: string;
  kind: 'error' | 'success';
}

export const GlobalErrorToast = () => {
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    let dismissTimer: ReturnType<typeof setTimeout> | null = null;

    const handleApiError = (e: any) => {
      const message: string = e.detail || 'System Unavailable';
      const isRecovery = message.toLowerCase().includes('reconnected') || message.toLowerCase().includes('back online');

      // Clear any pending auto-dismiss for the previous toast
      if (dismissTimer) clearTimeout(dismissTimer);

      setToast({ message, kind: isRecovery ? 'success' : 'error' });

      if (isRecovery) {
        // Recovery toast auto-dismisses after 4 s
        dismissTimer = setTimeout(() => setToast(null), 4000);
      }
      // "Offline" toast stays until dismissed manually or backend comes back
    };

    window.addEventListener('deadline_api_error', handleApiError);
    return () => {
      window.removeEventListener('deadline_api_error', handleApiError);
      if (dismissTimer) clearTimeout(dismissTimer);
    };
  }, []);

  const isOffline = toast?.kind === 'error' && toast.message.toLowerCase().includes('unable to connect');

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.kind + toast.message}
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          className={`fixed bottom-6 right-6 z-[9999] max-w-sm w-full backdrop-blur-xl border rounded-xl p-4 shadow-2xl flex items-start gap-3 ${
            toast.kind === 'success'
              ? 'bg-black/80 border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.15)]'
              : 'bg-black/80 border-rose-500/50 shadow-[0_0_30px_rgba(244,63,94,0.2)]'
          }`}
        >
          <div className={`p-2 rounded-lg ${toast.kind === 'success' ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`}>
            {toast.kind === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-500" />
            )}
          </div>
          <div className="flex-1 mt-0.5">
            <h4 className={`text-sm font-bold mb-1 ${toast.kind === 'success' ? 'text-emerald-300' : 'text-white'}`}>
              {toast.kind === 'success' ? 'System Restored' : 'System Alert'}
            </h4>
            <p className={`text-xs ${toast.kind === 'success' ? 'text-emerald-200' : 'text-rose-200'}`}>
              {toast.message}
            </p>
            {isOffline && (
              <p className="text-xs text-slate-400 mt-1">
                Start the backend:{' '}
                <code className="text-slate-300 bg-slate-800 px-1 rounded">
                  uvicorn main:app --reload
                </code>
              </p>
            )}
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
