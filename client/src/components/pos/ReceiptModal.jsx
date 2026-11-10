import React, { useState } from 'react';
import Modal from '../common/Modal';
import { formatCurrency, CURRENCY_SYMBOL } from '../../utils/currency';
import { useAuth } from '../../context/AuthContext';
import { Printer, CheckCircle2, RotateCcw, MessageSquare, Send, Smartphone, Lock } from 'lucide-react';
import { getWhatsAppReceiptUrl, normalizeWhatsAppPhone } from '../../utils/whatsapp';

const formatReceiptDate = (dateVal) => {
  const d = new Date(dateVal || Date.now());
  const day = String(d.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12 || 12;
  return `${day}-${month}-${year} ${hours}:${minutes} ${ampm}`;
};

const ReceiptModal = ({ isOpen, onClose, order }) => {
  const { tenantName, planLimits } = useAuth();
  const [customPhone, setCustomPhone] = useState('');
  const [showPhoneInput, setShowPhoneInput] = useState(false);

  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const storeName = order.tenantName || tenantName || 'NORMEGA MART';
  const isKhata = order.paymentMethod?.toUpperCase() === 'KHATA';
  const paymentModeText = order.paymentMethod?.toUpperCase() || 'CASH';

  const defaultPhone = order.customer?.phone || '';
  const effectivePhone = customPhone || defaultPhone;
  const normalizedPhone = normalizeWhatsAppPhone(effectivePhone);

  const handleShareWhatsApp = (e) => {
    e.preventDefault();
    if (!effectivePhone && !showPhoneInput) {
      setShowPhoneInput(true);
      return;
    }
    const url = getWhatsAppReceiptUrl(order, storeName, effectivePhone);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Receipt & Sale Complete" maxWidth="max-w-md">
      <div className="space-y-4">
        {/* Success Banner (Hidden during print) */}
        <div className="no-print bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 p-3 rounded-xl flex items-center space-x-2.5 text-xs text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span className="font-semibold">
            Order <span className="font-mono">{order.orderNumber}</span> recorded successfully.
          </span>
        </div>

        {/* 80mm Clean Thermal Receipt Layout */}
        <div
          id="thermal-receipt-print"
          className="bg-white p-5 border border-dashed border-slate-300 rounded-xl font-mono text-xs text-black shadow-inner leading-relaxed select-text"
          style={{ width: '100%', maxWidth: '340px', margin: '0 auto' }}
        >
          {/* Header */}
          <div className="text-center pb-2">
            <h2 className="text-base font-extrabold tracking-wider uppercase text-black">
              {storeName}
            </h2>
            <p className="text-[11px] text-black">Retail Point of Sale & Khata System</p>
            <p className="text-[11px] text-black">Pakistan • Official Sales Invoice</p>
          </div>

          <div className="text-[11px] py-1 border-t border-dashed border-black">
            <div className="flex justify-between">
              <span>Receipt :</span>
              <span className="font-bold">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Date    :</span>
              <span>{formatReceiptDate(order.createdAt)}</span>
            </div>
            {order.customer?.name && (
              <div className="flex justify-between">
                <span>Customer:</span>
                <span className="font-semibold">{order.customer.name}</span>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="text-[10px] text-black overflow-hidden whitespace-nowrap">
            ----------------------------------------
          </div>

          {/* Items Header */}
          <div className="flex justify-between text-[11px] font-bold py-0.5">
            <span className="w-5/12">Item</span>
            <span className="w-2/12 text-center">Qty</span>
            <span className="w-2/12 text-right">Price</span>
            <span className="w-3/12 text-right">Total</span>
          </div>

          <div className="text-[10px] text-black overflow-hidden whitespace-nowrap">
            ----------------------------------------
          </div>

          {/* Item Rows */}
          <div className="py-1 space-y-1">
            {order.items?.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start text-[11px]">
                <div className="w-5/12 pr-1">
                  <div className="font-semibold leading-tight line-clamp-1">{item.title}</div>
                  <div className="text-[9px] text-neutral-600">{item.sku}</div>
                </div>
                <div className="w-2/12 text-center">{item.quantity}</div>
                <div className="w-2/12 text-right">{item.price}</div>
                <div className="w-3/12 text-right font-bold">{item.subtotal}</div>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="text-[10px] text-black overflow-hidden whitespace-nowrap">
            ----------------------------------------
          </div>

          {/* Totals Section (Zero Sales Tax / GST) */}
          <div className="py-1 space-y-0.5 text-[11px]">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>

            {order.discountAmount > 0 && (
              <div className="flex justify-between">
                <span>Discount:</span>
                <span>-{formatCurrency(order.discountAmount)}</span>
              </div>
            )}

            <div className="flex justify-between font-extrabold text-sm pt-1 border-t border-dashed border-black">
              <span>Grand Total:</span>
              <span>{formatCurrency(order.grandTotal)}</span>
            </div>

            <div className="flex justify-between font-bold pt-1">
              <span>Payment Mode:</span>
              <span>{paymentModeText}</span>
            </div>

            {/* Cash Tendered & Change */}
            {order.paymentMethod?.toLowerCase() === 'cash' && order.paymentDetails?.cashTendered > 0 && (
              <>
                <div className="flex justify-between text-[10px]">
                  <span>Cash Tendered:</span>
                  <span>{formatCurrency(order.paymentDetails.cashTendered)}</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold">
                  <span>Change Given:</span>
                  <span>{formatCurrency(order.paymentDetails.changeGiven || 0)}</span>
                </div>
              </>
            )}

            {/* Khata / Udhar Ledger Details */}
            {isKhata && (
              <div className="mt-1 pt-1 border-t border-dashed border-black text-[10px] space-y-0.5">
                <div className="flex justify-between font-bold">
                  <span>UDHAR ADDED:</span>
                  <span>{formatCurrency(order.grandTotal)}</span>
                </div>
                {order.paymentDetails?.balanceAfter !== undefined && (
                  <div className="flex justify-between font-black text-[11px]">
                    <span>TOTAL BALANCE OWED:</span>
                    <span>{formatCurrency(order.paymentDetails.balanceAfter)}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="text-[10px] text-black overflow-hidden whitespace-nowrap">
            ----------------------------------------
          </div>

          {/* Footer */}
          <div className="text-center pt-1 space-y-0.5 text-[10px]">
            <p className="font-semibold uppercase">Thank you for shopping at {storeName}!</p>
            <p className="text-[9px]">Software Powered by NaveedPOS</p>
          </div>
        </div>

        {/* WhatsApp Receipt Quick-Share (Hidden during print) */}
        {!planLimits?.allowWhatsApp ? (
          <div className="no-print bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-3 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400">
              <Lock className="w-4 h-4 text-slate-400" />
              <span>WhatsApp Digital Receipts</span>
            </div>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
              Standard & Premium Feature
            </span>
          </div>
        ) : (
          <div className="no-print bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 p-3 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Share Receipt via WhatsApp</span>
              </div>
              {defaultPhone ? (
                <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
                  {defaultPhone}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowPhoneInput(!showPhoneInput)}
                  className="text-[11px] text-emerald-700 dark:text-emerald-400 hover:underline font-semibold"
                >
                  {showPhoneInput ? 'Cancel' : '+ Add Number'}
                </button>
              )}
            </div>

            {(showPhoneInput || !defaultPhone) && (
              <div className="flex items-center space-x-2 pt-1">
                <div className="relative flex-1">
                  <Smartphone className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    value={customPhone}
                    onChange={(e) => setCustomPhone(e.target.value)}
                    placeholder="e.g. 0300 1234567"
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-lg outline-none font-mono"
                  />
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center space-x-2 transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>
                {normalizedPhone ? `Send Receipt to WhatsApp (${normalizedPhone})` : 'Open in WhatsApp'}
              </span>
            </button>
          </div>
        )}

        {/* Modal Action Buttons (Hidden when printing) */}
        <div className="no-print pt-1 flex items-center space-x-3">
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center space-x-2 transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print 80mm Receipt</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="py-3 px-4 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center space-x-2 transition"
          >
            <RotateCcw className="w-4 h-4" />
            <span>New Sale</span>
          </button>
        </div>

        {/* 80mm Thermal Receipt Print Rules */}
        <style>{`
          @media print {
            @page {
              margin: 0;
              size: 80mm auto;
            }

            body * {
              visibility: hidden;
            }

            #thermal-receipt-print,
            #thermal-receipt-print * {
              visibility: visible;
            }

            #thermal-receipt-print {
              position: absolute;
              left: 0;
              top: 0;
              width: 80mm;
              margin: 0;
              padding: 10px;
              background-color: #ffffff !important;
              color: #000000 !important;
              font-family: 'Courier New', Courier, monospace;
              font-size: 12px;
              line-height: 1.25;
            }

            /* Force light colors and pure black text on thermal output */
            .no-print {
              display: none !important;
            }
          }
        `}</style>
      </div>
    </Modal>
  );
};

export default ReceiptModal;