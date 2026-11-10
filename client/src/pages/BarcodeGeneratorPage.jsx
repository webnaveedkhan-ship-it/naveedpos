import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { productService } from '../services/api';
import BarcodeSvg from '../components/common/BarcodeSvg';
import { formatCurrency } from '../utils/currency';
import {
  Barcode,
  Printer,
  Plus,
  Trash2,
  Search,
  Sparkles,
  Lock,
  Layers,
  ArrowRight,
  Settings2,
  RefreshCw,
  Eye,
  CheckCircle2,
} from 'lucide-react';

const SHEET_FORMATS = [
  {
    id: 'a4_24',
    name: 'A4 Sheet (24 Labels)',
    description: '3 cols × 8 rows (70mm × 37mm). Ideal for standard self-adhesive sticker sheets.',
    colsClass: 'grid-cols-3',
    cardPadding: 'p-3',
    maxRows: 8,
    perPage: 24,
  },
  {
    id: 'a4_40',
    name: 'A4 Sheet (40 Labels)',
    description: '4 cols × 10 rows (52.5mm × 29.7mm). Compact stickers for small grocery items.',
    colsClass: 'grid-cols-4',
    cardPadding: 'p-2',
    maxRows: 10,
    perPage: 40,
  },
  {
    id: 'thermal_roll',
    name: 'Continuous Thermal Roll (50mm × 30mm)',
    description: 'Individual sticker labels for Xprinter, Zebra, and TSC thermal barcode printers.',
    colsClass: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    cardPadding: 'p-4',
    perPage: 1,
  },
];

export default function BarcodeGeneratorPage() {
  const { tenantName, planLimits, tenantPlan } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Selected format & options
  const [format, setFormat] = useState('a4_24');
  const [showStoreName, setShowStoreName] = useState(true);
  const [showPrice, setShowPrice] = useState(true);
  const [showSkuText, setShowSkuText] = useState(true);

  // Print Queue: Array of { id, name, sku, price, qty }
  const [queue, setQueue] = useState([]);

  // Manual Quick Item Form
  const [customItem, setCustomItem] = useState({
    name: '',
    sku: '',
    price: '',
    qty: 6,
  });

  const isAllowed = planLimits?.allowBarcodeGen ?? true;

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await productService.getProducts({ limit: 150 });
        if (res.data?.success) {
          const list = res.data.products || [];
          setProducts(list);
          // Pre-populate queue with first 3 products for immediate preview
          if (list.length > 0 && queue.length === 0) {
            setQueue(
              list.slice(0, 3).map((p) => ({
                id: p._id,
                name: p.name,
                sku: p.barcode || p.sku || `SKU-${p._id?.slice(-6)}`,
                price: p.price,
                qty: 8,
              }))
            );
          }
        }
      } catch (err) {
        console.error('Failed to load products for barcode generator:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products.slice(0, 8);
    const q = searchTerm.toLowerCase();
    return products.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        p.barcode?.toLowerCase().includes(q)
    );
  }, [products, searchTerm]);

  const addToQueue = (product) => {
    const existingIndex = queue.findIndex((item) => item.id === product._id);
    if (existingIndex >= 0) {
      const updated = [...queue];
      updated[existingIndex].qty += 4;
      setQueue(updated);
    } else {
      setQueue([
        ...queue,
        {
          id: product._id,
          name: product.name,
          sku: product.barcode || product.sku || `SKU-${product._id?.slice(-6)}`,
          price: product.price,
          qty: 6,
        },
      ]);
    }
  };

  const addCustomItem = (e) => {
    e.preventDefault();
    if (!customItem.name || !customItem.sku) return;
    setQueue([
      ...queue,
      {
        id: `custom_${Date.now()}`,
        name: customItem.name,
        sku: customItem.sku,
        price: parseFloat(customItem.price) || 0,
        qty: parseInt(customItem.qty, 10) || 1,
      },
    ]);
    setCustomItem({ name: '', sku: '', price: '', qty: 6 });
  };

  const updateQueueQty = (index, delta) => {
    const updated = [...queue];
    const newQty = updated[index].qty + delta;
    if (newQty <= 0) {
      updated.splice(index, 1);
    } else {
      updated[index].qty = newQty;
    }
    setQueue(updated);
  };

  const removeFromQueue = (index) => {
    const updated = [...queue];
    updated.splice(index, 1);
    setQueue(updated);
  };

  const clearQueue = () => setQueue([]);

  // Flatten queue items based on each item's requested print quantity
  const flattenedLabels = useMemo(() => {
    const labels = [];
    queue.forEach((item) => {
      for (let i = 0; i < (item.qty || 1); i++) {
        labels.push(item);
      }
    });
    return labels;
  }, [queue]);

  const totalLabelCount = flattenedLabels.length;
  const currentFormat = SHEET_FORMATS.find((f) => f.id === format) || SHEET_FORMATS[0];

  const handlePrint = () => {
    window.print();
  };

  if (!isAllowed) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 sm:p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950/40 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Lock className="w-8 h-8" />
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Standard & Premium Feature
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-3">
            Printable Barcode Sticker Generator
          </h1>
          <p className="text-slate-600 dark:text-slate-300 max-w-lg mx-auto text-sm sm:text-base mb-6 leading-relaxed">
            Your current plan (<strong className="capitalize">{tenantPlan}</strong>) does not include printable barcode sticker generation.
            Upgrade to the <strong>Standard Plan (Rs. 3,000/mo)</strong> or <strong>Premium Plan (Rs. 5,500/mo)</strong> to print custom Code 128 barcodes on standard A4 sticker sheets and thermal label rolls.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/settings/billing"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-emerald-600/20"
            >
              <span>View Subscription Plans</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Screen-Only Header & Controls */}
      <div className="print:hidden space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                <Barcode className="w-6 h-6" />
              </span>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Barcode Sticker Label Generator
              </h1>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Generate and print crisp Code 128 barcode labels for shelf pricing, cartons, and product packaging.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              disabled={totalLabelCount === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-sm transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print {totalLabelCount} Labels</span>
            </button>
          </div>
        </div>

        {/* Configuration Bar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Format Selector */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Label Sheet Format</span>
            </h2>
            <div className="space-y-2">
              {SHEET_FORMATS.map((f) => (
                <label
                  key={f.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    format === f.id
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 dark:border-indigo-500'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/40'
                  }`}
                >
                  <input
                    type="radio"
                    name="sheet_format"
                    value={f.id}
                    checked={format === f.id}
                    onChange={(e) => setFormat(e.target.value)}
                    className="mt-1 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">{f.name}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                      {f.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Label Customization Options */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-emerald-600" />
              <span>Label Appearance</span>
            </h2>
            <div className="space-y-3">
              <label className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                <span>Display Store Name ({tenantName})</span>
                <input
                  type="checkbox"
                  checked={showStoreName}
                  onChange={(e) => setShowStoreName(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                <span>Display Selling Price (Rs.)</span>
                <input
                  type="checkbox"
                  checked={showPrice}
                  onChange={(e) => setShowPrice(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                <span>Display SKU Number Below Bars</span>
                <input
                  type="checkbox"
                  checked={showSkuText}
                  onChange={(e) => setShowSkuText(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
              </label>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Total Labels to Print:</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  {totalLabelCount} stickers
                </span>
              </div>
            </div>
          </div>

          {/* Quick Ad-hoc Item Generator */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Plus className="w-4 h-4 text-amber-500" />
              <span>Quick Custom Label</span>
            </h2>
            <form onSubmit={addCustomItem} className="space-y-2.5">
              <input
                type="text"
                placeholder="Product Name (e.g. Basmati Rice 5kg)"
                value={customItem.name}
                onChange={(e) => setCustomItem({ ...customItem, name: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                required
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="SKU / Barcode"
                  value={customItem.sku}
                  onChange={(e) => setCustomItem({ ...customItem, sku: e.target.value })}
                  className="text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <input
                  type="number"
                  placeholder="Price (Rs.)"
                  value={customItem.price}
                  onChange={(e) => setCustomItem({ ...customItem, price: e.target.value })}
                  className="text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={customItem.qty}
                  onChange={(e) => setCustomItem({ ...customItem, qty: e.target.value })}
                  className="w-20 text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                  title="Sticker Quantity"
                />
                <button
                  type="submit"
                  className="flex-1 text-xs py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-all"
                >
                  Add to Print Queue
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Product Catalog Picker & Active Queue */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Catalog Picker */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Search className="w-4 h-4 text-slate-400" />
                <span>Select from Product Catalog</span>
              </h3>
              <span className="text-xs text-slate-400">
                {products.length} products available
              </span>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search products by title, SKU, or barcode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-700 max-h-60 overflow-y-auto pr-1">
              {filteredProducts.map((p) => (
                <div
                  key={p._id}
                  className="py-2.5 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-700/30 px-2 rounded-lg transition-all"
                >
                  <div className="min-w-0 pr-3">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {p.name}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      SKU: {p.barcode || p.sku || 'N/A'} • {formatCurrency(p.price)}
                    </p>
                  </div>
                  <button
                    onClick={() => addToQueue(p)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-indigo-600 hover:text-white text-slate-700 dark:text-slate-200 rounded-lg font-medium transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Active Print Queue */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Printer className="w-4 h-4 text-emerald-600" />
                <span>Active Print Queue ({queue.length} items)</span>
              </h3>
              {queue.length > 0 && (
                <button
                  onClick={clearQueue}
                  className="text-xs text-rose-500 hover:text-rose-600 font-medium"
                >
                  Clear All
                </button>
              )}
            </div>

            {queue.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs italic">
                Print queue is empty. Select products from the catalog or create a custom label.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-700 max-h-60 overflow-y-auto pr-1">
                {queue.map((item, idx) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between text-xs px-2">
                    <div className="min-w-0 pr-2">
                      <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {item.name}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {item.sku} • {formatCurrency(item.price)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                        <button
                          onClick={() => updateQueueQty(idx, -1)}
                          className="px-2 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-300"
                        >
                          -
                        </button>
                        <span className="px-2.5 py-1 font-bold text-slate-800 dark:text-slate-200">
                          {item.qty}
                        </span>
                        <button
                          onClick={() => updateQueueQty(idx, 1)}
                          className="px-2 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-300"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromQueue(idx)}
                        className="p-1 text-slate-400 hover:text-rose-500 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Print / Live Preview Sheet */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
        <div className="print:hidden flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-indigo-500" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Print Sheet Preview ({currentFormat.name})
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            Page layout adjusts to selected sheet format on physical paper
          </span>
        </div>

        {flattenedLabels.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            Add items to the queue above to see label stickers preview.
          </div>
        ) : (
          <div
            id="printable-barcode-sheet"
            className={`grid ${currentFormat.colsClass} gap-2.5 print:gap-1.5 print:m-0`}
          >
            {flattenedLabels.map((item, index) => (
              <div
                key={`${item.id}-${index}`}
                className={`bg-white text-slate-900 border border-slate-300 print:border-slate-400 rounded-lg ${currentFormat.cardPadding} flex flex-col items-center justify-between text-center overflow-hidden break-inside-avoid shadow-xs`}
                style={{ minHeight: format === 'a4_40' ? '100px' : '125px' }}
              >
                {/* Store Header */}
                {showStoreName && (
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-700 truncate w-full">
                    {tenantName}
                  </div>
                )}

                {/* Product Title */}
                <div className="text-[11px] font-bold text-slate-900 leading-tight line-clamp-1 w-full mt-0.5">
                  {item.name}
                </div>

                {/* Barcode Vector */}
                <div className="my-1 w-full flex justify-center">
                  <BarcodeSvg
                    value={item.sku}
                    moduleWidth={format === 'a4_40' ? 1.2 : 1.5}
                    barHeight={format === 'a4_40' ? 32 : 40}
                    showText={showSkuText}
                  />
                </div>

                {/* Price Display */}
                {showPrice && (
                  <div className="text-xs font-black text-slate-900 mt-0.5">
                    {formatCurrency(item.price)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Global CSS for Print Optimization */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          nav, aside, header, .print\\:hidden {
            display: none !important;
          }
          #printable-barcode-sheet {
            display: grid !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          @page {
            margin: 8mm;
            size: auto;
          }
        }
      `}</style>
    </div>
  );
}
