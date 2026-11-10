import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { formatCurrency, CURRENCY_SYMBOL } from '../../utils/currency';
import {
  Trash2,
  Plus,
  Minus,
  AlertCircle,
  Tag,
  Percent,
  ArrowRight,
  ShoppingBag,
} from 'lucide-react';

const CartPane = ({ onOpenPayment }) => {
  const {
    cartItems,
    incrementItem,
    decrementItem,
    updateQuantity,
    togglePricingMode,
    removeFromCart,
    clearCart,
    subtotal,
    discountType,
    setDiscountType,
    discountValue,
    setDiscountValue,
    discountAmount,
    grandTotal,
    totalItemCount,
    cartAlert,
  } = useCart();

  const [showDiscountInput, setShowDiscountInput] = useState(false);

  return (
    <div className="w-full lg:w-96 xl:w-[420px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col h-full shadow-lg z-10">
      {/* Top Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ShoppingBag className="w-5 h-5 text-brand-600" />
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
            Current Order
          </h3>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}
          </span>
        </div>

        {cartItems.length > 0 && (
          <button
            onClick={clearCart}
            className="text-xs font-semibold text-red-500 hover:text-red-700 dark:hover:text-red-400 hover:underline transition"
          >
            Clear Cart
          </button>
        )}
      </div>

      {/* Stock Guard Alert Banner */}
      {cartAlert && (
        <div className="mx-4 mt-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-start space-x-2.5 text-xs text-red-700 dark:text-red-300 animate-in fade-in slide-in-from-top-1">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span className="font-medium leading-snug">{cartAlert.message}</span>
        </div>
      )}

      {/* Scrollable Cart Items List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {cartItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 p-6 text-center">
            <ShoppingBag className="w-12 h-12 stroke-1 text-slate-300 dark:text-slate-700 mb-2" />
            <p className="font-semibold text-slate-700 dark:text-slate-300 text-sm">
              Your cart is empty
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
              Tap products from the catalog or scan barcodes to begin sale
            </p>
          </div>
        ) : (
          cartItems.map((item) => {
            const isCarton = item.pricingMode === 'carton';
            const unitLabel = isCarton ? `carton (${item.cartonSize || 1} pcs)` : (item.unitType || 'piece');
            const stepVal = item.allowFractional ? 0.25 : 1;

            return (
              <div
                key={`${item.product}-${item.pricingMode}`}
                className="p-3 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col space-y-2 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-2">
                    <h5 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">
                      {item.title}
                    </h5>
                    <div className="flex items-center space-x-1.5 flex-wrap text-[10px] font-mono text-slate-400 mt-0.5">
                      <span>{item.sku}</span>
                      <span>•</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {formatCurrency(item.unitPrice || item.price)} / {unitLabel}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                      {formatCurrency(item.subtotal)}
                    </div>
                  </div>
                </div>

                {/* Carton / Single Piece Pricing Switcher (if carton price configured) */}
                {item.cartonPrice > 0 && (
                  <div className="flex items-center space-x-1 pt-0.5">
                    <button
                      type="button"
                      onClick={() => togglePricingMode(item.product)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                        isCarton
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300'
                      }`}
                    >
                      Carton ({formatCurrency(item.cartonPrice)})
                    </button>
                    <button
                      type="button"
                      onClick={() => togglePricingMode(item.product)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                        !isCarton
                          ? 'bg-brand-600 text-white shadow-xs'
                          : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300'
                      }`}
                    >
                      Single ({formatCurrency(item.price)})
                    </button>
                  </div>
                )}

                {/* Loose Weight Quick Add Chips (for fractional items like kg / grams) */}
                {item.allowFractional && (
                  <div className="flex items-center space-x-1 pt-0.5">
                    <span className="text-[10px] text-slate-400 font-medium">Add:</span>
                    {[
                      { label: '+250g', val: 0.25 },
                      { label: '+500g', val: 0.5 },
                      { label: '+1kg', val: 1.0 },
                    ].map((chip) => (
                      <button
                        key={chip.label}
                        type="button"
                        onClick={() => incrementItem(item.product, chip.val, item.pricingMode)}
                        className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-100 transition"
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Quantity Stepper & Remove */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center space-x-1 bg-white dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
                    <button
                      onClick={() => decrementItem(item.product, stepVal, item.pricingMode)}
                      className="p-1 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 transition"
                      title="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>

                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      max={item.stockQuantity}
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.product, e.target.value, item.pricingMode)}
                      className="w-14 text-center font-bold text-xs bg-transparent text-slate-800 dark:text-slate-100 outline-none"
                    />

                    <button
                      onClick={() => incrementItem(item.product, stepVal, item.pricingMode)}
                      className="p-1 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 transition"
                      title="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] text-slate-400">
                      Stock: {item.stockQuantity} {item.unitType || 'pcs'}
                    </span>
                    <button
                      onClick={() => removeFromCart(item.product, item.pricingMode)}
                      className="p-1.5 text-slate-400 hover:text-red-500 transition rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Cart Summary & Checkout Pane */}
      <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 space-y-3">
        {/* Subtotal */}
        <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-medium">
          <span>Subtotal</span>
          <span className="font-bold text-slate-900 dark:text-white">
            {formatCurrency(subtotal)}
          </span>
        </div>

        {/* Discount section */}
        <div>
          <div className="flex items-center justify-between text-xs">
            <button
              onClick={() => setShowDiscountInput(!showDiscountInput)}
              className="flex items-center text-brand-600 dark:text-brand-400 hover:underline font-semibold"
            >
              <Tag className="w-3.5 h-3.5 mr-1" />
              <span>Discount</span>
              {discountAmount > 0 && (
                <span className="ml-1 text-[10px] text-slate-500">
                  ({discountType === 'percentage' ? `${discountValue}%` : `${CURRENCY_SYMBOL} ${discountValue}`})
                </span>
              )}
            </button>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              {discountAmount > 0 ? `-${formatCurrency(discountAmount)}` : `${CURRENCY_SYMBOL} 0`}
            </span>
          </div>

          {showDiscountInput && (
            <div className="mt-2 p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2">
              <div className="flex rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 text-xs">
                <button
                  type="button"
                  onClick={() => setDiscountType('percentage')}
                  className={`px-2 py-1 flex items-center ${
                    discountType === 'percentage'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                  }`}
                >
                  <Percent className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setDiscountType('fixed')}
                  className={`px-2.5 py-1 flex items-center text-[10px] font-bold ${
                    discountType === 'fixed'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                  }`}
                >
                  Rs.
                </button>
              </div>

              <input
                type="number"
                min="0"
                value={discountValue}
                onChange={(e) => setDiscountValue(Math.max(0, Number(e.target.value)))}
                placeholder="Discount value"
                className="w-full px-2 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent text-slate-900 dark:text-white outline-none"
              />
            </div>
          )}
        </div>

        {/* Grand Total */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-baseline justify-between">
          <span className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
            Total Due
          </span>
          <span className="text-2xl font-black text-brand-600 dark:text-brand-400">
            {formatCurrency(grandTotal)}
          </span>
        </div>

        {/* Checkout / Pay Button */}
        <button
          disabled={cartItems.length === 0}
          onClick={onOpenPayment}
          className="w-full py-3.5 px-4 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-sm rounded-2xl shadow-md shadow-brand-500/25 flex items-center justify-center space-x-2 transition"
        >
          <span>Pay {formatCurrency(grandTotal)}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default CartPane;
