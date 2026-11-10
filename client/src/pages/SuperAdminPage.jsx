import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { superAdminService } from '../services/api';
import Modal from '../components/common/Modal';
import SuperAdminDashboard from '../components/superadmin/SuperAdminDashboard';
import TenantsDirectory from '../components/superadmin/TenantsDirectory';
import PaymentApprovals from '../components/superadmin/PaymentApprovals';
import SystemBroadcast from '../components/superadmin/SystemBroadcast';
import SecurityAuditTrail from '../components/superadmin/SecurityAuditTrail';
import {
  ShieldCheck,
  Building2,
  CreditCard,
  Megaphone,
  ShieldAlert,
  Activity,
  Plus,
  RefreshCw,
  Clock,
  Check,
  X,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

const SuperAdminPage = () => {
  const { tab } = useParams();
  const navigate = useNavigate();
  const { impersonateStore } = useAuth();

  // Tab mapping
  const validTabs = ['telemetry', 'tenants', 'payments', 'broadcast', 'audit'];
  const activeTab = validTabs.includes(tab) ? tab : 'telemetry';

  const handleTabChange = (newTab) => {
    if (newTab === 'telemetry') {
      navigate('/super-admin');
    } else {
      navigate(`/super-admin/${newTab}`);
    }
  };

  // State
  const [metrics, setMetrics] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [payments, setPayments] = useState([]);
  const [broadcasts, setBroadcasts] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('pending');
  const [auditActionFilter, setAuditActionFilter] = useState('all');
  const [auditSearchTerm, setAuditSearchTerm] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTenantData, setNewTenantData] = useState({
    name: '',
    slug: '',
    ownerName: '',
    ownerEmail: '',
    ownerPassword: '',
    phone: '',
    city: 'Islamabad',
    address: '',
    subscriptionMonths: '12',
    plan: 'standard',
  });
  const [modalError, setModalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick Extend Modal
  const [extendModalTenant, setExtendModalTenant] = useState(null);
  const [extendDays, setExtendDays] = useState('30');

  // Plan Override Modal
  const [planModalTenant, setPlanModalTenant] = useState(null);
  const [selectedNewPlan, setSelectedNewPlan] = useState('standard');
  const [planExtendDays, setPlanExtendDays] = useState('30');
  const [customLimits, setCustomLimits] = useState({
    maxProducts: '',
    maxKhataCustomers: '',
    allowBarcodeGen: true,
    allowWhatsApp: true,
    allowFractionalUnits: true,
  });

  // Reject Payment Modal
  const [rejectModalPayment, setRejectModalPayment] = useState(null);
  const [rejectionReason, setRejectionReason] = useState(
    'Transaction reference not verified in bank account.'
  );

  // Lightbox Modal
  const [lightboxImage, setLightboxImage] = useState(null);

  // Purge Data Modal
  const [purgeModalTenant, setPurgeModalTenant] = useState(null);
  const [purgeConfirmationText, setPurgeConfirmationText] = useState('');
  const [purgeProductsOption, setPurgeProductsOption] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [broadcastSubmitting, setBroadcastSubmitting] = useState(false);

  // Data Fetching
  const fetchPlatformData = useCallback(async () => {
    try {
      setRefreshing(true);
      const [metricsRes, tenantsRes, paymentsRes, broadcastsRes, auditRes] = await Promise.all([
        superAdminService.getMetrics(),
        superAdminService.getTenants({
          search: searchTerm,
          status: statusFilter,
          plan: planFilter,
        }),
        superAdminService.getPayments({ status: paymentStatusFilter }),
        superAdminService.getBroadcasts(),
        superAdminService.getAuditLogs({
          action: auditActionFilter,
          search: auditSearchTerm,
          limit: 50,
        }),
      ]);

      if (metricsRes.data?.success) setMetrics(metricsRes.data.metrics);
      if (tenantsRes.data?.success) setTenants(tenantsRes.data.tenants);
      if (paymentsRes.data?.success) setPayments(paymentsRes.data.payments);
      if (broadcastsRes.data?.success) setBroadcasts(broadcastsRes.data.broadcasts);
      if (auditRes.data?.success) setAuditLogs(auditRes.data.auditLogs);
    } catch (err) {
      console.error('Failed to load Super Admin data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [
    searchTerm,
    statusFilter,
    planFilter,
    paymentStatusFilter,
    auditActionFilter,
    auditSearchTerm,
  ]);

  useEffect(() => {
    fetchPlatformData();
  }, [fetchPlatformData]);

  // Actions
  const handleToggleStatus = async (tenantId, currentStatus) => {
    const nextStatus =
      currentStatus === 'active' || currentStatus === 'trial' ? 'suspended' : 'active';
    try {
      await superAdminService.toggleStatus(tenantId, nextStatus);
      fetchPlatformData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update store status');
    }
  };

  const handleQuickExtend = async (tenantId, days) => {
    try {
      await superAdminService.quickExtend(tenantId, Number(days));
      setExtendModalTenant(null);
      fetchPlatformData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to extend store subscription');
    }
  };

  const handleQuickPlanChange = async (tenantId, newPlan) => {
    try {
      await superAdminService.updateTenantPlan(tenantId, { plan: newPlan });
      fetchPlatformData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update store plan');
    }
  };

  const handleOpenPlanModal = (tenant) => {
    setPlanModalTenant(tenant);
    setSelectedNewPlan(tenant.plan || 'standard');
    setPlanExtendDays('30');
    setCustomLimits({
      maxProducts:
        tenant.planLimits?.maxProducts >= 99999
          ? 'Unlimited'
          : tenant.planLimits?.maxProducts || '',
      maxKhataCustomers:
        tenant.planLimits?.maxKhataCustomers >= 99999
          ? 'Unlimited'
          : tenant.planLimits?.maxKhataCustomers || '',
      allowBarcodeGen: tenant.planLimits?.allowBarcodeGen ?? true,
      allowWhatsApp: tenant.planLimits?.allowWhatsApp ?? true,
      allowFractionalUnits: tenant.planLimits?.allowFractionalUnits ?? true,
    });
  };

  const handleUpdatePlan = async (e) => {
    e.preventDefault();
    if (!planModalTenant) return;

    try {
      setIsSubmitting(true);
      const parsedLimits = {};
      if (customLimits.maxProducts && customLimits.maxProducts !== 'Unlimited') {
        parsedLimits.maxProducts = Number(customLimits.maxProducts);
      }
      if (customLimits.maxKhataCustomers && customLimits.maxKhataCustomers !== 'Unlimited') {
        parsedLimits.maxKhataCustomers = Number(customLimits.maxKhataCustomers);
      }
      parsedLimits.allowBarcodeGen = customLimits.allowBarcodeGen;
      parsedLimits.allowWhatsApp = customLimits.allowWhatsApp;
      parsedLimits.allowFractionalUnits = customLimits.allowFractionalUnits;

      await superAdminService.updateTenantPlan(planModalTenant._id, {
        plan: selectedNewPlan,
        customLimits: parsedLimits,
        extendDays: Number(planExtendDays) || 0,
      });
      setPlanModalTenant(null);
      fetchPlatformData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update store subscription plan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImpersonate = async (tenant) => {
    try {
      await impersonateStore(tenant._id);
      navigate('/dashboard');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to establish scoped impersonation session.');
    }
  };

  const handlePurgeData = async (e) => {
    e.preventDefault();
    if (!purgeModalTenant) return;

    try {
      setIsPurging(true);
      const res = await superAdminService.purgeTenantData(purgeModalTenant._id, {
        confirmation: purgeConfirmationText,
        purgeProducts: purgeProductsOption,
      });
      alert(res.data?.message || 'Store transactional data wiped successfully.');
      setPurgeModalTenant(null);
      setPurgeConfirmationText('');
      setPurgeProductsOption(false);
      fetchPlatformData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to purge store data.');
    } finally {
      setIsPurging(false);
    }
  };

  const handleApprovePayment = async (paymentId) => {
    try {
      await superAdminService.approvePayment(paymentId);
      fetchPlatformData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve payment.');
    }
  };

  const handleRejectPayment = async (e) => {
    e.preventDefault();
    if (!rejectModalPayment) return;

    try {
      await superAdminService.rejectPayment(rejectModalPayment._id, rejectionReason);
      setRejectModalPayment(null);
      fetchPlatformData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject payment.');
    }
  };

  const handleDeleteTenant = async (tenant) => {
    if (
      window.confirm(
        `Are you sure you want to permanently delete "${tenant.name}" (${tenant.slug})? This will completely erase all store records.`
      )
    ) {
      try {
        await superAdminService.deleteTenant(tenant._id);
        fetchPlatformData();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete store.');
      }
    }
  };

  const handleCreateTenant = async (e) => {
    e.preventDefault();
    setModalError('');
    setIsSubmitting(true);

    try {
      await superAdminService.createTenant(newTenantData);
      setIsAddModalOpen(false);
      setNewTenantData({
        name: '',
        slug: '',
        ownerName: '',
        ownerEmail: '',
        ownerPassword: '',
        phone: '',
        city: 'Islamabad',
        address: '',
        subscriptionMonths: '12',
        plan: 'standard',
      });
      fetchPlatformData();
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to create new store tenant.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateBroadcast = async (broadcastData) => {
    try {
      setBroadcastSubmitting(true);
      await superAdminService.createBroadcast(broadcastData);
      fetchPlatformData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to publish system broadcast.');
    } finally {
      setBroadcastSubmitting(false);
    }
  };

  const handleDeleteBroadcast = async (id) => {
    try {
      await superAdminService.deleteBroadcast(id);
      fetchPlatformData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete announcement.');
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
      {/* Top Header Bar */}
      <header className="bg-slate-900 border-b border-slate-800 text-white px-6 py-4 flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-black tracking-tight text-white">NaveedPOS Super Admin</h1>
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-brand-500/20 text-brand-300 border border-brand-500/40 rounded-full">
                  Platform Owner Console
                </span>
              </div>
              <p className="text-xs text-slate-400">
                SaaS Governance & Tenant Administration • Master Administrator: Naveed
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {metrics?.pendingPaymentsCount > 0 && (
              <button
                onClick={() => handleTabChange('payments')}
                className="flex items-center space-x-2 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition animate-pulse"
              >
                <Clock className="w-4 h-4 text-amber-400" />
                <span>{metrics.pendingPaymentsCount} Slips Pending</span>
              </button>
            )}

            <button
              onClick={fetchPlatformData}
              disabled={refreshing}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition border border-slate-700 disabled:opacity-50"
              title="Refresh Platform Data"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-500 hover:to-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-600/30 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Register Store</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-1 mt-5 overflow-x-auto no-scrollbar border-t border-slate-800 pt-3">
          <button
            onClick={() => handleTabChange('telemetry')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'telemetry'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Platform Telemetry</span>
          </button>

          <button
            onClick={() => handleTabChange('tenants')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'tenants'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Tenants Directory</span>
            {tenants.length > 0 && (
              <span className="px-1.5 py-0.2 bg-white/20 text-white rounded-full text-[10px]">
                {tenants.length}
              </span>
            )}
          </button>

          <button
            onClick={() => handleTabChange('payments')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'payments'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Payment Approvals</span>
            {metrics?.pendingPaymentsCount > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 font-black rounded-full text-[10px]">
                {metrics.pendingPaymentsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => handleTabChange('broadcast')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'broadcast'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            <span>System Broadcast</span>
          </button>

          <button
            onClick={() => handleTabChange('audit')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'audit'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Security Audit Log</span>
          </button>
        </div>
      </header>

      {/* Main View Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 md:pb-6 max-w-7xl w-full mx-auto space-y-6">
        {activeTab === 'telemetry' && (
          <SuperAdminDashboard
            metrics={metrics}
            tenants={tenants}
            payments={payments}
            onNavigateTab={handleTabChange}
            onApprovePayment={handleApprovePayment}
            onOpenRejectModal={(p) => {
              setRejectModalPayment(p);
              setRejectionReason('Transaction reference not verified in bank account.');
            }}
          />
        )}

        {activeTab === 'tenants' && (
          <TenantsDirectory
            tenants={tenants}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            planFilter={planFilter}
            setPlanFilter={setPlanFilter}
            onToggleStatus={handleToggleStatus}
            onQuickExtend={handleQuickExtend}
            onQuickPlanChange={handleQuickPlanChange}
            onOpenPlanModal={handleOpenPlanModal}
            onImpersonate={handleImpersonate}
            onOpenPurgeModal={(t) => {
              setPurgeModalTenant(t);
              setPurgeConfirmationText('');
              setPurgeProductsOption(false);
            }}
            onDeleteTenant={handleDeleteTenant}
            onOpenAddModal={() => setIsAddModalOpen(true)}
          />
        )}

        {activeTab === 'payments' && (
          <PaymentApprovals
            payments={payments}
            paymentStatusFilter={paymentStatusFilter}
            setPaymentStatusFilter={setPaymentStatusFilter}
            onApprovePayment={handleApprovePayment}
            onOpenRejectModal={(p) => {
              setRejectModalPayment(p);
              setRejectionReason('Transaction reference not verified in bank account.');
            }}
            onOpenLightbox={(img) => setLightboxImage(img)}
          />
        )}

        {activeTab === 'broadcast' && (
          <SystemBroadcast
            broadcasts={broadcasts}
            onCreateBroadcast={handleCreateBroadcast}
            onDeleteBroadcast={handleDeleteBroadcast}
            submitting={broadcastSubmitting}
          />
        )}

        {activeTab === 'audit' && (
          <SecurityAuditTrail
            auditLogs={auditLogs}
            auditActionFilter={auditActionFilter}
            setAuditActionFilter={setAuditActionFilter}
            auditSearchTerm={auditSearchTerm}
            setAuditSearchTerm={setAuditSearchTerm}
          />
        )}
      </main>

      {/* Modals */}
      {/* 1. Register Store Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register New Store Tenant"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreateTenant} className="space-y-4">
          {modalError && (
            <div className="p-3 bg-red-950/50 border border-red-800 text-red-300 text-xs font-bold rounded-xl">
              {modalError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Shop Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Al Madina Supermart"
                value={newTenantData.name}
                onChange={(e) =>
                  setNewTenantData({ ...newTenantData, name: e.target.value })
                }
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Store Slug (Optional)
              </label>
              <input
                type="text"
                placeholder="auto-generated from name"
                value={newTenantData.slug}
                onChange={(e) =>
                  setNewTenantData({ ...newTenantData, slug: e.target.value })
                }
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Owner Full Name
              </label>
              <input
                type="text"
                placeholder="Store Owner / Manager"
                value={newTenantData.ownerName}
                onChange={(e) =>
                  setNewTenantData({ ...newTenantData, ownerName: e.target.value })
                }
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                WhatsApp / Phone
              </label>
              <input
                type="text"
                placeholder="0300-1234567"
                value={newTenantData.phone}
                onChange={(e) =>
                  setNewTenantData({ ...newTenantData, phone: e.target.value })
                }
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Owner Email *
              </label>
              <input
                type="email"
                required
                placeholder="admin@shop.com"
                value={newTenantData.ownerEmail}
                onChange={(e) =>
                  setNewTenantData({ ...newTenantData, ownerEmail: e.target.value })
                }
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Password *
              </label>
              <input
                type="password"
                required
                placeholder="Initial password"
                value={newTenantData.ownerPassword}
                onChange={(e) =>
                  setNewTenantData({ ...newTenantData, ownerPassword: e.target.value })
                }
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Subscription Plan
              </label>
              <select
                value={newTenantData.plan}
                onChange={(e) =>
                  setNewTenantData({ ...newTenantData, plan: e.target.value })
                }
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              >
                <option value="basic">Basic (Rs. 1,500/mo)</option>
                <option value="standard">Standard (Rs. 3,000/mo)</option>
                <option value="premium">Premium Supermart (Rs. 5,500/mo)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Validity (Months)
              </label>
              <select
                value={newTenantData.subscriptionMonths}
                onChange={(e) =>
                  setNewTenantData({
                    ...newTenantData,
                    subscriptionMonths: e.target.value,
                  })
                }
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              >
                <option value="1">1 Month</option>
                <option value="3">3 Months</option>
                <option value="6">6 Months</option>
                <option value="12">12 Months (1 Year)</option>
                <option value="24">24 Months (2 Years)</option>
              </select>
            </div>
          </div>

          <div className="pt-3 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm transition"
            >
              {isSubmitting ? 'Registering...' : 'Register Store'}
            </button>
          </div>
        </form>
      </Modal>

      {/* 2. Plan Override Modal */}
      <Modal
        isOpen={Boolean(planModalTenant)}
        onClose={() => setPlanModalTenant(null)}
        title={`Override SaaS Tier: ${planModalTenant?.name || ''}`}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleUpdatePlan} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Select Tier Plan
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['basic', 'standard', 'premium'].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setSelectedNewPlan(p)}
                  className={`p-3 rounded-xl border text-center transition capitalize ${
                    selectedNewPlan === p
                      ? 'bg-brand-600 text-white font-bold border-brand-600 shadow-sm'
                      : 'border-slate-800 bg-slate-800/60 text-slate-400 font-medium'
                  }`}
                >
                  <div className="text-xs font-black">{p}</div>
                  <div className="text-[10px] opacity-80">
                    {p === 'basic' ? 'Rs. 1,500' : p === 'standard' ? 'Rs. 3,000' : 'Rs. 5,500'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Max Products Quota
              </label>
              <input
                type="text"
                placeholder="e.g. 300, 1500, or Unlimited"
                value={customLimits.maxProducts}
                onChange={(e) =>
                  setCustomLimits({ ...customLimits, maxProducts: e.target.value })
                }
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Max Khata Customers Quota
              </label>
              <input
                type="text"
                placeholder="e.g. 50 or Unlimited"
                value={customLimits.maxKhataCustomers}
                onChange={(e) =>
                  setCustomLimits({ ...customLimits, maxKhataCustomers: e.target.value })
                }
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1">
            <label className="flex items-center space-x-2 text-xs font-medium cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={customLimits.allowWhatsApp}
                onChange={(e) =>
                  setCustomLimits({ ...customLimits, allowWhatsApp: e.target.checked })
                }
                className="rounded text-brand-600"
              />
              <span>WhatsApp Bot</span>
            </label>
            <label className="flex items-center space-x-2 text-xs font-medium cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={customLimits.allowBarcodeGen}
                onChange={(e) =>
                  setCustomLimits({ ...customLimits, allowBarcodeGen: e.target.checked })
                }
                className="rounded text-brand-600"
              />
              <span>Barcode Labels</span>
            </label>
            <label className="flex items-center space-x-2 text-xs font-medium cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={customLimits.allowFractionalUnits}
                onChange={(e) =>
                  setCustomLimits({
                    ...customLimits,
                    allowFractionalUnits: e.target.checked,
                  })
                }
                className="rounded text-brand-600"
              />
              <span>Fractional Units</span>
            </label>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Extend Validity with Upgrade (Days)
            </label>
            <input
              type="number"
              value={planExtendDays}
              onChange={(e) => setPlanExtendDays(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>

          <div className="pt-3 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setPlanModalTenant(null)}
              className="px-4 py-2 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm transition"
            >
              {isSubmitting ? 'Updating...' : 'Save Plan & Quotas'}
            </button>
          </div>
        </form>
      </Modal>

      {/* 3. Danger Zone: Hard Reset / Purge Data Modal */}
      <Modal
        isOpen={Boolean(purgeModalTenant)}
        onClose={() => setPurgeModalTenant(null)}
        title="Hard Reset & Purge Store Transactional Data"
        maxWidth="max-w-md"
      >
        <form onSubmit={handlePurgeData} className="space-y-4">
          <div className="p-3 bg-red-950/40 border border-red-800/80 rounded-xl text-red-300 text-xs space-y-1">
            <div className="font-black flex items-center space-x-1 text-red-200">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span>Danger Zone: Irreversible Store Cleanup</span>
            </div>
            <p>
              This will wipe all <strong>orders, cash drawer shifts, expenses, purchases, and khata balances</strong> for{' '}
              <strong className="underline text-white">{purgeModalTenant?.name}</strong>.
            </p>
            <p className="text-[11px] text-red-400">
              Store owner credentials ({purgeModalTenant?.ownerEmail}) and plan status will remain preserved.
            </p>
          </div>

          <div>
            <label className="flex items-center space-x-2 text-xs font-bold text-slate-300 cursor-pointer mb-3">
              <input
                type="checkbox"
                checked={purgeProductsOption}
                onChange={(e) => setPurgeProductsOption(e.target.checked)}
                className="rounded text-red-600 focus:ring-red-500"
              />
              <span>Also purge catalog products (Full blank reset)</span>
            </label>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Type <strong className="text-red-400">PURGE</strong> to confirm:
            </label>
            <input
              type="text"
              required
              placeholder="PURGE"
              value={purgeConfirmationText}
              onChange={(e) => setPurgeConfirmationText(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-red-700/80 rounded-xl text-xs font-mono font-bold text-white focus:ring-1 focus:ring-red-500 outline-none"
            />
          </div>

          <div className="pt-3 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setPurgeModalTenant(null)}
              className="px-4 py-2 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPurging || purgeConfirmationText.trim().toUpperCase() !== 'PURGE'}
              className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold shadow-sm disabled:opacity-40 transition"
            >
              {isPurging ? 'Purging...' : 'Execute Hard Reset'}
            </button>
          </div>
        </form>
      </Modal>

      {/* 4. Reject Payment Reason Modal */}
      <Modal
        isOpen={Boolean(rejectModalPayment)}
        onClose={() => setRejectModalPayment(null)}
        title="Reject Payment Slip"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleRejectPayment} className="space-y-4">
          <p className="text-xs text-slate-400">
            Provide a note for <strong>{rejectModalPayment?.tenantName}</strong> explaining why this payment proof could not be verified.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Rejection Reason Note *
            </label>
            <textarea
              rows={3}
              required
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:ring-1 focus:ring-red-500 outline-none"
            />
          </div>

          <div className="pt-3 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setRejectModalPayment(null)}
              className="px-4 py-2 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold shadow-sm transition"
            >
              Confirm Rejection
            </button>
          </div>
        </form>
      </Modal>

      {/* 5. Lightbox Modal for Receipt Screenshot */}
      <Modal
        isOpen={Boolean(lightboxImage)}
        onClose={() => setLightboxImage(null)}
        title="Attached Payment Slip / Proof"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4 text-center">
          <div className="max-h-[70vh] overflow-auto flex items-center justify-center bg-slate-950 rounded-xl p-2 border border-slate-800">
            <img
              src={lightboxImage}
              alt="Payment Slip Proof"
              className="max-h-[65vh] object-contain rounded-lg"
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => setLightboxImage(null)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs"
            >
              Close Viewer
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SuperAdminPage;
