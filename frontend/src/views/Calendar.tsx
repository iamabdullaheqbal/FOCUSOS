'use client'

import React, { useEffect, useState } from 'react';
import { 
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, 
  addDays, addWeeks, subWeeks, isToday, isWeekend
} from 'date-fns';
import { 
  ShieldAlert, ActivitySquare,
  AlertTriangle, CalendarDays, ChevronLeft, ChevronRight, X
} from 'lucide-react';
import { GlassCard } from '../components/UI/GlassCard';
import { FocusOSApi } from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '../components/UI/Badge';


export const Calendar: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [view, setView] = useState<'month' | 'week'>('month');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const evRes = await FocusOSApi.getCalendarEvents();
        const rawEvents = Array.isArray(evRes?.data) ? evRes.data : Array.isArray(evRes) ? evRes : [];
        const mappedEvents = rawEvents.map((e: any) => ({
          ...e,
          start: new Date(e.start || Date.now()),
          end: new Date(e.end || Date.now())
        }));
        setEvents(mappedEvents);
      } catch (err) {
        console.error("Failed to load calendar", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const changeDate = (direction: 'prev' | 'next' | 'today') => {
    if (direction === 'today') {
      setCurrentDate(new Date());
    } else if (view === 'month') {
      setCurrentDate(prev => direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1));
    } else {
      setCurrentDate(prev => direction === 'next' ? addWeeks(prev, 1) : subWeeks(prev, 1));
    }
  };

  const getDayEvents = (date: Date) => {
    return events.filter(e => isSameDay(e.start, date));
  };

  // Render Month Grid
  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div className="grid grid-cols-7 bg-[#090B14] rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, idx) => (
          <div key={d} className={`bg-[#090B14] p-4 text-center text-xs font-bold uppercase tracking-widest ${idx === 0 || idx === 6 ? 'text-gray-600' : 'text-gray-400'}`}>
            {d}
          </div>
        ))}
        {days.map((day, i) => {
          const dayEvents = getDayEvents(day);
          const tasks = dayEvents.filter(e => e.type === 'task').length;
          const deadlines = dayEvents.filter(e => e.type === 'deadline').length;
          const goals = dayEvents.filter(e => e.type === 'goal').length;
          const meetings = dayEvents.filter(e => e.type === 'meeting').length;
          const habits = dayEvents.filter(e => e.type === 'habit').length;
          const alerts = dayEvents.filter(e => e.risk_level === 'High').length;
          
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          
          return (
            <motion.div 
              key={i} 
              whileHover={{ scale: 0.98 }}
              onClick={() => setSelectedDate(day)}
              className={`min-h-[140px] p-3 cursor-pointer transition-all duration-300 relative group border-t border-r border-white/5
                ${!isCurrentMonth ? 'opacity-30 bg-[#090B14]' : isWeekend(day) ? 'bg-[#0F1522]' : 'bg-[#111827]'}
                ${isSelected ? 'ring-2 ring-inset ring-purple-500 bg-purple-500/10 shadow-[0_0_20px_rgba(168,85,247,0.15)] z-10' : 'hover:bg-[#1A2235] hover:shadow-xl'}
                ${isToday(day) ? 'ring-2 ring-inset ring-blue-500 bg-blue-500/5 z-10' : ''}
              `}
            >
              <div className="flex justify-between items-start mb-3">
                <span className={`text-base font-black flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                  isToday(day) 
                    ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.6)]' 
                    : isSelected ? 'bg-purple-500/20 text-purple-400' : 'text-gray-300 group-hover:text-white'
                }`}>
                  {format(day, 'd')}
                </span>
                {alerts > 0 && (
                   <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                     <AlertTriangle className="w-4 h-4 text-rose-500 drop-shadow-md" />
                   </motion.div>
                )}
              </div>
              
              <div className="mt-2 space-y-1.5">
                {deadlines > 0 && <div className="text-[11px] font-bold text-red-100 bg-red-500/80 px-2 py-1 rounded-full shadow-sm flex justify-between items-center backdrop-blur-sm"><span>Deadline</span><span className="bg-white/20 px-1.5 rounded-full">{deadlines}</span></div>}
                {meetings > 0 && <div className="text-[11px] font-bold text-purple-100 bg-purple-500/80 px-2 py-1 rounded-full shadow-sm flex justify-between items-center backdrop-blur-sm"><span>Meeting</span><span className="bg-white/20 px-1.5 rounded-full">{meetings}</span></div>}
                {tasks > 0 && <div className="text-[11px] font-bold text-cyan-100 bg-cyan-600/80 px-2 py-1 rounded-full shadow-sm flex justify-between items-center backdrop-blur-sm"><span>Task</span><span className="bg-white/20 px-1.5 rounded-full">{tasks}</span></div>}
                {goals > 0 && <div className="text-[11px] font-bold text-green-100 bg-emerald-500/80 px-2 py-1 rounded-full shadow-sm flex justify-between items-center backdrop-blur-sm"><span>Goal</span><span className="bg-white/20 px-1.5 rounded-full">{goals}</span></div>}
                {habits > 0 && <div className="text-[11px] font-bold text-orange-100 bg-orange-500/80 px-2 py-1 rounded-full shadow-sm flex justify-between items-center backdrop-blur-sm"><span>Habit</span><span className="bg-white/20 px-1.5 rounded-full">{habits}</span></div>}
              </div>
            </motion.div>
          )
        })}
      </div>
    );
  };

  const renderWeekView = () => {
    const startDate = startOfWeek(currentDate);
    const days = Array.from({length: 7}).map((_, i) => addDays(startDate, i));
    const hours = Array.from({length: 15}).map((_, i) => i + 8); // 8 AM to 10 PM

    return (
      <div className="flex flex-col bg-[#090B14] rounded-2xl border border-white/5 shadow-2xl overflow-hidden h-[600px] overflow-y-auto">
        <div className="grid grid-cols-8 sticky top-0 z-20 bg-[#090B14] border-b border-white/5 shadow-lg">
          <div className="p-3 border-r border-white/5"></div>
          {days.map(d => (
            <div key={d.toString()} onClick={() => setSelectedDate(d)} className={`p-3 text-center cursor-pointer hover:bg-white/5 border-r border-white/5 transition-colors ${isToday(d) ? 'bg-blue-500/10' : ''}`}>
              <div className="text-[10px] uppercase text-gray-500 font-bold tracking-widest">{format(d, 'EEE')}</div>
              <div className={`text-xl font-black mt-1 ${isToday(d) ? 'text-blue-400' : 'text-gray-200'}`}>{format(d, 'd')}</div>
            </div>
          ))}
        </div>
        <div className="relative bg-[#111827]">
          {hours.map(h => (
            <div key={h} className="grid grid-cols-8 border-b border-white/5 h-20 group hover:bg-white/5 transition-colors">
              <div className="p-2 text-xs font-bold text-gray-600 text-right pr-4 border-r border-white/5 pt-3">
                {h}:00
              </div>
              {days.map(d => (
                <div key={d.toString()} className="border-r border-white/5 relative">
                  {getDayEvents(d).map(e => {
                     const evHour = e.start.getHours();
                     const evMin = e.start.getMinutes();
                     if (evHour === h) {
                        return (
                          <motion.div whileHover={{ scale: 1.02 }} key={e.id} className="absolute inset-x-1 p-1.5 text-[10px] rounded-lg font-bold overflow-hidden shadow-md backdrop-blur-md"
                               style={{ 
                                 top: `${(evMin/60)*100}%`, 
                                 height: '90%', 
                                 background: e.type==='deadline' ? 'rgba(239,68,68,0.2)' : e.type==='meeting'?'rgba(168,85,247,0.2)': e.type==='goal'?'rgba(16,185,129,0.2)':'rgba(6,182,212,0.2)',
                                 borderLeft: `3px solid ${e.type==='deadline'?'#ef4444':e.type==='meeting'?'#a855f7':e.type==='goal'?'#10b981':'#06b6d4'}`,
                                 color: '#fff',
                                 zIndex: 10
                               }}>
                            {format(e.start, 'h:mm')} - {e.title}
                          </motion.div>
                        )
                     }
                     return null;
                  })}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const selectedDayEvents = selectedDate ? getDayEvents(selectedDate) : [];
  const morningEvents = selectedDayEvents.filter(e => e.start.getHours() < 12);
  const afternoonEvents = selectedDayEvents.filter(e => e.start.getHours() >= 12 && e.start.getHours() < 17);
  const eveningEvents = selectedDayEvents.filter(e => e.start.getHours() >= 17);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 h-screen w-full relative z-10">
        <ActivitySquare className="w-16 h-16 text-sky-500 animate-pulse mb-4" />
        <h2 className="text-2xl font-black text-white">Aggregating Productivity Matrix...</h2>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-screen bg-[#090B14] p-4 sm:p-6 lg:p-8 relative z-10">
      <div className="w-full max-w-[1800px] mx-auto relative space-y-6">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <CalendarDays className="w-6 h-6 text-sky-500" />
            <span className="text-sm font-bold tracking-widest uppercase text-sky-500">Executive Calendar Intelligence</span>
          </div>
          <h1 className="text-4xl font-black text-white mb-2 tracking-tight">AI Productivity Calendar</h1>
          <p className="text-gray-400 font-medium text-lg">Plan • Organize • Execute</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="text-2xl font-black min-w-[180px] text-left sm:text-right text-white mr-4">
            {format(currentDate, view === 'month' ? 'MMMM yyyy' : 'MMM yyyy')}
          </div>

          <div className="flex bg-[#111827] rounded-xl p-1 border border-white/5 shadow-xl">
            <button onClick={() => setView('month')} className={`px-5 py-2 text-sm font-bold rounded-lg transition-all duration-300 ${view === 'month' ? 'bg-sky-500/20 text-sky-400 shadow-sm' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}>Month</button>
            <button onClick={() => setView('week')} className={`px-5 py-2 text-sm font-bold rounded-lg transition-all duration-300 ${view === 'week' ? 'bg-sky-500/20 text-sky-400 shadow-sm' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}>Week</button>
          </div>
          
          <div className="flex items-center gap-1 bg-[#111827] rounded-xl p-1 border border-white/5 shadow-xl">
            <button onClick={() => changeDate('today')} className="px-4 py-2 text-sm font-bold text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">Today</button>
            <div className="w-px h-6 bg-white/10 mx-1"></div>
            <button onClick={() => changeDate('prev')} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white"><ChevronLeft className="w-5 h-5"/></button>
            <button onClick={() => changeDate('next')} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white"><ChevronRight className="w-5 h-5"/></button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
        <div className={`transition-all duration-300 ${selectedDate ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
          {view === 'month' ? renderMonthView() : renderWeekView()}
        </div>
        
        {/* Day Planner Side Panel */}
        <AnimatePresence>
          {selectedDate && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              className="lg:col-span-4 h-full"
            >
              <GlassCard className="h-full min-h-[600px] border-t-4 border-t-sky-500 relative flex flex-col">
                <button onClick={() => setSelectedDate(null)} className="absolute top-4 right-4 p-1 rounded hover:bg-white/10">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
                
                <div className="mb-6">
                  <h3 className="text-2xl font-black text-white">{format(selectedDate, 'EEEE')}</h3>
                  <p className="text-sky-400 font-bold">{format(selectedDate, 'MMMM d, yyyy')}</p>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                  
                  {/* AI Recommendations */}
                  {selectedDayEvents.some(e => e.risk_level === 'High') && (
                    <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3">
                      <h4 className="text-xs font-bold text-rose-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4"/> Critical Deadlines Today
                      </h4>
                      <p className="text-xs text-rose-200">The Intelligence Engine detects high-risk deadlines. Prioritize deep work immediately.</p>
                    </div>
                  )}

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-white/10 pb-1">Morning</h4>
                    {morningEvents.length > 0 ? morningEvents.map(e => (
                      <div key={e.id} className="bg-black/40 border border-white/5 p-3 rounded-lg flex items-start gap-3">
                         <span className="text-xs font-bold text-gray-400 w-12 pt-0.5">{format(e.start, 'h:mm')}</span>
                         <div>
                           <p className="text-sm font-bold text-white">{e.title}</p>
                           <Badge className="mt-1" variant={e.type==='deadline'?'danger':e.type==='goal'?'success':'info'}>{e.type}</Badge>
                         </div>
                      </div>
                    )) : <p className="text-xs text-gray-500 italic">No morning items.</p>}
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-white/10 pb-1">Afternoon</h4>
                    {afternoonEvents.length > 0 ? afternoonEvents.map(e => (
                      <div key={e.id} className="bg-black/40 border border-white/5 p-3 rounded-lg flex items-start gap-3">
                         <span className="text-xs font-bold text-gray-400 w-12 pt-0.5">{format(e.start, 'h:mm')}</span>
                         <div>
                           <p className="text-sm font-bold text-white">{e.title}</p>
                           <Badge className="mt-1" variant={e.type==='deadline'?'danger':e.type==='goal'?'success':'info'}>{e.type}</Badge>
                         </div>
                      </div>
                    )) : <p className="text-xs text-gray-500 italic">No afternoon items.</p>}
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-white/10 pb-1">Evening</h4>
                    {eveningEvents.length > 0 ? eveningEvents.map(e => (
                      <div key={e.id} className="bg-black/40 border border-white/5 p-3 rounded-lg flex items-start gap-3">
                         <span className="text-xs font-bold text-gray-400 w-12 pt-0.5">{format(e.start, 'h:mm')}</span>
                         <div>
                           <p className="text-sm font-bold text-white">{e.title}</p>
                           <Badge className="mt-1" variant={e.type==='deadline'?'danger':e.type==='goal'?'success':'info'}>{e.type}</Badge>
                         </div>
                      </div>
                    )) : <p className="text-xs text-gray-500 italic">No evening items.</p>}
                  </div>

                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
    </div>
  );
};
