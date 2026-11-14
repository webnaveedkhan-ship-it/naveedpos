import React, { useState } from 'react';
import {
  Printer,
  MessageSquare,
  Check,
  Copy,
  X,
  Receipt,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  Store,
} from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import { getWhatsAppKhataReceiptUrl } from '../../utils/whatsapp';

export default function KhataReceiptModal({ isOpen, onClose, receipt }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !receipt) return null;

  const isPayment =
    receipt.type === 'PAYMENT_RECEIVED' ||
    receipt.type === 'WASOOLI' ||
    receipt.type === 'PAYMENT';

  const titleBadge = isPayment ? 'WASOOLI RECEIPT (رسید وصولی)' : 'UDHAR PARCHI (ادھار پرچی)';
  const amountLabel = isPayment ? 'Amount Wasool Shuda (Received)' : 'Naya Udhar (Credit Given)';
  const amountColor = isPayment ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400';
  const badgeBg = isPayment
    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
    : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-800';

  const dateStr = receipt.date
    ? new Date(receipt.date).toLocaleString('en-PK', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : new Date().toLocaleString('en-PK');

  const receiptNumber =
    receipt.receiptNumber ||
    receipt.orderNumber ||
    `REC-${Date.now().toString().slice(-6)}`;

  const storeName = receipt.storeName || 'NaveedPOS Retail Mart';

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsApp = () => {
    const url = getWhatsAppKhataReceiptUrl(
      {
        ...receipt,
        receiptNumber,
      },
      storeName
    );
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCopy = () => {
    const text = `*${storeName}* - ${titleBadge}\nReceipt #: ${receiptNumber}\nDate: ${dateStr}\nCustomer: ${receipt.customerName || 'Valued Customer'} (${receipt.customerPhone || 'N/A'})\n${amountLabel}: Rs. ${Number(receipt.amount || 0).toLocaleString()}\nPichla Baqaya: Rs. ${Number(receipt.previousDebt || 0).toLocaleString()}\n*NAYA BAQAYA: Rs. ${Number(receipt.balanceAfter ?? receipt.currentDebt ?? 0).toLocaleString()}*`;
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/75 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[95vh]">
        {/* Top Header Actions */}
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-850/80">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400">
              <Receipt className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-xs text-slate-800 dark:text-slate-100 tracking-tight">
              Digital Khata Receipt
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Thermal Receipt Container */}
        <div className="p-5 overflow-y-auto space-y-4 print:p-0 print:m-0 print:border-none print:shadow-none bg-slate-50/40 dark:bg-slate-900/40">
          {/* 80mm Thermal Paper Simulation Card */}
          <div
            id="khata-printable-slip"
            className="bg-white dark:bg-slate-950 p-5 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 shadow-xs space-y-4 text-center font-sans print:border-none"
          >
            {/* Store Branding */}
            <div>
              <div className="flex items-center justify-center gap-1.5 text-slate-700 dark:text-slate-300 mb-1">
                <Store className="w-4 h-4 text-brand-600" />
                <h3 className="font-black text-sm uppercase tracking-wide text-slate-900 dark:text-white">
                  {storeName}
                </h3>
              </div>
              <p className="text-[10px] text-slate-500 font-mono">
                Multi-Tenant Retail Counter & Khata System
              </p>
            </div>

            {/* Receipt Type Pill */}
            <div className="flex justify-center">
              <span
                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${badgeBg}`}
              >
                {titleBadge}
              </span>
            </div>

            {/* Meta Information Bar */}
            <div className="border-t border-b border-dashed border-slate-200 dark:border-slate-800 py-2.5 text-left text-[11px] space-y-1">
              <div className="flex justify-between text-slate-500">
                <span>Receipt No:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  #{receiptNumber}
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Date & Time:</span>
                <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                  {dateStr}
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Customer:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {receipt.customerName || 'Valued Customer'}
                </span>
              </div>
              {receipt.customerPhone && (
                <div className="flex justify-between text-slate-500">
                  <span>Phone:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">
                    {receipt.customerPhone}
                  </span>
                </div>
              )}
            </div>

            {/* Financial Ledger Calculation Box */}
            <div className="bg-slate-50 dark:bg-slate-900/90 rounded-xl p-3.5 border border-slate-200/70 dark:border-slate-800 space-y-2 text-left text-xs">
              {receipt.previousDebt !== undefined && (
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>Pichla Baqaya (Previous Due):</span>
                  <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                    {formatCurrency(receipt.previousDebt || 0)}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center py-1.5 border-t border-dashed border-slate-200 dark:border-slate-800">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  {isPayment ? (
                    <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
                  )}
                  <span>{amountLabel}:</span>
                </span>
                <span className={`text-base font-black font-mono ${amountColor}`}>
                  {formatCurrency(receipt.amount || 0)}
                </span>
              </div>

              {isPayment && receipt.paymentMethod && (
                <div className="flex justify-between text-slate-500 text-[10px]">
                  <span>Payment Mode:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300 uppercase">
                    {receipt.paymentMethod}
                  </span>
                </div>
              )}

              {receipt.notes && (
                <div className="pt-1 text-[11px] text-slate-600 dark:text-slate-400 italic">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Note:</span>{' '}
                  {receipt.notes}
                </div>
              )}

              {/* Outstanding Balance Highlight */}
              <div className="pt-2 border-t-2 border-slate-900 dark:border-slate-700 flex justify-between items-baseline">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Naya Baqaya (Current Balance)
                  </div>
                  <div className="text-[10px] text-slate-400">Total remaining debt</div>
                </div>
                <div className="text-xl font-black font-mono text-slate-900 dark:text-white">
                  {formatCurrency(receipt.balanceAfter ?? receipt.currentDebt ?? 0)}
                </div>
              </div>
            </div>

            {/* Footer / Verification Stamp */}
            <div className="pt-2 text-center text-[10px] text-slate-400 space-y-1">
              <div className="flex items-center justify-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified by Store Cashier / Operator</span>
              </div>
              <p>JazakAllah Khair for your timely business cooperation!</p>
              <div className="text-[9px] font-mono text-slate-400 pt-1">
                Generated via NaveedPOS Khata Engine
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            {/* 1-Tap WhatsApp Receipt Share */}
            <button
              type="button"
              onClick={handleWhatsApp}
              className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-sm active:scale-95"
              title="Send WhatsApp Receipt to Customer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Send WhatsApp</span>
            </button>

            {/* 80mm Thermal Print */}
            <button
              type="button"
              onClick={handlePrint}
              className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-sm active:scale-95"
              title="Print 80mm Thermal Receipt"
            >
              <Printer className="w-4 h-4" />
              <span>Print Slip</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition flex items-center justify-center space-x-1.5 active:scale-95"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied Slip!' : 'Copy Summary'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="py-2 px-3 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold transition active:scale-95"
            >
              Done / Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
