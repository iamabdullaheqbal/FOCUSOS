'use client'

import React, { useState, useEffect } from 'react';
import { usePageMeta } from '../hooks/usePageMeta';
import { 
  LifeBuoy, AlertTriangle, ShieldAlert, Activity, 
  RefreshCw, Loader2, RotateCcw, CheckCircle
} from 'lucide-react';
import { GlassCard } from '../components/UI/GlassCard';
import { GradientButton } from '../components/UI/GradientButton';
import { Badge } from '../components/UI/Badge';
import { FocusOSApi } from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { useSync } from '../hooks/useSync';
import { usePathname, useSearchParams } from 'next/navigation';

export const Rescue: React.FC = () => {
  usePageMeta('Rescue Center');
  const [threats, setThreats] = useState<any[]>([]);
  const [strategies, setStrategies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [executionId, setExecutionId] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const linkedThreatId = searchParams.get('threat');

  const fetchThreats = async () => {
    try {
      const res = await FocusOSApi.getInterventionThreats();
      setThreats(res.data || []);
    } catch (e) { }
  };

  useEffect(() => {
    fetchThreats();
  }, []);

  useSync(['THREAT_DETECTED', 'RESCUE_EXECUTED', 'RESCUE_ROLLBACK'], fetchThreats);



  const handleScan = async () => {
    setLoading(true);
    setExecutionId(null);
    try {
      const res = await FocusOSApi.scanInterventions();
      setThreats(res.threats?.data || []);
      setStrategies(res.rescue_plan?.strategies || []);
    } catch (err) {} finally {
      setLoading(false);
    }
  };

  const handleExecute = async (strategy: any) => {
    setLoading(true);
    try {
      const res = await FocusOSApi.executeInterventionStrategy({
        strategy_name: strategy.name,
        actions: strategy.actions
      });
      setExecutionId(res.execution_id);
      fetchThreats();
      setStrategies([]);
    } catch (e) {} finally {
      setLoading(false);
    }
  };

  const handleUndo = async () => {
    if (!executionId) return;
    setLoading(true);
    try {
      await FocusOSApi.undoIntervention(executionId);
      setExecutionId(null);
      fetchThreats();
    } catch (e) {} finally {
      setLoading(false);
    }
  };
return (
    <div className="space-y-6 pb-12">
      {/* Hero Banner */}
      <GlassCard className={`relative overflow-hidden ${threats.length > 0 ? 'border-rose-500/50' : 'border-emerald-500/50'}`}>
        <div className={`absolute inset-0 opacity-10 pointer-events-none ${threats.length > 0 ? 'bg-rose-500' : 'bg-emerald-500'}`} />
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-white mb-2 flex items-center gap-3">
              {threats.length > 0 ? <AlertTriangle className="text-rose-500 w-8 h-8"/> : <CheckCircle className="text-emerald-500 w-8 h-8"/>}
              {threats.length > 0 ? 'Critical Intervention Required' : 'System Healthy'}
            </h2>
            <p className="text-gray-400 font-medium">
              {threats.length > 0 
                ? `${threats.length} active threats detected. Schedule failure is imminent without recovery.` 
                : 'All workflows are operating within safe capacity limits.'}
            </p>
          </div>
          <GradientButton 
            variant={threats.length > 0 ? 'danger' : 'primary'}
            onClick={handleScan}
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <RefreshCw className="w-4 h-4" />}
            Scan & Generate Strategies
          </GradientButton>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Threats */}
        <div className="space-y-6 lg:col-span-1">
          <GlassCard>
            <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-rose-400" /> Detected Threats
            </h3>
            <div className="space-y-3">
              {threats.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No active threats.</p>
              ) : (
                threats.map((t, idx) => (
                  <div 
                    key={idx} 
                    id={`threat-${t.id}`}
                    ref={el => {
                      if (el && linkedThreatId && t.id === linkedThreatId) {
                        setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
                      }
                    }}
                    className={`p-3 bg-black/40 rounded-xl border border-rose-500/20 ${(linkedThreatId && t.id === linkedThreatId) ? 'ring-2 ring-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.3)] animate-pulse' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-rose-400 uppercase">{t.threat_type}</span>
                      <Badge variant="danger">{t.severity}</Badge>
                    </div>
                    <p className="text-sm text-gray-300 font-medium">{t.description}</p>
                  </div>
                ))
              )}
            </div>
          </GlassCard>

          {/* Execution History & Undo */}
          {executionId && (
            <GlassCard className="border-amber-500/30 bg-amber-500/5">
              <h3 className="text-sm font-bold text-amber-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <RotateCcw className="w-4 h-4" /> Active Rollback
              </h3>
              <p className="text-sm text-gray-300 mb-4">You recently executed a strategy. If the new schedule is unworkable, you can restore the system state.</p>
              <GradientButton variant="danger" className="w-full justify-center flex items-center gap-2" onClick={handleUndo} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <RotateCcw className="w-4 h-4"/>}
                Undo Last Execution
              </GradientButton>
            </GlassCard>
          )}
        </div>

        {/* Right Column: Strategies */}
        <div className="lg:col-span-2">
          <GlassCard className="h-full">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-cyan-400" /> Twin-Validated Strategies
            </h3>
            
            {strategies.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-64 text-center border-2 border-dashed border-white/10 rounded-2xl">
                 <LifeBuoy className="w-16 h-16 text-white/10 mb-4" />
                 <p className="text-gray-500 max-w-sm">
                   Generate strategies to view Twin-validated recovery options.
                 </p>
               </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <AnimatePresence>
                  {strategies.map((strat, i) => (
                    <motion.div 
                      key={strat.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-4 rounded-xl bg-black/40 border border-white/10 hover:border-cyan-500/50 transition-colors flex flex-col h-full"
                    >
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-black text-white">{strat.name}</h4>
                        <Badge variant="success">{strat.success_prob}% Success</Badge>
                      </div>
                      
                      <p className="text-xs text-gray-400 italic mb-4 flex-1">{strat.impact}</p>
                      
                      <div className="space-y-2 mb-6">
                        {strat.actions.map((act: any, j: number) => (
                          <div key={j} className="text-xs font-medium text-gray-300 bg-white/5 p-2 rounded">
                            • {act.description || act.action}
                          </div>
                        ))}
                      </div>

                      <GradientButton variant="primary" className="w-full justify-center mt-auto" onClick={() => handleExecute(strat)} disabled={loading}>
                        Execute {strat.name}
                      </GradientButton>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
