import React, { useState, useMemo } from 'react';
import {
  Search,
  Barcode,
  Package,
  PlusCircle,
  Calculator,
  ShoppingCart,
  CheckCircle,
  Sparkles,
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { formatCurrency } from '../../utils/currency';

const DEFAULT_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop';

// Lightweight cash register beep synthesizer using Web Audio API
const playBeep = () => {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // 880 Hz crisp beep
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } catch {
    // Ignore audio autoplay restrictions
  }
};

const ProductGrid = ({
  products = [],
  categories = ['All'],
  activeCategory = 'All',
  onSelectCategory,
  loading = false,
  onOpenQuickAdd,
  onOpenCashDrawer,
  onOpenMobileCart,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { addToCart, cartItems, totalItemCount, grandTotal } = useCart();
  const [addedEffectId, setAddedEffectId] = useState(null);

  const safeProducts = Array.isArray(products) ? products : [];
  const safeCategories = Array.isArray(categories) ? categories : ['All'];

  // Filter products by category and search keyword
  const filteredProducts = useMemo(() => {
    return safeProducts.filter((product) => {
      if (!product) return false;
      const matchesCategory =
        activeCategory === 'All' || product.category === activeCategory;
      const matchesSearch =
        (product.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.sku || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [safeProducts, activeCategory, searchTerm]);

  // Handle 1-tap add to cart with feedback
  const handleItemTap = (product) => {
    if (product.stockQuantity <= 0) return;
    addToCart(product, 1);
    playBeep();
    setAddedEffectId(product._id);
    setTimeout(() => setAddedEffectId(null), 300);
  };

  // Handle barcode scanner Enter or fast SKU match
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && searchTerm.trim() !== '') {
      e.preventDefault();
      const trimmed = searchTerm.trim().toUpperCase();
      const exactSkuMatch = products.find((p) => p.sku === trimmed);

      if (exactSkuMatch) {
        if (exactSkuMatch.stockQuantity > 0) {
          handleItemTap(exactSkuMatch);
          setSearchTerm('');
        }
      } else if (filteredProducts.length === 1) {
        if (filteredProducts[0].stockQuantity > 0) {
          handleItemTap(filteredProducts[0]);
          setSearchTerm('');
        }
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950 p-3 sm:p-4 pb-28 lg:pb-4">
      {/* Top Sticky Bar: Search + Scan Trigger + Mobile Cart Counter Pill */}
      <div className="sticky top-0 z-20 bg-slate-950 pb-2.5 space-y-2.5">
        <div className="flex items-center gap-2">
          {/* Search Box */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search or scan barcode..."
              className="w-full pl-10 pr-20 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-white placeholder-slate-400 min-tap"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 text-xs font-mono">
              <Barcode className="w-4 h-4 mr-1 inline" /> Scan
            </div>
          </div>

          {/* Mobile Cart Counter Trigger Pill (Visible on mobile < lg) */}
          <button
            type="button"
            onClick={onOpenMobileCart}
            className="lg:hidden px-3 py-2 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 rounded-2xl flex items-center space-x-1.5 min-tap active:scale-95 transition shadow-xs flex-shrink-0"
          >
            <ShoppingCart className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-black">
              {totalItemCount} • Rs. {Math.round(grandTotal).toLocaleString('en-PK')}
            </span>
          </button>
        </div>

        {/* Quick Add Product & Cash Drawer Bar */}
        <div className="flex items-center justify-between gap-2">
          {/* Category Filter Pills (Horizontal swipe) */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none flex-1">
            {safeCategories.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => onSelectCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all min-tap flex items-center ${
                    isActive
                      ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          <div className="flex items-center space-x-1.5 flex-shrink-0">
            {onOpenQuickAdd && (
              <button
                type="button"
                onClick={onOpenQuickAdd}
                className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-850 text-emerald-400 border border-emerald-900/60 rounded-xl text-xs font-bold transition flex items-center space-x-1"
                title="Add product directly"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">+ Item</span>
              </button>
            )}

            {onOpenCashDrawer && (
              <button
                type="button"
                onClick={onOpenCashDrawer}
                className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-850 text-amber-400 border border-amber-900/60 rounded-xl text-xs font-bold transition flex items-center space-x-1"
                title="Audit Cash Drawer"
              >
                <Calculator className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Hisaab</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2-Column Mobile Touch Grid (2-cols on mobile, 3-4 cols on desktop) */}
      <div className="flex-1 overflow-y-auto pr-0.5">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400">
            <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-sm font-medium">Loading catalog items...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-800 rounded-2xl p-6">
            <Package className="w-12 h-12 stroke-1 mb-2 text-slate-600" />
            <p className="text-base font-semibold text-slate-300">No products found</p>
            <p className="text-xs text-slate-500 mt-1">Try adjusting search or category filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-3.5">
            {filteredProducts.map((product) => {
              const cartItem = cartItems.find((i) => i.product === product._id);
              const inCartQty = cartItem ? cartItem.quantity : 0;
              const isOutOfStock = Number(product.stockQuantity || 0) <= 0;
              const isLowStock =
                !isOutOfStock &&
                Number(product.stockQuantity) <=
                  Number(product.lowStockAlert || product.lowStockThreshold || 5);
              const remainingStock = Number(product.stockQuantity) - inCartQty;
              const imgSrc = product.image || product.imageUrl || DEFAULT_FALLBACK_IMAGE;
              const isJustAdded = addedEffectId === product._id;

              return (
                <div
                  key={product._id}
                  onClick={() => handleItemTap(product)}
                  className={`group relative flex flex-col justify-between bg-slate-900 border rounded-2xl overflow-hidden transition-all text-left select-none active:scale-[0.97] min-tap ${
                    isJustAdded ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-950' : ''
                  } ${
                    isOutOfStock
                      ? 'opacity-50 cursor-not-allowed border-slate-800'
                      : remainingStock <= 0
                      ? 'border-amber-500/50 bg-amber-950/20 cursor-not-allowed'
                      : 'border-slate-800 hover:border-emerald-500/80 cursor-pointer shadow-md'
                  }`}
                >
                  {/* Product Thumbnail with Category & In-Cart Badges */}
                  <div className="relative w-full h-24 sm:h-28 bg-slate-800 overflow-hidden">
                    <img
                      src={imgSrc}
                      alt={product.title}
                      loading="lazy"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = DEFAULT_FALLBACK_IMAGE;
                      }}
                      className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                        isOutOfStock ? 'grayscale' : ''
                      }`}
                    />

                    {/* Distinct Size / Variant pill if present */}
                    {(product.size || product.variant || product.unitType) && (
                      <div className="absolute top-2 left-2">
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-950/85 text-emerald-300 border border-slate-700/80 backdrop-blur-sm">
                          {product.size ? `Size: ${product.size}` : product.unitType || 'Pcs'}
                        </span>
                      </div>
                    )}

                    {/* In-cart count badge */}
                    {inCartQty > 0 && (
                      <div className="absolute top-2 right-2">
                        <span className="inline-flex items-center text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 shadow-md">
                          <CheckCircle className="w-3 h-3 mr-0.5" />
                          {inCartQty} in cart
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card Content Body */}
                  <div className="p-2.5 sm:p-3 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] font-mono text-slate-400 mb-0.5 truncate">
                        {product.sku}
                      </div>
                      <h4 className="font-bold text-xs sm:text-sm text-white line-clamp-2 leading-snug mb-1.5">
                        {product.title}
                      </h4>
                    </div>

                    {/* Price & Live Stock Row */}
                    <div className="pt-2 border-t border-slate-800/80 space-y-1">
                      <div className="flex items-baseline justify-between">
                        <div className="text-sm sm:text-base font-black text-emerald-400">
                          {formatCurrency(product.price)}
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">
                          /{product.unitType || 'pc'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[10px]">
                        {isOutOfStock ? (
                          <span className="text-rose-400 font-black">Out of stock</span>
                        ) : isLowStock ? (
                          <span className="text-amber-400 font-bold">
                            Low: {remainingStock} left
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium font-mono">
                            Stock: {remainingStock}
                          </span>
                        )}
                        <span className="text-[10px] font-bold text-cyan-400">+ Add</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductGrid;
