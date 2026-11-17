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
  Layers,
} from 'lucide-react';
import Modal from '../common/Modal';
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
  const [selectedProductForVariants, setSelectedProductForVariants] = useState(null);

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
        (product.sku || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (Array.isArray(product.variants) &&
          product.variants.some(
            (v) =>
              (v.size || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
              (v.color || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
              (v.sku || '').toLowerCase().includes(searchTerm.toLowerCase())
          ));
      return matchesCategory && matchesSearch;
    });
  }, [safeProducts, activeCategory, searchTerm]);

  // Handle 1-tap add to cart with feedback (or open variant selector if variants exist)
  const handleItemTap = (product) => {
    if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
      setSelectedProductForVariants(product);
      return;
    }
    if (product.stockQuantity <= 0) return;
    addToCart(product, 1);
    playBeep();
    setAddedEffectId(product._id);
    setTimeout(() => setAddedEffectId(null), 300);
  };

  const handleSelectVariant = (product, variant) => {
    const stock = variant.stockQuantity !== undefined ? Number(variant.stockQuantity) : Number(product.stockQuantity);
    if (stock <= 0) return;
    addToCart(product, 1, 'unit', variant);
    playBeep();
    setAddedEffectId(product._id);
    setTimeout(() => setAddedEffectId(null), 300);
    setSelectedProductForVariants(null);
  };

  // Handle barcode scanner Enter or fast SKU match
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && searchTerm.trim() !== '') {
      e.preventDefault();
      const trimmed = searchTerm.trim().toUpperCase();
      const exactSkuMatch = safeProducts.find((p) => p && p.sku === trimmed);

      if (exactSkuMatch) {
        if (exactSkuMatch.stockQuantity > 0) {
          handleItemTap(exactSkuMatch);
          setSearchTerm('');
        }
        return;
      }

      // Check variant barcode / SKU
      for (const prod of safeProducts) {
        if (prod.variants && Array.isArray(prod.variants)) {
          const matchedVariant = prod.variants.find((v) => (v.sku || '').toUpperCase() === trimmed);
          if (matchedVariant) {
            handleSelectVariant(prod, matchedVariant);
            setSearchTerm('');
            return;
          }
        }
      }

      if (filteredProducts.length === 1) {
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

          {/* Prominent Quick Add Product Button */}
          {onOpenQuickAdd && (
            <button
              type="button"
              onClick={onOpenQuickAdd}
              className="px-3 sm:px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm rounded-2xl flex items-center space-x-1.5 active:scale-95 transition-all shadow-md shadow-emerald-600/30 flex-shrink-0 min-tap"
              title="Quick Add Product to POS (نئی پروڈکٹ شامل کریں)"
            >
              <PlusCircle className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              <span className="whitespace-nowrap font-black">+ Add Product</span>
            </button>
          )}

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
        ) : safeProducts.length === 0 ? (
          <div className="h-80 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-800 rounded-3xl p-8 max-w-lg mx-auto my-8 text-center bg-slate-900/40 animate-fadeIn">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 text-emerald-400 shadow-sm">
              <Package className="w-8 h-8 stroke-1" />
            </div>
            <h3 className="text-lg font-black text-white">Your Store Catalog is Empty</h3>
            <p className="text-xs text-slate-400 mt-1 mb-5 max-w-xs leading-relaxed">
              No products found in this store yet. Add your first item to start billing, or load demo items.
            </p>
            <div className="flex items-center gap-3 flex-wrap justify-center">
              {onOpenQuickAdd && (
                <button
                  type="button"
                  onClick={onOpenQuickAdd}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-600/20 active:scale-95 transition flex items-center space-x-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>+ Add First Product</span>
                </button>
              )}
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-800 rounded-2xl p-6 text-center animate-fadeIn">
            <Package className="w-12 h-12 stroke-1 mb-2 text-slate-600" />
            <p className="text-base font-semibold text-slate-300">No matching products found</p>
            <p className="text-xs text-slate-500 mt-1">Try adjusting search or category filter</p>
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                if (onSelectCategory) onSelectCategory('All');
              }}
              className="mt-3 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-3.5">
            {filteredProducts.map((product) => {
              if (!product) return null;
              const cartItem = cartItems.find((i) => i.product === product._id);
              const inCartQty = cartItem ? cartItem.quantity : 0;
              const stockQty = Number(product?.stockQuantity ?? 0);
              const isOutOfStock = stockQty <= 0;
              const lowAlert = Number(product?.lowStockAlert ?? product?.lowStockThreshold ?? 5);
              const isLowStock = !isOutOfStock && stockQty <= lowAlert;
              const remainingStock = stockQty - inCartQty;
              const imgSrc = product.image || product.imageUrl || DEFAULT_FALLBACK_IMAGE;
              const isJustAdded = addedEffectId === product._id;
              const price = Number(product?.price ?? product?.sellingPrice ?? 0);

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
                    {product.variants && Array.isArray(product.variants) && product.variants.length > 0 ? (
                      <div className="absolute top-2 left-2">
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-indigo-950/90 text-indigo-300 border border-indigo-700/80 backdrop-blur-sm flex items-center space-x-1">
                          <Layers className="w-2.5 h-2.5 mr-0.5" />
                          <span>{product.variants.length} Variants</span>
                        </span>
                      </div>
                    ) : (product.size || product.variant || product.unitType) ? (
                      <div className="absolute top-2 left-2">
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-950/85 text-emerald-300 border border-slate-700/80 backdrop-blur-sm">
                          {product.size ? `Size: ${product.size}` : product.unitType || 'Pcs'}
                        </span>
                      </div>
                    ) : null}

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

      {/* Quick Size / Color Variant Picker Modal for Garments & Footwear */}
      {selectedProductForVariants && (
        <Modal
          isOpen={!!selectedProductForVariants}
          onClose={() => setSelectedProductForVariants(null)}
          title={`Select Variant: ${selectedProductForVariants.title}`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-slate-900 border border-slate-800 rounded-xl">
              <img
                src={selectedProductForVariants.image || DEFAULT_FALLBACK_IMAGE}
                alt={selectedProductForVariants.title}
                className="w-12 h-12 rounded-lg object-cover bg-slate-800"
              />
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-white truncate">
                  {selectedProductForVariants.title}
                </h4>
                <p className="text-[10px] text-slate-400">
                  Base Price: {formatCurrency(selectedProductForVariants.price)} • {selectedProductForVariants.category}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Available Sizes &amp; Colors ({selectedProductForVariants.variants?.length || 0})
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                {(selectedProductForVariants.variants || []).map((variant, idx) => {
                  const varStock = variant.stockQuantity !== undefined ? Number(variant.stockQuantity) : Number(selectedProductForVariants.stockQuantity);
                  const isVarOut = varStock <= 0;
                  const varPrice = variant.price ? Number(variant.price) : Number(selectedProductForVariants.price);

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={isVarOut}
                      onClick={() => handleSelectVariant(selectedProductForVariants, variant)}
                      className={`p-3 rounded-xl border text-left transition flex flex-col justify-between active:scale-95 ${
                        isVarOut
                          ? 'opacity-40 border-slate-800 bg-slate-900 cursor-not-allowed'
                          : 'border-slate-800 hover:border-emerald-500 bg-slate-900/90 hover:bg-slate-850 cursor-pointer shadow-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-black text-xs text-white">
                          {variant.size ? `Size: ${variant.size}` : 'Standard'}
                        </span>
                        {variant.color && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                            {variant.color}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px]">
                        <span className="font-extrabold text-emerald-400">
                          {formatCurrency(varPrice)}
                        </span>
                        <span className={`text-[10px] ${isVarOut ? 'text-rose-400 font-bold' : 'text-slate-400'}`}>
                          {isVarOut ? 'Out of stock' : `${varStock} in stock`}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedProductForVariants(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ProductGrid;
