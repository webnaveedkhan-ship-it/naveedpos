import React from 'react';
import { AlertTriangle, Check, XCircle } from 'lucide-react';

const StockBadge = ({ stockQuantity, lowStockAlert }) => {
  if (stockQuantity <= 0) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300">
        <XCircle className="w-3 h-3 mr-1" />
        Out of Stock (0)
      </span>
    );
  }

  if (stockQuantity <= lowStockAlert) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 animate-pulse">
        <AlertTriangle className="w-3 h-3 mr-1" />
        Low Stock ({stockQuantity})
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
      <Check className="w-3 h-3 mr-1" />
      In Stock ({stockQuantity})
    </span>
  );
};

export default StockBadge;
