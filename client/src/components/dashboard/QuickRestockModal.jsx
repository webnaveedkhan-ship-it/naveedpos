import React, { useState, useEffect } from 'react';
import { Package, ArrowUpRight, CheckCircle2, AlertTriangle, Layers, DollarSign } from 'lucide-react';
import Modal from '../common/Modal';
import { productService } from '../../services/api';
import { formatCurrency, CURRENCY_SYMBOL } from '../../utils/currency';

const QuickRestockModal = ({ isOpen, onClose, product, onRestockSuccess }) => {
  const [quantityToAdd, setQuantityToAdd] = useState(20);
  const [newCostPrice, setNewCostPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (product) {
      setQuantityToAdd(20);
      setNewCostPrice(
        product.costPrice !== undefined && product.costPrice !== null
          ? product.costPrice
          : ''
      );
      setError(null);
    }
  }, [product, isOpen]);

  if (!product) return null;

  const currentStock = Number(product.stockQuantity || 0);
  const threshold = Number(product.lowStockAlert || product.lowStockThreshold || 5);
  const sellingPrice = Number(product.sellingPrice || product.price || 0);
  const parsedQty = parseInt(quantityToAdd, 10) || 0;
  const projectedStock = currentStock + parsedQty;
  const parsedCost = newCostPrice !== '' ? Number(newCostPrice) : Number(product.costPrice || 0);
  const projectedMargin =
    sellingPrice > 0 && parsedCost >= 0
      ? Math.round(((sellingPrice - parsedCost) / sellingPrice) * 1000) / 10
      : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (parsedQty <= 0) {
      setError('Please enter a restock quantity greater than 0.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const payload = {
        quantityToAdd: parsedQty,
      };

      if (newCostPrice !== '' && !isNaN(Number(newCostPrice))) {
        payload.newCostPrice = Number(newCostPrice);
      }

      const res = await productService.quickRestock(product._id, payload);
      if (res.data.success) {
        if (onRestockSuccess) {
          onRestockSuccess(res.data.product, parsedQty);
        }
        onClose();
      } else {
        setError(res.data.message || 'Failed to restock inventory.');
      }
    } catch (err) {
      console.error('Quick restock error:', err);
      setError(err.response?.data?.message || 'Error executing restock update.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Quick Inventory Restock"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Product Details Header */}
        <div className="flex items-center gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
          <div className="w-12 h-12 rounded-lg bg-white dark:bg-slate-700 overflow-hidden flex-shrink-0 border border-slate-200/80 dark:border-slate-600 flex items-center justify-center">
            {product.image || product.imageUrl ? (
              <img
                src={product.image || product.imageUrl}
                alt={product.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src =
                    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&auto=format&fit=crop';
                }}
              />
            ) : (
              <Package className="w-6 h-6 text-slate-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
              {product.title}
            </h4>
            <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="font-mono bg-slate-200/70 dark:bg-slate-700 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                {product.sku || 'NO-SKU'}
              </span>
              <span>•</span>
              <span>{product.category || 'General'}</span>
              <span>•</span>
              <span className="text-slate-600 dark:text-slate-300 font-medium">
                Selling: {formatCurrency(sellingPrice)}
              </span>
            </div>
          </div>
        </div>

        {/* Current vs Minimum Threshold Status */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Current Stock
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              <span
                className={`text-lg font-black ${
                  currentStock <= 0
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-amber-600 dark:text-amber-400'
                }`}
              >
                {currentStock} units
              </span>
              {currentStock <= 0 ? (
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                  Out
                </span>
              ) : (
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                  Critical
                </span>
              )}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Reorder Threshold
            </span>
            <div className="text-lg font-black text-slate-800 dark:text-slate-200 mt-1">
              Min: {threshold} units
            </div>
          </div>
        </div>

        {/* Quantity to Add Form Input */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Incoming Stock Units to Add <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type="number"
              min="1"
              step="1"
              value={quantityToAdd}
              onChange={(e) => setQuantityToAdd(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-base font-extrabold text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition"
              placeholder="e.g. 24"
              required
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
              units
            </span>
          </div>

          {/* Quick preset buttons */}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] font-semibold text-slate-400">Quick:</span>
            {[10, 20, 50, 100].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setQuantityToAdd(preset)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition ${
                  parsedQty === preset
                    ? 'bg-brand-50 border-brand-500 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                }`}
              >
                +{preset}
              </button>
            ))}
          </div>
        </div>

        {/* Projected Stock Preview Banner */}
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>
              New Total Stock will be:{' '}
              <strong className="text-sm font-black text-emerald-900 dark:text-emerald-200">
                {projectedStock} units
              </strong>
            </span>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">
            {projectedStock > threshold ? 'Above Reorder Limit' : 'Still Below Limit'}
          </span>
        </div>

        {/* Cost Price (Wholesale) Update */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <span>Wholesale Cost Price ({CURRENCY_SYMBOL})</span>
              <span className="text-[10px] font-normal text-slate-400">(optional update)</span>
            </label>
            {sellingPrice > 0 && (
              <span className="text-[11px] font-semibold text-slate-500">
                Margin:{' '}
                <strong className={projectedMargin >= 20 ? 'text-emerald-600' : 'text-amber-600'}>
                  {projectedMargin}%
                </strong>
              </span>
            )}
          </div>
          <div className="relative">
            <input
              type="number"
              min="0"
              step="any"
              value={newCostPrice}
              onChange={(e) => setNewCostPrice(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition"
              placeholder="e.g. 150"
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
              Rs
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Updating the wholesale cost will immediately update margin & net profit metrics on subsequent sales.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || parsedQty <= 0}
            className="px-5 py-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center space-x-1.5"
          >
            {isSubmitting ? (
              <span>Updating Stock...</span>
            ) : (
              <>
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Confirm Restock (+{parsedQty} units)</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default QuickRestockModal;
