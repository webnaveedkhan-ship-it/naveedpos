import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
} from 'recharts';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowUpRight, ShoppingBag } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

const CustomBarTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-2xl shadow-2xl border border-slate-700/60 text-xs space-y-1.5 min-w-[190px]">
        <div className="font-extrabold text-slate-200 border-b border-slate-700/80 pb-1 mb-1 truncate">
          {data.rawTitle}
        </div>
        <div className="flex items-center justify-between text-emerald-400 font-bold">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shadow-sm" />
            Revenue:
          </span>
          <span className="font-black text-white">{formatCurrency(data.totalRevenue)}</span>
        </div>
        <div className="flex items-center justify-between text-indigo-300 font-semibold text-[11px]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block shadow-sm" />
            Net Profit:
          </span>
          <span className="font-black text-indigo-200">+{formatCurrency(data.totalProfit)}</span>
        </div>
        <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800 flex items-center justify-between">
          <span>Units Sold:</span>
          <span className="font-bold text-white bg-slate-800 px-1.5 py-0.5 rounded">
            {data.unitsSold} {data.unitsSold === 1 ? 'unit' : 'units'}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

const CustomYAxisTick = ({ x, y, payload, chartData }) => {
  const item = chartData?.find((d) => d.displayName === payload.value) || chartData?.[payload.index];
  if (!item) return null;

  const truncatedTitle =
    item.rawTitle.length > 15 ? `${item.rawTitle.slice(0, 14)}…` : item.rawTitle;

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={-8}
        y={-2}
        textAnchor="end"
        className="text-[11px] font-bold fill-slate-800 dark:fill-slate-200"
      >
        {truncatedTitle}
      </text>
      <text
        x={-8}
        y={11}
        textAnchor="end"
        className="text-[9px] font-semibold fill-emerald-600 dark:fill-emerald-400"
      >
        ({item.unitsSold} sold)
      </text>
    </g>
  );
};

const TopProductsChart = ({ topProducts = [], periodLabel = 'Today' }) => {
  const chartData = (topProducts || []).slice(0, 5).map((p, idx) => ({
    id: p._id || `p-${idx}`,
    rawTitle: p.title || 'Product',
    displayName: `${p.title && p.title.length > 14 ? p.title.slice(0, 13) + '…' : p.title || 'Item'} (${p.unitsSold || 0} sold)`,
    unitsSold: Number(p.unitsSold || 0),
    totalRevenue: Number(p.totalRevenue || 0),
    totalProfit: Number(p.totalProfit || 0),
  }));

  const hasData = chartData.length > 0 && chartData.some((p) => p.totalRevenue > 0);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
              Top 5 Best-Selling Products
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ranked by revenue for {periodLabel.toLowerCase()}
            </p>
          </div>
        </div>

        <Link
          to="/products"
          className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
        >
          <span>Catalog</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Rounded Horizontal BarChart */}
      {!hasData ? (
        <div className="py-12 text-center flex flex-col items-center justify-center flex-1">
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-2">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
            No product sales recorded for {periodLabel.toLowerCase()}.
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Completed checkouts will automatically populate this leaderboard.
          </p>
        </div>
      ) : (
        <div className="w-full h-64 sm:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={chartData}
              margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
                stroke="#94a3b8"
                opacity={0.15}
              />
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#64748b', fontSize: 10 }}
                tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)}
              />
              <YAxis
                type="category"
                dataKey="displayName"
                width={140}
                tickLine={false}
                axisLine={false}
                tick={(props) => <CustomYAxisTick {...props} chartData={chartData} />}
              />
              <Tooltip content={<CustomBarTooltip />} />
              <Bar
                dataKey="totalRevenue"
                name="Total Revenue"
                radius={[0, 8, 8, 0]}
                barSize={20}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`bar-cell-${index}`}
                    fill={
                      index === 0
                        ? '#10b981'
                        : index === 1
                        ? '#059669'
                        : index === 2
                        ? '#047857'
                        : index === 3
                        ? '#3b82f6'
                        : '#6366f1'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default TopProductsChart;
