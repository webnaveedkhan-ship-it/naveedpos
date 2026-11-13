import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { useCart } from '../../context/CartContext';
import { orderService, khataService } from '../../services/api';
import { formatCurrency, PAKISTANI_BANKNOTES } from '../../utils/currency';
import {
  Banknote,
  CreditCard,
  Split,
  BookOpen,
  Check,
  AlertCircle,
  UserPlus,
  Search,
  AlertTriangle,
  UserCheck,
  ChevronDown,
} from 'lucide-react';

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

  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash', 'card', 'khata', 'split'
  const [cashTendered, setCashTendered] = useState('');
  const [splitCash, setSplitCash] = useState('');
  const [cardLast4, setCardLast4] = useState('4242');
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Khata (Udhar) customer state
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
      const res = await khataService.getCustomers({ search, limit: 50 });
      if (res.data.success) {
        setCustomers(res.data.customers || []);
      }
    } catch (err) {
      console.error('Failed to load Khata customers:', err);
    } finally {
      setLoadingCustomers(false);
    }
  };

  // Reset or preset values when modal opens
  useEffect(() => {
    if (isOpen) {
      setCashTendered(grandTotal.toString());
      setSplitCash((grandTotal / 2).toFixed(0));
      setErrorMsg('');
      setSelectedKhataCustomer(null);
      setShowQuickAddCustomer(false);
      loadKhataCustomers();
    }
  }, [isOpen, grandTotal]);

  const tenderedNum = parseFloat(cashTendered) || 0;
  const changeDue = Math.max(0, tenderedNum - grandTotal);
  const remainingDue = Math.max(0, grandTotal - tenderedNum);

  // Split payment math
  const splitCashNum = parseFloat(splitCash) || 0;
  const splitCardNum = Math.max(0, grandTotal - splitCashNum);

  // Khata credit limit check
  const khataCurrentDebt = selectedKhataCustomer?.totalDebt || 0;
  const khataLimit = selectedKhataCustomer?.creditLimit || 0;
  const khataProjectedDebt = khataCurrentDebt + grandTotal;
  const isKhataLimitExceeded = khataLimit > 0 && khataProjectedDebt > khataLimit;

  // Handle Quick Tender Cash buttons
  const handleQuickCash = (amount) => {
    if (amount === 'exact') {
      setCashTendered(grandTotal.toFixed(0));
    } else {
      setCashTendered(amount.toString());
    }
  };

  // Quick register customer inline
  const handleQuickAddCustomer = async (e) => {
    e.preventDefault();
    if (!newCustomerForm.name.trim() || !newCustomerForm.phone.trim()) {
      setErrorMsg('Customer name and phone number are required for Khata registration.');
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

      if (res.data.success) {
        const created = res.data.customer;
        setCustomers((prev) => [created, ...prev]);
        setSelectedKhataCustomer(created);
        setCustomerName(created.name);
        setCustomerPhone(created.phone);
        setShowQuickAddCustomer(false);
        setNewCustomerForm({ name: '', phone: '', address: '', creditLimit: '10000' });
      }
    } catch (err) {
      console.error('Quick add customer error:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to add customer to Khata.');
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

    // Validation
    if (paymentMethod === 'cash' && tenderedNum < grandTotal) {
      setErrorMsg(`Insufficient cash tendered. Balance due: ${formatCurrency(remainingDue)}`);
      return;
    }

    if (paymentMethod === 'split') {
      if (splitCashNum < 0 || splitCashNum > grandTotal) {
        setErrorMsg('Invalid split cash portion.');
        return;
      }
    }

    if (paymentMethod === 'khata') {
      if (!selectedKhataCustomer) {
        setErrorMsg('Please select or register a customer to record this sale as Khata (Udhar).');
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
      const orderPayload = {
        items: cartItems.map((item) => ({
          product: item.product,
          title: item.title,
          sku: item.sku,
          price: item.price,
          costPrice: item.costPrice,
          quantity: item.quantity,
          subtotal: item.subtotal,
        })),
        subtotal,
        taxRate,
        taxAmount,
        discountType,
        discountValue,
        discountAmount,
        grandTotal,
        paymentMethod: paymentMethod.toUpperCase(),
        paymentDetails: {
          cashTendered:
            paymentMethod === 'cash'
              ? tenderedNum
              : paymentMethod === 'split'
              ? splitCashNum
              : 0,
          changeGiven: paymentMethod === 'cash' ? Number(changeDue.toFixed(2)) : 0,
          cardAmount:
            paymentMethod === 'card'
              ? grandTotal
              : paymentMethod === 'split'
              ? Number(splitCardNum.toFixed(2))
              : 0,
          cardLast4: paymentMethod === 'card' || paymentMethod === 'split' ? cardLast4 : '',
          cashAmount: paymentMethod === 'split' ? splitCashNum : 0,
          khataAmount: paymentMethod === 'khata' ? grandTotal : 0,
          previousDebt: paymentMethod === 'khata' ? khataCurrentDebt : 0,
          balanceAfter: paymentMethod === 'khata' ? khataProjectedDebt : 0,
        },
        customer: {
          khataId: selectedKhataCustomer ? selectedKhataCustomer._id : null,
          name: customerName || 'Walk-in Customer',
          phone: customerPhone || '',
        },
        notes,
      };

      const res = await orderService.createOrder(orderPayload);
      if (res.data.success) {
        clearCart();
        onClose();
        onOrderCompleted(res.data.order);
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
    <Modal isOpen={isOpen} onClose={onClose} title="Complete Checkout" maxWidth="max-w-xl">
      <div className="space-y-4">
        {/* Total Banner */}
        <div className="bg-slate-900 text-white rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
              Total Amount Payable
            </span>
            <div className="text-3xl font-black text-brand-400">
              {formatCurrency(grandTotal)}
            </div>
          </div>
          <div className="text-right text-xs text-slate-400">
            <div>Items: {cartItems.length}</div>
            <div>Tax: {formatCurrency(taxAmount)}</div>
          </div>
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl flex items-center text-xs text-red-700 dark:text-red-300 font-medium">
            <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Payment Method Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
            Payment Method
          </label>
          <div className="grid grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => setPaymentMethod('cash')}
              className={`p-2.5 rounded-xl border flex flex-col items-center justify-center space-y-1 font-semibold text-xs transition ${
                paymentMethod === 'cash'
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Banknote className="w-5 h-5 text-emerald-600" />
              <span>Cash</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('card')}
              className={`p-2.5 rounded-xl border flex flex-col items-center justify-center space-y-1 font-semibold text-xs transition ${
                paymentMethod === 'card'
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <CreditCard className="w-5 h-5 text-blue-600" />
              <span>Card / POS</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('khata')}
              className={`p-2.5 rounded-xl border flex flex-col items-center justify-center space-y-1 font-semibold text-xs transition ${
                paymentMethod === 'khata'
                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <BookOpen className="w-5 h-5 text-amber-600" />
              <span>Khata (Udhar)</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('split')}
              className={`p-2.5 rounded-xl border flex flex-col items-center justify-center space-y-1 font-semibold text-xs transition ${
                paymentMethod === 'split'
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Split className="w-5 h-5 text-purple-600" />
              <span>Split</span>
            </button>
          </div>
        </div>

        {/* Dynamic Payment Details: CASH */}
        {paymentMethod === 'cash' && (
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Amount Tendered (Rs.)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={cashTendered}
                onChange={(e) => setCashTendered(e.target.value)}
                autoFocus
                placeholder="0"
                className="w-full px-3 py-2.5 text-lg font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>

            {/* Quick Tender Pakistani Banknotes */}
            <div>
              <span className="block text-[11px] font-semibold text-slate-500 mb-1.5">
                Quick Pakistani Banknotes:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickCash('exact')}
                  className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Exact ({formatCurrency(grandTotal)})
                </button>
                {PAKISTANI_BANKNOTES.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleQuickCash(amt)}
                    className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200"
                  >
                    Rs. {amt.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Change Due Box */}
            <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                Change to Return:
              </span>
              <span
                className={`text-xl font-black ${
                  tenderedNum >= grandTotal ? 'text-emerald-600' : 'text-amber-500'
                }`}
              >
                {formatCurrency(changeDue)}
              </span>
            </div>
          </div>
        )}

        {/* Dynamic Payment Details: CARD */}
        {paymentMethod === 'card' && (
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center space-x-2 text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 p-2.5 rounded-xl">
              <CreditCard className="w-4 h-4 flex-shrink-0" />
              <span>Card terminal ready: Swipe, insert chip, or tap PayPak / Visa / Mastercard.</span>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Card Reference / Last 4 Digits (Optional)
              </label>
              <input
                type="text"
                maxLength="4"
                value={cardLast4}
                onChange={(e) => setCardLast4(e.target.value)}
                placeholder="4242"
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>
          </div>
        )}

        {/* Dynamic Payment Details: KHATA (UDHAR) */}
        {paymentMethod === 'khata' && (
          <div className="bg-amber-50/60 dark:bg-amber-950/20 p-4 rounded-2xl border border-amber-200 dark:border-amber-900/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-bold text-amber-800 dark:text-amber-300">
                <BookOpen className="w-4 h-4" />
                <span>Customer Khata (Credit / Udhar Sale)</span>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickAddCustomer(!showQuickAddCustomer)}
                className="text-xs font-bold text-amber-700 dark:text-amber-400 hover:text-amber-900 flex items-center space-x-1"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{showQuickAddCustomer ? 'Cancel' : '+ New Customer'}</span>
              </button>
            </div>

            {/* Quick Add Form Inline */}
            {showQuickAddCustomer ? (
              <form
                onSubmit={handleQuickAddCustomer}
                className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-amber-300 dark:border-amber-800/80 space-y-2.5"
              >
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Quick Add New Khata Customer
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Full Name *"
                    value={newCustomerForm.name}
                    onChange={(e) =>
                      setNewCustomerForm({ ...newCustomerForm, name: e.target.value })
                    }
                    className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Phone (0300-1234567) *"
                    value={newCustomerForm.phone}
                    onChange={(e) =>
                      setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })
                    }
                    className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Credit Limit (Rs.)"
                    value={newCustomerForm.creditLimit}
                    onChange={(e) =>
                      setNewCustomerForm({ ...newCustomerForm, creditLimit: e.target.value })
                    }
                    className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                  />
                  <input
                    type="text"
                    placeholder="Address / Area"
                    value={newCustomerForm.address}
                    onChange={(e) =>
                      setNewCustomerForm({ ...newCustomerForm, address: e.target.value })
                    }
                    className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={quickAddLoading}
                  className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1"
                >
                  {quickAddLoading ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Save & Select Customer</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div>
                {/* Search / Select Customer */}
                <div className="relative mb-2">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by customer name or phone..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                  />
                </div>

                {/* Customer List selection box */}
                <div className="max-h-36 overflow-y-auto space-y-1 pr-1 border border-slate-200 dark:border-slate-800 rounded-xl p-1 bg-white dark:bg-slate-900">
                  {loadingCustomers ? (
                    <div className="p-3 text-center text-xs text-slate-400">Loading customers...</div>
                  ) : filteredCustomers.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-400">
                      No matching Khata customers found.{' '}
                      <button
                        type="button"
                        onClick={() => setShowQuickAddCustomer(true)}
                        className="text-amber-600 font-bold hover:underline"
                      >
                        Register new
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
                            <div className="font-semibold">{c.name}</div>
                            <div
                              className={`text-[10px] ${
                                isSelected ? 'text-amber-100' : 'text-slate-400'
                              }`}
                            >
                              {c.phone} {c.address ? `• ${c.address}` : ''}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono font-bold">
                              {formatCurrency(c.totalDebt || 0)}
                            </div>
                            <div
                              className={`text-[10px] ${
                                isSelected ? 'text-amber-100' : 'text-slate-400'
                              }`}
                            >
                              Limit: {c.creditLimit > 0 ? formatCurrency(c.creditLimit) : 'Unlimited'}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Selected Customer Ledger Summary */}
            {selectedKhataCustomer && (
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-amber-200 dark:border-amber-900/60 space-y-1.5 text-xs">
                <div className="flex justify-between items-center font-bold text-slate-800 dark:text-slate-200">
                  <span>Selected Customer:</span>
                  <span className="text-amber-600 dark:text-amber-400">
                    {selectedKhataCustomer.name} ({selectedKhataCustomer.phone})
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Current Outstanding Udhar:</span>
                  <span className="font-semibold">{formatCurrency(khataCurrentDebt)}</span>
                </div>
                <div className="flex justify-between text-amber-700 dark:text-amber-400 font-bold">
                  <span>+ This Sale (To be added):</span>
                  <span>+{formatCurrency(grandTotal)}</span>
                </div>
                <div className="flex justify-between font-black text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-slate-800">
                  <span>New Balance Due:</span>
                  <span className="text-sm text-red-600 dark:text-red-400">
                    {formatCurrency(khataProjectedDebt)}
                  </span>
                </div>

                {isKhataLimitExceeded && (
                  <div className="mt-2 p-2 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-lg flex items-center space-x-1.5 text-[11px] text-red-700 dark:text-red-300 font-bold">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-600" />
                    <span>
                      Exceeds Credit Limit of {formatCurrency(khataLimit)} by{' '}
                      {formatCurrency(khataProjectedDebt - khataLimit)}! Sale cannot proceed.
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Dynamic Payment Details: SPLIT */}
        {paymentMethod === 'split' && (
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Cash Portion (Rs.)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                max={grandTotal}
                value={splitCash}
                onChange={(e) => setSplitCash(e.target.value)}
                className="w-full px-3 py-2 text-sm font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white"
              />
            </div>
            <div className="flex items-center justify-between text-xs p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="font-semibold text-slate-600 dark:text-slate-400">
                Card Portion Balance:
              </span>
              <span className="font-black text-blue-600 dark:text-blue-400 text-sm">
                {formatCurrency(splitCardNum)}
              </span>
            </div>
          </div>
        )}

        {/* Customer Info (For Cash/Card/Split) */}
        {paymentMethod !== 'khata' && (
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Customer Name
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
                Customer Mobile (+92)
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

        {/* Action Buttons */}
        <div className="pt-2 flex items-center space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="w-1/3 py-2.5 px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs hover:bg-slate-200 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isProcessing || (paymentMethod === 'khata' && isKhataLimitExceeded)}
            onClick={handleProcessOrder}
            className="w-2/3 py-3 px-4 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-extrabold rounded-xl text-sm shadow-md shadow-brand-500/20 flex items-center justify-center space-x-2 transition"
          >
            {isProcessing ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>
                  {paymentMethod === 'khata' ? 'Confirm Khata (Udhar) Sale' : 'Confirm & Complete Sale'}
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
