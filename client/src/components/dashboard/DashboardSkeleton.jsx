import React from 'react';

export const KpiCardsSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 animate-pulse">
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <div
        key={i}
        className="p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800" />
        </div>
        <div className="h-7 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="h-3 w-28 bg-slate-100 dark:bg-slate-850 rounded" />
      </div>
    ))}
  </div>
);

export const ChartSkeleton = () => (
  <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl animate-pulse space-y-4">
    <div className="flex items-center justify-between">
      <div className="space-y-1.5">
        <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="h-3 w-56 bg-slate-100 dark:bg-slate-850 rounded" />
      </div>
      <div className="h-6 w-20 bg-slate-200 dark:bg-slate-800 rounded-lg" />
    </div>
    <div className="h-56 bg-slate-100 dark:bg-slate-850 rounded-xl flex items-end justify-between p-4 gap-3">
      {[40, 65, 30, 85, 55, 90, 70].map((h, i) => (
        <div
          key={i}
          className="flex-1 bg-slate-200 dark:bg-slate-800 rounded-t"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  </div>
);

export const TopProductsSkeleton = () => (
  <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl animate-pulse space-y-4">
    <div className="flex items-center justify-between">
      <div className="h-4 w-36 bg-slate-200 dark:bg-slate-800 rounded" />
      <div className="h-3 w-16 bg-slate-100 dark:bg-slate-850 rounded" />
    </div>
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center space-x-3 p-2 rounded-xl">
          <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-2.5 w-20 bg-slate-100 dark:bg-slate-850 rounded" />
          </div>
          <div className="h-4 w-14 bg-slate-200 dark:bg-slate-800 rounded" />
        </div>
      ))}
    </div>
  </div>
);

export const TableSkeleton = () => (
  <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl animate-pulse overflow-hidden">
    <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
      <div className="h-4 w-36 bg-slate-200 dark:bg-slate-800 rounded" />
      <div className="h-7 w-28 bg-slate-200 dark:bg-slate-800 rounded-xl" />
    </div>
    <div className="p-4 space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-8 bg-slate-100 dark:bg-slate-850 rounded-lg" />
      ))}
    </div>
  </div>
);

export default {
  KpiCardsSkeleton,
  ChartSkeleton,
  TopProductsSkeleton,
  TableSkeleton,
};