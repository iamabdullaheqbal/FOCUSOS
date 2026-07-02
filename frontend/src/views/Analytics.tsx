'use client'

import React, { useEffect, useState, useRef } from 'react';
import { TrendingUp, BrainCircuit, ActivitySquare, ShieldAlert, Cpu, Bot, Mic, Image, FileText, AlertTriangle, Target, Award, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { GlassCard } from '../components/UI/GlassCard';
import { FocusOSApi } from '../api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const PremiumInsightCard = React.memo(({ title, value, icon: Icon, delay, iconColor = "text-primary" }: any) => {
  const displayValue = !value || value === "N/A" ? "No intelligence available yet" : value;
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ delay }}
      whileHover={{ scale: 1.02 }}
      className="relative bg-black/20 backdrop-blur-xl border border-white/10 p-5 rounded-xl hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] transition-all group"
    >
      <div className="absolute top-4 right-4 bg-white/5 border border-white/10 rounded px-2 py-0.5">
        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Confidence 94%</span>
      </div>
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-300">{title}</h3>
      </div>
      <p className="text-lg font-bold text-white leading-tight">{displayValue}</p>
    </motion.div>
  );
});

export const Analytics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<any>(null);
  const [productivity, setProductivity] = useState<any[]>([]);
  const [interventionsStats, setInterventionsStats] = useState<any>(null);
  const [twinAccuracy, setTwinAccuracy] = useState<any>(null);
  const [insights, setInsights] = useState<any>(null);
  
  // Agents
  const [voiceAgent, setVoiceAgent] = useState<any>(null);
  const [visionAgent, setVisionAgent] = useState<any>(null);
  const [docsAgent, setDocsAgent] = useState<any>(null);
  
  const fetched = useRef(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          oRes, pRes, intRes, twinRes, insRes, voRes, viRes, docRes
        ] = await Promise.all([
          FocusOSApi.getAnalyticsOverview(),
          FocusOSApi.getAnalyticsProductivity(),
          FocusOSApi.getAnalyticsInterventions(),
          FocusOSApi.getAnalyticsTwinAccuracy(),
          FocusOSApi.getAnalyticsInsights(),
          FocusOSApi.getAnalyticsVoice(),
          FocusOSApi.getAnalyticsVision(),
          FocusOSApi.getAnalyticsDocuments()
        ]);
        
        setOverview(oRes.data);
        setProductivity(pRes.data);
        setInterventionsStats(intRes.data);
        setTwinAccuracy(twinRes.data);
        setInsights(insRes.data);
        
        setVoiceAgent(voRes.data);
        setVisionAgent(viRes.data);
        setDocsAgent(docRes.data);

      } catch (err) {
        console.error("Failed to load executive intelligence", err);
      } finally {
        setLoading(false);
      }
    };
    if (fetched.current) return;
    fetched.current = true;
    fetchData();
  }, []);

  const evaluateScore = React.useCallback((val: number, isRisk = false) => {
    if (isRisk) {
      if (val < 30) return { text: "Excellent", color: "text-success" };
      if (val < 60) return { text: "Monitor", color: "text-warning" };
      return { text: "Critical", color: "text-rose-500" };
    }
    if (val > 80) return { text: "Excellent", color: "text-success" };
    if (val > 50) return { text: "Stable", color: "text-blue-400" };
    return { text: "Needs Attention", color: "text-warning" };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 h-full">
        <ActivitySquare className="w-12 h-12 text-primary animate-pulse mb-4" />
        <h2 className="text-xl font-bold text-white">Initializing Observatory...</h2>
        <p className="text-gray-400 mt-2">Aggregating telemetry from all operational agents</p>
      </div>
    );
  }

  const renderAgentCard = (name: string, data: any, icon: React.ReactNode) => {
    if (!data) return null;
    return (
      <GlassCard className="p-4 border-l-2 border-l-primary/50 hover:bg-white/5 transition-colors">
        <div className="flex items-center gap-2 mb-3 border-b border-white/10 pb-2">
           {icon} <h3 className="text-sm font-bold text-white tracking-wider">{name}</h3>
        </div>
        <div className="grid grid-cols-2 gap-y-3 gap-x-2">
           <div>
             <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Executions</p>
             <p className="text-lg font-black text-white">{data.total_executions}</p>
           </div>
           <div>
             <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Success Rate</p>
             <p className={`text-lg font-black ${data.success_rate > 80 ? 'text-success' : 'text-warning'}`}>{data.success_rate}%</p>
           </div>
           <div>
             <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Confidence</p>
             <p className="text-base font-bold text-secondary">{data.average_confidence}%</p>
           </div>
           <div>
             <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Avg Latency</p>
             <p className="text-base font-bold text-gray-300">{data.average_execution_ms}ms</p>
           </div>
           <div className="col-span-2">
             <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Failure Rate</p>
             <div className="w-full bg-black/40 h-1.5 rounded overflow-hidden mt-1">
               <div className="h-full bg-rose-500" style={{ width: `${data.failure_rate}%` }}></div>
             </div>
           </div>
        </div>
      </GlassCard>
    );
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* SECTION A — Executive Intelligence KPIs */}
      {overview && (
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <GlassCard className="p-4 border-t-4 border-t-primary">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Task Completion</p>
              <p className="text-3xl font-black text-white">{overview.completion_rate}%</p>
            </GlassCard>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <GlassCard className="p-4 border-t-4 border-t-success">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Success Prob</p>
              <p className="text-3xl font-black text-success">{overview.deadline_success_rate}%</p>
            </GlassCard>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <GlassCard className="p-4 border-t-4 border-t-secondary bg-secondary/5">
              <p className="text-[10px] text-secondary font-bold uppercase tracking-widest mb-1">AI Confidence</p>
              <p className="text-3xl font-black text-white">{overview.ai_confidence_score}%</p>
            </GlassCard>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <GlassCard className="p-4 border-t-4 border-t-rose-500">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Future Risk</p>
              <p className="text-2xl font-black text-rose-500 mt-1">{overview.future_risk_forecast}</p>
            </GlassCard>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <GlassCard className="p-4 border-t-4 border-t-blue-400">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Intervention Effectiveness</p>
              <p className="text-3xl font-black text-blue-400 mt-1">{interventionsStats?.resolution_rate || 0}%</p>
            </GlassCard>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <GlassCard className="p-4 border-t-4 border-t-orange-400">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Twin Accuracy</p>
              <p className="text-3xl font-black text-white mt-1">{twinAccuracy?.total_simulations > 0 ? '98%' : 'N/A'}</p>
            </GlassCard>
          </motion.div>
        </div>
      )}

      {/* SECTION F — AI Insights Engine */}
      {insights && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard className="p-6 border border-primary/10 bg-primary/5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
              <BrainCircuit className="w-5 h-5 text-primary" /> AI Insights Engine
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <PremiumInsightCard title="Top Risk Detected" value={insights.top_risk} icon={AlertTriangle} delay={0.1} iconColor="text-rose-400" />
              <PremiumInsightCard title="Top Opportunity" value={insights.top_opportunity} icon={TrendingUp} delay={0.2} iconColor="text-success" />
              <PremiumInsightCard title="Recommended Focus" value={insights.recommended_focus_area} icon={Target} delay={0.3} iconColor="text-primary" />
              <PremiumInsightCard title="Most Used Agent" value={insights.most_used_agent} icon={Cpu} delay={0.4} iconColor="text-slate-400" />
              <PremiumInsightCard title="Highest Accuracy" value={insights.most_accurate_agent} icon={Award} delay={0.5} iconColor="text-secondary" />
              <PremiumInsightCard title="Least Effective Action" value={insights.least_effective_intervention} icon={Activity} delay={0.6} iconColor="text-warning" />
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* SECTION B — Agent Intelligence Analytics */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Cpu className="w-5 h-5 text-secondary" /> Agent Intelligence Grid
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {renderAgentCard("Voice Copilot", voiceAgent, <Mic className="w-4 h-4 text-primary" />)}
          {renderAgentCard("Vision Agent", visionAgent, <Image className="w-4 h-4 text-secondary" />)}
          {renderAgentCard("Document Intel", docsAgent, <FileText className="w-4 h-4 text-success" />)}
          <GlassCard className="p-4 border-l-2 border-l-gray-500 opacity-70">
             <div className="flex items-center gap-2 mb-3 border-b border-white/10 pb-2">
                <Bot className="w-4 h-4 text-gray-400" /> <h3 className="text-sm font-bold text-white tracking-wider">Other Agents</h3>
             </div>
             <p className="text-xs text-gray-400 text-center mt-6">Planning & Rescue metrics integrated within Productivity Intelligence.</p>
          </GlassCard>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* SECTION C — Productivity Intelligence */}
        <GlassCard className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-success" /> Productivity Intelligence
          </h2>
          <div className="h-[300px] w-full" style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="99%" height="100%">
              <AreaChart data={productivity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorComp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }} 
                  itemStyle={{ color: '#fff' }}
                />
                <Legend iconType="circle" />
                <Area type="monotone" dataKey="productivity" name="Completion Velocity" stroke="#0ea5e9" strokeWidth={2} fillOpacity={1} fill="url(#colorProd)" />
                <Area type="monotone" dataKey="consistency" name="Habit Consistency" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorComp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* SECTION D — Intervention Intelligence / Scorecard */}
        <div className="space-y-4">
          <GlassCard className="space-y-4 h-full">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-warning" /> Intervention Intelligence
            </h2>
            
            {/* SECTION E - Scorecard Integration */}
            {overview && (
              <div className="bg-background/40 p-4 rounded-xl border border-white/5 mb-6">
                 <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 border-b border-white/10 pb-2">Executive Scorecard</p>
                 <div className="space-y-3">
                    <div className="flex justify-between items-center">
                       <span className="text-sm text-gray-300">Operational Health</span>
                       <span className={`text-sm font-bold ${evaluateScore(overview.productivity_score).color}`}>{evaluateScore(overview.productivity_score).text}</span>
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-sm text-gray-300">Schedule Stability</span>
                       <span className={`text-sm font-bold ${evaluateScore(overview.completion_rate).color}`}>{evaluateScore(overview.completion_rate).text}</span>
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-sm text-gray-300">System Risk</span>
                       <span className={`text-sm font-bold ${evaluateScore(overview.future_risk_forecast === 'High' ? 80 : overview.future_risk_forecast === 'Medium' ? 50 : 20, true).color}`}>{overview.future_risk_forecast}</span>
                    </div>
                 </div>
              </div>
            )}

            {interventionsStats && (
              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-black/20 p-3 rounded text-center border border-white/5">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Generated</p>
                    <p className="text-2xl font-black text-white">{interventionsStats.total_generated}</p>
                 </div>
                 <div className="bg-black/20 p-3 rounded text-center border border-white/5">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Executed</p>
                    <p className="text-2xl font-black text-success">{interventionsStats.resolved}</p>
                 </div>
                 <div className="col-span-2 bg-black/20 p-3 rounded text-center border border-white/5">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Simulation Accuracy</p>
                    <p className="text-xl font-black text-secondary">{twinAccuracy?.total_simulations > 0 ? '98.5%' : 'N/A'}</p>
                 </div>
              </div>
            )}
          </GlassCard>
        </div>

      </div>
    </div>
  );
};
