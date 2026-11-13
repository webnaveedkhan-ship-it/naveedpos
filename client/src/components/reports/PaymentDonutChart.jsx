import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import { PieChart as PieIcon, CreditCard, Banknote, BookOpen } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-2xl shadow-xl border border-slate-700/60 text-xs min-w-[150px]">
        <div className="flex items-center gap-2 mb-1.5 border-b border-slate-700/80 pb-1">
          <span
            className="w-2.5 h-2.5 rounded-full inline-block shadow-sm"
            style={{ backgroundColor: data.color || '#10b981' }}
          />
          <span className="font-extrabold text-slate-200">{data.label}</span>
        </div>
        <div className="font-black text-sm text-white">
          {formatCurrency(data.amount || 0)}
        </div>
        <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
          <span>{data.count || 0} {data.count === 1 ? 'sale' : 'sales'}</span>
          <span className="font-bold text-emerald-400">{data.percentage || 0}%</span>
        </div>
      </div>
    );
  }
  return null;
};

const PaymentDonutChart = ({
  paymentMethods = [],
  totalOrders = 0,
}) => {
  const safePaymentMethods = Array.isArray(paymentMethods) ? paymentMethods : [];
  // Ensure we have non-empty data with positive amounts
  const hasData = safePaymentMethods.some((p) => Number(p?.amount || 0) > 0);
  const chartData = hasData
    ? safePaymentMethods.filter((p) => Number(p?.amount || 0) > 0)
    : [
        { label: 'Cash', amount: 0, color: '#10b981', percentage: 0 },
        { label: 'Market Udhar', amount: 0, color: '#f59e0b', percentage: 0 },
        { label: 'Card / Bank', amount: 0, color: '#3b82f6', percentage: 0 },
      ];

  const defaultDonutDisplay = hasData
    ? chartData
    : [{ label: 'No Sales', amount: 1, color: '#cbd5e1', percentage: 100 }];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
            <PieIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
              Payment Stream Breakdown
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Cash, Card & Customer Khata collections
            </p>
          </div>
        </div>
      </div>

      {/* Donut Chart with Center Readout */}
      <div className="relative w-full h-52 flex items-center justify-center my-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<CustomPieTooltip />} />
            <Pie
              data={defaultDonutDisplay}
              dataKey="amount"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius={56}
              outerRadius={82}
              paddingAngle={hasData ? 3 : 0}
              stroke="transparent"
            >
              {defaultDonutDisplay.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color || '#10b981'}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center Readout (Total Orders Count) */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Total Orders
          </span>
          <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {totalOrders}
          </span>
          <span className="text-[9px] text-slate-400 font-medium">Bills Issued</span>
        </div>
      </div>

      {/* Structured Legend with exact rupees & % */}
      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        {paymentMethods.map((pm) => {
          const isCash = pm.method === 'CASH';
          const isCard = pm.method === 'CARD';
          const IconComponent = isCash ? Banknote : isCard ? CreditCard : BookOpen;

          return (
            <div
              key={pm.method}
              className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition text-xs"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: pm.color }}
                />
                <IconComponent className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {pm.label}
                </span>
              </div>

              <div className="flex items-center gap-2 text-right">
                <span className="font-extrabold text-slate-900 dark:text-white">
                  {formatCurrency(pm.amount || 0)}
                </span>
                <span
                  className="px-1.5 py-0.5 rounded text-[10px] font-black"
                  style={{
                    backgroundColor: `${pm.color}20`,
                    color: pm.color,
                  }}
                >
                  {pm.percentage || 0}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PaymentDonutChart;
