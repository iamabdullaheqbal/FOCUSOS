'use client'

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

export const GlobalErrorToast = () => {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleApiError = (e: any) => {
      setError(e.detail || "System Unavailable");
      setTimeout(() => setError(null), 8000);
    };

    window.addEventListener('deadline_api_error', handleApiError);
    return () => window.removeEventListener('deadline_api_error', handleApiError);
  }, []);

  return (
    <AnimatePresence>
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          className="fixed bottom-6 right-6 z-[9999] max-w-sm w-full bg-black/80 backdrop-blur-xl border border-rose-500/50 rounded-xl p-4 shadow-[0_0_30px_rgba(244,63,94,0.2)] flex items-start gap-3"
        >
          <div className="p-2 bg-rose-500/20 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
          </div>
          <div className="flex-1 mt-0.5">
            <h4 className="text-sm font-bold text-white mb-1">System Alert</h4>
            <p className="text-xs text-rose-200">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
