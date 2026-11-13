import React, { useState, useEffect, useCallback } from 'react';
import { orderService } from '../services/api';
import { formatCurrency } from '../utils/currency';
import ReceiptModal from '../components/pos/ReceiptModal';
import {
  Receipt,
  Search,
  Calendar,
  Printer,
  Banknote,
  CreditCard,
  Split,
  Eye,
} from 'lucide-react';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);

  // Selected Order for Receipt Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 15,
        search: searchTerm,
        paymentMethod: paymentFilter !== 'all' ? paymentFilter : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };

      const res = await orderService.getOrders(params);
      if (res.data.success) {
        setOrders(res.data.orders);
        setTotalPages(res.data.totalPages);
        setTotalOrders(res.data.total);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, paymentFilter, startDate, endDate]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleViewReceipt = (order) => {
    setSelectedOrder(order);
    setIsReceiptOpen(true);
  };

  const getPaymentIcon = (method) => {
    switch (method) {
      case 'cash':
        return <Banknote className="w-3.5 h-3.5 text-emerald-600 mr-1" />;
      case 'card':
        return <CreditCard className="w-3.5 h-3.5 text-blue-600 mr-1" />;
      case 'split':
        return <Split className="w-3.5 h-3.5 text-purple-600 mr-1" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 p-3 sm:p-6 overflow-y-auto bg-slate-50 dark:bg-slate-950 animate-fadeIn">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Receipt className="w-6 h-6 text-brand-600" />
          Orders & Transactions Log
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Historical sales log, cashier records, and thermal receipt reprints ({totalOrders} completed transactions)
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xs mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search by Order # */}
        <div className="relative">
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
            placeholder="Search Order # (e.g. NPOS-...)"
            className="w-full min-h-[44px] pl-9 pr-3 py-2 text-base sm:text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white"
          />
        </div>

        {/* Payment Method Filter */}
        <div>
          <select
            value={paymentFilter}
            onChange={(e) => {
              setPaymentFilter(e.target.value);
              setPage(1);
            }}
            className="w-full min-h-[44px] px-3 py-2 text-base sm:text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white"
          >
            <option value="all">All Payment Methods</option>
            <option value="cash">Cash Only</option>
            <option value="card">Card Only</option>
            <option value="split">Split Payment Only</option>
          </select>
        </div>

        {/* Start Date */}
        <div className="relative">
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
            className="w-full min-h-[44px] px-3 py-2 text-base sm:text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white"
          />
        </div>

        {/* End Date */}
        <div className="relative">
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
            className="w-full min-h-[44px] px-3 py-2 text-base sm:text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Orders Table Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        {/* Mobile View: High-Touch Transaction Cards (< md) */}
        <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {loading ? (
            <div className="py-12 text-center text-slate-400">
              <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading orders history...
            </div>
          ) : orders.length === 0 ? (
            <div className="py-12 text-center text-slate-400 p-4">
              No orders match your filter criteria.
            </div>
          ) : (
            orders.map((ord) => (
              <div key={ord._id} className="p-3.5 space-y-2.5 bg-slate-50/50 dark:bg-slate-950/40">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-mono font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                      {ord.orderNumber}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {new Date(ord.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-black text-slate-900 dark:text-white">
                      {formatCurrency(ord.grandTotal)}
                    </div>
                    <span className="inline-flex items-center text-[10px] font-bold capitalize text-slate-600 dark:text-slate-400">
                      {getPaymentIcon(ord.paymentMethod)}
                      {ord.paymentMethod}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-200/60 dark:border-slate-800/80">
                  <div className="truncate mr-2">
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {ord.customer?.name || 'Walk-in'}
                    </span>
                    <span className="mx-1">•</span>
                    <span>
                      {ord.items && ord.items.length > 0
                        ? `${ord.items.reduce((sum, i) => sum + (Number(i.quantity) || 1), 0)} items`
                        : `${ord.itemsCount || 1} items`}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleViewReceipt(ord)}
                    className="min-h-[38px] px-3 py-1.5 bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/40 dark:hover:bg-brand-900/40 text-brand-700 dark:text-brand-300 font-bold text-xs rounded-xl shadow-2xs active:scale-[0.97] transition flex items-center space-x-1 flex-shrink-0"
                    title="View & Print Receipt"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Receipt</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View: Full Data Table (hidden on mobile, visible md:block) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
              <tr>
                <th className="py-3.5 px-4">Receipt #</th>
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4">Cashier</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Items Count</th>
                <th className="py-3.5 px-4">Payment</th>
                <th className="py-3.5 px-4">Total Amount</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading orders history...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    No orders match your filter criteria.
                  </td>
                </tr>
              ) : (
                orders.map((ord) => (
                  <tr
                    key={ord._id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-850/60 transition"
                  >
                    {/* Order # */}
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {ord.orderNumber}
                    </td>

                    {/* Date/Time */}
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(ord.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    {/* Cashier */}
                    <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                      {ord.cashierName || ord.cashier?.name || 'Staff'}
                    </td>

                    {/* Customer */}
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {ord.customer?.name || 'Walk-in'}
                    </td>

                    {/* Items */}
                    <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                      {ord.items && ord.items.length > 0
                        ? `${ord.items.reduce((sum, i) => sum + (Number(i.quantity) || 1), 0)} units (${ord.items.length} sku)`
                        : `${ord.itemsCount || 1} items`}
                    </td>

                    {/* Payment Method */}
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center text-xs font-semibold capitalize">
                        {getPaymentIcon(ord.paymentMethod)}
                        {ord.paymentMethod}
                      </span>
                    </td>

                    {/* Grand Total */}
                    <td className="py-3 px-4 font-extrabold text-slate-900 dark:text-white">
                      {formatCurrency(ord.grandTotal)}
                    </td>

                    {/* Action: View Receipt */}
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleViewReceipt(ord)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition"
                        title="View and reprint thermal receipt"
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-500 mr-1" />
                        <span>Receipt</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>
              Page {page} of {totalPages} ({totalOrders} orders)
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

      {/* Receipt Modal for Viewing / Printing */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        order={selectedOrder}
      />
    </div>
  );
};

export default OrdersPage;
