import React, { useState } from 'react';
import Modal from '../common/Modal';
import ProductImageUploader from '../common/ProductImageUploader';
import { productService } from '../../services/api';
import { PlusCircle, AlertCircle, Sparkles, Check, Package } from 'lucide-react';

const CATEGORY_PRESETS = [
  'General Retail',
  'Groceries & Pantry',
  'Beverages',
  'Snacks & Confectionery',
  'Dairy & Fresh',
  'Garments & Apparel',
  'Footwear',
  'Personal Care',
  'Electronics & Acc.',
  'Household & Cleaning',
];

const QuickAddProductModal = ({ isOpen, onClose, onProductCreated }) => {
  const [formData, setFormData] = useState({
    title: '',
    sku: '',
    category: 'General Retail',
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
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleGenerateSku = () => {
    const cleanPrefix = (formData.category || 'ITM')
      .replace(/[^a-zA-Z]/g, '')
      .slice(0, 3)
      .toUpperCase() || 'ITM';
    const rand = Math.floor(1000 + Math.random() * 9000);
    setFormData((prev) => ({
      ...prev,
      sku: `${cleanPrefix}-${rand}`,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const title = (formData.title || '').trim();
    const sku = (formData.sku || '').trim().toUpperCase();
    const priceNum = parseFloat(formData.price);

    if (!title) {
      setErrorMsg('Product title is required.');
      return;
    }
    if (!sku) {
      setErrorMsg('SKU / Barcode is required.');
      return;
    }
    if (isNaN(priceNum) || priceNum <= 0) {
      setErrorMsg('Please enter a valid selling price greater than 0.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        title,
        sku,
        category: (formData.category || 'General Retail').trim(),
        price: priceNum,
        sellingPrice: priceNum,
        costPrice: parseFloat(formData.costPrice) || 0,
        stockQuantity: parseFloat(formData.stockQuantity) || 0,
        lowStockAlert: parseFloat(formData.lowStockAlert) || 5,
        lowStockThreshold: parseFloat(formData.lowStockAlert) || 5,
        unitType: formData.unitType || 'piece',
        allowFractional: Boolean(formData.allowFractional),
        cartonSize: parseInt(formData.cartonSize, 10) || 1,
        cartonPrice: parseFloat(formData.cartonPrice) || 0,
        image:
          (formData.image || '').trim() ||
          'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop',
        description: (formData.description || '').trim(),
      };

      const res = await productService.createProduct(payload);
      if (res.data?.success) {
        if (onProductCreated) {
          onProductCreated(res.data.product);
        }
        // Reset form to defaults
        setFormData({
          title: '',
          sku: '',
          category: 'General Retail',
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
        onClose();
      }
    } catch (err) {
      console.error('Quick Add Product failed:', err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to add product. Please verify fields.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Quick Add Product to POS"
      subtitle="Create a new catalog item directly from counter without losing active cart"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {errorMsg && (
          <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-300 dark:border-red-900 rounded-xl flex items-center text-xs text-red-700 dark:text-red-300 font-semibold animate-fadeIn">
            <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Product Title */}
        <div>
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-100 mb-1">
            Product Title (پروڈکٹ کا نام) *
          </label>
          <input
            type="text"
            name="title"
            required
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g. Tapal Danedar Tea 430g / Men Shalwar Kameez"
            className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white placeholder-slate-400 font-medium"
          />
        </div>

        {/* Barcode & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-100">
                Barcode / SKU *
              </label>
              <button
                type="button"
                onClick={handleGenerateSku}
                className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-0.5 active:scale-95 transition"
              >
                <Sparkles className="w-3 h-3" />
                Auto-generate
              </button>
            </div>
            <input
              type="text"
              name="sku"
              required
              value={formData.sku}
              onChange={handleChange}
              placeholder="e.g. GRO-1029 or 8964000..."
              className="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white uppercase font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-100 mb-1">
              Category (کیٹیگری) *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white font-medium"
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
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-100 mb-1">
              Selling Price Rs. (فروخت قیمت) *
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
              className="w-full px-3 py-2 text-xs font-extrabold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-emerald-600 dark:text-emerald-400 placeholder-slate-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-100 mb-1">
              Cost Price Rs. (خرید قیمت)
            </label>
            <input
              type="number"
              name="costPrice"
              min="0"
              step="any"
              value={formData.costPrice}
              onChange={handleChange}
              placeholder="0.00"
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white placeholder-slate-400 font-medium"
            />
          </div>
        </div>

        {/* Stock Quantity & Low Stock Limit */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-100 mb-1">
              Opening Stock (موجود اسٹاک) *
            </label>
            <input
              type="number"
              name="stockQuantity"
              required
              min="0"
              value={formData.stockQuantity}
              onChange={handleChange}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-100 mb-1">
              Low Stock Warning (کم اسٹاک الرٹ)
            </label>
            <input
              type="number"
              name="lowStockAlert"
              min="0"
              value={formData.lowStockAlert}
              onChange={handleChange}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white font-medium"
            />
          </div>
        </div>

        {/* Unit Type & Fractional Controls */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Unit Type (پیمائش کی اکائی)
              </label>
              <select
                name="unitType"
                value={formData.unitType}
                onChange={handleChange}
                className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg outline-none text-slate-900 dark:text-white"
              >
                <option value="piece">Piece / Pcs (عدد)</option>
                <option value="kg">Kilogram / Kg (کلو)</option>
                <option value="gram">Gram / g (گرام)</option>
                <option value="liter">Litre / Ltr (لیٹر)</option>
                <option value="dozen">Dozen (درجن)</option>
                <option value="carton">Carton / Pack (کاٹن / پیک)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Carton Price (ہول سیل ریٹ)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                name="cartonPrice"
                value={formData.cartonPrice}
                onChange={handleChange}
                placeholder="Optional"
                className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg outline-none font-bold text-indigo-600 dark:text-indigo-400"
              />
            </div>
          </div>

          <label className="flex items-center space-x-2 cursor-pointer pt-0.5">
            <input
              type="checkbox"
              name="allowFractional"
              checked={formData.allowFractional}
              onChange={handleChange}
              className="w-3.5 h-3.5 text-emerald-600 rounded"
            />
            <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
              Allow Fractional / Loose Weight Stepping (0.25kg, 0.5kg کھلی اشیاء)
            </span>
          </label>
        </div>

        {/* Product Photo Uploader */}
        <div>
          <ProductImageUploader
            value={formData.image}
            onChange={(val) => setFormData((prev) => ({ ...prev, image: val }))}
            label="Product Photo (Optional)"
          />
        </div>

        {/* Actions */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md transition disabled:opacity-50 flex items-center space-x-1.5 active:scale-95"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <PlusCircle className="w-4 h-4" />
                <span>Save &amp; Add to Catalog</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default QuickAddProductModal;
