import React, { useState } from 'react';
import Modal from '../common/Modal';
import ProductImageUploader from '../common/ProductImageUploader';
import { productService } from '../../services/api';
import { PlusCircle, AlertCircle, Sparkles } from 'lucide-react';

const CATEGORY_PRESETS = [
  'Beverages',
  'Snacks & Bakery',
  'Dairy & Fresh',
  'Groceries & Pantry',
  'Personal Care',
  'Electronics & Acc.',
  'General Retail',
];

const QuickAddProductModal = ({ isOpen, onClose, onProductCreated }) => {
  const [formData, setFormData] = useState({
    title: '',
    sku: '',
    category: 'Groceries & Pantry',
    price: '',
    costPrice: '',
    stockQuantity: '20',
    lowStockAlert: '5',
    unitType: 'piece',
    allowFractional: false,
    cartonSize: '1',
    cartonPrice: '',
    image: '',
    description: '',
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleGenerateSku = () => {
    const prefix = (formData.category || 'ITM').slice(0, 3).toUpperCase();
    const random = Math.floor(100 + Math.random() * 900);
    setFormData((prev) => ({
      ...prev,
      sku: `${prefix}-${random}`,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.title || !formData.sku || !formData.price) {
      setErrorMsg('Product title, SKU/Barcode, and selling price are required.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        title: formData.title.trim(),
        sku: formData.sku.trim().toUpperCase(),
        category: formData.category.trim(),
        price: Number(formData.price),
        sellingPrice: Number(formData.price),
        costPrice: Number(formData.costPrice || 0),
        stockQuantity: Number(formData.stockQuantity || 0),
        lowStockAlert: Number(formData.lowStockAlert || 5),
        lowStockThreshold: Number(formData.lowStockAlert || 5),
        unitType: formData.unitType || 'piece',
        allowFractional: Boolean(formData.allowFractional),
        cartonSize: Number(formData.cartonSize) || 1,
        cartonPrice: Number(formData.cartonPrice) || 0,
        image:
          formData.image.trim() ||
          'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop',
        description: formData.description.trim(),
      };

      const res = await productService.createProduct(payload);
      if (res.data.success) {
        onProductCreated(res.data.product);
        // Reset form
        setFormData({
          title: '',
          sku: '',
          category: 'Groceries & Pantry',
          price: '',
          costPrice: '',
          stockQuantity: '20',
          lowStockAlert: '5',
          image: '',
          description: '',
        });
        onClose();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to add product. Please verify fields.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Quick Add Product to POS"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <p className="text-xs text-slate-500">
          Create a new catalog item directly from counter without losing active customer cart.
        </p>

        {errorMsg && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl flex items-center text-xs text-red-700 dark:text-red-300">
            <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Product Title */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Product Title *
          </label>
          <input
            type="text"
            name="title"
            required
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g. Tapal Danedar Tea 430g"
            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white"
          />
        </div>

        {/* Barcode & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Barcode / SKU *
              </label>
              <button
                type="button"
                onClick={handleGenerateSku}
                className="text-[10px] font-bold text-brand-600 hover:text-brand-700 flex items-center gap-0.5"
              >
                <Sparkles className="w-2.5 h-2.5" />
                Auto-generate
              </button>
            </div>
            <input
              type="text"
              name="sku"
              required
              value={formData.sku}
              onChange={handleChange}
              placeholder="e.g. TEA-003 or 8964000..."
              className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Category *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white"
            >
              {CATEGORY_PRESETS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Prices: Selling Price & Cost Price */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Selling Price (Rs.) *
            </label>
            <input
              type="number"
              name="price"
              required
              min="0"
              step="any"
              value={formData.price}
              onChange={handleChange}
              placeholder="0.00"
              className="w-full px-3 py-2 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none text-brand-600 dark:text-brand-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Cost Price (Rs.)
            </label>
            <input
              type="number"
              name="costPrice"
              min="0"
              step="any"
              value={formData.costPrice}
              onChange={handleChange}
              placeholder="0.00"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Stock Quantity & Low Stock Limit */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Opening Stock Quantity *
            </label>
            <input
              type="number"
              name="stockQuantity"
              required
              min="0"
              value={formData.stockQuantity}
              onChange={handleChange}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Low Stock Alert Limit
            </label>
            <input
              type="number"
              name="lowStockAlert"
              min="0"
              value={formData.lowStockAlert}
              onChange={handleChange}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Multi-Unit & Loose Weight Controls */}
        <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Unit Type
              </label>
              <select
                name="unitType"
                value={formData.unitType}
                onChange={handleChange}
                className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg outline-none"
              >
                <option value="piece">Piece (Pcs)</option>
                <option value="kg">Kilogram (Kg)</option>
                <option value="gram">Gram (g)</option>
                <option value="liter">Litre (Ltr)</option>
                <option value="dozen">Dozen</option>
                <option value="carton">Carton / Pack</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Carton Price (Optional)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                name="cartonPrice"
                value={formData.cartonPrice}
                onChange={handleChange}
                placeholder="Rs. Wholesale"
                className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg outline-none font-bold text-indigo-600"
              />
            </div>
          </div>

          <label className="flex items-center space-x-2 cursor-pointer pt-0.5">
            <input
              type="checkbox"
              name="allowFractional"
              checked={formData.allowFractional}
              onChange={(e) => setFormData({ ...formData, allowFractional: e.target.checked })}
              className="w-3.5 h-3.5 text-brand-600 rounded"
            />
            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
              Allow Fractional / Loose Weight Stepping (e.g. 0.25kg, 0.5kg)
            </span>
          </label>
        </div>

        {/* Product Image Uploader with Computer File Picker & Preview */}
        <div>
          <ProductImageUploader
            value={formData.image}
            onChange={(val) => setFormData((prev) => ({ ...prev, image: val }))}
            label="Product Photo (Local Upload or Default)"
          />
        </div>

        {/* Actions */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-xl shadow-md transition disabled:opacity-50 flex items-center space-x-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{loading ? 'Adding...' : 'Add to Catalog & Cart'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default QuickAddProductModal;
