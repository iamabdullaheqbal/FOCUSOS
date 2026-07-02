'use client'

import React, { useState, useEffect } from 'react';
import { 
  FileText, Upload, CheckCircle2, PlayCircle, Users, AlertTriangle, 
  Cpu, FileSearch, ArrowRight, Save, CalendarDays, Loader2 
} from 'lucide-react';
import { GlassCard } from '../components/UI/GlassCard';
import { GradientButton } from '../components/UI/GradientButton';
import { FocusOSApi } from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { useCountUp } from '../hooks/useCountUp';

const AnimatedKpi = ({ value, suffix = '', label, icon: Icon, delay = 0, colorClass = "text-white" }: any) => {
  const isNumber = typeof value === 'number';
  const count = useCountUp(isNumber ? value : 0, 1.5);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
    >
      <GlassCard className="p-4 flex flex-col hover:-translate-y-1 transition-transform duration-300">
        <div className="flex justify-between items-start mb-2">
          <div className="p-1.5 rounded-lg bg-white/5 border border-white/10">
            <Icon className="w-4 h-4 text-gray-400" />
          </div>
        </div>
        <div>
          <div className={`text-2xl font-black mb-1 tracking-tight ${colorClass}`}>
            {isNumber ? <span ref={count.ref}>{count.value}</span> : <span>{value}</span>}
            {suffix}
          </div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">{label}</p>
        </div>
      </GlassCard>
    </motion.div>
  );
};

export const DocumentIntelligence: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    FocusOSApi.getAnalyticsOverview().then(res => setAnalytics(res.data));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await FocusOSApi.uploadDocument(file);
      // backend wraps result under { status, message, data: {...} }
      setResult(res.data);
    } catch (err: any) {
      const msg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.message ||
        'Upload failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const pipelineStages = [
    { label: "Upload", icon: Upload },
    { label: "Parse", icon: FileSearch },
    { label: "Extract", icon: Cpu },
    { label: "Save", icon: Save },
    { label: "Schedule", icon: CalendarDays }
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500 mb-2 flex items-center gap-3">
          <FileText className="w-8 h-8 text-emerald-400" /> Document Intelligence Command Center
        </h1>
        <p className="text-gray-400 font-medium">Upload specifications or meeting notes. Gemini 2.0 extracts tasks and auto-schedules execution.</p>
      </motion.div>

      {/* SECTION 1: Intelligence KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <AnimatedKpi value={result ? 1 : 0} label="Documents Processed" icon={FileText} delay={0.1} colorClass="text-emerald-400" />
        <AnimatedKpi value={result ? result.tasks_created : 0} label="Tasks Extracted" icon={CheckCircle2} delay={0.2} colorClass="text-cyan-400" />
        <AnimatedKpi value={result ? result.deadlines?.length || 0 : 0} label="Deadlines Found" icon={AlertTriangle} delay={0.3} colorClass="text-rose-400" />
        <AnimatedKpi value={result ? (result.confidence || analytics?.ai_confidence_score || 85) : (analytics?.ai_confidence_score || 0)} suffix="%" label="Confidence Score" icon={Cpu} delay={0.4} colorClass="text-purple-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Input & Pipeline */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* SECTION 2: Input Center */}
          <GlassCard className="border-t-2 border-t-emerald-500 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4 relative z-10">
               <Upload className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold text-white relative z-10">Multi-Format Upload Center</h3>
            <p className="text-xs text-gray-400 mb-6 font-medium relative z-10 uppercase tracking-widest">Supports PDF, DOCX, TXT, MD</p>
            
            <input 
              type="file" 
              id="file-upload" 
              className="hidden" 
              accept=".pdf,.docx,.txt,.md"
              onChange={handleFileChange}
            />
            <label 
              htmlFor="file-upload"
              className="cursor-pointer bg-black/40 border border-white/10 hover:border-emerald-500/50 text-white text-sm font-bold py-3 px-6 rounded-lg transition-all mb-4 w-full relative z-10 flex items-center justify-center gap-2"
            >
              {file ? (
                <><CheckCircle2 className="w-4 h-4 text-emerald-400" /> {file.name}</>
              ) : (
                "Select File"
              )}
            </label>

            <GradientButton 
              className="w-full relative z-10 flex justify-center items-center gap-2" 
              onClick={handleUpload} 
              disabled={!file || loading}
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin"/> Processing...</> : <><PlayCircle className="w-4 h-4" /> Extract Intelligence</>}
            </GradientButton>

            {error && <p className="text-rose-500 text-xs font-bold mt-4 relative z-10 bg-rose-500/10 p-2 rounded w-full border border-rose-500/20">{error}</p>}
          </GlassCard>

          {/* SECTION 3: Agent Pipeline Visualization */}
          <GlassCard className="bg-black/20">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" /> Live Extraction Pipeline
            </h3>
            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px before:h-full before:w-0.5 before:bg-white/10">
              {pipelineStages.map((stage, idx) => {
                const isActive = loading;
                const isComplete = !!result;
                const activeColor = isComplete ? 'border-emerald-500 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : isActive ? 'border-cyan-500 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)] animate-pulse' : 'border-white/10 text-gray-500';
                
                return (
                  <div key={idx} className="relative flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center bg-black z-10 transition-all duration-500 ${activeColor}`}>
                      <stage.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 bg-white/5 p-2 rounded-lg border border-white/5">
                      <span className={`text-[10px] font-black uppercase tracking-wider ${isComplete ? 'text-emerald-400' : isActive ? 'text-cyan-400' : 'text-gray-500'}`}>
                        {stage.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </div>

        {/* RIGHT COLUMN: Dashboards */}
        <div className="lg:col-span-8 space-y-6">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div key="results" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                
                {/* SECTION 5: AI Executive Briefing */}
                <GlassCard className="border-l-4 border-l-emerald-500 bg-emerald-500/5">
                  <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> AI Summary Briefing
                  </h3>
                  <p className="text-gray-200 text-sm leading-relaxed">{result.summary}</p>
                </GlassCard>

                {/* SECTION 4 & 6: Intelligence Output Dashboard & Action Center */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Tasks */}
                  <GlassCard className="border-t-2 border-t-cyan-500">
                    <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> Extracted Tasks
                    </h4>
                    <ul className="space-y-2 text-sm text-gray-300">
                      {result.tasks?.map((t: any, i: number) => (
                        <li key={i} className="flex items-start gap-2 bg-black/30 p-2 rounded border border-white/5">
                          <ArrowRight className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                          <span>{typeof t === 'string' ? t : (t.title || 'Untitled Task')}</span>
                        </li>
                      ))}
                    </ul>
                  </GlassCard>
                  
                  {/* Deadlines */}
                  <GlassCard className="border-t-2 border-t-rose-500">
                    <h4 className="text-xs font-bold text-rose-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" /> Deadlines Detected
                    </h4>
                    <ul className="space-y-2 text-sm text-gray-300">
                      {result.deadlines?.map((d: string, i: number) => (
                        <li key={i} className="flex items-center gap-2 bg-black/30 p-2 rounded border border-white/5">
                          <CalendarDays className="w-4 h-4 text-rose-500 shrink-0" />
                          <span className="font-bold text-rose-200">{d}</span>
                        </li>
                      ))}
                      {(!result.deadlines || result.deadlines.length === 0) && (
                        <p className="text-gray-500 text-xs italic p-2">No explicit deadlines found.</p>
                      )}
                    </ul>
                  </GlassCard>

                  {/* Owners & Action Items */}
                  <GlassCard className="md:col-span-2 border-t-2 border-t-purple-500">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="flex-1">
                        <h4 className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <Users className="w-4 h-4" /> Detected Owners
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {result.owners?.map((o: string, i: number) => (
                            <span key={i} className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-3 py-1 rounded-full text-xs font-bold">
                              {o}
                            </span>
                          ))}
                          {(!result.owners || result.owners.length === 0) && (
                            <span className="text-gray-500 text-xs italic">Unassigned (Self)</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <Cpu className="w-4 h-4" /> Action Items
                        </h4>
                        <ul className="space-y-2 text-sm text-gray-300">
                          {result.action_items?.map((a: string, i: number) => (
                            <li key={i} className="flex items-start gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-gray-500 mt-1.5 shrink-0" />
                              <span className="text-xs">{a}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </GlassCard>

                  {/* Calendar Injection Preview */}
                  <GlassCard className="md:col-span-2 bg-emerald-500/10 border-emerald-500/30">
                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                      <Save className="w-4 h-4" /> Calendar Injection Preview
                    </h4>
                    <p className="text-xs text-gray-300 mb-4">The following tasks have been natively committed to the FocusOS PostgreSQL database:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {result.tasks?.map((t: string, i: number) => (
                        <div key={i} className="bg-black/50 border border-emerald-500/20 p-3 rounded-lg shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                          <div className="flex justify-between items-start mb-2">
                            <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase px-2 py-0.5 rounded">Scheduled</span>
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          </div>
                          <p className="text-xs text-white font-medium line-clamp-2">{t}</p>
                        </div>
                      ))}
                    </div>
                  </GlassCard>

                </div>
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full">
                <GlassCard className="h-full min-h-[500px] flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-white/5">
                  <FileSearch className="w-16 h-16 text-white/5 mb-4" />
                  <h3 className="text-xl font-bold text-gray-500">Intelligence Dashboard Offline</h3>
                  <p className="text-gray-600 mt-2 max-w-sm text-sm">Upload a document to extract actionable intelligence and visualize the execution cascade.</p>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
};
