import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import ProductImageUploader from '../common/ProductImageUploader';
import { formatCurrency } from '../../utils/currency';
import { useAuth } from '../../context/AuthContext';
import { AlertCircle, Percent, DollarSign, Lock } from 'lucide-react';

const ProductModal = ({ isOpen, onClose, onSave, product, categories }) => {
  const { planLimits } = useAuth();
  const allowFractionalUnits = planLimits?.allowFractionalUnits ?? true;

  const [formData, setFormData] = useState({
    title: '',
    sku: '',
    category: '',
    price: '',
    costPrice: '',
    stockQuantity: '',
    lowStockAlert: '5',
    unitType: 'piece',
    allowFractional: false,
    cartonSize: '1',
    cartonPrice: '',
    description: '',
  });
  const [imageUrl, setImageUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        title: product.title || '',
        sku: product.sku || '',
        category: product.category || '',
        price: product.price?.toString() || '',
        costPrice: product.costPrice?.toString() || '',
        stockQuantity: product.stockQuantity?.toString() || '',
        lowStockAlert: product.lowStockAlert?.toString() || '5',
        unitType: product.unitType || 'piece',
        allowFractional: Boolean(product.allowFractional),
        cartonSize: product.cartonSize?.toString() || '1',
        cartonPrice: product.cartonPrice?.toString() || '',
        description: product.description || '',
      });
      setImageUrl(product.image || '');
    } else {
      setFormData({
        title: '',
        sku: '',
        category: categories.length > 0 && categories[0] !== 'All' ? categories[0] : 'General',
        price: '',
        costPrice: '',
        stockQuantity: '10',
        lowStockAlert: '5',
        unitType: 'piece',
        allowFractional: false,
        cartonSize: '1',
        cartonPrice: '',
        description: '',
      });
      setImageUrl('');
    }
    setErrorMsg('');
  }, [product, isOpen, categories]);

  const priceNum = parseFloat(formData.price) || 0;
  const costNum = parseFloat(formData.costPrice) || 0;
  const profit = priceNum - costNum;
  const marginPct = priceNum > 0 ? ((profit / priceNum) * 100).toFixed(1) : 0;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.title || !formData.sku || !formData.category || !formData.price) {
      setErrorMsg('Please fill in all required fields (Title, SKU, Category, Price).');
      return;
    }

    setIsSubmitting(true);
    try {
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        data.append(key, formData[key]);
      });
      if (imageUrl) {
        data.append('image', imageUrl);
      }

      await onSave(data, product?._id);
      onClose();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to save product. Ensure SKU is unique.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={product ? 'Edit Product' : 'Add New Inventory Item'}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl flex items-center text-xs text-red-700 dark:text-red-300 font-medium">
            <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Title */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Product Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Cold Brew Coffee 330ml"
              required
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white"
            />
          </div>

          {/* SKU / Barcode */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              SKU / Barcode *
            </label>
            <input
              type="text"
              name="sku"
              value={formData.sku}
              onChange={handleChange}
              placeholder="e.g. BEV-001 or 123456789"
              required
              className="w-full px-3 py-2 text-sm font-mono uppercase bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Category *
            </label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
              list="category-suggestions"
              placeholder="Select or enter category"
              required
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white"
            />
            <datalist id="category-suggestions">
              {categories
                .filter((c) => c !== 'All')
                .map((c) => (
                  <option key={c} value={c} />
                ))}
            </datalist>
          </div>

          {/* Selling Price */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Selling Price (Rs.) *
            </label>
            <input
              type="number"
              step="any"
              min="0"
              name="price"
              value={formData.price}
              onChange={handleChange}
              placeholder="0.00"
              required
              className="w-full px-3 py-2 text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white"
            />
          </div>

          {/* Cost Price */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Cost Price (Rs.)
            </label>
            <input
              type="number"
              step="any"
              min="0"
              name="costPrice"
              value={formData.costPrice}
              onChange={handleChange}
              placeholder="0.00"
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Profit margin live badge */}
        {priceNum > 0 && costNum > 0 && (
          <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
            <span>Profit Margin:</span>
            <span className={profit >= 0 ? 'text-emerald-600' : 'text-red-500'}>
              {formatCurrency(profit)} / unit ({marginPct}%)
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {/* Stock Quantity */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Current Stock Quantity *
            </label>
            <input
              type="number"
              min="0"
              name="stockQuantity"
              value={formData.stockQuantity}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white"
            />
          </div>

          {/* Low Stock Alert Threshold */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Low Stock Alert Limit
            </label>
            <input
              type="number"
              min="0"
              name="lowStockAlert"
              value={formData.lowStockAlert}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Multi-Unit & Wholesale Carton Configuration */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Unit Configuration & Wholesale Pricing
            </span>
            {allowFractionalUnits ? (
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  name="allowFractional"
                  checked={formData.allowFractional}
                  onChange={(e) => setFormData({ ...formData, allowFractional: e.target.checked })}
                  className="w-3.5 h-3.5 text-brand-600 rounded"
                />
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Allow Loose Weight (kg / grams)
                </span>
              </label>
            ) : (
              <div
                className="flex items-center space-x-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800"
                title="Custom Fractional Unit pricing is available on Premium Supermart plan (Rs. 5,500/mo)"
              >
                <Lock className="w-3 h-3" />
                <span>Loose Weight (Premium Plan)</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Base Unit Type
              </label>
              <select
                name="unitType"
                value={formData.unitType}
                onChange={handleChange}
                className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg outline-none font-medium text-slate-900 dark:text-white"
              >
                <option value="piece">Piece (Pcs)</option>
                <option value="kg">Kilogram (Kg)</option>
                <option value="gram">Gram (g)</option>
                <option value="liter">Litre (Ltr)</option>
                <option value="dozen">Dozen (12 pcs)</option>
                <option value="carton">Carton / Box</option>
                <option value="pack">Pack / Bundle</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Carton Pack Size (Units)
              </label>
              <input
                type="number"
                min="1"
                name="cartonSize"
                value={formData.cartonSize}
                onChange={handleChange}
                placeholder="e.g. 12 or 24"
                className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg outline-none text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Carton Wholesale Price (Rs.)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                name="cartonPrice"
                value={formData.cartonPrice}
                onChange={handleChange}
                placeholder="Optional"
                className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg outline-none font-bold text-indigo-600 dark:text-indigo-400"
              />
            </div>
          </div>
        </div>

        {/* Product Image Uploader with Computer File Picker & Preview */}
        <div>
          <ProductImageUploader
            value={imageUrl}
            onChange={(val) => setImageUrl(val)}
            label="Product Image (Local Computer Upload or URL)"
          />
        </div>

        {/* Action Buttons */}
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
            disabled={isSubmitting}
            className="px-5 py-2 text-xs font-extrabold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md transition disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : product ? 'Update Product' : 'Add to Inventory'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ProductModal;
