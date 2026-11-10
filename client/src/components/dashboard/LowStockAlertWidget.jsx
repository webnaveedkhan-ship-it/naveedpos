import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Package,
  PlusCircle,
  CheckCircle2,
  ArrowRight,
  TrendingDown,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { formatCurrency, CURRENCY_SYMBOL } from '../../utils/currency';
import QuickRestockModal from './QuickRestockModal';

const LowStockAlertWidget = ({
  products = [],
  onRestockSuccess,
  isLoading = false,
}) => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenRestock = (product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseRestock = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  const handleSuccess = (updatedProduct, quantityAdded) => {
    if (onRestockSuccess) {
      onRestockSuccess(updatedProduct, quantityAdded);
    }
    handleCloseRestock();
  };

  const outOfStockCount = products.filter(
    (p) => Number(p.stockQuantity || 0) <= 0
  ).length;

  return (
    <>
      <div
        id="low-stock-section"
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs transition-all duration-200"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                products.length > 0
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                  : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {products.length > 0 ? (
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              ) : (
                <CheckCircle2 className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Low Stock & Critical Inventory
                </h2>
                {products.length > 0 && (
                  <span className="px-2 py-0.5 text-xs font-black rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400">
                    {products.length} {products.length === 1 ? 'Item' : 'Items'}
                  </span>
                )}
                {outOfStockCount > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-rose-600 text-white animate-pulse">
                    {outOfStockCount} Out of Stock
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Immediate supplier reordering prioritized by lowest inventory levels first
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/products"
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition flex items-center space-x-1"
            >
              <span>View Full Catalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Content Table or Empty State */}
        {products.length === 0 ? (
          <div className="py-10 px-4 text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Healthy Inventory Levels
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mt-1">
              All catalog items are currently stocked above their minimum reorder limits. No items require immediate supplier purchase.
            </p>
            <Link
              to="/products"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
            >
              <span>Browse Catalog & Set Custom Thresholds</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-3 font-semibold rounded-l-lg">Product</th>
                  <th className="py-2.5 px-3 font-semibold">Category</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Status & Stock</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Reorder Limit</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Cost / Price</th>
                  <th className="py-2.5 px-3 font-semibold text-right rounded-r-lg">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {products.map((item) => {
                  const stock = Number(item.stockQuantity || 0);
                  const threshold = Number(
                    item.lowStockAlert || item.lowStockThreshold || 5
                  );
                  const cost = Number(item.costPrice || 0);
                  const price = Number(item.sellingPrice || item.price || 0);
                  const isOutOfStock = stock <= 0;

                  return (
                    <tr
                      key={item._id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition"
                    >
                      {/* Product Thumbnail & Title */}
                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-3 max-w-[260px]">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex-shrink-0 flex items-center justify-center">
                            {item.image || item.imageUrl ? (
                              <img
                                src={item.image || item.imageUrl}
                                alt={item.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src =
                                    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&auto=format&fit=crop';
                                }}
                              />
                            ) : (
                              <Package className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                          <div className="truncate">
                            <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                              {item.title}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                              <span>SKU: {item.sku || 'N/A'}</span>
                              {item.barcode && <span>• Barcode: {item.barcode}</span>}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400 font-medium">
                        <span className="inline-block px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-[10px] font-semibold">
                          {item.category || 'Retail'}
                        </span>
                      </td>

                      {/* Current Stock Status */}
                      <td className="py-3 px-3 text-center">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />
                            Out of Stock (0)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                            <TrendingDown className="w-3 h-3" />
                            {stock} units left
                          </span>
                        )}
                      </td>

                      {/* Reorder Limit */}
                      <td className="py-3 px-3 text-center text-slate-500 dark:text-slate-400 font-semibold">
                        <span className="text-[11px]">Min: {threshold} units</span>
                      </td>

                      {/* Cost / Price */}
                      <td className="py-3 px-3 text-right">
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {formatCurrency(price)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Cost: {formatCurrency(cost)}
                        </div>
                      </td>

                      {/* Restock Button */}
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenRestock(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-xs transition"
                          title={`Quick Restock ${item.title}`}
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>Restock</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Restock Modal */}
      <QuickRestockModal
        isOpen={isModalOpen}
        onClose={handleCloseRestock}
        product={selectedProduct}
        onRestockSuccess={handleSuccess}
      />
    </>
  );
};

export default LowStockAlertWidget;
