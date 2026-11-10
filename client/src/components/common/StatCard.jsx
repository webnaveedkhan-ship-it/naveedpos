import React from 'react';

const StatCard = ({ title, value, icon: Icon, color = 'brand', subtitle }) => {
  const colorMap = {
    brand: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border border-emerald-500/20',
    },
    emerald: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border border-emerald-500/20',
    },
    blue: {
      bg: 'bg-blue-500/10',
      text: 'text-blue-400',
      border: 'border border-blue-500/20',
    },
    amber: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border border-amber-500/20',
    },
    purple: {
      bg: 'bg-indigo-500/10',
      text: 'text-indigo-400',
      border: 'border border-indigo-500/20',
    },
    indigo: {
      bg: 'bg-indigo-500/10',
      text: 'text-indigo-400',
      border: 'border border-indigo-500/20',
    },
    rose: {
      bg: 'bg-rose-500/10',
      text: 'text-rose-400',
      border: 'border border-rose-500/20',
    },
  };

  const scheme = colorMap[color] || colorMap.brand;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg transition hover:border-slate-700">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
          {title}
        </span>
        <div className={`p-2.5 rounded-xl ${scheme.bg} ${scheme.text} ${scheme.border}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-3">
        <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          {value}
        </div>
        {subtitle && (
          <div className="mt-1 text-xs text-slate-400 font-medium">
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
