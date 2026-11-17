import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import ProductImageUploader from '../common/ProductImageUploader';
import { formatCurrency } from '../../utils/currency';
import { useAuth } from '../../context/AuthContext';
import {
  AlertCircle,
  Percent,
  DollarSign,
  Lock,
  Plus,
  Trash2,
  Layers,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';

const INDUSTRY_PRESETS = [
  { id: 'GENERAL_STORE', label: 'General Store', icon: '🏬', defaultCat: 'General Retail' },
  { id: 'FOOTWEAR', label: 'Shoes / Footwear', icon: '👟', defaultCat: 'Footwear' },
  { id: 'GARMENTS', label: 'Garments & Apparel', icon: '👕', defaultCat: 'Garments' },
  { id: 'PERFUME', label: 'Perfumes & Scents', icon: '🧴', defaultCat: 'Fragrances' },
];

const VARIANT_PRESETS = {
  FOOTWEAR: {
    sizes: ['6', '7', '8', '9', '10', '11', '40', '41', '42', '43', '44'],
    colors: ['Black', 'Brown', 'Tan', 'White', 'Navy'],
    sizeLabel: 'Shoe Size',
  },
  GARMENTS: {
    sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'],
    colors: ['Black', 'White', 'Navy', 'Grey', 'Red', 'Blue'],
    sizeLabel: 'Garment Size',
  },
  PERFUME: {
    sizes: ['30ml', '50ml', '100ml', '125ml', '200ml'],
    colors: ['EDP', 'EDT', 'Parfum', 'Attar / Oil', 'Body Spray'],
    sizeLabel: 'Bottle Volume',
    colorLabel: 'Fragrance Type',
  },
  GENERAL_STORE: {
    sizes: ['Small', 'Medium', 'Large', 'Family Pack', '1kg', '5kg'],
    colors: ['Standard', 'Red', 'Blue', 'Green'],
    sizeLabel: 'Size / Pack',
  },
};

const ProductModal = ({ isOpen, onClose, onSave, product, categories = [] }) => {
  const { planLimits } = useAuth();
  const allowFractionalUnits = planLimits?.allowFractionalUnits ?? true;

  const [formData, setFormData] = useState({
    title: '',
    name: '',
    sku: '',
    barcode: '',
    category: '',
    price: '',
    salePrice: '',
    costPrice: '',
    stockQuantity: '',
    stock: '',
    lowStockAlert: '5',
    minStockAlert: '5',
    businessType: 'GENERAL_STORE',
    unitType: 'piece',
    allowFractional: false,
    cartonSize: '1',
    cartonPrice: '',
    description: '',
  });

  const [variants, setVariants] = useState([]);
  const [newVariant, setNewVariant] = useState({
    size: '',
    color: '',
    sku: '',
    price: '',
    stockQuantity: '',
  });
  const [showVariantSection, setShowVariantSection] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (product) {
      const bType = (product.businessType || 'GENERAL_STORE').toUpperCase();
      const prodTitle = product.name || product.title || '';
      const prodBarcode = product.barcode || product.sku || '';
      const prodPrice = (product.salePrice ?? product.price ?? '')?.toString();
      const prodStock = (product.stock ?? product.stockQuantity ?? '')?.toString();
      const prodAlert = (product.minStockAlert ?? product.lowStockAlert ?? product.lowStockThreshold ?? '5')?.toString();

      setFormData({
        title: prodTitle,
        name: prodTitle,
        sku: prodBarcode,
        barcode: prodBarcode,
        category: product.category || '',
        price: prodPrice,
        salePrice: prodPrice,
        costPrice: product.costPrice?.toString() || '',
        stockQuantity: prodStock,
        stock: prodStock,
        lowStockAlert: prodAlert,
        minStockAlert: prodAlert,
        businessType: bType,
        unitType: product.unitType || 'piece',
        allowFractional: Boolean(product.allowFractional),
        cartonSize: product.cartonSize?.toString() || '1',
        cartonPrice: product.cartonPrice?.toString() || '',
        description: product.description || '',
      });

      const prodVariants = Array.isArray(product.variants) ? product.variants : [];
      setVariants(prodVariants);
      setShowVariantSection(prodVariants.length > 0 || ['FOOTWEAR', 'GARMENTS', 'PERFUME'].includes(bType));
      setImageUrl(product.image || product.imageUrl || '');
    } else {
      setFormData({
        title: '',
        name: '',
        sku: '',
        barcode: '',
        category: Array.isArray(categories) && categories.length > 0 && categories[0] !== 'All' ? categories[0] : 'General Retail',
        price: '',
        salePrice: '',
        costPrice: '',
        stockQuantity: '10',
        stock: '10',
        lowStockAlert: '5',
        minStockAlert: '5',
        businessType: 'GENERAL_STORE',
        unitType: 'piece',
        allowFractional: false,
        cartonSize: '1',
        cartonPrice: '',
        description: '',
      });
      setVariants([]);
      setShowVariantSection(false);
      setImageUrl('');
    }
    setNewVariant({ size: '', color: '', sku: '', price: '', stockQuantity: '' });
    setErrorMsg('');
  }, [product, isOpen, categories]);

  const priceNum = parseFloat(formData.price || formData.salePrice) || 0;
  const costNum = parseFloat(formData.costPrice) || 0;
  const profit = priceNum - costNum;
  const marginPct = priceNum > 0 ? ((profit / priceNum) * 100).toFixed(1) : 0;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'title') next.name = value;
      if (name === 'name') next.title = value;
      if (name === 'sku') next.barcode = value;
      if (name === 'barcode') next.sku = value;
      if (name === 'price') next.salePrice = value;
      if (name === 'salePrice') next.price = value;
      if (name === 'stockQuantity') next.stock = value;
      if (name === 'stock') next.stockQuantity = value;
      if (name === 'lowStockAlert') next.minStockAlert = value;
      if (name === 'minStockAlert') next.lowStockAlert = value;
      return next;
    });
  };

  const handleSelectIndustry = (type) => {
    const preset = INDUSTRY_PRESETS.find((p) => p.id === type);
    setFormData((prev) => ({
      ...prev,
      businessType: type,
      category: prev.category === 'General Retail' || !prev.category ? (preset?.defaultCat || 'General') : prev.category,
    }));
    if (['FOOTWEAR', 'GARMENTS', 'PERFUME'].includes(type)) {
      setShowVariantSection(true);
    }
  };

  const handleAddVariant = () => {
    if (!newVariant.size && !newVariant.color) {
      setErrorMsg('Please specify at least a size or color/type for this variant.');
      return;
    }
    setErrorMsg('');
    const cleanSize = (newVariant.size || '').trim();
    const cleanColor = (newVariant.color || '').trim();
    const baseSku = formData.sku || formData.barcode || 'ITM';
    const autoSku =
      newVariant.sku.trim() ||
      `${baseSku}-${cleanSize}-${cleanColor}`.replace(/[^a-zA-Z0-9-]/g, '-').toUpperCase();

    const varStock = newVariant.stockQuantity ? Number(newVariant.stockQuantity) : Number(formData.stockQuantity || 10);
    const varPrice = newVariant.price ? Number(newVariant.price) : Number(formData.price || 0);

    setVariants((prev) => [
      ...prev,
      {
        size: cleanSize,
        color: cleanColor,
        sku: autoSku.toUpperCase(),
        stock: varStock,
        stockQuantity: varStock,
        price: varPrice,
        salePrice: varPrice,
        costPrice: Number(formData.costPrice || 0),
      },
    ]);

    setNewVariant({ size: '', color: '', sku: '', price: '', stockQuantity: '' });
  };

  const handleRemoveVariant = (index) => {
    setVariants((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const titleVal = formData.title || formData.name;
    const skuVal = formData.sku || formData.barcode;
    const priceVal = formData.price || formData.salePrice;

    if (!titleVal || !skuVal || !formData.category || !priceVal) {
      setErrorMsg('Please fill in all required fields (Product Name, SKU/Barcode, Category, Price).');
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
      data.append('variants', JSON.stringify(variants));

      await onSave(data, product?._id);
      onClose();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to save product. Ensure SKU/Barcode is unique.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentPresets = VARIANT_PRESETS[formData.businessType] || VARIANT_PRESETS.GENERAL_STORE;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={product ? 'Edit Product' : 'Add New Inventory Item'}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl flex items-center text-xs text-red-700 dark:text-red-300 font-medium">
            <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Multi-Industry Business Selector Tabs */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Industry / Store Category
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {INDUSTRY_PRESETS.map((preset) => {
              const active = formData.businessType === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectIndustry(preset.id)}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center space-x-2 ${
                    active
                      ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400 ring-2 ring-brand-500/30'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <span className="text-base">{preset.icon}</span>
                  <span className="truncate">{preset.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Product Name / Title */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Product Name *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder={
                formData.businessType === 'FOOTWEAR'
                  ? 'e.g. Leather Oxford Shoes'
                  : formData.businessType === 'GARMENTS'
                  ? 'e.g. Cotton Polo T-Shirt'
                  : formData.businessType === 'PERFUME'
                  ? 'e.g. Oudh Al-Mubarak EDP 100ml'
                  : 'e.g. Tapal Danedar Tea 450g'
              }
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
              placeholder="e.g. FTW-1001 or 89640001"
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
              placeholder="e.g. Men Shoes, Fragrances, Dairy"
              required
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white"
            />
            <datalist id="category-suggestions">
              {(categories || [])
                .filter((c) => c && c !== 'All')
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

        {/* Profit margin live preview */}
        {priceNum > 0 && costNum > 0 && (
          <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
            <span>Profit Margin:</span>
            <span className={profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}>
              {formatCurrency(profit)} / unit ({marginPct}%)
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {/* Stock Quantity */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Total Stock Quantity *
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
              value={formData.lowStockAlert ?? '5'}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Dynamic Multi-Variant Section (Footwear Sizes, Garment Fits, Perfumes) */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <Layers className="w-4 h-4 text-brand-500" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Industry Variants ({currentPresets.sizeLabel} &amp; {currentPresets.colorLabel || 'Color'})
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowVariantSection(!showVariantSection)}
              className="text-[11px] font-bold text-brand-600 dark:text-brand-400 hover:underline"
            >
              {showVariantSection ? 'Hide Variants' : `+ Manage Variants (${variants.length})`}
            </button>
          </div>

          {showVariantSection && (
            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              {/* Quick Helper Preset Pills */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Quick Sizes:</span>
                  {currentPresets.sizes.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setNewVariant((v) => ({ ...v, size: s }))}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold border transition ${
                        newVariant.size === s
                          ? 'bg-brand-600 text-white border-brand-600'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-brand-500'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Quick Colors/Types:</span>
                  {currentPresets.colors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewVariant((v) => ({ ...v, color: c }))}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold border transition ${
                        newVariant.color === c
                          ? 'bg-brand-600 text-white border-brand-600'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-brand-500'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Add Variant Form Inputs */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">
                    {currentPresets.sizeLabel}
                  </label>
                  <input
                    type="text"
                    value={newVariant.size}
                    onChange={(e) => setNewVariant({ ...newVariant, size: e.target.value })}
                    placeholder="e.g. 42 or XL"
                    className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">
                    {currentPresets.colorLabel || 'Color'}
                  </label>
                  <input
                    type="text"
                    value={newVariant.color}
                    onChange={(e) => setNewVariant({ ...newVariant, color: e.target.value })}
                    placeholder="e.g. Black"
                    className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">
                    Variant Price (Rs.)
                  </label>
                  <input
                    type="number"
                    value={newVariant.price}
                    onChange={(e) => setNewVariant({ ...newVariant, price: e.target.value })}
                    placeholder={formData.price || 'Price'}
                    className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none text-slate-900 dark:text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">
                    Stock
                  </label>
                  <input
                    type="number"
                    value={newVariant.stockQuantity}
                    onChange={(e) => setNewVariant({ ...newVariant, stockQuantity: e.target.value })}
                    placeholder="10"
                    className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none text-slate-900 dark:text-white"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1 flex items-end">
                  <button
                    type="button"
                    onClick={handleAddVariant}
                    className="w-full py-1.5 px-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-lg transition flex items-center justify-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Variant</span>
                  </button>
                </div>
              </div>

              {/* Render Existing Variants */}
              {variants.length > 0 && (
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {variants.map((v, idx) => {
                    const vStock = v.stock !== undefined ? v.stock : v.stockQuantity;
                    const vPrice = v.salePrice !== undefined ? v.salePrice : (v.price || formData.price);
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {v.size ? `Size: ${v.size}` : ''}
                          </span>
                          {v.color && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-[10px] text-slate-600 dark:text-slate-300 font-semibold">
                              {v.color}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 font-mono">
                            {v.sku}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(vPrice)}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ({vStock} in stock)
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveVariant(idx)}
                            className="p-1 text-slate-400 hover:text-red-500 rounded transition"
                            title="Remove variant"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Wholesale Carton Pack Configuration */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Wholesale &amp; Unit Options
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
                title="Custom Fractional Unit pricing is available on Premium Supermart plan"
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
                Carton Pack Size
              </label>
              <input
                type="number"
                min="1"
                name="cartonSize"
                value={formData.cartonSize}
                onChange={handleChange}
                placeholder="e.g. 12"
                className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg outline-none text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Wholesale Price (Rs.)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                name="cartonPrice"
                value={formData.cartonPrice}
                onChange={handleChange}
                placeholder="Optional"
                className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg outline-none font-bold text-brand-600 dark:text-brand-400"
              />
            </div>
          </div>
        </div>

        {/* Product Image Uploader */}
        <div>
          <ProductImageUploader
            value={imageUrl}
            onChange={(val) => setImageUrl(val)}
            label="Product Image (Upload or Image URL)"
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
