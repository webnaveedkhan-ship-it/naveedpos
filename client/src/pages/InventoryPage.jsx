import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { productService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/currency';
import StockBadge from '../components/inventory/StockBadge';
import ProductModal from '../components/inventory/ProductModal';
import {
  Package,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  Edit2,
  Trash2,
  ArrowUpDown,
  CheckCircle,
  Barcode,
  Zap,
  Layers,
} from 'lucide-react';

const INDUSTRY_FILTERS = [
  { id: 'All', label: 'All Industries', icon: '🌐' },
  { id: 'GENERAL_STORE', label: 'General Store', icon: '🏬' },
  { id: 'FOOTWEAR', label: 'Shoes / Footwear', icon: '👟' },
  { id: 'GARMENTS', label: 'Garments & Apparel', icon: '👕' },
  { id: 'PERFUME', label: 'Perfumes', icon: '🧴' },
];

const getIndustryBadge = (bType) => {
  switch ((bType || '').toUpperCase()) {
    case 'FOOTWEAR':
      return { label: '👟 Shoes', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' };
    case 'GARMENTS':
      return { label: '👕 Garments', cls: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300' };
    case 'PERFUME':
      return { label: '🧴 Perfume', cls: 'bg-pink-100 text-pink-800 dark:bg-pink-950/60 dark:text-pink-300' };
    case 'GENERAL_STORE':
    default:
      return { label: '🏬 General', cls: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' };
  }
};

const InventoryPage = () => {
  const { isAdmin } = useAuth();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedIndustry, setSelectedIndustry] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [notification, setNotification] = useState(null);
  const [seedingDemo, setSeedingDemo] = useState(false);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const safeProducts = Array.isArray(products) ? products.filter(Boolean) : [];

  const handleSeedDummyProducts = async () => {
    try {
      setSeedingDemo(true);
      const res = await productService.seedDummyProducts();
      showNotification(res.data?.message || '27 Pakistani retail demo products loaded successfully');
      await fetchProducts();
      await fetchCategories();
    } catch (err) {
      console.error('Failed to load dummy products:', err);
      showNotification('Failed to load demo products', 'error');
    } finally {
      setSeedingDemo(false);
    }
  };

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 15,
        search: searchTerm,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        businessType: selectedIndustry !== 'All' ? selectedIndustry : undefined,
        lowStock: lowStockOnly ? 'true' : 'false',
      };

      const res = await productService.getProducts(params);
      if (res.data?.success) {
        const list = Array.isArray(res.data.products) ? res.data.products : [];
        setProducts(list);
        setTotalPages(res.data.totalPages || 1);
        setTotalCount(res.data.total || list.length);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error('Error fetching inventory:', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, selectedCategory, selectedIndustry, lowStockOnly]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await productService.getCategories();
      if (res.data?.success) {
        const rawCats = Array.isArray(res.data.categories) ? res.data.categories : [];
        setCategories(['All', ...rawCats.filter(Boolean)]);
      } else {
        setCategories(['All']);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      setCategories(['All']);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Handle direct navigation shortcuts (?action=add or custom event)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'add' || params.get('add') === 'true') {
      setEditingProduct(null);
      setIsModalOpen(true);
    }

    const handleOpenAdd = () => {
      setEditingProduct(null);
      setIsModalOpen(true);
    };

    window.addEventListener('open-add-product', handleOpenAdd);
    return () => window.removeEventListener('open-add-product', handleOpenAdd);
  }, []);

  const handleSaveProduct = async (formData, id) => {
    try {
      if (id) {
        await productService.updateProduct(id, formData);
        showNotification('Product updated successfully');
      } else {
        await productService.createProduct(formData);
        showNotification('Product created successfully');
      }
      fetchProducts();
      fetchCategories();
    } catch (err) {
      console.error('Save product error:', err);
      throw err;
    }
  };

  const handleDeleteProduct = async (id, title) => {
    if (window.confirm(`Are you sure you want to remove "${title}" from inventory?`)) {
      try {
        await productService.deleteProduct(id);
        showNotification(`"${title}" has been removed`);
        fetchProducts();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete product');
      }
    }
  };

  return (
    <div className="flex-1 p-3 sm:p-6 overflow-y-auto bg-slate-50 dark:bg-slate-950 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-brand-600" />
            Inventory &amp; Multi-Industry Catalog
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage product items, prices, barcodes, industry variants, and low-stock alerts ({totalCount} total products)
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <Link
            to="/products/barcode-generator"
            className="min-h-[44px] flex items-center space-x-1.5 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl shadow-xs active:scale-[0.97] transition"
            title="Generate & print Code 128 barcode sticker labels"
          >
            <Barcode className="w-4 h-4 text-indigo-600" />
            <span>Barcode Generator</span>
          </Link>

          {isAdmin && (
            <>
              <button
                type="button"
                onClick={handleSeedDummyProducts}
                disabled={seedingDemo}
                className="min-h-[44px] flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold text-xs rounded-xl shadow-xs active:scale-[0.97] transition disabled:opacity-50"
                title="Load 27 authentic Pakistani retail demo products across all categories"
              >
                <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{seedingDemo ? 'Loading...' : '⚡ Load Demo Products'}</span>
              </button>

              <button
                onClick={() => {
                  setEditingProduct(null);
                  setIsModalOpen(true);
                }}
                className="min-h-[44px] flex items-center space-x-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 active:scale-[0.97] text-white font-bold text-xs rounded-xl shadow-md shadow-brand-500/20 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add Product</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Floating Notification */}
      {notification && (
        <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 rounded-xl flex items-center text-xs text-emerald-800 dark:text-emerald-300 font-medium animate-fadeIn">
          <CheckCircle className="w-4 h-4 mr-2 text-emerald-600" />
          <span>{notification.message}</span>
        </div>
      )}

      {/* Multi-Industry Filter Pill Selector */}
      <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1 scrollbar-none">
        {INDUSTRY_FILTERS.map((ind) => {
          const active = selectedIndustry === ind.id;
          return (
            <button
              key={ind.id}
              type="button"
              onClick={() => {
                setSelectedIndustry(ind.id);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center space-x-1.5 ${
                active
                  ? 'bg-brand-600 text-white shadow-sm ring-2 ring-brand-500/30'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
              }`}
            >
              <span>{ind.icon}</span>
              <span>{ind.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xs mb-6 flex flex-col md:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder="Search by title, SKU, or variant size/color..."
            className="w-full min-h-[44px] pl-9 pr-3 py-2 text-base sm:text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white"
          />
        </div>

        {/* Category Dropdown */}
        <div className="w-full md:w-52">
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
            className="w-full min-h-[44px] px-3 py-2 text-base sm:text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                Category: {c}
              </option>
            ))}
          </select>
        </div>

        {/* Low Stock Toggle */}
        <button
          onClick={() => {
            setLowStockOnly(!lowStockOnly);
            setPage(1);
          }}
          className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 w-full md:w-auto border ${
            lowStockOnly
              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700'
              : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span>Low Stock Only</span>
        </button>
      </div>

      {/* Main Inventory Card / Table Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {/* Mobile View: Cards */}
        <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading inventory records...
            </div>
          ) : safeProducts.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <Package className="w-10 h-10 stroke-1 mx-auto mb-2 text-slate-500" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No products found</p>
              <p className="text-xs text-slate-500 mt-0.5 mb-3">Add your first product to begin billing in POS</p>
              {isAdmin && (
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleSeedDummyProducts}
                    disabled={seedingDemo}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition active:scale-95 inline-flex items-center space-x-1.5 disabled:opacity-50"
                  >
                    <Zap className="w-4 h-4" />
                    <span>{seedingDemo ? 'Loading...' : '⚡ Load Demo Products'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProduct(null);
                      setIsModalOpen(true);
                    }}
                    className="px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-sm transition active:scale-95 inline-flex items-center space-x-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Add Product</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            safeProducts.map((item) => {
              if (!item) return null;
              const prodTitle = item.name || item.title || 'Untitled Item';
              const prodBarcode = item.barcode || item.sku || 'N/A';
              const price = Number(item.salePrice !== undefined ? item.salePrice : item.price || 0);
              const costPrice = Number(item.costPrice || 0);
              const stock = item.stock !== undefined ? item.stock : item.stockQuantity;
              const minAlert = item.minStockAlert !== undefined ? item.minStockAlert : item.lowStockAlert;
              const profit = price - costPrice;
              const marginPct = price > 0 ? ((profit / price) * 100).toFixed(0) : 0;
              const indBadge = getIndustryBadge(item.businessType);

              return (
                <div key={item._id} className="p-3.5 space-y-2.5 bg-slate-50/50 dark:bg-slate-950/40">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900 dark:text-white text-sm leading-tight">
                        {prodTitle}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className="font-mono font-semibold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[10px] text-slate-700 dark:text-slate-300">
                          {prodBarcode}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${indBadge.cls}`}>
                          {indBadge.label}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {item.category}
                        </span>
                        {item.variants && item.variants.length > 0 && (
                          <span className="text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded">
                            {item.variants.length} variants
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                        {formatCurrency(price)}
                      </div>
                      {isAdmin && (
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                          Margin: {marginPct}%
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800/80">
                    <StockBadge
                      stockQuantity={stock}
                      lowStockAlert={minAlert}
                    />

                    {isAdmin && (
                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingProduct(item);
                            setIsModalOpen(true);
                          }}
                          className="min-h-[38px] px-3 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 rounded-xl active:scale-[0.97] transition flex items-center space-x-1"
                          title="Edit Product"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(item._id, prodTitle)}
                          className="min-h-[38px] px-2.5 py-1.5 text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 hover:bg-red-100 dark:bg-red-950/50 rounded-xl active:scale-[0.97] transition flex items-center"
                          title="Delete Product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop View: Full Data Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
              <tr>
                <th className="py-3.5 px-4">Item Details</th>
                <th className="py-3.5 px-4">SKU / Barcode</th>
                <th className="py-3.5 px-4">Industry / Cat.</th>
                <th className="py-3.5 px-4">Price</th>
                {isAdmin && <th className="py-3.5 px-4">Cost Price</th>}
                {isAdmin && <th className="py-3.5 px-4">Margin</th>}
                <th className="py-3.5 px-4">Stock Level</th>
                {isAdmin && <th className="py-3.5 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading inventory records...
                  </td>
                </tr>
              ) : safeProducts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center py-4">
                      <Package className="w-10 h-10 stroke-1 mb-2 text-slate-500" />
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Your store catalog is empty</p>
                      <p className="text-xs text-slate-500 mt-0.5 mb-3">Add your first product to begin billing in POS</p>
                      {isAdmin && (
                        <div className="flex items-center justify-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingProduct(null);
                              setIsModalOpen(true);
                            }}
                            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md transition active:scale-95 inline-flex items-center space-x-1.5"
                          >
                            <Plus className="w-4 h-4" />
                            <span>+ Add First Product</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleSeedDummyProducts}
                            disabled={seedingDemo}
                            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl shadow-sm transition active:scale-95 inline-flex items-center space-x-1.5 disabled:opacity-50"
                          >
                            <Zap className="w-4 h-4 text-emerald-600" />
                            <span>{seedingDemo ? 'Loading...' : '⚡ Load Demo Products'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                safeProducts.map((item) => {
                  if (!item) return null;
                  const prodTitle = item.name || item.title || 'Untitled Item';
                  const prodBarcode = item.barcode || item.sku || 'N/A';
                  const price = Number(item.salePrice !== undefined ? item.salePrice : item.price || 0);
                  const costPrice = Number(item.costPrice || 0);
                  const stock = item.stock !== undefined ? item.stock : item.stockQuantity;
                  const minAlert = item.minStockAlert !== undefined ? item.minStockAlert : item.lowStockAlert;
                  const profit = price - costPrice;
                  const marginPct = price > 0 ? ((profit / price) * 100).toFixed(0) : 0;
                  const indBadge = getIndustryBadge(item.businessType);

                  return (
                    <tr
                      key={item._id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-850/60 transition"
                    >
                      {/* Product Name */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{prodTitle}</span>
                          {item.variants && item.variants.length > 0 && (
                            <span className="text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded">
                              {item.variants.length} variants
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <div className="text-[10px] text-slate-400 truncate max-w-xs">
                            {item.description}
                          </div>
                        )}
                      </td>

                      {/* SKU */}
                      <td className="py-3 px-4">
                        <span className="font-mono font-semibold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px] text-slate-700 dark:text-slate-300">
                          {prodBarcode}
                        </span>
                      </td>

                      {/* Industry & Category */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${indBadge.cls}`}>
                            {indBadge.label}
                          </span>
                          <span className="text-slate-600 dark:text-slate-300 font-medium text-[11px]">
                            {item.category}
                          </span>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {formatCurrency(price)}
                      </td>

                      {/* Cost Price (Admin) */}
                      {isAdmin && (
                        <td className="py-3 px-4 text-slate-500 font-mono">
                          {formatCurrency(costPrice)}
                        </td>
                      )}

                      {/* Margin (Admin) */}
                      {isAdmin && (
                        <td className="py-3 px-4">
                          <span
                            className={`font-semibold ${
                              profit >= 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-red-500'
                            }`}
                          >
                            {marginPct}%
                          </span>
                        </td>
                      )}

                      {/* Stock Level Badge */}
                      <td className="py-3 px-4">
                        <StockBadge
                          stockQuantity={stock}
                          lowStockAlert={minAlert}
                        />
                      </td>

                      {/* Actions */}
                      {isAdmin && (
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => {
                                setEditingProduct(item);
                                setIsModalOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition"
                              title="Edit Product"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(item._id, prodTitle)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition"
                              title="Delete Product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>
              Page {page} of {totalPages} ({totalCount} items)
            </span>
            <div className="flex space-x-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg disabled:opacity-40 font-semibold"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg disabled:opacity-40 font-semibold"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveProduct}
        product={editingProduct}
        categories={categories}
      />
    </div>
  );
};

export default InventoryPage;
