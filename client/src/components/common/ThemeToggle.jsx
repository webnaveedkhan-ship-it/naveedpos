import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const ThemeToggle = ({ className = '', showLabel = false }) => {
  const { theme, isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`p-2 rounded-xl border transition-all duration-200 flex items-center space-x-1.5 focus:outline-none select-none min-tap active:scale-95 ${
        isDark
          ? 'bg-slate-900 hover:bg-slate-850 text-amber-400 border-slate-800 hover:border-slate-700 shadow-sm'
          : 'bg-slate-100 hover:bg-slate-200 text-indigo-600 border-slate-200 hover:border-slate-300 shadow-sm'
      } ${className}`}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-400 animate-in spin-in-180 duration-300" />
      ) : (
        <Moon className="w-4 h-4 text-indigo-600 animate-in spin-in-180 duration-300" />
      )}
      {showLabel && (
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 capitalize">
          {theme}
        </span>
      )}
    </button>
  );
};

export default ThemeToggle;
