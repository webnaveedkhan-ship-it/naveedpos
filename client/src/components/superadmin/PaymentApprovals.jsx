import React, { useState } from 'react';
import {
  CreditCard,
  Check,
  X,
  Eye,
  Copy,
  Clock,
  MessageSquare,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

const PaymentApprovals = ({
  payments = [],
  paymentStatusFilter,
  setPaymentStatusFilter,
  onApprovePayment,
  onOpenRejectModal,
  onOpenLightbox,
}) => {
  const [copiedTid, setCopiedTid] = useState('');

  const handleCopyTid = (tid) => {
    if (!tid) return;
    navigator.clipboard.writeText(tid);
    setCopiedTid(tid);
    setTimeout(() => setCopiedTid(''), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header & Status Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <CreditCard className="w-5 h-5 text-brand-400" />
              <span>Pakistani Offline Payment Verification Queue</span>
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-brand-500/20 text-brand-300 border border-brand-500/30">
              Manual Clearing
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Review JazzCash, EasyPaisa, Nayapay, SadaPay, or Bank Transfer slips uploaded by shop owners.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1 bg-slate-800 p-1 rounded-xl border border-slate-700/60 self-start sm:self-auto">
          {['pending', 'approved', 'rejected', 'all'].map((st) => (
            <button
              key={st}
              onClick={() => setPaymentStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg capitalize transition ${
                paymentStatusFilter === st
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Receipts View: Mobile Touch Cards (< md) + Desktop Table (md:) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-md overflow-hidden">
        {/* Mobile View: High-Touch Slip Review Cards */}
        <div className="md:hidden divide-y divide-slate-800/80">
          {payments.length === 0 ? (
            <div className="py-12 text-center text-slate-500 p-4">
              <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
              <p className="font-semibold text-sm">
                No {paymentStatusFilter !== 'all' ? paymentStatusFilter : ''} payment slips found
              </p>
            </div>
          ) : (
            payments.map((p) => (
              <div key={p._id} className="p-4 space-y-3 bg-slate-950/40">
                {/* Store Name, Plan, & Amount */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-black text-white text-sm">{p.tenantName}</h4>
                    <div className="flex items-center space-x-2 mt-0.5">
                      <span className="text-[11px] text-slate-400 font-mono">
                        {p.tenantPhone || 'No Phone'}
                      </span>
                      {p.whatsappUrl && (
                        <a
                          href={p.whatsappUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-400 hover:text-emerald-300 text-[10px] font-bold inline-flex items-center space-x-1"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-black text-emerald-400">
                      Rs. {Number(p.amount || 0).toLocaleString('en-PK')}
                    </span>
                    <span
                      className={`block text-[10px] font-black uppercase mt-0.5 ${
                        p.status === 'approved'
                          ? 'text-emerald-400'
                          : p.status === 'rejected'
                          ? 'text-rose-400'
                          : 'text-amber-400'
                      }`}
                    >
                      ● {p.status}
                    </span>
                  </div>
                </div>

                {/* Method, TID & Screenshot Thumbnail */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                  <div>
                    <div className="font-bold text-slate-200 capitalize">
                      {p.paymentMethod || 'Manual IBFT'}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center space-x-1.5">
                      <span>TID: {p.transactionReference || 'N/A'}</span>
                      {p.transactionReference && (
                        <button
                          type="button"
                          onClick={() => handleCopyTid(p.transactionReference)}
                          className="text-indigo-400 hover:text-indigo-300"
                          title="Copy TID"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    {copiedTid === p.transactionReference && (
                      <span className="text-[10px] text-emerald-400 font-bold">Copied!</span>
                    )}
                  </div>

                  {/* Thumbnail */}
                  {p.receiptImageUrl ? (
                    <button
                      type="button"
                      onClick={() => onOpenLightbox(p.receiptImageUrl)}
                      className="w-14 h-14 rounded-lg bg-slate-800 border border-slate-700 overflow-hidden relative flex-shrink-0 group"
                    >
                      <img
                        src={p.receiptImageUrl}
                        alt="Slip proof"
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-white">
                        <Eye className="w-4 h-4" />
                      </div>
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-500 italic">No image</span>
                  )}
                </div>

                {/* Big Touch Action Buttons for Mobile */}
                {p.status === 'pending' && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => onApprovePayment(p._id)}
                      className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-sm transition flex items-center justify-center space-x-1.5 min-tap active:scale-[0.98]"
                    >
                      <Check className="w-4 h-4" />
                      <span>Approve (+30d)</span>
                    </button>

                    <button
                      onClick={() => onOpenRejectModal(p)}
                      className="py-2.5 px-3 bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border border-rose-800/80 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 min-tap active:scale-[0.98]"
                    >
                      <X className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Desktop View: Full Table (md:block) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-850/80 text-[11px] font-black uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4">Store & Contact</th>
                <th className="py-3.5 px-4">Plan & Cycle</th>
                <th className="py-3.5 px-4">Amount (PKR)</th>
                <th className="py-3.5 px-4">Payment Method</th>
                <th className="py-3.5 px-4">TID / Reference #</th>
                <th className="py-3.5 px-4 text-center">Receipt Screenshot</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Review Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-500">
                    <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                    <p className="font-semibold text-sm">
                      No {paymentStatusFilter !== 'all' ? paymentStatusFilter : ''} payment slips found
                    </p>
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-800/40 transition">
                    {/* Store Name & Contact */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white">{p.tenantName}</div>
                      <div className="flex items-center space-x-2 mt-0.5">
                        <span className="text-[11px] text-slate-400 font-mono">
                          {p.tenantPhone || 'No Phone'}
                        </span>
                        {p.whatsappUrl && (
                          <a
                            href={p.whatsappUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center space-x-1 text-emerald-400 hover:text-emerald-300 text-[10px] font-bold"
                            title="Chat on WhatsApp with Merchant"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>WhatsApp</span>
                          </a>
                        )}
                      </div>
                    </td>

                    {/* Plan Tier & Billing Cycle */}
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-slate-800 text-slate-300 border border-slate-700">
                        {p.plan || 'Standard'}
                      </span>
                      <div className="text-[11px] text-slate-400 mt-1 capitalize">
                        {p.billingCycle === 'yearly' ? 'Annual (365 Days)' : 'Monthly (30 Days)'}
                      </div>
                    </td>

                    {/* Amount in PKR */}
                    <td className="py-3.5 px-4">
                      <div className="text-sm font-black text-brand-400">
                        Rs. {Number(p.amount || 0).toLocaleString('en-PK')}
                      </div>
                    </td>

                    {/* Payment Method Badge */}
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                        {p.paymentMethod || 'BANK_IBFT'}
                      </span>
                    </td>

                    {/* TID / Reference Number */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-slate-200">
                          {p.transactionId || p.referenceNumber || 'N/A'}
                        </span>
                        {(p.transactionId || p.referenceNumber) && (
                          <button
                            onClick={() => handleCopyTid(p.transactionId || p.referenceNumber)}
                            className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition"
                            title="Copy Transaction Reference ID"
                          >
                            {copiedTid === (p.transactionId || p.referenceNumber) ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Screenshot Preview */}
                    <td className="py-3.5 px-4 text-center">
                      {p.receiptImageUrl ? (
                        <button
                          type="button"
                          onClick={() => onOpenLightbox(p.receiptImageUrl)}
                          className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition border border-slate-700"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-400" />
                          <span>View Proof</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-500">No Image</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                          p.status === 'approved'
                            ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                            : p.status === 'rejected'
                            ? 'bg-red-950/60 text-red-300 border border-red-800'
                            : 'bg-amber-950/60 text-amber-300 border border-amber-800 animate-pulse'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>

                    {/* Review Actions */}
                    <td className="py-3.5 px-4 text-right">
                      {p.status === 'pending' ? (
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* 1-Click Approve */}
                          <button
                            onClick={() => onApprovePayment(p._id)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center space-x-1"
                            title="Approve Payment & Shift Expiry +30 Days"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>

                          {/* Reject with Note */}
                          <button
                            onClick={() => onOpenRejectModal(p)}
                            className="px-2.5 py-1.5 bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-800 rounded-lg text-xs font-bold transition"
                            title="Reject Payment Proof with Reason Note"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-500 italic">
                          {p.status === 'approved' ? 'Verified' : 'Rejected'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PaymentApprovals;
