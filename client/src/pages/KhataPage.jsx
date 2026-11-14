import React, { useState, useEffect, useCallback } from 'react';
import { khataService } from '../services/api';
import { formatCurrency, PAKISTANI_BANKNOTES } from '../utils/currency';
import { useAuth } from '../context/AuthContext';
import { getWhatsAppReminderUrl } from '../utils/whatsapp';
import StatCard from '../components/common/StatCard';
import Modal from '../components/common/Modal';
import KhataReceiptModal from '../components/khata/KhataReceiptModal';
import {
  BookOpen,
  UserPlus,
  Search,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Printer,
  Calendar,
  AlertCircle,
  CheckCircle,
  FileText,
  BadgeAlert,
  MessageSquare,
  Lock,
  Receipt,
  Plus,
} from 'lucide-react';

const KhataPage = () => {
  const { tenantName, planLimits } = useAuth();
  const storeName = tenantName || 'NORMEGA MART';
  const [metrics, setMetrics] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debtFilter, setDebtFilter] = useState('all'); // 'all', 'debtors', 'cleared'

  // Add Customer Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    address: '',
    creditLimit: '10000',
    initialDebt: '0',
    notes: '',
  });
  const [addError, setAddError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Record Wasooli Modal
  const [wasooliCustomer, setWasooliCustomer] = useState(null);
  const [wasooliAmount, setWasooliAmount] = useState('');
  const [wasooliMode, setWasooliMode] = useState('CASH');
  const [wasooliNotes, setWasooliNotes] = useState('');
  const [wasooliSubmitting, setWasooliSubmitting] = useState(false);

  // Record Udhar / Note Paid Modal
  const [udharCustomer, setUdharCustomer] = useState(null);
  const [udharAmount, setUdharAmount] = useState('');
  const [udharOrderNumber, setUdharOrderNumber] = useState('');
  const [udharNotes, setUdharNotes] = useState('');
  const [udharSubmitting, setUdharSubmitting] = useState(false);

  // Digital Khata Receipt Modal (Wasooli & Udhar Parchi)
  const [activeReceipt, setActiveReceipt] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // Passbook / Statement Modal
  const [statementCustomer, setStatementCustomer] = useState(null);

  const fetchKhataData = useCallback(async () => {
    try {
      setLoading(true);
      const [metricRes, customerRes] = await Promise.all([
        khataService.getMetrics().catch((err) => {
          console.warn('Khata metrics fallback:', err);
          return { data: { success: false } };
        }),
        khataService.getCustomers({ search: searchTerm }).catch((err) => {
          console.warn('Khata customers fallback:', err);
          return { data: { success: false, customers: [] } };
        }),
      ]);

      if (metricRes?.data?.success && metricRes.data.metrics) {
        setMetrics(metricRes.data.metrics);
      } else {
        setMetrics((prev) => prev || {
          totalMarketDebt: 0,
          totalDebtorsCount: 0,
          todayWasooli: 0,
          totalCustomers: 0,
        });
      }

      if (customerRes?.data?.success) {
        const list = Array.isArray(customerRes.data.customers)
          ? customerRes.data.customers
          : Array.isArray(customerRes.data.data)
          ? customerRes.data.data
          : [];
        setCustomers(list);
      } else {
        setCustomers((prev) => (Array.isArray(prev) ? prev : []));
      }
    } catch (err) {
      console.error('Failed to load Khata data:', err);
      setCustomers([]);
      setMetrics((prev) => prev || {
        totalMarketDebt: 0,
        totalDebtorsCount: 0,
        todayWasooli: 0,
        totalCustomers: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchKhataData();
  }, [fetchKhataData]);

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    setAddError('');
    setIsSubmitting(true);

    try {
      await khataService.createCustomer(newCustomer);
      setIsAddModalOpen(false);
      setNewCustomer({
        name: '',
        phone: '',
        address: '',
        creditLimit: '10000',
        initialDebt: '0',
        notes: '',
      });
      fetchKhataData();
    } catch (err) {
      setAddError(err.response?.data?.message || 'Failed to create customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const safeCustomers = Array.isArray(customers) ? customers : [];
  const filteredCustomers = safeCustomers.filter((c) => {
    if (!c) return false;
    const debt = Number(c.totalDebt ?? c.netBalance ?? 0);
    if (debtFilter === 'debtors') return debt > 0;
    if (debtFilter === 'cleared') return debt <= 0;
    return true;
  });

  const handleOpenWasooli = (customer = null) => {
    if (customer && customer._id) {
      setWasooliCustomer(customer);
      const debt = Number(customer.totalDebt ?? customer.netBalance ?? 0);
      setWasooliAmount(debt > 0 ? debt.toString() : '');
    } else {
      const defaultCust = safeCustomers.find((c) => Number(c?.totalDebt ?? c?.netBalance ?? 0) > 0) || safeCustomers[0] || null;
      setWasooliCustomer(defaultCust || { _id: '' });
      const debt = Number(defaultCust?.totalDebt ?? defaultCust?.netBalance ?? 0);
      setWasooliAmount(debt > 0 ? debt.toString() : '');
    }
    setWasooliNotes('');
    setWasooliMode('CASH');
  };

  const handleRecordWasooli = async (e) => {
    e.preventDefault();
    const customerId = wasooliCustomer?._id;
    if (!customerId) {
      alert('Please select a customer for Wasooli');
      return;
    }
    const currentSelected = safeCustomers.find((c) => c._id === customerId) || wasooliCustomer;
    const payAmount = Number(wasooliAmount);
    if (!payAmount || payAmount <= 0) {
      alert('Please enter a valid wasooli amount');
      return;
    }

    setWasooliSubmitting(true);
    try {
      const res = await khataService.recordPayment(customerId, {
        amount: payAmount,
        notes: wasooliNotes,
        paymentMethod: wasooliMode,
      });

      const prevDebt = res?.data?.previousDebt ?? Number(currentSelected?.totalDebt ?? currentSelected?.netBalance ?? 0);
      const newDebt = res?.data?.currentDebt ?? Math.max(0, prevDebt - payAmount);
      const tx = res?.data?.transaction;

      setActiveReceipt({
        type: 'PAYMENT_RECEIVED',
        receiptNumber: tx?.receiptNumber || tx?._id || `WAS-${Date.now().toString().slice(-6)}`,
        date: tx?.date || new Date().toISOString(),
        customerName: currentSelected.name,
        customerPhone: currentSelected.phone,
        amount: payAmount,
        paymentMethod: wasooliMode,
        previousDebt: prevDebt,
        balanceAfter: newDebt,
        currentDebt: newDebt,
        notes: wasooliNotes || 'Payment Received (Wasooli)',
        storeName: storeName,
      });
      setIsReceiptOpen(true);

      setWasooliCustomer(null);
      setWasooliAmount('');
      setWasooliNotes('');
      fetchKhataData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record wasooli payment');
    } finally {
      setWasooliSubmitting(false);
    }
  };

  const handleOpenUdhar = (customer = null) => {
    if (customer && customer._id) {
      setUdharCustomer(customer);
    } else {
      const defaultCust = safeCustomers[0] || null;
      setUdharCustomer(defaultCust || { _id: '' });
    }
    setUdharAmount('');
    setUdharOrderNumber('');
    setUdharNotes('');
  };

  const handleRecordUdhar = async (e) => {
    e.preventDefault();
    const customerId = udharCustomer?._id;
    if (!customerId) {
      alert('Please select a customer to give Udhar');
      return;
    }
    const currentSelected = safeCustomers.find((c) => c._id === customerId) || udharCustomer;
    const creditAmount = Number(udharAmount);
    if (!creditAmount || creditAmount <= 0) {
      alert('Please enter a valid udhar amount');
      return;
    }

    setUdharSubmitting(true);
    try {
      const res = await khataService.recordUdhar(customerId, {
        amount: creditAmount,
        orderNumber: udharOrderNumber,
        notes: udharNotes,
      });

      const prevDebt = res?.data?.previousDebt ?? Number(currentSelected?.totalDebt ?? currentSelected?.netBalance ?? 0);
      const newDebt = res?.data?.currentDebt ?? (prevDebt + creditAmount);
      const tx = res?.data?.transaction;

      setActiveReceipt({
        type: 'UDHAR_GIVEN',
        receiptNumber: tx?.orderNumber || tx?.receiptNumber || tx?._id || `UDH-${Date.now().toString().slice(-6)}`,
        date: tx?.date || new Date().toISOString(),
        customerName: currentSelected.name,
        customerPhone: currentSelected.phone,
        amount: creditAmount,
        paymentMethod: 'UDHAR_CREDIT',
        previousDebt: prevDebt,
        balanceAfter: newDebt,
        currentDebt: newDebt,
        notes: udharNotes || 'New Udhar Given / Note Paid',
        orderNumber: udharOrderNumber,
        storeName: storeName,
      });
      setIsReceiptOpen(true);

      setUdharCustomer(null);
      setUdharAmount('');
      setUdharOrderNumber('');
      setUdharNotes('');
      fetchKhataData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record udhar / note paid');
    } finally {
      setUdharSubmitting(false);
    }
  };

  const handleOpenTxReceipt = (tx) => {
    if (!tx || !statementCustomer) return;
    const isPayment = tx.type === 'PAYMENT_RECEIVED' || tx.type === 'WASOOLI';
    const txAmount = Number(tx.amount || 0);
    const balanceAfter = Number(tx.balanceAfter || 0);
    const prevDebt = isPayment
      ? balanceAfter + txAmount
      : Math.max(0, balanceAfter - txAmount);

    setActiveReceipt({
      type: tx.type,
      receiptNumber: tx.orderNumber || tx.receiptNumber || tx._id || `TX-${Date.now().toString().slice(-6)}`,
      date: tx.date || new Date().toISOString(),
      customerName: statementCustomer.name,
      customerPhone: statementCustomer.phone,
      amount: txAmount,
      paymentMethod: tx.paymentMethod || (isPayment ? 'CASH' : 'UDHAR_CREDIT'),
      previousDebt: prevDebt,
      balanceAfter: balanceAfter,
      currentDebt: balanceAfter,
      notes: tx.notes || (isPayment ? 'Wasooli Payment' : 'Udhar Given'),
      orderNumber: tx.orderNumber,
      storeName: storeName,
    });
    setIsReceiptOpen(true);
  };

  const parsedWasooliAmount = parseFloat(wasooliAmount) || 0;
  const currentWasooliCust = safeCustomers.find((c) => c._id === wasooliCustomer?._id) || wasooliCustomer;
  const wasooliCustomerDebt = Number(currentWasooliCust?.totalDebt ?? currentWasooliCust?.netBalance ?? 0);
  const remainingAfterWasooli = wasooliCustomer
    ? Math.max(0, wasooliCustomerDebt - parsedWasooliAmount)
    : 0;

  const parsedUdharAmount = parseFloat(udharAmount) || 0;
  const currentUdharCust = safeCustomers.find((c) => c._id === udharCustomer?._id) || udharCustomer;
  const udharCustomerDebt = Number(currentUdharCust?.totalDebt ?? currentUdharCust?.netBalance ?? 0);
  const totalAfterUdhar = currentUdharCust
    ? udharCustomerDebt + parsedUdharAmount
    : 0;
  const udharCreditLimit = Number(currentUdharCust?.creditLimit || 0);
  const isLimitExceeded = udharCreditLimit > 0 && totalAfterUdhar > udharCreditLimit;

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-slate-50 dark:bg-slate-950 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-brand-600" />
            Customer Khata & Udhar Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track customer debts, credit limits, daily collections (Wasooli), and digital passbooks
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick 1-Tap Record Udhar */}
          <button
            onClick={() => handleOpenUdhar(null)}
            className="flex items-center space-x-1.5 px-3.5 py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-500/20 transition min-tap"
            title="Record credit / udhar given to a customer"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>+ Udhar (ادھار دیا)</span>
          </button>

          {/* Quick 1-Tap Record Wasooli */}
          <button
            onClick={() => handleOpenWasooli(null)}
            className="flex items-center space-x-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20 transition min-tap"
            title="Record cash or online collection from a customer"
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>Wasooli (وصولی)</span>
          </button>

          {/* Open New Khata Account */}
          <button
            onClick={() => {
              setAddError('');
              setIsAddModalOpen(true);
            }}
            className="flex items-center space-x-1.5 px-3.5 py-2.5 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white font-bold text-xs rounded-xl shadow-md shadow-brand-500/20 transition min-tap"
          >
            <UserPlus className="w-4 h-4" />
            <span>New Account</span>
          </button>
        </div>
      </div>

      {/* 4 Khata Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Market Udhar"
          value={formatCurrency(metrics?.totalMarketDebt ?? metrics?.totalUdhar ?? 0)}
          icon={BadgeAlert}
          color="rose"
          subtitle="Total outstanding money in market"
        />
        <StatCard
          title="Active Debtors"
          value={metrics?.totalDebtorsCount ?? 0}
          icon={Wallet}
          color="amber"
          subtitle="Customers owing money"
        />
        <StatCard
          title="Today's Wasooli"
          value={formatCurrency(metrics?.todayWasooli ?? 0)}
          icon={ArrowDownLeft}
          color="brand"
          subtitle="Cash/Online collections today"
        />
        <StatCard
          title="Total Khata Accounts"
          value={metrics?.totalCustomers ?? metrics?.customerCount ?? safeCustomers.length}
          icon={BookOpen}
          color="blue"
          subtitle="Registered credit customers"
        />
      </div>

      {/* Search and Filters Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search khata by customer name or phone number..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center space-x-1.5 w-full sm:w-auto">
          {[
            { id: 'all', label: 'All Accounts' },
            { id: 'debtors', label: 'Debtors (Baqaya)' },
            { id: 'cleared', label: 'Cleared (Nil)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setDebtFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                debtFilter === tab.id
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Customer Khata Directory: Mobile Cards (< md) + Desktop Table (md:) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        {/* Mobile View: High-Touch Customer Cards */}
        <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {loading ? (
            <div className="py-12 text-center text-slate-400">
              <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading Khata ledger...
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="py-12 text-center text-slate-400 p-4">
              No customers found matching your criteria.
            </div>
          ) : (
            filteredCustomers.map((c) => {
              const currentDebt = Number(c.totalDebt ?? c.netBalance ?? 0);
              const hasDebt = currentDebt > 0;
              const creditLimit = Number(c.creditLimit || 10000);
              return (
                <div key={c._id} className="p-4 space-y-3 bg-slate-50/50 dark:bg-slate-950/40">
                  {/* Top: Avatar, Name & Current Debt */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black text-sm flex items-center justify-center flex-shrink-0">
                        {c.name ? c.name.charAt(0).toUpperCase() : 'C'}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm leading-tight">
                          {c.name}
                        </h4>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">
                          {c.phone || 'No phone'}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div
                        className={`text-base font-black ${
                          hasDebt ? 'text-rose-500 dark:text-rose-400' : 'text-emerald-500 dark:text-emerald-400'
                        }`}
                      >
                        {formatCurrency(currentDebt)}
                      </div>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider ${
                          hasDebt ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {hasDebt ? 'Baqaya (Due)' : 'Cleared'}
                      </span>
                    </div>
                  </div>

                  {/* Customer Address or Credit Limit */}
                  <div className="flex items-center justify-between text-xs text-slate-400 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="truncate mr-2">{c.address || 'No address registered'}</span>
                    <span className="font-mono flex-shrink-0">
                      Limit: {formatCurrency(creditLimit)}
                    </span>
                  </div>

                  {/* Mobile 1-Tap Action Buttons (4-action grid) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    {/* 1. Record Udhar (Give Credit) */}
                    <button
                      onClick={() => handleOpenUdhar(c)}
                      className="py-2.5 px-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 min-tap shadow-xs"
                      title="Give Credit / Udhar (ادھار دیا)"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                      <span>+ Udhar</span>
                    </button>

                    {/* 2. Record Wasooli (Payment Received) */}
                    <button
                      onClick={() => handleOpenWasooli(c)}
                      className="py-2.5 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition flex items-center justify-center space-x-1 min-tap shadow-xs"
                      title="Record Payment Wasooli (وصولی)"
                    >
                      <ArrowDownLeft className="w-4 h-4" />
                      <span>Wasooli</span>
                    </button>

                    {/* 3. Passbook / Ledger */}
                    <button
                      onClick={() => setStatementCustomer(c)}
                      className="py-2.5 px-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 min-tap"
                      title="View Customer Khata Passbook"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Passbook</span>
                    </button>

                    {/* 4. WhatsApp Reminder */}
                    {hasDebt ? (
                      planLimits?.allowWhatsApp ? (
                        <button
                          onClick={() => {
                            const url = getWhatsAppReminderUrl(c, storeName);
                            window.open(url, '_blank', 'noopener,noreferrer');
                          }}
                          className="py-2.5 px-2 bg-green-600 hover:bg-green-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 min-tap shadow-xs"
                          title="Send WhatsApp Udhar Reminder"
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span>WhatsApp</span>
                        </button>
                      ) : (
                        <button
                          disabled
                          className="py-2.5 px-2 bg-slate-100 dark:bg-slate-850 text-slate-400 rounded-xl text-xs font-medium flex items-center justify-center space-x-1 opacity-50 cursor-not-allowed"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </button>
                      )
                    ) : (
                      <div className="py-2.5 px-2 rounded-xl text-[11px] font-medium text-slate-400 flex items-center justify-center border border-slate-200 dark:border-slate-800">
                        Nil Baqaya
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
                <th className="py-3.5 px-4">Customer Details</th>
                <th className="py-3.5 px-4">Phone Number</th>
                <th className="py-3.5 px-4">Credit Limit</th>
                <th className="py-3.5 px-4">Current Udhar Balance</th>
                <th className="py-3.5 px-4">Last Activity</th>
                <th className="py-3.5 px-4 text-right">Khata Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading Khata ledger...
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    No customers found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => {
                  const lastTx = Array.isArray(c.transactions) ? c.transactions[0] : null;
                  const currentDebt = Number(c.totalDebt ?? c.netBalance ?? 0);
                  const hasDebt = currentDebt > 0;
                  const creditLimit = Number(c.creditLimit || 0);

                  return (
                    <tr
                      key={c._id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-850/60 transition"
                    >
                      {/* Name & Address */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{c.name}</span>
                        </div>
                        {c.address && (
                          <div className="text-[10px] text-slate-400 truncate max-w-xs">
                            {c.address}
                          </div>
                        )}
                      </td>

                      {/* Phone */}
                      <td className="py-3 px-4 font-mono font-semibold text-slate-700 dark:text-slate-300">
                        {c.phone}
                      </td>

                      {/* Credit Limit */}
                      <td className="py-3 px-4 text-slate-500">
                        {creditLimit > 0 ? formatCurrency(creditLimit) : 'Unlimited'}
                      </td>

                      {/* Current Debt */}
                      <td className="py-3 px-4">
                        <div
                          className={`font-black text-sm ${
                            hasDebt ? 'text-red-600 dark:text-red-400' : 'text-emerald-600'
                          }`}
                        >
                          {formatCurrency(currentDebt)}
                        </div>
                        {hasDebt && creditLimit > 0 && currentDebt >= creditLimit && (
                          <span className="text-[9px] font-bold text-red-500 uppercase tracking-tight">
                            Limit Exceeded
                          </span>
                        )}
                      </td>

                      {/* Last Activity */}
                      <td className="py-3 px-4 text-slate-500">
                        {lastTx ? (
                          <div>
                            <span
                              className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${
                                lastTx.type === 'UDHAR_GIVEN' ? 'bg-red-500' : 'bg-emerald-500'
                              }`}
                            />
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {lastTx.type === 'UDHAR_GIVEN' ? 'Udhar' : 'Wasooli'}: {formatCurrency(lastTx.amount)}
                            </span>
                            <div className="text-[10px] text-slate-400">
                              {new Date(lastTx.date).toLocaleDateString('en-PK')}
                            </div>
                          </div>
                        ) : (
                          'No transactions yet'
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {hasDebt && (
                            planLimits?.allowWhatsApp ? (
                              <button
                                onClick={() => {
                                  const url = getWhatsAppReminderUrl(c, storeName);
                                  window.open(url, '_blank', 'noopener,noreferrer');
                                }}
                                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-950/40 dark:text-green-300 transition flex items-center space-x-1"
                                title="Send WhatsApp Udhar Reminder"
                              >
                                <MessageSquare className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                                <span className="hidden sm:inline">WhatsApp</span>
                              </button>
                            ) : (
                              <span
                                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 flex items-center space-x-1 cursor-not-allowed opacity-60"
                                title="WhatsApp Reminder requires Standard or Premium Plan"
                              >
                                <Lock className="w-3 h-3 text-slate-400" />
                                <span className="hidden sm:inline">WhatsApp</span>
                              </span>
                            )
                          )}

                          {/* 1-Tap Record Udhar */}
                          <button
                            onClick={() => handleOpenUdhar(c)}
                            className="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 transition flex items-center space-x-1"
                            title="Record new Udhar / Credit given"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            <span>+ Udhar</span>
                          </button>

                          {/* 1-Tap Wasooli */}
                          <button
                            onClick={() => handleOpenWasooli(c)}
                            className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 transition flex items-center space-x-1"
                            title="Record Payment Wasooli"
                          >
                            <ArrowDownLeft className="w-3.5 h-3.5" />
                            <span>Wasooli</span>
                          </button>

                          {/* Passbook Statement */}
                          <button
                            onClick={() => setStatementCustomer(c)}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition flex items-center space-x-1"
                            title="View Digital Passbook Ledger"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Passbook</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: New Khata Customer */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Open New Khata Account"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-3">
          {addError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl flex items-center text-xs text-red-700 dark:text-red-300">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>{addError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Customer Name *
            </label>
            <input
              type="text"
              required
              value={newCustomer.name}
              onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
              placeholder="e.g. Haji Aslam / Muhammad Tariq"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Mobile Phone Number *
            </label>
            <input
              type="text"
              required
              value={newCustomer.phone}
              onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
              placeholder="0300-1234567"
              className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Address / Area / Shop Details
            </label>
            <input
              type="text"
              value={newCustomer.address}
              onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
              placeholder="e.g. House #12, Street 4, Lahore"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Credit Limit (Rs.)
              </label>
              <input
                type="number"
                min="0"
                value={newCustomer.creditLimit}
                onChange={(e) => setNewCustomer({ ...newCustomer, creditLimit: e.target.value })}
                placeholder="10000"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Opening Purana Udhar (Rs.)
              </label>
              <input
                type="number"
                min="0"
                value={newCustomer.initialDebt}
                onChange={(e) => setNewCustomer({ ...newCustomer, initialDebt: e.target.value })}
                placeholder="0"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md transition disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Save Khata Account'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Record Wasooli Payment */}
      <Modal
        isOpen={!!wasooliCustomer}
        onClose={() => setWasooliCustomer(null)}
        title={`Record Payment (Wasooli) - ${currentWasooliCust?.name || 'Select Customer'}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleRecordWasooli} className="space-y-4">
          {/* Customer Selection if opened from header without customer */}
          {(!wasooliCustomer?._id || !safeCustomers.some((c) => c._id === wasooliCustomer?._id)) && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Select Customer *
              </label>
              <select
                required
                value={wasooliCustomer?._id || ''}
                onChange={(e) => {
                  const selected = safeCustomers.find((c) => c._id === e.target.value);
                  setWasooliCustomer(selected || null);
                  const debt = Number(selected?.totalDebt ?? selected?.netBalance ?? 0);
                  setWasooliAmount(debt > 0 ? debt.toString() : '');
                }}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white"
              >
                <option value="">-- Choose Customer to Receive Payment --</option>
                {safeCustomers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.phone || 'No phone'}) — Baqaya: Rs. {Number(c.totalDebt ?? c.netBalance ?? 0).toLocaleString()}
                  </option>
                ))}
              </select>
            </div>
          )}

          {currentWasooliCust?._id && (
            <div className="p-3.5 bg-slate-900 text-white rounded-2xl flex items-center justify-between border border-slate-800 shadow-sm">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                  Current Total Udhar Due
                </span>
                <div className="text-2xl font-black text-red-400">
                  {formatCurrency(wasooliCustomerDebt)}
                </div>
              </div>
              <div className="text-right text-xs text-slate-400 font-mono">
                {currentWasooliCust?.phone || 'No phone'}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Amount Received (Rs.) *
            </label>
            <input
              type="number"
              min="1"
              required
              autoFocus
              value={wasooliAmount}
              onChange={(e) => setWasooliAmount(e.target.value)}
              placeholder="Enter amount collected"
              className="w-full px-3 py-2.5 text-lg font-bold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
            />
          </div>

          {/* Quick Banknote Buttons */}
          <div>
            <span className="block text-[11px] font-semibold text-slate-500 mb-1.5">
              Quick Pakistani Tender:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setWasooliAmount(wasooliCustomerDebt > 0 ? wasooliCustomerDebt.toString() : '0')}
                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
              >
                Full Due ({formatCurrency(wasooliCustomerDebt)})
              </button>
              {PAKISTANI_BANKNOTES.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setWasooliAmount(b.toString())}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300"
                >
                  Rs. {b.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Payment Channel
              </label>
              <select
                value={wasooliMode}
                onChange={(e) => setWasooliMode(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white"
              >
                <option value="CASH">Cash in Hand</option>
                <option value="BANK_TRANSFER">Bank Transfer / Raast</option>
                <option value="JAZZCASH">JazzCash</option>
                <option value="EASYPAISA">EasyPaisa</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Remaining Balance
              </label>
              <div className="px-3 py-2 text-xs font-extrabold bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-800 dark:text-slate-200">
                {formatCurrency(remainingAfterWasooli)}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Remarks / Notes
            </label>
            <input
              type="text"
              value={wasooliNotes}
              onChange={(e) => setWasooliNotes(e.target.value)}
              placeholder="e.g. Received via Raast payment / Counter cash"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={() => setWasooliCustomer(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={wasooliSubmitting || parsedWasooliAmount <= 0 || !wasooliCustomer?._id}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition disabled:opacity-50"
            >
              {wasooliSubmitting ? 'Recording...' : 'Confirm Wasooli'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Record Udhar Given (Note Paid / ادھار دیا) */}
      <Modal
        isOpen={!!udharCustomer}
        onClose={() => setUdharCustomer(null)}
        title={`Record Udhar / Note Paid (ادھار دیا) - ${currentUdharCust?.name || 'Select Customer'}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleRecordUdhar} className="space-y-4">
          {/* Customer Selection if opened from header without customer */}
          {(!udharCustomer?._id || !safeCustomers.some((c) => c._id === udharCustomer?._id)) && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Select Customer *
              </label>
              <select
                required
                value={udharCustomer?._id || ''}
                onChange={(e) => {
                  const selected = safeCustomers.find((c) => c._id === e.target.value);
                  setUdharCustomer(selected || null);
                }}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white"
              >
                <option value="">-- Choose Customer to Give Credit --</option>
                {safeCustomers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.phone || 'No phone'}) — Purana Baqaya: Rs. {Number(c.totalDebt ?? c.netBalance ?? 0).toLocaleString()}
                  </option>
                ))}
              </select>
            </div>
          )}

          {currentUdharCust?._id && (
            <div className="p-3.5 bg-slate-900 text-white rounded-2xl flex items-center justify-between border border-slate-800 shadow-sm">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                  Purana Baqaya (Current Due)
                </span>
                <div className="text-2xl font-black text-rose-400">
                  {formatCurrency(udharCustomerDebt)}
                </div>
                {udharCreditLimit > 0 && (
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Credit Limit: {formatCurrency(udharCreditLimit)}
                  </div>
                )}
              </div>
              <div className="text-right text-xs text-slate-400 font-mono">
                {currentUdharCust?.phone || 'No phone'}
              </div>
            </div>
          )}

          {/* Credit Limit Alert Banner */}
          {isLimitExceeded && (
            <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl flex items-start gap-2 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Credit Limit Warning:</span> Customer limit of{' '}
                {formatCurrency(udharCreditLimit)} will be exceeded by{' '}
                {formatCurrency(totalAfterUdhar - udharCreditLimit)}!
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Udhar Credit Amount (Rs.) *
            </label>
            <input
              type="number"
              min="1"
              required
              autoFocus
              value={udharAmount}
              onChange={(e) => setUdharAmount(e.target.value)}
              placeholder="Enter credit amount given"
              className="w-full px-3 py-2.5 text-lg font-bold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
            />
          </div>

          {/* Quick Banknotes */}
          <div>
            <span className="block text-[11px] font-semibold text-slate-500 mb-1.5">
              Quick Pakistani Amounts:
            </span>
            <div className="flex flex-wrap gap-2">
              {[500, 1000, 2000, 3000, 5000, 10000].map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setUdharAmount(b.toString())}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300"
                >
                  Rs. {b.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Bill / Invoice No. (Optional)
              </label>
              <input
                type="text"
                value={udharOrderNumber}
                onChange={(e) => setUdharOrderNumber(e.target.value)}
                placeholder="e.g. INV-1049"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                New Expected Baqaya
              </label>
              <div className="px-3 py-2 text-xs font-extrabold bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 rounded-xl text-rose-700 dark:text-rose-300">
                {formatCurrency(totalAfterUdhar)}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Items Description / Purpose
            </label>
            <input
              type="text"
              value={udharNotes}
              onChange={(e) => setUdharNotes(e.target.value)}
              placeholder="e.g. 2 Unstitched Suits, Cooking Oil & Ghee"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={() => setUdharCustomer(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={udharSubmitting || parsedUdharAmount <= 0 || !udharCustomer?._id}
              className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md shadow-rose-600/20 transition disabled:opacity-50"
            >
              {udharSubmitting ? 'Recording...' : 'Confirm Udhar (ادھار دیا)'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Customer Digital Passbook / Statement */}
      <Modal
        isOpen={!!statementCustomer}
        onClose={() => setStatementCustomer(null)}
        title={`Passbook Ledger - ${statementCustomer?.name}`}
        maxWidth="max-w-3xl"
      >
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between gap-3">
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                {statementCustomer?.name}
              </h4>
              <p className="text-xs text-slate-500 font-mono">{statementCustomer?.phone}</p>
              {statementCustomer?.address && (
                <p className="text-[11px] text-slate-400 mt-0.5">{statementCustomer.address}</p>
              )}
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                Current Outstanding Udhar
              </span>
              <div className="text-2xl font-black text-red-600 dark:text-red-400">
                {formatCurrency(statementCustomer?.totalDebt ?? statementCustomer?.netBalance ?? 0)}
              </div>
              <div className="text-[10px] text-slate-400">
                Credit Limit: {formatCurrency(statementCustomer?.creditLimit || 0)}
              </div>
            </div>
          </div>

          {/* Transactions List with 1-Tap Receipt Generation */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden max-h-80 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-[10px] uppercase font-bold text-slate-500 sticky top-0">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Order / Notes</th>
                  <th className="py-2.5 px-3 text-right">Debit (Udhar)</th>
                  <th className="py-2.5 px-3 text-right">Credit (Wasooli)</th>
                  <th className="py-2.5 px-3 text-right">Balance</th>
                  <th className="py-2.5 px-3 text-right">Slip (پرچی)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {!Array.isArray(statementCustomer?.transactions) || statementCustomer.transactions.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400">
                      No ledger transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  (statementCustomer.transactions || []).map((tx) => (
                    <tr key={tx._id} className="hover:bg-slate-50 dark:hover:bg-slate-850">
                      <td className="py-2 px-3 text-slate-500 whitespace-nowrap">
                        {new Date(tx.date).toLocaleDateString('en-PK', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            tx.type === 'UDHAR_GIVEN'
                              ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}
                        >
                          {tx.type === 'UDHAR_GIVEN' ? 'Udhar Given' : 'Wasooli Received'}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {tx.orderNumber || tx.notes || '—'}
                        </div>
                        {tx.recordedByName && (
                          <div className="text-[9px] text-slate-400">By: {tx.recordedByName}</div>
                        )}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-red-600">
                        {tx.type === 'UDHAR_GIVEN' ? formatCurrency(tx.amount) : '—'}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-600">
                        {tx.type === 'PAYMENT_RECEIVED' ? formatCurrency(tx.amount) : '—'}
                      </td>
                      <td className="py-2 px-3 text-right font-black text-slate-900 dark:text-white">
                        {formatCurrency(tx.balanceAfter)}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenTxReceipt(tx)}
                          className="px-2 py-1 rounded-lg bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/60 dark:hover:bg-brand-900/60 text-brand-700 dark:text-brand-300 transition inline-flex items-center gap-1 font-bold text-[11px]"
                          title="Generate & View Digital Receipt"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>پرچی</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition flex items-center space-x-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print Passbook Statement</span>
              </button>

              {(statementCustomer?.totalDebt ?? statementCustomer?.netBalance ?? 0) > 0 && (
                planLimits?.allowWhatsApp ? (
                  <button
                    type="button"
                    onClick={() => {
                      const url = getWhatsAppReminderUrl(statementCustomer, storeName);
                      window.open(url, '_blank', 'noopener,noreferrer');
                    }}
                    className="px-3.5 py-2 text-xs font-bold rounded-xl bg-green-600 hover:bg-green-700 text-white transition flex items-center space-x-1.5 shadow-xs"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Send WhatsApp Udhar Alert</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    <Lock className="w-3.5 h-3.5 text-amber-600" />
                    <span>WhatsApp available on Standard plan</span>
                  </div>
                )
              )}
            </div>

            <button
              type="button"
              onClick={() => setStatementCustomer(null)}
              className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* Digital Khata Thermal & WhatsApp Receipt Modal */}
      <KhataReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => {
          setIsReceiptOpen(false);
          setActiveReceipt(null);
        }}
        receipt={activeReceipt}
      />
    </div>
  );
};

export default KhataPage;
