'use client'

import React, { useState, useRef, useEffect } from 'react';
import { format, addMonths, subMonths, getDaysInMonth, startOfMonth, getDay, isSameDay } from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CustomDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (dateStr: string) => void;
  minDate?: string;
  maxDate?: string;
  placeholder?: string;
}

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({ value, onChange, minDate, maxDate, placeholder = "Select Date" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(value ? new Date(value + "T00:00:00") : new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDayOfMonth = getDay(startOfMonth(currentMonth));
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const handleDateClick = (day: number) => {
    const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const localISOTime = format(selectedDate, 'yyyy-MM-dd');
    
    if (minDate && localISOTime < minDate) return;
    if (maxDate && localISOTime > maxDate) return;

    onChange(localISOTime);
    setIsOpen(false);
  };

  const displayValue = value ? format(new Date(value + "T00:00:00"), 'dd MMM yyyy') : placeholder;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-black/50 border border-white/10 hover:border-cyan-500/50 rounded-lg p-3 text-left text-white focus:outline-none flex justify-between items-center transition-colors"
      >
        <span className={value ? 'text-white font-medium' : 'text-gray-500'}>{displayValue}</span>
        <CalendarIcon className="w-4 h-4 text-gray-400" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-[60] top-full mt-2 right-0 w-72 bg-[#0f0f0f] border border-white/10 rounded-xl p-4 shadow-2xl shadow-black"
          >
            <div className="flex justify-between items-center mb-4">
              <button 
                type="button"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-1 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="font-bold text-white text-sm">
                {format(currentMonth, 'MMMM yyyy')}
              </div>
              <button 
                type="button"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-1 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                <div key={d} className="text-center text-[10px] font-bold text-gray-500 uppercase">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {blanks.map(b => <div key={`blank-${b}`} className="h-8" />)}
              {days.map(d => {
                const dateToCheck = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d);
                const localISOTime = format(dateToCheck, 'yyyy-MM-dd');
                
                const isSelected = value === localISOTime;
                const isDisabled = Boolean((minDate && localISOTime < minDate) || (maxDate && localISOTime > maxDate));
                const isToday = isSameDay(dateToCheck, new Date());

                return (
                  <button
                    key={d}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => handleDateClick(d)}
                    className={`h-8 w-8 flex items-center justify-center rounded-full text-xs font-medium transition-colors
                      ${isDisabled ? 'text-gray-600 cursor-not-allowed opacity-50' : 'hover:bg-cyan-500/20 hover:text-cyan-400'}
                      ${isSelected ? 'bg-cyan-500 text-black font-bold hover:bg-cyan-400 hover:text-black' : (isToday && !isSelected ? 'text-cyan-400 border border-cyan-500/50' : 'text-gray-300')}
                    `}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
