import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Camera } from 'lucide-react';

const DEFAULT_PLACEHOLDER =
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop';

const ProductImageUploader = ({ value, onChange, label = 'Product Image' }) => {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPG, PNG, WEBP, etc.)');
      return;
    }

    // Read file as Base64 data URL for instant client-side rendering & upload persistence
    const reader = new FileReader();
    reader.onload = (e) => {
      if (onChange) {
        onChange(e.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const onDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const onDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const clearImage = (e) => {
    e.stopPropagation();
    if (onChange) {
      onChange('');
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const previewSrc = value || DEFAULT_PLACEHOLDER;
  const isCustomImage = !!value;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
          {label}
        </label>
        {isCustomImage && (
          <button
            type="button"
            onClick={clearImage}
            className="text-[11px] font-semibold text-red-500 hover:text-red-700 flex items-center gap-0.5"
          >
            <X className="w-3 h-3" />
            <span>Remove</span>
          </button>
        )}
      </div>

      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-3 text-center cursor-pointer transition flex flex-col sm:flex-row items-center gap-3.5 ${
          dragActive
            ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/20'
            : 'border-slate-300 dark:border-slate-700 hover:border-brand-500 bg-slate-50 dark:bg-slate-800/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              handleFileChange(e.target.files[0]);
            }
          }}
          className="hidden"
        />

        {/* Thumbnail Preview */}
        <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-700 flex-shrink-0 border border-slate-200 dark:border-slate-700 shadow-xs">
          <img
            src={previewSrc}
            alt="Preview"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = DEFAULT_PLACEHOLDER;
            }}
          />
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition text-white">
            <Camera className="w-5 h-5" />
          </div>
        </div>

        {/* Upload Instruction */}
        <div className="text-left flex-1 min-w-0">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
            <Upload className="w-3.5 h-3.5 text-brand-600" />
            <span>Upload from Computer</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Click to browse files or drag and drop image here
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Supports JPG, PNG, WEBP (instant local preview & cloud ready)
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProductImageUploader;
