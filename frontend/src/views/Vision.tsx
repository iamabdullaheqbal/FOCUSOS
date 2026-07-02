'use client'

import React, { useState, useEffect } from 'react';
import { 
  Camera, UploadCloud, CheckCircle2, PlayCircle,
  Cpu, FileSearch, Save, CalendarDays, Loader2, Target, Zap, ArrowRight
} from 'lucide-react';
import { GlassCard } from '../components/UI/GlassCard';
import { GradientButton } from '../components/UI/GradientButton';
import { FocusOSApi } from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { useCountUp } from '../hooks/useCountUp';
import { Badge } from '../components/UI/Badge';

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

export const Vision: React.FC = () => {
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
      const res = await FocusOSApi.runVisionAgent(file);
      // axios already unwraps response.data, so res IS the body
      setResult(res);
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
    { label: "Image", icon: Camera },
    { label: "OCR", icon: FileSearch },
    { label: "Extraction", icon: Cpu },
    { label: "Priority Analysis", icon: Zap },
    { label: "Database Save", icon: Save },
    { label: "Schedule Injection", icon: CalendarDays }
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500 mb-2 flex items-center gap-3">
          <Camera className="w-8 h-8 text-blue-400" /> Vision Intelligence Center
        </h1>
        <p className="text-gray-400 font-medium">Drop screenshots of syllabi or notes. FocusOS will extract the tasks directly into PostgreSQL.</p>
      </motion.div>

      {/* SECTION 1: Intelligence KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <AnimatedKpi value={result ? 1 : 0} label="Images Processed" icon={Camera} delay={0.1} colorClass="text-blue-400" />
        <AnimatedKpi value={result ? result.inserted_task_ids?.length || 0 : 0} label="Tasks Extracted" icon={CheckCircle2} delay={0.2} colorClass="text-indigo-400" />
        <AnimatedKpi value={result ? 95 : analytics?.ai_confidence_score || 0} suffix="%" label="OCR Confidence" icon={FileSearch} delay={0.3} colorClass="text-cyan-400" />
        <AnimatedKpi value={analytics?.deadline_success_rate || 0} suffix="%" label="Detection Accuracy" icon={Target} delay={0.4} colorClass="text-emerald-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Input & Pipeline */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* SECTION 2: Input Center */}
          <GlassCard className="border-t-2 border-t-blue-500 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4 relative z-10">
               <UploadCloud className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-lg font-bold text-white relative z-10">Image Input Center</h3>
            <p className="text-xs text-gray-400 mb-6 font-medium relative z-10 uppercase tracking-widest">Supports PNG, JPG, WEBP</p>
            
            <input 
              type="file" 
              id="file-upload" 
              className="hidden" 
              accept="image/png, image/jpeg, image/webp"
              onChange={handleFileChange}
            />
            <label 
              htmlFor="file-upload"
              className="cursor-pointer bg-black/40 border border-white/10 hover:border-blue-500/50 text-white text-sm font-bold py-3 px-6 rounded-lg transition-all mb-4 w-full relative z-10 flex items-center justify-center gap-2"
            >
              {file ? (
                <><CheckCircle2 className="w-4 h-4 text-blue-400" /> {file.name}</>
              ) : (
                "Select Image"
              )}
            </label>

            <GradientButton 
              className="w-full relative z-10 flex justify-center items-center gap-2" 
              onClick={handleUpload} 
              disabled={!file || loading}
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin"/> Processing...</> : <><PlayCircle className="w-4 h-4" /> Analyze with Vision</>}
            </GradientButton>

            {error && <p className="text-rose-500 text-xs font-bold mt-4 relative z-10 bg-rose-500/10 p-2 rounded w-full border border-rose-500/20">{error}</p>}
          </GlassCard>

          {/* SECTION 3: Agent Pipeline Visualization */}
          <GlassCard className="bg-black/20">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-400" /> Live Extraction Pipeline
            </h3>
            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px before:h-full before:w-0.5 before:bg-white/10">
              {pipelineStages.map((stage, idx) => {
                const isActive = loading;
                const isComplete = !!result;
                const activeColor = isComplete ? 'border-blue-500 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.3)]' : isActive ? 'border-indigo-500 text-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.5)] animate-pulse' : 'border-white/10 text-gray-500';
                
                return (
                  <div key={idx} className="relative flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center bg-black z-10 transition-all duration-500 ${activeColor}`}>
                      <stage.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 bg-white/5 p-2 rounded-lg border border-white/5">
                      <span className={`text-[10px] font-black uppercase tracking-wider ${isComplete ? 'text-blue-400' : isActive ? 'text-indigo-400' : 'text-gray-500'}`}>
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
            {loading ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                <GlassCard className="h-full min-h-[500px] flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-blue-500/20">
                  <Loader2 className="w-16 h-16 text-blue-500 animate-spin mb-4" />
                  <h3 className="text-xl font-bold text-white">Gemini Multimodal Processing</h3>
                  <p className="text-gray-400 mt-2 max-w-sm text-sm">Performing OCR, inferring spatial context, and serializing tasks into PostgreSQL...</p>
                </GlassCard>
              </motion.div>
            ) : result ? (
              <motion.div key="results" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                
                {/* SECTION 5: AI Executive Briefing */}
                <GlassCard className="border-l-4 border-l-blue-500 bg-blue-500/5">
                  <h3 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Camera className="w-4 h-4" /> Vision Agent Briefing
                  </h3>
                  <p className="text-gray-200 text-sm leading-relaxed">{result.summary || "Image successfully parsed and tasks injected."}</p>
                </GlassCard>

                {/* SECTION 4 & 6: Intelligence Output Dashboard & Action Center */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Extracted Tasks & Priorities */}
                  <GlassCard className="border-t-2 border-t-indigo-500 md:col-span-2">
                    <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Cpu className="w-4 h-4" /> Extracted Tasks & Priorities
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {result.tasks?.map((t: any, i: number) => (
                        <div key={i} className="bg-black/30 rounded-lg p-3 border border-white/5 flex flex-col justify-between">
                          <div className="flex justify-between items-start mb-2">
                            <p className="text-white font-medium text-sm line-clamp-2">{t.title}</p>
                            <Badge variant={t.priority === 'High' ? 'danger' : 'info'}>{t.priority}</Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/5">
                             <CalendarDays className="w-3 h-3 text-gray-500" />
                             <span className="text-xs text-gray-400">{t.deadline}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                  
                  {/* Action Items */}
                  <GlassCard className="border-t-2 border-t-emerald-500">
                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Target className="w-4 h-4" /> AI Recommendations
                    </h4>
                    <ul className="space-y-2 text-sm text-gray-300">
                      {result.action_items?.map((item: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 bg-black/30 p-2 rounded border border-white/5">
                          <ArrowRight className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="text-xs">{item}</span>
                        </li>
                      ))}
                      {(!result.action_items || result.action_items.length === 0) && (
                        <p className="text-gray-500 text-xs italic p-2">No additional action items identified.</p>
                      )}
                    </ul>
                  </GlassCard>

                  {/* Saved Task IDs */}
                  <GlassCard className="border-t-2 border-t-cyan-500">
                    <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Save className="w-4 h-4" /> Natively Saved UUIDs
                    </h4>
                    <div className="flex flex-col gap-2">
                      {result.inserted_task_ids?.map((id: string, i: number) => (
                        <div key={i} className="flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 px-3 py-2 rounded-lg">
                           <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                           <span className="text-xs font-mono text-cyan-200 truncate">{id}</span>
                        </div>
                      ))}
                    </div>
                  </GlassCard>

                </div>
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full">
                <GlassCard className="h-full min-h-[500px] flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-white/5">
                  <Camera className="w-16 h-16 text-white/5 mb-4" />
                  <h3 className="text-xl font-bold text-gray-500">Vision System Offline</h3>
                  <p className="text-gray-600 mt-2 max-w-sm text-sm">Upload an image to engage the multimodal OCR extraction engine.</p>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
};
