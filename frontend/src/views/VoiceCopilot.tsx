'use client'

import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff,
  Activity, 
  CheckCircle2, 
  Cpu, 
  Network, 
  Zap, 
  Loader2, 
  MessageSquare,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { GlassCard } from '../components/UI/GlassCard';
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

export const VoiceCopilot: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [speechSupported, setSpeechSupported] = useState(true);
  const networkRetryRef = useRef(0);   // tracks how many times we've auto-retried a 'network' error

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    FocusOSApi.getAnalyticsOverview().then(res => setAnalytics(res.data));
  }, []);

  const speakResponse = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.pitch = 1;
      utterance.rate = 1;
      window.speechSynthesis.speak(utterance);
    }
  };

  const processTranscript = async (text: string) => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await FocusOSApi.processVoiceTranscript(text);
      setResult(res.data);
      if (res.data.nlu?.voice_response) {
        speakResponse(res.data.nlu.voice_response);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Store the SpeechRecognition constructor (set once on mount)
  const SpeechRecognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return undefined;
    }
    SpeechRecognitionRef.current = SpeechRecognition;
    return () => {
      // Abort any active session on unmount
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, []);

  const createRecognition = () => {
    const SpeechRecognition = SpeechRecognitionRef.current;
    if (!SpeechRecognition) return null;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let currentTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        currentTranscript += event.results[i][0].transcript;
      }
      setTranscript(currentTranscript);
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      recognitionRef.current = null;
      if (event.error === 'network') {
        // Auto-retry once — Chrome sometimes fires a spurious network error on the first start
        if (networkRetryRef.current < 1) {
          networkRetryRef.current += 1;
          setTimeout(() => {
            const retryRecognition = createRecognition();
            if (!retryRecognition) return;
            recognitionRef.current = retryRecognition;
            try {
              retryRecognition.start();
              setIsListening(true);
            } catch {
              recognitionRef.current = null;
              setSpeechError(
                'Microphone could not start. Check browser permissions and try again.'
              );
            }
          }, 300);
          return;
        }
        networkRetryRef.current = 0;
        setSpeechError(
          'Browser speech recognition requires an internet connection to Google\'s servers. ' +
          'You can still type your command in the box below.'
        );
      } else if (event.error === 'not-allowed' || event.error === 'permission-denied') {
        setSpeechError('Microphone access denied. Allow microphone access in browser settings, or type your command below.');
      } else if (event.error === 'no-speech') {
        setSpeechError(null); // no-speech is not really an error — just silence
      } else {
        setSpeechError(`Speech recognition error (${event.error}). You can still type commands below.`);
      }
    };

    return recognition;
  };

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
      setIsListening(false);
    } else {
      setSpeechError(null);
      networkRetryRef.current = 0;   // reset retry count on every manual press
      if (!transcript) setResult(null);
      // Always create a fresh instance — SpeechRecognition can't be restarted
      const recognition = createRecognition();
      if (!recognition) return;
      recognitionRef.current = recognition;
      try {
        recognition.start();
        setIsListening(true);
      } catch (e) {
        recognitionRef.current = null;
        setSpeechError('Could not start microphone. Please try again.');
      }
    }
  };


  const demoCommands = [
    "Plan my week and move my meetings.",
    "Add 'Deploy Database' to my tasks for Friday.",
    "I'm falling behind, I need a rescue plan.",
    "Simulate what happens if I miss the React Architecture deadline."
  ];

  const defaultStages = [
    { label: "Speech Captured", icon: Mic },
    { label: "Intent Detected", icon: Cpu },
    { label: "Entities Found", icon: Zap },
    { label: "Router", icon: Network },
    { label: "Agent Execution", icon: Activity },
    { label: "Completed", icon: CheckCircle2 }
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 mb-2 flex items-center gap-3">
          <Mic className="w-8 h-8 text-purple-400" /> Executive Voice Operations Center
        </h1>
        <p className="text-gray-400 font-medium">Control FocusOS entirely through natural language. Speak your intent.</p>
      </motion.div>

      {/* Speech API status banner */}
      {!speechSupported && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
          <MicOff className="w-4 h-4 shrink-0" />
          Web Speech API is not supported in this browser. Use the text box below to type your commands.
        </div>
      )}
      {speechError && speechSupported && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{speechError}</span>
          <button onClick={() => setSpeechError(null)} className="ml-auto text-rose-400 hover:text-white text-xs underline shrink-0">Dismiss</button>
        </div>
      )}

      {/* SECTION 1: Intelligence KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <AnimatedKpi value={result ? result.structured_result?.execution_time_ms || 0 : 0} suffix="ms" label="Execution Time" icon={Activity} delay={0.1} colorClass="text-purple-400" />
        <AnimatedKpi value={result ? 100 : 0} suffix="%" label="Execution Success" icon={CheckCircle2} delay={0.2} colorClass="text-emerald-400" />
        <AnimatedKpi value={result ? result.nlu?.confidence || 0 : analytics?.ai_confidence_score || 0} suffix="%" label="AI Confidence" icon={Cpu} delay={0.3} colorClass="text-cyan-400" />
        <AnimatedKpi value={result ? (result.structured_result?.used_mistral ? "Mistral" : "Local") : "Idle"} label="Routing Engine" icon={Network} delay={0.4} colorClass="text-pink-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Input & Pipeline */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* SECTION 2: Input Center */}
          <GlassCard className={`border-t-2 ${isListening ? 'border-t-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.2)]' : 'border-t-white/10'} flex flex-col items-center justify-center p-8 text-center relative overflow-hidden group transition-all duration-500`}>
            <div className={`absolute inset-0 bg-gradient-to-b from-purple-500/10 to-transparent transition-opacity ${isListening ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
            
            <button
              onClick={toggleListen}
              disabled={!speechSupported}
              className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 relative z-10 ${
                !speechSupported
                  ? 'bg-white/5 text-gray-600 cursor-not-allowed border border-white/5'
                  : isListening
                  ? 'bg-purple-500 text-white animate-pulse shadow-[0_0_20px_rgba(168,85,247,0.5)]'
                  : 'bg-white/5 text-gray-400 hover:bg-purple-500/20 hover:text-purple-400 border border-white/10'
              }`}
            >
              {isListening ? <Mic className="w-10 h-10" /> : <MicOff className="w-10 h-10" />}
            </button>
            <p className="mt-4 text-sm font-bold text-white relative z-10 h-6">
              {isListening ? "Listening..." : "Click to Speak"}
            </p>

            <div className="w-full mt-4 flex items-start gap-2 relative z-10">
               <textarea
                 value={transcript}
                 onChange={(e) => setTranscript(e.target.value)}
                 className="flex-1 h-20 bg-black/40 rounded-lg p-3 text-sm italic text-gray-200 border border-white/10 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none"
                 placeholder="Recognized text will appear here. You can edit before sending."
               />
               <button
                 onClick={() => transcript && processTranscript(transcript)}
                 disabled={!transcript || loading || isListening}
                 className="h-20 px-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg flex items-center justify-center transition-colors shadow-lg shadow-purple-500/20"
               >
                 <ArrowRight className="w-6 h-6" />
               </button>
            </div>

            <div className="w-full mt-6 text-left relative z-10">
              <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Demo Commands</h3>
              <div className="flex flex-col gap-2">
                {demoCommands.map((cmd, i) => (
                  <button 
                    key={i} 
                    onClick={() => { setTranscript(cmd); processTranscript(cmd); }}
                    className="text-left text-[11px] text-gray-400 bg-white/5 hover:bg-purple-500/20 hover:text-purple-300 p-2 rounded transition-colors border border-white/5"
                  >
                    "{cmd}"
                  </button>
                ))}
              </div>
            </div>
          </GlassCard>

          {/* SECTION 3: Agent Pipeline Visualization */}
          <GlassCard className="bg-black/20">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Network className="w-4 h-4 text-pink-400" /> Live Execution Pipeline
            </h3>
            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px before:h-full before:w-0.5 before:bg-white/10">
              {(result?.structured_result?.trace || defaultStages).map((stage: any, idx: number) => {
                const isActive = loading;
                const isComplete = !!result;
                const activeColor = isComplete ? 'border-purple-500 text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.3)]' : isActive ? 'border-pink-500 text-pink-400 shadow-[0_0_10px_rgba(236,72,153,0.5)] animate-pulse' : 'border-white/10 text-gray-500';
                
                const label = typeof stage === 'string' ? stage : stage.label;
                const Icon = typeof stage === 'string' ? CheckCircle2 : stage.icon;

                return (
                  <div key={idx} className="relative flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center bg-black z-10 transition-all duration-500 ${activeColor}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 bg-white/5 p-2 rounded-lg border border-white/5">
                      <span className={`text-[10px] font-black uppercase tracking-wider ${isComplete ? 'text-purple-400' : isActive ? 'text-pink-400' : 'text-gray-500'}`}>
                        {label}
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
                <GlassCard className="h-full min-h-[500px] flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-purple-500/20">
                  <Loader2 className="w-16 h-16 text-purple-500 animate-spin mb-4" />
                  <h3 className="text-xl font-bold text-white">NLU Engine Processing</h3>
                  <p className="text-gray-400 mt-2 max-w-sm text-sm">Extracting intent, entities, and triggering the orchestration router...</p>
                </GlassCard>
              </motion.div>
            ) : result ? (
              <motion.div key="results" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                
                {/* SECTION 5: AI Executive Briefing */}
                <GlassCard className="border-l-4 border-l-purple-500 bg-purple-500/5">
                  <h3 className="text-sm font-bold text-purple-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" /> AI Voice Synthesis
                  </h3>
                  <p className="text-gray-200 text-sm leading-relaxed italic">"{result.nlu?.voice_response || "Command executed successfully."}"</p>
                </GlassCard>

                {/* SECTION 4 & 6: Intelligence Output Dashboard & Action Center */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Intent & Transcript */}
                  <GlassCard className="border-t-2 border-t-pink-500">
                    <h4 className="text-xs font-bold text-pink-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Cpu className="w-4 h-4" /> Extracted Intent
                    </h4>
                    <div className="bg-black/30 p-3 rounded border border-white/5 mb-3">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-white">{result.nlu?.intent}</span>
                        <span className="text-xs font-bold bg-pink-500/20 text-pink-300 px-2 py-1 rounded">
                          {result.nlu?.confidence}% Conf
                        </span>
                      </div>
                    </div>
                    <h5 className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Original Transcript</h5>
                    <p className="text-xs text-gray-300 italic">"{result.transcript}"</p>
                  </GlassCard>
                  
                  {/* Extracted Entities */}
                  <GlassCard className="border-t-2 border-t-cyan-500">
                    <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Zap className="w-4 h-4" /> Extracted Entities
                    </h4>
                    {result.nlu?.entities && Object.keys(result.nlu.entities).length > 0 ? (
                      <ul className="space-y-2 text-sm text-gray-300">
                        {Object.entries(result.nlu.entities).map(([key, val]: any, i: number) => (
                          <li key={i} className="flex flex-col bg-black/30 p-2 rounded border border-white/5">
                            <span className="text-[10px] text-gray-500 uppercase">{key.replace('_', ' ')}</span>
                            <span className="font-medium text-cyan-100">{val}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                       <p className="text-gray-500 text-xs italic p-2">No specific entities detected.</p>
                    )}
                  </GlassCard>

                  {/* Agent Trace */}
                  <GlassCard className="md:col-span-2 border-t-2 border-t-emerald-500">
                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Network className="w-4 h-4" /> Orchestrator Routing Trace
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {result?.structured_result?.trace?.map((step: string, i: number) => (
                        <div key={i} className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-2 rounded-lg">
                           <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                           <span className="text-xs font-bold text-emerald-200">{step}</span>
                        </div>
                      ))}
                    </div>
                  </GlassCard>

                  {/* Execution Result */}
                  <GlassCard className="md:col-span-2 bg-white/5 border-white/10">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4" /> Execution Result
                    </h4>
                    <pre className="text-xs text-gray-300 bg-black/50 p-4 rounded-lg overflow-x-auto border border-white/5">
                      {JSON.stringify(result.structured_result || result.execution, null, 2)}
                    </pre>
                  </GlassCard>

                </div>
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full">
                <GlassCard className="h-full min-h-[500px] flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-white/5">
                  <MicOff className="w-16 h-16 text-white/5 mb-4" />
                  <h3 className="text-xl font-bold text-gray-500">Voice Link Offline</h3>
                  <p className="text-gray-600 mt-2 max-w-sm text-sm">Click the microphone or use a demo command to initiate voice routing.</p>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
};
