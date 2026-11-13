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
} from 'lucide-react';

const InventoryPage = () => {
  const { isAdmin } = useAuth();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [selectedCategory, setSelectedCategory] = useState('All');
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

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 15,
        search: searchTerm,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        lowStock: lowStockOnly ? 'true' : 'false',
      };

      const res = await productService.getProducts(params);
      if (res.data.success) {
        setProducts(res.data.products);
        setTotalPages(res.data.totalPages);
        setTotalCount(res.data.total);
      }
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, selectedCategory, lowStockOnly]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await productService.getCategories();
      if (res.data.success) {
        setCategories(['All', ...res.data.categories]);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Handle Add/Edit Save
  const handleSaveProduct = async (formData, productId) => {
    if (productId) {
      await productService.updateProduct(productId, formData);
      showNotification('Product details updated successfully');
    } else {
      await productService.createProduct(formData);
      showNotification('New product added to inventory');
    }
    fetchProducts();
    fetchCategories();
  };

  // Handle Delete
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-brand-600" />
            Inventory & Catalog
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage product items, prices, barcodes, and track low-stock thresholds ({totalCount} total products)
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
            placeholder="Search by title or SKU barcode..."
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
          className={`w-full md:w-auto min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition border active:scale-[0.97] ${
            lowStockOnly
              ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
              : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Low Stock Alert</span>
        </button>
      </div>

      {/* Inventory Table Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        {/* Mobile View: Scannable Product Cards (< md) */}
        <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {loading ? (
            <div className="py-12 text-center text-slate-400">
              <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading inventory records...
            </div>
          ) : products.length === 0 ? (
            <div className="py-12 text-center text-slate-400 p-4">
              No items match the selected criteria.
            </div>
          ) : (
            products.map((item) => {
              const profit = item.price - (item.costPrice || 0);
              const marginPct = item.price > 0 ? ((profit / item.price) * 100).toFixed(0) : 0;
              return (
                <div key={item._id} className="p-3.5 space-y-2.5 bg-slate-50/50 dark:bg-slate-950/40">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900 dark:text-white text-sm leading-tight">
                        {item.title}
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="font-mono font-semibold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[10px] text-slate-700 dark:text-slate-300">
                          {item.sku}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {item.category}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                        {formatCurrency(item.price)}
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
                      stockQuantity={item.stockQuantity}
                      lowStockAlert={item.lowStockAlert}
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
                          onClick={() => handleDeleteProduct(item._id, item.title)}
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

        {/* Desktop View: Full Data Table (hidden on mobile, visible md:block) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
              <tr>
                <th className="py-3.5 px-4">Item Details</th>
                <th className="py-3.5 px-4">SKU / Barcode</th>
                <th className="py-3.5 px-4">Category</th>
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
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    No items match the selected criteria.
                  </td>
                </tr>
              ) : (
                products.map((item) => {
                  const profit = item.price - (item.costPrice || 0);
                  const marginPct = item.price > 0 ? ((profit / item.price) * 100).toFixed(0) : 0;

                  return (
                    <tr
                      key={item._id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-850/60 transition"
                    >
                      {/* Product Name */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {item.title}
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
                          {item.sku}
                        </span>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span className="text-slate-600 dark:text-slate-300 font-medium">
                          {item.category}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {formatCurrency(item.price)}
                      </td>

                      {/* Cost Price (Admin) */}
                      {isAdmin && (
                        <td className="py-3 px-4 text-slate-500 font-mono">
                          {formatCurrency(item.costPrice || 0)}
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
                          stockQuantity={item.stockQuantity}
                          lowStockAlert={item.lowStockAlert}
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
                              onClick={() => handleDeleteProduct(item._id, item.title)}
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
