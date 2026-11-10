import React, { useState, useEffect, useCallback } from 'react';
import { supplierService, purchaseService, productService } from '../services/api';
import { formatCurrency } from '../utils/currency';
import StatCard from '../components/common/StatCard';
import Modal from '../components/common/Modal';
import {
  Truck,
  Building2,
  Phone,
  Mail,
  PlusCircle,
  Search,
  FileText,
  DollarSign,
  ArrowDownLeft,
  CheckCircle2,
  AlertCircle,
  Package,
  Layers,
  Calendar,
  CreditCard,
  Wallet,
  ArrowRight,
  TrendingDown,
  Printer,
  Download,
} from 'lucide-react';

const SuppliersPage = () => {
  const [activeTab, setActiveTab] = useState('suppliers'); // 'suppliers' | 'purchases'

  // Data states
  const [suppliers, setSuppliers] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);

  // Selected supplier for payment
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Bank Transfer');
  const [payNotes, setPayNotes] = useState('');
  const [paySubmitting, setPaySubmitting] = useState(false);

  // New Supplier form
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    companyName: '',
    phone: '',
    email: '',
    address: '',
    balancePayable: 0,
  });
  const [supplierError, setSupplierError] = useState('');
  const [supplierSubmitting, setSupplierSubmitting] = useState(false);

  // New Purchase form
  const [newPurchase, setNewPurchase] = useState({
    supplierId: '',
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().slice(0, 10),
    items: [
      { productId: '', title: '', sku: '', quantity: 1, unitCost: 0, subtotal: 0 },
    ],
    paidAmount: '',
    paymentMethod: 'Cash',
    notes: '',
  });
  const [purchaseError, setPurchaseError] = useState('');
  const [purchaseSubmitting, setPurchaseSubmitting] = useState(false);

  // Load suppliers and purchases
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [supRes, purRes, prodRes] = await Promise.all([
        supplierService.getSuppliers({ search: searchTerm }),
        purchaseService.getPurchases(),
        productService.getProducts({ limit: 100 }),
      ]);

      if (supRes.data.success) {
        setSuppliers(supRes.data.suppliers || []);
      }
      if (purRes.data.success) {
        setPurchases(purRes.data.purchases || []);
      }
      if (prodRes.data.products) {
        setAllProducts(prodRes.data.products || []);
      }
    } catch (err) {
      console.error('Failed to load supplier & purchase data:', err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Aggregate KPI metrics
  const totalPayable = suppliers.reduce((sum, s) => sum + (Number(s.balancePayable) || 0), 0);
  const totalPurchasesVolume = suppliers.reduce((sum, s) => sum + (Number(s.totalPurchases) || 0), 0);
  const totalPaidVolume = suppliers.reduce((sum, s) => sum + (Number(s.totalPaid) || 0), 0);

  // Handle create supplier
  const handleCreateSupplier = async (e) => {
    e.preventDefault();
    setSupplierError('');
    if (!newSupplier.name.trim()) {
      setSupplierError('Contact person name is required.');
      return;
    }
    if (!newSupplier.phone.trim()) {
      setSupplierError('Contact phone number is required.');
      return;
    }

    try {
      setSupplierSubmitting(true);
      const res = await supplierService.createSupplier(newSupplier);
      if (res.data.success) {
        setIsSupplierModalOpen(false);
        setNewSupplier({
          name: '',
          companyName: '',
          phone: '',
          email: '',
          address: '',
          balancePayable: 0,
        });
        fetchData();
      }
    } catch (err) {
      setSupplierError(err.response?.data?.message || 'Failed to create supplier');
    } finally {
      setSupplierSubmitting(false);
    }
  };

  // Handle supplier payment
  const handlePaySupplier = async (e) => {
    e.preventDefault();
    if (!selectedSupplier) return;
    const amount = parseFloat(payAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }

    try {
      setPaySubmitting(true);
      const res = await supplierService.paySupplier(selectedSupplier._id, {
        amount,
        paymentMethod: payMethod,
        notes: payNotes,
      });
      if (res.data.success) {
        setIsPayModalOpen(false);
        setSelectedSupplier(null);
        setPayAmount('');
        setPayNotes('');
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record supplier payment');
    } finally {
      setPaySubmitting(false);
    }
  };

  // Purchase Items Helpers
  const handleItemProductSelect = (index, productId) => {
    const selectedProd = allProducts.find((p) => p._id === productId);
    const updated = [...newPurchase.items];
    if (selectedProd) {
      updated[index] = {
        ...updated[index],
        productId: selectedProd._id,
        title: selectedProd.title,
        sku: selectedProd.sku || '',
        unitCost: selectedProd.costPrice || 0,
        subtotal: (selectedProd.costPrice || 0) * (updated[index].quantity || 1),
      };
    } else {
      updated[index] = {
        ...updated[index],
        productId: '',
        title: '',
        sku: '',
        unitCost: 0,
        subtotal: 0,
      };
    }
    setNewPurchase({ ...newPurchase, items: updated });
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...newPurchase.items];
    const item = { ...updated[index], [field]: value };
    const qty = parseFloat(field === 'quantity' ? value : item.quantity) || 0;
    const cost = parseFloat(field === 'unitCost' ? value : item.unitCost) || 0;
    item.subtotal = Math.round(qty * cost * 100) / 100;
    updated[index] = item;
    setNewPurchase({ ...newPurchase, items: updated });
  };

  const addItemRow = () => {
    setNewPurchase({
      ...newPurchase,
      items: [
        ...newPurchase.items,
        { productId: '', title: '', sku: '', quantity: 1, unitCost: 0, subtotal: 0 },
      ],
    });
  };

  const removeItemRow = (index) => {
    if (newPurchase.items.length <= 1) return;
    const updated = newPurchase.items.filter((_, i) => i !== index);
    setNewPurchase({ ...newPurchase, items: updated });
  };

  const invoiceTotal = newPurchase.items.reduce((sum, it) => sum + (Number(it.subtotal) || 0), 0);

  // Handle submit purchase
  const handleCreatePurchase = async (e) => {
    e.preventDefault();
    setPurchaseError('');

    if (!newPurchase.supplierId) {
      setPurchaseError('Please select a supplier.');
      return;
    }
    const validItems = newPurchase.items.filter((it) => it.title.trim() && it.quantity > 0);
    if (validItems.length === 0) {
      setPurchaseError('Please add at least one valid product item.');
      return;
    }

    try {
      setPurchaseSubmitting(true);
      const res = await purchaseService.createPurchase({
        ...newPurchase,
        items: validItems,
        paidAmount: parseFloat(newPurchase.paidAmount) || 0,
      });

      if (res.data.success) {
        setIsPurchaseModalOpen(false);
        setNewPurchase({
          supplierId: '',
          invoiceNumber: '',
          invoiceDate: new Date().toISOString().slice(0, 10),
          items: [{ productId: '', title: '', sku: '', quantity: 1, unitCost: 0, subtotal: 0 }],
          paidAmount: '',
          paymentMethod: 'Cash',
          notes: '',
        });
        fetchData();
        alert('Wholesale purchase logged! Inventory stock has been automatically incremented.');
      }
    } catch (err) {
      setPurchaseError(err.response?.data?.message || 'Failed to save purchase invoice');
    } finally {
      setPurchaseSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Suppliers & Wholesale Purchases
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 rounded-full">
              Auto Stock Inward
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage wholesale distributors, log stock delivery invoices, and track accounts payable
          </p>
        </div>

        <div className="flex items-center space-x-3 flex-wrap">
          <button
            type="button"
            onClick={() => setIsSupplierModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition flex items-center space-x-1.5"
          >
            <Building2 className="w-4 h-4 text-indigo-500" />
            <span>New Supplier</span>
          </button>

          <button
            type="button"
            onClick={() => setIsPurchaseModalOpen(true)}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition flex items-center space-x-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Log Purchase / Inward Stock</span>
          </button>
        </div>
      </div>

      {/* KPI Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Wholesale Payable"
          value={formatCurrency(totalPayable)}
          icon={TrendingDown}
          color="rose"
          subtitle="Outstanding balance due to suppliers"
        />
        <StatCard
          title="Active Suppliers"
          value={suppliers.length}
          icon={Building2}
          color="indigo"
          subtitle="Distributors & wholesale vendors"
        />
        <StatCard
          title="Total Purchases Logged"
          value={formatCurrency(totalPurchasesVolume)}
          icon={Package}
          color="blue"
          subtitle={`${purchases.length} inward invoices received`}
        />
        <StatCard
          title="Total Paid to Suppliers"
          value={formatCurrency(totalPaidVolume)}
          icon={CheckCircle2}
          color="emerald"
          subtitle="Settled wholesale payments"
        />
      </div>

      {/* Navigation Switcher Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
        <div className="flex space-x-6">
          <button
            onClick={() => setActiveTab('suppliers')}
            className={`pb-3 text-xs font-bold transition flex items-center space-x-2 border-b-2 ${
              activeTab === 'suppliers'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Suppliers & Accounts Payable ({suppliers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('purchases')}
            className={`pb-3 text-xs font-bold transition flex items-center space-x-2 border-b-2 ${
              activeTab === 'purchases'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Purchase Invoices & Inward Stock ({purchases.length})</span>
          </button>
        </div>

        {activeTab === 'suppliers' && (
          <div className="relative w-64 pb-2">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search suppliers..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
            />
          </div>
        )}
      </div>

      {/* TAB 1: SUPPLIERS DIRECTORY */}
      {activeTab === 'suppliers' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                <tr>
                  <th className="py-3.5 px-4">Supplier / Vendor</th>
                  <th className="py-3.5 px-4">Contact Phone</th>
                  <th className="py-3.5 px-4 text-right">Total Invoiced</th>
                  <th className="py-3.5 px-4 text-right">Total Paid</th>
                  <th className="py-3.5 px-4 text-right">Balance Payable</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-400">
                      <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      Loading suppliers...
                    </td>
                  </tr>
                ) : suppliers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-400">
                      <Building2 className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                      <p className="font-semibold">No suppliers found.</p>
                      <p className="text-[11px] mt-0.5">Click "New Supplier" to register your wholesale distributors.</p>
                    </td>
                  </tr>
                ) : (
                  suppliers.map((s) => {
                    const hasDue = Number(s.balancePayable) > 0;
                    return (
                      <tr key={s._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-850/60 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                            <span>{s.companyName || s.name}</span>
                          </div>
                          {s.companyName && s.name && (
                            <div className="text-[11px] text-slate-400 font-medium">Rep: {s.name}</div>
                          )}
                          {s.address && (
                            <div className="text-[10px] text-slate-400 truncate max-w-xs">{s.address}</div>
                          )}
                        </td>

                        <td className="py-3.5 px-4 font-mono font-semibold text-slate-700 dark:text-slate-300">
                          {s.phone}
                        </td>

                        <td className="py-3.5 px-4 text-right font-medium text-slate-600 dark:text-slate-400">
                          {formatCurrency(s.totalPurchases || 0)}
                        </td>

                        <td className="py-3.5 px-4 text-right font-medium text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(s.totalPaid || 0)}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <span
                            className={`font-black text-sm ${
                              hasDue ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'
                            }`}
                          >
                            {formatCurrency(s.balancePayable || 0)}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {hasDue && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedSupplier(s);
                                  setPayAmount(s.balancePayable.toString());
                                  setIsPayModalOpen(true);
                                }}
                                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 transition flex items-center space-x-1"
                              >
                                <DollarSign className="w-3.5 h-3.5" />
                                <span>Pay</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                setNewPurchase({
                                  ...newPurchase,
                                  supplierId: s._id,
                                });
                                setIsPurchaseModalOpen(true);
                              }}
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 transition flex items-center space-x-1"
                            >
                              <PlusCircle className="w-3.5 h-3.5" />
                              <span>Inward Stock</span>
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
      )}

      {/* TAB 2: PURCHASE INVOICES */}
      {activeTab === 'purchases' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4">Items Summary</th>
                  <th className="py-3 px-4 text-right">Invoice Total</th>
                  <th className="py-3 px-4 text-right">Amount Paid</th>
                  <th className="py-3 px-4 text-right">Balance Due</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-slate-400">
                      <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      Loading purchase invoices...
                    </td>
                  </tr>
                ) : purchases.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-slate-400">
                      <FileText className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                      <p className="font-semibold">No purchase invoices recorded yet.</p>
                      <p className="text-[11px] mt-0.5">Click "Log Purchase / Inward Stock" to log delivery goods.</p>
                    </td>
                  </tr>
                ) : (
                  purchases.map((p) => {
                    const statusColor =
                      p.status === 'PAID'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : p.status === 'PARTIAL'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300';

                    return (
                      <tr key={p._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-850/60 transition">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                          {p.invoiceNumber || 'INV-NA'}
                        </td>
                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                          {new Date(p.invoiceDate).toLocaleDateString('en-PK', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                          {p.supplierName || 'Wholesale Supplier'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-slate-600 dark:text-slate-400 font-medium">
                            {p.items?.length || 0} product(s) (
                            {p.items?.reduce((sum, it) => sum + it.quantity, 0)} units)
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">
                          {formatCurrency(p.totalAmount)}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-emerald-600">
                          {formatCurrency(p.paidAmount || 0)}
                        </td>
                        <td className="py-3 px-4 text-right font-black text-rose-600">
                          {formatCurrency(p.balanceDue || 0)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase ${statusColor}`}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal 1: New Supplier */}
      <Modal
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        title="Register Wholesale Supplier"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateSupplier} className="space-y-3.5">
          {supplierError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 rounded-xl flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{supplierError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Company / Agency Name *
            </label>
            <input
              type="text"
              required
              value={newSupplier.companyName}
              onChange={(e) => setNewSupplier({ ...newSupplier, companyName: e.target.value })}
              placeholder="e.g. Metro Wholesale Foods / National Beverage Agency"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Contact Person / Sales Representative *
            </label>
            <input
              type="text"
              required
              value={newSupplier.name}
              onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
              placeholder="e.g. Tariq Mehmood"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                required
                value={newSupplier.phone}
                onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                placeholder="0300 1234567"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none font-mono text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={newSupplier.email}
                onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                placeholder="supplier@mail.com"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Warehouse / Business Address
            </label>
            <input
              type="text"
              value={newSupplier.address}
              onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
              placeholder="e.g. Akbari Mandi, Lahore"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Initial Payable Balance (if any)
            </label>
            <input
              type="number"
              min="0"
              value={newSupplier.balancePayable}
              onChange={(e) => setNewSupplier({ ...newSupplier, balancePayable: parseFloat(e.target.value) || 0 })}
              placeholder="0"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none font-mono text-slate-900 dark:text-white"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsSupplierModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={supplierSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition disabled:opacity-50"
            >
              {supplierSubmitting ? 'Registering...' : 'Register Supplier'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Pay Supplier */}
      <Modal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        title={`Settle Payable to ${selectedSupplier?.companyName || selectedSupplier?.name}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handlePaySupplier} className="space-y-3.5">
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl">
            <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-300">
              Current Outstanding Balance:
            </span>
            <div className="text-xl font-black text-rose-700 dark:text-rose-400">
              {formatCurrency(selectedSupplier?.balancePayable || 0)}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Payment Amount (PKR) *
            </label>
            <input
              type="number"
              required
              min="1"
              step="any"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              placeholder="e.g. 10000"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['Cash', 'Bank Transfer', 'Cheque'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPayMethod(m)}
                  className={`py-2 text-xs font-bold rounded-xl border transition ${
                    payMethod === m
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Cheque / Transaction Ref / Remarks
            </label>
            <input
              type="text"
              value={payNotes}
              onChange={(e) => setPayNotes(e.target.value)}
              placeholder="e.g. Transferred via HBL Raast"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsPayModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={paySubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition disabled:opacity-50"
            >
              {paySubmitting ? 'Recording...' : 'Confirm Payment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 3: Log Purchase & Inward Stock */}
      <Modal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        title="Log Wholesale Purchase Invoice (Auto Stock Inward)"
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleCreatePurchase} className="space-y-4">
          {purchaseError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 rounded-xl flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{purchaseError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Select Supplier *
              </label>
              <select
                required
                value={newPurchase.supplierId}
                onChange={(e) => setNewPurchase({ ...newPurchase, supplierId: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none font-semibold text-slate-900 dark:text-white"
              >
                <option value="">-- Choose Supplier --</option>
                {suppliers.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.companyName || s.name} ({s.phone})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Supplier Invoice Number
              </label>
              <input
                type="text"
                value={newPurchase.invoiceNumber}
                onChange={(e) => setNewPurchase({ ...newPurchase, invoiceNumber: e.target.value })}
                placeholder="e.g. INV-9082"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none font-mono text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Invoice Date *
              </label>
              <input
                type="date"
                required
                value={newPurchase.invoiceDate}
                onChange={(e) => setNewPurchase({ ...newPurchase, invoiceDate: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Dynamic Inward Stock Items Table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-850/40 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Inward Stock Items (Stock will auto-increment on submit)
              </span>
              <button
                type="button"
                onClick={addItemRow}
                className="px-2.5 py-1 text-xs font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 transition flex items-center space-x-1"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {newPurchase.items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                  {/* Product Picker */}
                  <div className="col-span-5">
                    <select
                      value={item.productId}
                      onChange={(e) => handleItemProductSelect(idx, e.target.value)}
                      className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none font-medium text-slate-900 dark:text-white"
                    >
                      <option value="">-- Select Store Product or Custom --</option>
                      {allProducts.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.title} (Stock: {p.stockQuantity} | Cost: Rs {p.costPrice})
                        </option>
                      ))}
                    </select>
                    {!item.productId && (
                      <input
                        type="text"
                        placeholder="Or type product title manually"
                        value={item.title}
                        onChange={(e) => handleItemChange(idx, 'title', e.target.value)}
                        className="mt-1 w-full px-2 py-1 text-[11px] bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                      />
                    )}
                  </div>

                  {/* Quantity */}
                  <div className="col-span-2">
                    <input
                      type="number"
                      step="any"
                      min="0.1"
                      required
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                      className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none font-bold text-center text-slate-900 dark:text-white"
                    />
                  </div>

                  {/* Unit Wholesale Cost */}
                  <div className="col-span-2">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      required
                      placeholder="Cost"
                      value={item.unitCost}
                      onChange={(e) => handleItemChange(idx, 'unitCost', e.target.value)}
                      className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none font-mono text-right text-slate-900 dark:text-white"
                    />
                  </div>

                  {/* Subtotal */}
                  <div className="col-span-2 text-right font-black text-xs text-indigo-600 dark:text-indigo-400">
                    {formatCurrency(item.subtotal)}
                  </div>

                  {/* Remove */}
                  <div className="col-span-1 text-center">
                    <button
                      type="button"
                      disabled={newPurchase.items.length <= 1}
                      onClick={() => removeItemRow(idx)}
                      className="text-slate-400 hover:text-red-500 disabled:opacity-30"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Row */}
            <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700 px-2 font-black text-sm">
              <span>Invoice Total:</span>
              <span className="text-indigo-600 dark:text-indigo-400">{formatCurrency(invoiceTotal)}</span>
            </div>
          </div>

          {/* Payment Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Amount Paid Upfront (PKR)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={newPurchase.paidAmount}
                onChange={(e) => setNewPurchase({ ...newPurchase, paidAmount: e.target.value })}
                placeholder="0 (or leave empty if full credit)"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Remaining balance ({formatCurrency(Math.max(0, invoiceTotal - (parseFloat(newPurchase.paidAmount) || 0)))}) will be added to supplier payable.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Payment Mode
              </label>
              <select
                value={newPurchase.paymentMethod}
                onChange={(e) => setNewPurchase({ ...newPurchase, paymentMethod: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white"
              >
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer / Raast</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Remarks / Gate Pass Reference (Optional)
            </label>
            <input
              type="text"
              value={newPurchase.notes}
              onChange={(e) => setNewPurchase({ ...newPurchase, notes: e.target.value })}
              placeholder="e.g. Delivery truck # LEB-4412, received in good condition"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsPurchaseModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={purchaseSubmitting || invoiceTotal <= 0}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition disabled:opacity-50"
            >
              {purchaseSubmitting ? 'Inwarding Stock...' : 'Save & Inward Stock'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SuppliersPage;
