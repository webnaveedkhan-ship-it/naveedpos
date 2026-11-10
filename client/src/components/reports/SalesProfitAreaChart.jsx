import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const sales = payload.find((p) => p.dataKey === 'sales')?.value || 0;
    const profit = payload.find((p) => p.dataKey === 'profit')?.value || 0;
    const margin = sales > 0 ? Math.round((profit / sales) * 1000) / 10 : 0;

    return (
      <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-2xl border border-slate-700/60 text-xs space-y-1.5 min-w-[190px]">
        <div className="border-b border-slate-700/80 pb-1.5 mb-1.5 flex items-center justify-between">
          <span className="font-extrabold text-slate-200">{label}</span>
          <span className="text-[10px] text-slate-400 font-semibold uppercase">PKR</span>
        </div>
        <div className="flex items-center justify-between gap-4 font-semibold text-emerald-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shadow-sm" />
            Total Sales:
          </span>
          <span className="font-black text-white">{formatCurrency(sales)}</span>
        </div>
        <div className="flex items-center justify-between gap-4 font-semibold text-indigo-300">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block shadow-sm" />
            Net Profit:
          </span>
          <span className="font-black text-indigo-200">{formatCurrency(profit)}</span>
        </div>
        <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[10px] text-slate-400">
          <span>Profit Margin:</span>
          <span className="font-bold text-emerald-400">{margin}%</span>
        </div>
      </div>
    );
  }
  return null;
};

const SalesProfitAreaChart = ({ data = [], period = 'daily', periodLabel = 'Today' }) => {
  const chartData = data && data.length > 0 ? data : [
    { timeLabel: '9 AM', sales: 0, profit: 0 },
    { timeLabel: '12 PM', sales: 0, profit: 0 },
    { timeLabel: '3 PM', sales: 0, profit: 0 },
    { timeLabel: '6 PM', sales: 0, profit: 0 },
    { timeLabel: '9 PM', sales: 0, profit: 0 },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between h-full">
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
                Sales & Net Profit Velocity
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {period === 'daily' && 'Hourly turnover velocity vs take-home profit'}
                {period === 'weekly' && 'Day-by-day revenue velocity across Monday to Sunday'}
                {period === 'monthly' && 'Monthly sales momentum and cumulative margins'}
                {period === 'custom' && 'Timeline trajectory for selected date range'}
              </p>
            </div>
          </div>
        </div>

        {/* Legend Pills */}
        <div className="flex items-center gap-3 text-xs font-bold self-start sm:self-auto bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700/50">
          <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs" />
            <span>Sales Revenue</span>
          </div>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <div className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-400">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-xs" />
            <span>Net Profit</span>
          </div>
        </div>
      </div>

      {/* Recharts Area Chart */}
      <div className="w-full h-64 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
          >
            <defs>
              {/* Emerald Gradient for Sales */}
              <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
              {/* Indigo Gradient for Profit */}
              <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#94a3b8"
              opacity={0.15}
              vertical={false}
            />

            <XAxis
              dataKey="timeLabel"
              tickLine={false}
              axisLine={{ stroke: '#cbd5e1', opacity: 0.3 }}
              tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
              dy={6}
            />

            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }}
              tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)}
              dx={-4}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Sales Area (Smooth Spline) */}
            <Area
              type="monotone"
              dataKey="sales"
              name="Sales Revenue"
              stroke="#10b981"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorSales)"
              activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2, fill: '#ffffff' }}
            />

            {/* Net Profit Area (Smooth Spline) */}
            <Area
              type="monotone"
              dataKey="profit"
              name="Net Profit"
              stroke="#6366f1"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorProfit)"
              activeDot={{ r: 6, stroke: '#6366f1', strokeWidth: 2, fill: '#ffffff' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SalesProfitAreaChart;
