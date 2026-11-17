import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Sparkles, Check } from 'lucide-react';

const MODULES = [
  {
    id: 'FOOTWEAR',
    label: 'Footwear Mart',
    urdu: 'جوتے اور چپل',
    icon: '👟',
    badge: 'Sizes 6-11',
    color: 'from-amber-500 to-amber-600',
    border: 'border-amber-500',
    text: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-500/10 dark:bg-amber-950/40',
  },
  {
    id: 'GARMENTS',
    label: 'Garments & Boutique',
    urdu: 'کپڑے اور ملبوسات',
    icon: '👕',
    badge: 'Sizes S-XXL',
    color: 'from-blue-500 to-blue-600',
    border: 'border-blue-500',
    text: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-500/10 dark:bg-blue-950/40',
  },
  {
    id: 'GENERAL_STORE',
    label: 'Supermart & Kiryana',
    urdu: 'کریانہ اور جنرل اسٹور',
    icon: '🛒',
    badge: 'FMCG / Loose KG',
    color: 'from-emerald-500 to-teal-600',
    border: 'border-emerald-500',
    text: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-500/10 dark:bg-emerald-950/40',
  },
  {
    id: 'PERFUME',
    label: 'Perfumery & Attar',
    urdu: 'عطر اور پرفیوم',
    icon: '🧪',
    badge: 'ML & Tolas',
    color: 'from-purple-500 to-pink-600',
    border: 'border-purple-500',
    text: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-500/10 dark:bg-purple-950/40',
  },
];

const ModuleSwitcherHeader = ({ currentModule, onSelectModule }) => {
  const { businessType, switchBusinessType } = useAuth();
  const activeId = currentModule || businessType || 'GENERAL_STORE';

  const handleSelect = (modId) => {
    if (onSelectModule) {
      onSelectModule(modId);
    }
    if (switchBusinessType) {
      switchBusinessType(modId);
    }
  };

  const activeModObj = MODULES.find((m) => m.id === activeId) || MODULES[2];

  return (
    <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Active Store Business Module:
          </span>
          <span className={`text-xs font-black px-2.5 py-0.5 rounded-full ${activeModObj.bg} ${activeModObj.text} border border-current flex items-center gap-1`}>
            <span>{activeModObj.icon}</span>
            <span>{activeModObj.label}</span>
          </span>
        </div>

        <span className="text-[11px] text-slate-500 font-medium">
          Click any module below to switch dashboard workflows instantly:
        </span>
      </div>

      {/* 4 Segmented Interactive Module Switcher Pills */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {MODULES.map((mod) => {
          const isActive = activeId === mod.id;
          return (
            <button
              key={mod.id}
              type="button"
              onClick={() => handleSelect(mod.id)}
              className={`p-2.5 rounded-xl border transition-all text-left flex items-center justify-between group active:scale-[0.98] ${
                isActive
                  ? `bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-md ${mod.border} ring-2 ring-emerald-500/30`
                  : 'bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center space-x-2 min-w-0">
                <span className="text-xl flex-shrink-0">{mod.icon}</span>
                <div className="min-w-0">
                  <span className="text-xs font-bold block truncate leading-tight">
                    {mod.label}
                  </span>
                  <span className="text-[10px] font-sans opacity-80 block truncate">
                    {mod.urdu}
                  </span>
                </div>
              </div>

              {isActive ? (
                <div className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center flex-shrink-0 ml-1">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              ) : (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-400 flex-shrink-0 ml-1">
                  {mod.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ModuleSwitcherHeader;
