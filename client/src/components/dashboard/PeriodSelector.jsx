import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, ChevronDown, Check, Filter } from 'lucide-react';

const PERIOD_OPTIONS = [
  { id: 'today', label: 'Today', description: 'Daily velocity' },
  { id: 'this_week', label: 'This Week', description: 'Mon - Sun' },
  { id: 'this_month', label: 'This Month', description: 'Calendar month' },
  { id: 'custom', label: 'Custom Range', description: 'Pick dates' },
];

const PeriodSelector = ({
  activePeriod,
  onPeriodChange,
  startDate,
  endDate,
  onCustomDateChange,
  isLoading,
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customStart, setCustomStart] = useState(
    startDate || new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)
  );
  const [customEnd, setCustomEnd] = useState(
    endDate || new Date().toISOString().slice(0, 10)
  );

  const handleSelect = (id) => {
    if (id === 'custom') {
      setShowDatePicker(true);
      onPeriodChange('custom', { startDate: customStart, endDate: customEnd });
    } else {
      setShowDatePicker(false);
      onPeriodChange(id);
    }
  };

  const applyCustomRange = (e) => {
    e.preventDefault();
    if (!customStart || !customEnd) return;
    onPeriodChange('custom', { startDate: customStart, endDate: customEnd });
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2 sm:p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
      {/* Pill Segmented Controls */}
      <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl relative">
        {PERIOD_OPTIONS.map((opt) => {
          const isActive = activePeriod === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              disabled={isLoading}
              onClick={() => handleSelect(opt.id)}
              className={`relative px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 z-10 select-none ${
                isActive
                  ? 'text-white dark:text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activePeriodPill"
                  className="absolute inset-0 bg-brand-600 dark:bg-brand-500 rounded-lg shadow-sm shadow-brand-600/30"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative z-10 flex items-center space-x-1.5">
                {opt.id === 'today' && <Clock className="w-3.5 h-3.5" />}
                {opt.id === 'this_week' && <Calendar className="w-3.5 h-3.5" />}
                {opt.id === 'this_month' && <Calendar className="w-3.5 h-3.5" />}
                {opt.id === 'custom' && <Filter className="w-3.5 h-3.5" />}
                <span>{opt.label}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Date Details & Custom Picker */}
      {activePeriod === 'custom' && (
        <form
          onSubmit={applyCustomRange}
          className="flex flex-wrap items-center gap-2 text-xs animate-in fade-in"
        >
          <div className="flex items-center space-x-1 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-bold text-slate-400 uppercase">From:</span>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none"
            />
          </div>

          <div className="flex items-center space-x-1 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-bold text-slate-400 uppercase">To:</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 font-bold rounded-xl text-xs transition shadow-sm"
          >
            Apply
          </button>
        </form>
      )}
    </div>
  );
};

export default PeriodSelector;