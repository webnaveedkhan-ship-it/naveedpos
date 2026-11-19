import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { useCart } from '../../context/CartContext';
import { orderService, khataService } from '../../services/api';
import { formatCurrency, PAKISTANI_BANKNOTES } from '../../utils/currency';
import {
  Banknote,
  Smartphone,
  Building2,
  BookOpen,
  Split,
  Check,
  AlertCircle,
  UserPlus,
  Search,
  AlertTriangle,
  UserCheck,
  CreditCard,
  X,
  Phone,
  User,
  ShieldAlert,
} from 'lucide-react';

const PAKISTANI_BANKS = [
  'Meezan Bank',
  'Habib Bank Limited (HBL)',
  'United Bank Limited (UBL)',
  'Bank Alfalah',
  'MCB Bank',
  'Allied Bank (ABL)',
  'Faysal Bank',
  'Askari Bank',
  'Bank of Punjab (BOP)',
  'Standard Chartered',
  'Other IBFT / Raast',
];

const PaymentModal = ({ isOpen, onClose, onOrderCompleted }) => {
  const {
    cartItems,
    subtotal,
    taxRate,
    taxAmount,
    discountType,
    discountValue,
    discountAmount,
    grandTotal,
    clearCart,
  } = useCart();

  // Payment Method: 'CASH' | 'CARD_DIGITAL' | 'KHATA' | 'SPLIT'
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [digitalSubMode, setDigitalSubMode] = useState('CARD'); // 'CARD' | 'WALLET' | 'BANK'
  const [cardTxRef, setCardTxRef] = useState('');

  // CASH Details
  const [cashTendered, setCashTendered] = useState('');

  // JAZZCASH / EASYPAISA Details
  const [walletType, setWalletType] = useState('JazzCash'); // 'JazzCash' | 'EasyPaisa' | 'Raast'
  const [walletTxRef, setWalletTxRef] = useState('');
  const [walletSenderPhone, setWalletSenderPhone] = useState('');

  // BANK TRANSFER Details
  const [bankName, setBankName] = useState('Meezan Bank');
  const [bankTxRef, setBankTxRef] = useState('');

  // SPLIT Details
  const [splitCash, setSplitCash] = useState('');

  // CUSTOMER Details
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');

  // Processing & Errors
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // KHATA Customers State
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [selectedKhataCustomer, setSelectedKhataCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showQuickAddCustomer, setShowQuickAddCustomer] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: '',
    phone: '',
    address: '',
    creditLimit: '10000',
  });
  const [quickAddLoading, setQuickAddLoading] = useState(false);

  // Fetch Khata customers
  const loadKhataCustomers = async (search = '') => {
    try {
      setLoadingCustomers(true);
      const res = await khataService.getCustomers({ search, limit: 60 });
      if (res.data?.success) {
        setCustomers(Array.isArray(res.data.customers) ? res.data.customers : []);
      }
    } catch (err) {
      console.error('Failed to load Khata customers:', err);
      setCustomers([]);
    } finally {
      setLoadingCustomers(false);
    }
  };

  // Reset or preset values when modal opens
  useEffect(() => {
    if (isOpen) {
      setPaymentMethod('CASH');
      setDigitalSubMode('CARD');
      setCardTxRef('');
      setCashTendered(grandTotal.toString());
      setSplitCash((grandTotal / 2).toFixed(0));
      setWalletTxRef('');
      setWalletSenderPhone('');
      setBankTxRef('');
      setCustomerName('Walk-in Customer');
      setCustomerPhone('');
      setNotes('');
      setErrorMsg('');
      setSelectedKhataCustomer(null);
      setShowQuickAddCustomer(false);
      setCustomerSearch('');
      loadKhataCustomers();
    }
  }, [isOpen, grandTotal]);

  const tenderedNum = parseFloat(cashTendered) || 0;
  const changeDue = Math.max(0, tenderedNum - grandTotal);
  const remainingDue = Math.max(0, grandTotal - tenderedNum);

  // Split payment math
  const splitCashNum = parseFloat(splitCash) || 0;
  const splitRemainingNum = Math.max(0, grandTotal - splitCashNum);

  // Khata credit limit check
  const khataCurrentDebt = Number(selectedKhataCustomer?.totalDebt || 0);
  const khataLimit = Number(selectedKhataCustomer?.creditLimit || 0);
  const khataProjectedDebt = Number((khataCurrentDebt + grandTotal).toFixed(2));
  const isKhataLimitExceeded = khataLimit > 0 && khataProjectedDebt > khataLimit;

  // Handle Quick Tender Cash buttons
  const handleQuickCash = (amount) => {
    if (amount === 'exact') {
      setCashTendered(grandTotal.toFixed(0));
    } else {
      setCashTendered(amount.toString());
    }
  };

  // Quick register customer inline directly in checkout
  const handleQuickAddCustomer = async (e) => {
    e.preventDefault();
    if (!newCustomerForm.name.trim() || !newCustomerForm.phone.trim()) {
      setErrorMsg('Customer name and mobile number are required.');
      return;
    }

    try {
      setQuickAddLoading(true);
      setErrorMsg('');
      const res = await khataService.createCustomer({
        name: newCustomerForm.name.trim(),
        phone: newCustomerForm.phone.trim(),
        address: newCustomerForm.address.trim(),
        creditLimit: parseFloat(newCustomerForm.creditLimit) || 0,
        initialDebt: 0,
      });

      if (res.data?.success) {
        const created = res.data.customer;
        setCustomers((prev) => [created, ...(Array.isArray(prev) ? prev : [])]);
        setSelectedKhataCustomer(created);
        setCustomerName(created.name);
        setCustomerPhone(created.phone);
        setShowQuickAddCustomer(false);
        setNewCustomerForm({ name: '', phone: '', address: '', creditLimit: '10000' });
      }
    } catch (err) {
      console.error('Quick add customer error:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to create Khata customer account.');
    } finally {
      setQuickAddLoading(false);
    }
  };

  const handleSelectCustomer = (cust) => {
    setSelectedKhataCustomer(cust);
    setCustomerName(cust.name);
    setCustomerPhone(cust.phone);
    setErrorMsg('');
  };

  const handleProcessOrder = async () => {
    setErrorMsg('');

    // Validations
    if (paymentMethod === 'CASH' && tenderedNum < grandTotal) {
      setErrorMsg(`Insufficient cash tendered. Balance due: ${formatCurrency(remainingDue)}`);
      return;
    }

    if (paymentMethod === 'SPLIT') {
      if (splitCashNum < 0 || splitCashNum > grandTotal) {
        setErrorMsg('Invalid split cash portion.');
        return;
      }
    }

    if (paymentMethod === 'KHATA') {
      if (!selectedKhataCustomer) {
        setErrorMsg('Please select or add a Khata customer to record this sale as Udhar.');
        return;
      }

      if (isKhataLimitExceeded) {
        setErrorMsg(
          `Credit Limit Exceeded! Customer limit is ${formatCurrency(khataLimit)}. Current Udhar is ${formatCurrency(
            khataCurrentDebt
          )}. This sale would reach ${formatCurrency(khataProjectedDebt)}.`
        );
        return;
      }
    }

    setIsProcessing(true);

    try {
      let effectiveMethod = paymentMethod.toUpperCase();
      if (effectiveMethod === 'CARD_DIGITAL') {
        if (digitalSubMode === 'WALLET') effectiveMethod = 'JAZZCASH_EASYPAISA';
        else if (digitalSubMode === 'BANK') effectiveMethod = 'BANK';
        else effectiveMethod = 'CARD';
      }

      const orderPayload = {
        items: cartItems.map((item) => ({
          product: item.product,
          title: item.title,
          sku: item.sku,
          price: Number(item.price),
          costPrice: Number(item.costPrice || 0),
          quantity: Number(item.quantity),
          subtotal: Number(item.subtotal || item.price * item.quantity),
        })),
        subtotal,
        taxRate: 0,
        taxAmount: 0,
        discountType,
        discountValue,
        discountAmount,
        grandTotal,
        paymentMethod: effectiveMethod,
        paymentDetails: {
          cashTendered:
            paymentMethod === 'CASH'
              ? tenderedNum
              : paymentMethod === 'SPLIT'
              ? splitCashNum
              : 0,
          changeGiven: paymentMethod === 'CASH' ? Number(changeDue.toFixed(2)) : 0,
          cashAmount: paymentMethod === 'SPLIT' ? splitCashNum : paymentMethod === 'CASH' ? grandTotal : 0,
          cardType: effectiveMethod === 'CARD' ? 'VISA / MASTERCARD / POS' : '',
          walletType: effectiveMethod === 'JAZZCASH_EASYPAISA' ? walletType : '',
          transactionRef:
            effectiveMethod === 'JAZZCASH_EASYPAISA'
              ? walletTxRef
              : effectiveMethod === 'BANK'
              ? bankTxRef
              : effectiveMethod === 'CARD'
              ? (cardTxRef || 'POS-TERMINAL')
              : '',
          bankName: effectiveMethod === 'BANK' ? bankName : '',
          khataAmount: paymentMethod === 'KHATA' ? grandTotal : 0,
          previousDebt: paymentMethod === 'KHATA' ? khataCurrentDebt : 0,
          balanceAfter: paymentMethod === 'KHATA' ? khataProjectedDebt : 0,
        },
        customer: {
          khataId: selectedKhataCustomer ? selectedKhataCustomer._id : null,
          name: customerName || 'Walk-in Customer',
          phone: customerPhone || (selectedKhataCustomer ? selectedKhataCustomer.phone : ''),
        },
        notes,
      };

      const res = await orderService.createOrder(orderPayload);
      if (res.data?.success) {
        clearCart();
        onClose();
        if (onOrderCompleted) {
          onOrderCompleted(res.data.order);
        }
      }
    } catch (err) {
      console.error('Order checkout error:', err);
      setErrorMsg(
        err.response?.data?.message || 'Transaction failed. Please check stock or connection.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const safeCustomers = Array.isArray(customers) ? customers : [];
  const filteredCustomers = safeCustomers.filter(
    (c) =>
      (c?.name || '').toLowerCase().includes(customerSearch.toLowerCase()) ||
      (c?.phone || '').toLowerCase().includes(customerSearch.toLowerCase())
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="POS Billing & Checkout" maxWidth="max-w-xl">
      <div className="space-y-4">
        {/* Total Banner */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white rounded-2xl p-4 flex items-center justify-between border border-slate-800 shadow-md">
          <div>
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block">
              Total Amount Payable (کل رقم)
            </span>
            <div className="text-3xl font-black text-emerald-400 tracking-tight">
              {formatCurrency(grandTotal)}
            </div>
          </div>
          <div className="text-right text-xs text-slate-400">
            <div className="font-semibold text-white">
              {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
            </div>
            {discountAmount > 0 && (
              <div className="text-rose-400 font-medium">
                Disc: -{formatCurrency(discountAmount)}
              </div>
            )}
            <div className="text-slate-500 font-mono">Tax: 0%</div>
          </div>
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl flex items-center text-xs text-red-700 dark:text-red-300 font-medium animate-fadeIn">
            <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Multi-Mode Payment Method Pills / Buttons */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
            Select Payment Method (ادائیگی کا طریقہ)
          </label>
          <div className="grid grid-cols-3 gap-2">
            {/* 1. Cash (نقد) */}
            <button
              type="button"
              onClick={() => {
                setPaymentMethod('CASH');
                setErrorMsg('');
              }}
              className={`p-3 rounded-2xl border flex flex-col items-center justify-center space-y-1 font-black text-xs transition active:scale-95 ${
                paymentMethod === 'CASH'
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-500/30 shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Banknote className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Cash (نقد)</span>
            </button>

            {/* 2. Card / Digital Payment (کارڈ / ڈیجیٹل) */}
            <button
              type="button"
              onClick={() => {
                setPaymentMethod('CARD_DIGITAL');
                setErrorMsg('');
              }}
              className={`p-3 rounded-2xl border flex flex-col items-center justify-center space-y-1 font-black text-xs transition active:scale-95 ${
                paymentMethod === 'CARD_DIGITAL' || paymentMethod === 'JAZZCASH_EASYPAISA' || paymentMethod === 'BANK'
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 ring-2 ring-indigo-500/30 shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <CreditCard className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Card / Digital</span>
              <span className="text-[10px] text-slate-400 font-normal">کارڈ / ڈیجیٹل</span>
            </button>

            {/* 3. Khata / Udhar (کھاتا - ادھار) */}
            <button
              type="button"
              onClick={() => {
                setPaymentMethod('KHATA');
                setErrorMsg('');
              }}
              className={`p-3 rounded-2xl border flex flex-col items-center justify-center space-y-1 font-black text-xs transition active:scale-95 ${
                paymentMethod === 'KHATA'
                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 ring-2 ring-amber-500/30 shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <BookOpen className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <span>Khata / Udhar</span>
              <span className="text-[10px] text-slate-400 font-normal">کھاتا - ادھار</span>
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* PAYMENT DETAILS: CASH                                     */}
        {/* ========================================================= */}
        {paymentMethod === 'CASH' && (
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Cash Tendered (موصول نقد رقم)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={cashTendered}
                onChange={(e) => setCashTendered(e.target.value)}
                autoFocus
                placeholder="0"
                className="w-full px-3 py-2.5 text-lg font-black bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
              />
            </div>

            {/* Quick Pakistani Banknotes */}
            <div>
              <span className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                Quick Pakistani Banknotes (نوٹ منتخب کریں):
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickCash('exact')}
                  className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 text-emerald-600 dark:text-emerald-400"
                >
                  Exact ({formatCurrency(grandTotal)})
                </button>
                {PAKISTANI_BANKNOTES.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleQuickCash(amt)}
                    className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200"
                  >
                    Rs. {amt.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Change Due Box */}
            <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                Change to Return (واپسی رقم):
              </span>
              <span
                className={`text-xl font-black ${
                  tenderedNum >= grandTotal ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'
                }`}
              >
                {formatCurrency(changeDue)}
              </span>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* PAYMENT DETAILS: CARD / DIGITAL PAYMENT (SUBMODES)        */}
        {/* ========================================================= */}
        {(paymentMethod === 'CARD_DIGITAL' || paymentMethod === 'JAZZCASH_EASYPAISA' || paymentMethod === 'BANK') && (
          <div className="bg-indigo-50/60 dark:bg-indigo-950/30 p-4 rounded-2xl border border-indigo-200 dark:border-indigo-900/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-bold text-indigo-900 dark:text-indigo-300">
                <CreditCard className="w-4 h-4 text-indigo-600" />
                <span>Card &amp; Digital Channels (کارڈ اور ڈیجیٹل ادائیگی)</span>
              </div>
            </div>

            {/* Sub-Channel Switcher */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDigitalSubMode('CARD')}
                className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition flex items-center justify-center space-x-1 ${
                  digitalSubMode === 'CARD'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>POS Card</span>
              </button>
              <button
                type="button"
                onClick={() => setDigitalSubMode('WALLET')}
                className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition flex items-center justify-center space-x-1 ${
                  digitalSubMode === 'WALLET'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mobile Wallet</span>
              </button>
              <button
                type="button"
                onClick={() => setDigitalSubMode('BANK')}
                className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition flex items-center justify-center space-x-1 ${
                  digitalSubMode === 'BANK'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Bank / Raast</span>
              </button>
            </div>

            {/* Sub-Channel 1: Card / POS Terminal */}
            {digitalSubMode === 'CARD' && (
              <div className="space-y-2 bg-white dark:bg-slate-900 p-3 rounded-xl border border-indigo-100 dark:border-indigo-950">
                <div className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 font-medium">
                  <span>Swipe / Tap Customer Card on POS Machine</span>
                  <span className="text-emerald-600 font-bold">Terminal Active</span>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Card Slip Reference / Auth Code (اختیاری)
                  </label>
                  <input
                    type="text"
                    value={cardTxRef}
                    onChange={(e) => setCardTxRef(e.target.value)}
                    placeholder="e.g. AUTH-849182"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            )}

            {/* Sub-Channel 2: JazzCash / EasyPaisa / Raast */}
            {digitalSubMode === 'WALLET' && (
              <div className="space-y-2 bg-white dark:bg-slate-900 p-3 rounded-xl border border-indigo-100 dark:border-indigo-950">
                <div className="grid grid-cols-3 gap-2">
                  {['JazzCash', 'EasyPaisa', 'Raast'].map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setWalletType(w)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition ${
                        walletType === w
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {w}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Transaction ID / TID (ٹرانزیکشن آئی ڈی)
                    </label>
                    <input
                      type="text"
                      value={walletTxRef}
                      onChange={(e) => setWalletTxRef(e.target.value)}
                      placeholder="e.g. TID 0498172948"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Sender Mobile # (بھیجنے والے کا نمبر)
                    </label>
                    <input
                      type="text"
                      value={walletSenderPhone}
                      onChange={(e) => setWalletSenderPhone(e.target.value)}
                      placeholder="0300-1234567"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Sub-Channel 3: Bank Transfer / IBFT */}
            {digitalSubMode === 'BANK' && (
              <div className="space-y-2 bg-white dark:bg-slate-900 p-3 rounded-xl border border-indigo-100 dark:border-indigo-950">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Receiving Bank
                    </label>
                    <select
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none text-slate-900 dark:text-white"
                    >
                      {PAKISTANI_BANKS.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      IBFT Reference / Cheque #
                    </label>
                    <input
                      type="text"
                      value={bankTxRef}
                      onChange={(e) => setBankTxRef(e.target.value)}
                      placeholder="e.g. IBFT-9182374"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* PAYMENT DETAILS: KHATA / UDHAR (SMART REAL-TIME KHATA)    */}
        {/* ========================================================= */}
        {paymentMethod === 'KHATA' && (
          <div className="bg-amber-50/70 dark:bg-amber-950/30 p-4 rounded-2xl border border-amber-200 dark:border-amber-900/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-black text-amber-900 dark:text-amber-300">
                <BookOpen className="w-4 h-4 text-amber-600" />
                <span>Customer Khata Ledger (کھاتا - ادھار فروخت)</span>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickAddCustomer(!showQuickAddCustomer)}
                className="text-xs font-bold text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200 flex items-center space-x-1"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{showQuickAddCustomer ? 'Cancel' : '+ Add New Customer'}</span>
              </button>
            </div>

            {/* Quick Add Form Inline Directly in Modal */}
            {showQuickAddCustomer ? (
              <form
                onSubmit={handleQuickAddCustomer}
                className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-amber-300 dark:border-amber-800/80 space-y-2.5 animate-fadeIn"
              >
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                  <span>Register New Khata Customer</span>
                  <span className="text-[10px] text-amber-600 font-normal">نیا کھاتہ دار</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Full Customer Name *"
                    value={newCustomerForm.name}
                    onChange={(e) =>
                      setNewCustomerForm({ ...newCustomerForm, name: e.target.value })
                    }
                    className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-900 dark:text-white"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Mobile # (0300-1234567) *"
                    value={newCustomerForm.phone}
                    onChange={(e) =>
                      setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })
                    }
                    className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Credit Limit Rs. (حد ادھار)"
                    value={newCustomerForm.creditLimit}
                    onChange={(e) =>
                      setNewCustomerForm({ ...newCustomerForm, creditLimit: e.target.value })
                    }
                    className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-900 dark:text-white"
                  />
                  <input
                    type="text"
                    placeholder="Address / Shop / Area"
                    value={newCustomerForm.address}
                    onChange={(e) =>
                      setNewCustomerForm({ ...newCustomerForm, address: e.target.value })
                    }
                    className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-900 dark:text-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={quickAddLoading}
                  className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1 shadow-xs"
                >
                  {quickAddLoading ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Save &amp; Select Customer (محفوظ اور منتخب کریں)</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div>
                {/* Search Bar */}
                <div className="relative mb-2">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search Customer by Name or Mobile (نام یا موبائل تلاش کریں)..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
                  />
                </div>

                {/* Dropdown / Selection List */}
                <div className="max-h-40 overflow-y-auto space-y-1 pr-1 border border-slate-200 dark:border-slate-800 rounded-xl p-1 bg-white dark:bg-slate-900">
                  {loadingCustomers ? (
                    <div className="p-3 text-center text-xs text-slate-400">Loading Khata accounts...</div>
                  ) : filteredCustomers.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-500">
                      No matching customer found.{' '}
                      <button
                        type="button"
                        onClick={() => setShowQuickAddCustomer(true)}
                        className="text-amber-600 dark:text-amber-400 font-bold hover:underline"
                      >
                        + Register as new
                      </button>
                    </div>
                  ) : (
                    filteredCustomers.map((c) => {
                      const isSelected = selectedKhataCustomer?._id === c._id;
                      return (
                        <div
                          key={c._id}
                          onClick={() => handleSelectCustomer(c)}
                          className={`p-2 rounded-lg cursor-pointer flex items-center justify-between text-xs transition ${
                            isSelected
                              ? 'bg-amber-500 text-white font-bold'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div>
                            <div className="font-bold flex items-center space-x-1.5">
                              <span>{c.name}</span>
                              {c.totalDebt > 0 && (
                                <span
                                  className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                                    isSelected
                                      ? 'bg-amber-600 text-white'
                                      : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                                  }`}
                                >
                                  Udhar
                                </span>
                              )}
                            </div>
                            <div
                              className={`text-[10px] ${
                                isSelected ? 'text-amber-100' : 'text-slate-400'
                              }`}
                            >
                              {c.phone} {c.address ? `• ${c.address}` : ''}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono font-black">
                              Balance: {formatCurrency(c.totalDebt || 0)}
                            </div>
                            <div
                              className={`text-[10px] ${
                                isSelected ? 'text-amber-100' : 'text-slate-400'
                              }`}
                            >
                              Limit: {c.creditLimit > 0 ? formatCurrency(c.creditLimit) : 'No Limit'}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Selected Khata Customer Ledger Summary */}
            {selectedKhataCustomer && (
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-amber-300 dark:border-amber-800 space-y-1.5 text-xs animate-fadeIn">
                <div className="flex justify-between items-center font-bold text-slate-800 dark:text-slate-200">
                  <span className="flex items-center space-x-1">
                    <User className="w-3.5 h-3.5 text-amber-600" />
                    <span>Selected Account:</span>
                  </span>
                  <span className="text-amber-700 dark:text-amber-400 font-extrabold">
                    {selectedKhataCustomer.name} ({selectedKhataCustomer.phone})
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Current Outstanding Udhar (سابقہ ادھار):</span>
                  <span className="font-semibold">{formatCurrency(khataCurrentDebt)}</span>
                </div>
                <div className="flex justify-between text-amber-700 dark:text-amber-400 font-bold">
                  <span>+ This Bill Added (نیا بل شامل):</span>
                  <span>+{formatCurrency(grandTotal)}</span>
                </div>
                <div className="flex justify-between font-black text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-slate-800">
                  <span>Total New Balance Due (کل بقایا رقم):</span>
                  <span className="text-sm text-red-600 dark:text-red-400">
                    {formatCurrency(khataProjectedDebt)}
                  </span>
                </div>

                {isKhataLimitExceeded && (
                  <div className="mt-2 p-2 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 rounded-lg flex items-center space-x-1.5 text-[11px] text-red-700 dark:text-red-300 font-bold">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-600" />
                    <span>
                      Exceeds Credit Limit of {formatCurrency(khataLimit)} by{' '}
                      {formatCurrency(khataProjectedDebt - khataLimit)}! Please adjust bill or extend limit.
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Walk-in Customer Info (For Cash/JazzCash/Bank) */}
        {paymentMethod !== 'KHATA' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Customer Name (اختیاری)
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Walk-in Customer"
                className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Customer Mobile (+92) (اختیاری)
              </label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="0300-1234567"
                className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white"
              />
            </div>
          </div>
        )}

        {/* Order Notes */}
        <div>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Order / Bill Note (Optional)..."
            className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white"
          />
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="w-1/3 py-2.5 px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isProcessing || (paymentMethod === 'KHATA' && isKhataLimitExceeded)}
            onClick={handleProcessOrder}
            className={`w-2/3 py-3 px-4 disabled:opacity-50 text-white font-extrabold rounded-xl text-sm shadow-md flex items-center justify-center space-x-2 transition ${
              paymentMethod === 'KHATA'
                ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20'
                : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
            }`}
          >
            {isProcessing ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>
                  {paymentMethod === 'KHATA'
                    ? 'Confirm Khata (Udhar) Sale'
                    : 'Confirm & Complete Sale'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default PaymentModal;
