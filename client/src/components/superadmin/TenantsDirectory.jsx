import React, { useState } from 'react';
import {
  Search,
  Building2,
  MessageSquare,
  Clock,
  Lock,
  Unlock,
  Check,
  UserCheck,
  Calendar,
  Layers,
  RotateCcw,
  Trash2,
  Plus,
  ExternalLink,
} from 'lucide-react';

const TenantsDirectory = ({
  tenants = [],
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  planFilter,
  setPlanFilter,
  onToggleStatus,
  onQuickExtend,
  onQuickPlanChange,
  onOpenPlanModal,
  onImpersonate,
  onOpenPurgeModal,
  onDeleteTenant,
  onOpenAddModal,
}) => {
  const [activeDropdownTenant, setActiveDropdownTenant] = useState(null);

  return (
    <div className="space-y-6">
      {/* Top Controls: Search, Filters & Action */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by store name, owner, phone, slug..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-medium text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Status & Plan Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Pills */}
          <div className="flex items-center space-x-1 bg-slate-800 p-1 rounded-xl border border-slate-700/60">
            {['all', 'active', 'trial', 'expired', 'suspended'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg capitalize transition ${
                  statusFilter === st
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Plan Pills */}
          <div className="flex items-center space-x-1 bg-slate-800 p-1 rounded-xl border border-slate-700/60">
            {['all', 'basic', 'standard', 'premium', 'trial'].map((pl) => (
              <button
                key={pl}
                onClick={() => setPlanFilter(pl)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg capitalize transition ${
                  planFilter === pl
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {pl}
              </button>
            ))}
          </div>

          <button
            onClick={onOpenAddModal}
            className="flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-500 hover:to-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-600/30 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Store</span>
          </button>
        </div>
      </div>

      {/* Tenants View: Desktop Table + Mobile Card Stream */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-md overflow-hidden">
        {/* Mobile View: High-Touch Card Stream (< md) */}
        <div className="md:hidden divide-y divide-slate-800/80">
          {tenants.length === 0 ? (
            <div className="py-12 text-center text-slate-500 p-4">
              <Building2 className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
              <p className="font-semibold text-sm">No registered stores matching your filters</p>
            </div>
          ) : (
            tenants.map((t) => (
              <div key={t._id} className="p-4 space-y-3 bg-slate-950/40">
                {/* Header: Shop Name & Status */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-black text-white text-sm">{t.name}</h4>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      <span>{t.slug}</span>
                      <span> • </span>
                      <span className="text-slate-500">{t.city || 'Pakistan'}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => onToggleStatus(t._id, t.status)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition inline-flex items-center space-x-1 shadow-xs ${
                      t.status === 'active'
                        ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                        : t.status === 'trial'
                        ? 'bg-blue-950/60 text-blue-300 border border-blue-800'
                        : 'bg-rose-950/60 text-rose-300 border border-rose-800'
                    }`}
                  >
                    {t.status === 'suspended' ? <Lock className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                    <span>{t.status}</span>
                  </button>
                </div>

                {/* Owner & WhatsApp */}
                <div className="flex items-center justify-between text-xs bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                  <div className="truncate mr-2">
                    <div className="text-slate-300 font-medium truncate">{t.ownerEmail}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{t.phone || 'No phone'}</div>
                  </div>
                  {t.whatsappUrl && (
                    <a
                      href={t.whatsappUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1 shadow-sm flex-shrink-0"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  )}
                </div>

                {/* Plan Tier & Quota */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase mb-1">
                      SaaS Plan Tier
                    </span>
                    <select
                      value={t.plan || 'trial'}
                      onChange={(e) => onQuickPlanChange(t._id, e.target.value)}
                      className="w-full text-xs font-bold bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-white focus:ring-1 focus:ring-brand-500"
                    >
                      <option value="basic">Basic (1.5k)</option>
                      <option value="standard">Standard (3k)</option>
                      <option value="premium">Premium (5.5k)</option>
                      {t.plan === 'trial' && <option value="trial" disabled>14d Trial</option>}
                    </select>
                  </div>

                  <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase mb-1">
                      Validity Status
                    </span>
                    <div className="text-xs font-bold text-white">
                      {t.subscriptionExpiresAt
                        ? new Date(t.subscriptionExpiresAt).toLocaleDateString('en-PK', {
                            day: '2-digit',
                            month: 'short',
                          })
                        : 'No Expiry'}
                    </div>
                    <div className="text-[10px] text-amber-400 font-semibold flex items-center space-x-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      <span>{t.expiryCountdownText}</span>
                    </div>
                  </div>
                </div>

                {/* Mobile Touch Quick Actions Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="inline-flex rounded-lg overflow-hidden border border-slate-700 bg-slate-800 text-[11px] font-bold">
                    <button
                      onClick={() => onQuickExtend(t._id, 7)}
                      className="px-2 py-1.5 text-slate-300 hover:text-white hover:bg-slate-700"
                    >
                      +7d
                    </button>
                    <span className="w-px bg-slate-700" />
                    <button
                      onClick={() => onQuickExtend(t._id, 14)}
                      className="px-2 py-1.5 text-slate-300 hover:text-white hover:bg-slate-700"
                    >
                      +14d
                    </button>
                    <span className="w-px bg-slate-700" />
                    <button
                      onClick={() => onQuickExtend(t._id, 30)}
                      className="px-2.5 py-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-slate-700 font-black"
                    >
                      +30d
                    </button>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => onImpersonate(t)}
                      className="px-2.5 py-1.5 bg-indigo-950/60 hover:bg-indigo-900 text-indigo-300 border border-indigo-800 rounded-lg text-xs font-bold flex items-center space-x-1"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Login</span>
                    </button>

                    <button
                      onClick={() => onOpenPlanModal(t)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                      title="Custom Quotas"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onDeleteTenant(t)}
                      className="p-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-800/60 rounded-lg"
                      title="Delete Store"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View: Full Data Table (hidden on mobile, visible md:block) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-850/80 text-[11px] font-black uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4">Shop Name & Slug</th>
                <th className="py-3.5 px-4">Owner & WhatsApp</th>
                <th className="py-3.5 px-4">Plan Tier</th>
                <th className="py-3.5 px-4">Expiry Date</th>
                <th className="py-3.5 px-4">Product Usage</th>
                <th className="py-3.5 px-4 text-center">Status Toggle</th>
                <th className="py-3.5 px-4 text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {tenants.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-500">
                    <Building2 className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                    <p className="font-semibold text-sm">No registered stores matching your filters</p>
                  </td>
                </tr>
              ) : (
                tenants.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-800/40 transition">
                    {/* Shop Name & Slug */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white flex items-center space-x-2">
                        <span>{t.name}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono flex items-center space-x-1 mt-0.5">
                        <span>{t.slug}</span>
                        <span>•</span>
                        <span className="text-slate-500">{t.city || 'Pakistan'}</span>
                      </div>
                    </td>

                    {/* Owner Name & WhatsApp Link */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-200">
                        {t.ownerEmail}
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-[11px] text-slate-400 font-mono">
                          {t.phone || 'No Phone'}
                        </span>
                        {t.whatsappUrl && (
                          <a
                            href={t.whatsappUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center space-x-1 px-1.5 py-0.5 bg-emerald-950/50 text-emerald-400 hover:bg-emerald-900/60 rounded text-[10px] font-bold border border-emerald-800/50 transition"
                            title="Direct WhatsApp Chat with Store Owner"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>WhatsApp</span>
                          </a>
                        )}
                      </div>
                    </td>

                    {/* Current Plan Tier & Quick Plan Override Dropdown */}
                    <td className="py-3.5 px-4 min-w-[150px]">
                      <div className="flex items-center space-x-2 mb-1.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                            t.plan === 'premium'
                              ? 'bg-purple-950/60 text-purple-300 border border-purple-800'
                              : t.plan === 'standard'
                              ? 'bg-brand-950/60 text-brand-300 border border-brand-800'
                              : t.plan === 'basic'
                              ? 'bg-slate-800 text-slate-300 border border-slate-700'
                              : 'bg-blue-950/60 text-blue-300 border border-blue-800'
                          }`}
                        >
                          {t.plan || 'trial'}
                        </span>
                      </div>
                      {/* Plan Override Dropdown */}
                      <select
                        value={t.plan || 'trial'}
                        onChange={(e) => onQuickPlanChange(t._id, e.target.value)}
                        className="w-full text-[11px] font-bold bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 focus:ring-1 focus:ring-brand-500 cursor-pointer"
                        title="Switch Plan Tier (Basic, Standard, Premium)"
                      >
                        <option value="basic">Basic (Rs. 1,500/mo)</option>
                        <option value="standard">Standard (Rs. 3,000/mo)</option>
                        <option value="premium">Premium (Rs. 5,500/mo)</option>
                        {t.plan === 'trial' && <option value="trial" disabled>14-Day Free Trial</option>}
                      </select>
                      <button
                        onClick={() => onOpenPlanModal(t)}
                        className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold underline underline-offset-2 mt-1 block"
                      >
                        Custom Limits &rarr;
                      </button>
                    </td>

                    {/* Expiry Date & Countdown */}
                    <td className="py-3.5 px-4">
                      <div className="text-slate-300 font-medium">
                        {t.subscriptionExpiresAt
                          ? new Date(t.subscriptionExpiresAt).toLocaleDateString('en-PK', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'No Expiry'}
                      </div>
                      <div
                        className={`text-[11px] font-semibold flex items-center space-x-1 mt-0.5 ${
                          t.isExpired
                            ? 'text-red-400'
                            : t.daysRemaining <= 5
                            ? 'text-amber-400'
                            : 'text-slate-400'
                        }`}
                      >
                        <Clock className="w-3 h-3 flex-shrink-0" />
                        <span>{t.expiryCountdownText}</span>
                      </div>
                    </td>

                    {/* Product Usage Count */}
                    <td className="py-3.5 px-4 min-w-[140px]">
                      <div className="text-slate-200 font-bold text-[11px]">
                        {t.usage?.productsUsageText || `${t.usage?.products || 0} products`}
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
                        <div
                          className={`h-full rounded-full transition-all ${
                            t.usage?.productsPercentage >= 95
                              ? 'bg-red-500'
                              : t.usage?.productsPercentage >= 80
                              ? 'bg-amber-500'
                              : 'bg-brand-500'
                          }`}
                          style={{ width: `${t.usage?.productsPercentage || 0}%` }}
                        />
                      </div>
                    </td>

                    {/* Instant Status Toggle: Active vs Suspended */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => onToggleStatus(t._id, t.status)}
                        className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase transition inline-flex items-center space-x-1.5 shadow-xs ${
                          t.status === 'active'
                            ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800 hover:bg-red-950/60 hover:text-red-300 hover:border-red-800'
                            : t.status === 'trial'
                            ? 'bg-blue-950/60 text-blue-300 border border-blue-800'
                            : 'bg-red-950/60 text-red-300 border border-red-800 hover:bg-emerald-950/60 hover:text-emerald-300 hover:border-emerald-800'
                        }`}
                        title={
                          t.status === 'suspended'
                            ? 'Store locked. Click to Unlock.'
                            : 'Click to Suspend Store (Instant HTTP 403 Lock)'
                        }
                      >
                        {t.status === 'suspended' ? (
                          <>
                            <Lock className="w-3 h-3" />
                            <span>Suspended</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-3 h-3" />
                            <span>{t.status}</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Quick 1-Click Extensions & Impersonate */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        {/* 1-Click Extension Dropdown / Quick Buttons */}
                        <div className="inline-flex rounded-lg shadow-xs overflow-hidden border border-slate-700 bg-slate-800">
                          <button
                            onClick={() => onQuickExtend(t._id, 7)}
                            className="px-1.5 py-1 text-[10px] font-bold text-slate-300 hover:text-white hover:bg-slate-700 transition"
                            title="Extend +7 Days"
                          >
                            +7d
                          </button>
                          <span className="w-px bg-slate-700" />
                          <button
                            onClick={() => onQuickExtend(t._id, 14)}
                            className="px-1.5 py-1 text-[10px] font-bold text-slate-300 hover:text-white hover:bg-slate-700 transition"
                            title="Extend +14 Days"
                          >
                            +14d
                          </button>
                          <span className="w-px bg-slate-700" />
                          <button
                            onClick={() => onQuickExtend(t._id, 30)}
                            className="px-2 py-1 text-[10px] font-bold text-brand-400 hover:text-brand-300 hover:bg-slate-700 transition"
                            title="Extend +30 Days (1 Month)"
                          >
                            +30d
                          </button>
                          <span className="w-px bg-slate-700" />
                          <button
                            onClick={() => onQuickExtend(t._id, 365)}
                            className="px-2 py-1 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 hover:bg-slate-700 transition"
                            title="Extend +365 Days (1 Year)"
                          >
                            +365d
                          </button>
                        </div>

                        {/* Impersonate Store Button */}
                        <button
                          onClick={() => onImpersonate(t)}
                          className="px-2.5 py-1 bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-800 rounded-lg text-xs font-bold transition flex items-center space-x-1"
                          title="Impersonate Store (Remote Troubleshooting Session)"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Login as Shop</span>
                        </button>

                        {/* Hard Reset / Purge */}
                        <button
                          onClick={() => onOpenPurgeModal(t)}
                          className="p-1 hover:bg-amber-950/60 text-amber-400 rounded-lg transition"
                          title="Hard Reset Store Test Data"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => onDeleteTenant(t)}
                          className="p-1 hover:bg-red-950/60 text-red-400 rounded-lg transition"
                          title="Delete Store Permanently"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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

export default TenantsDirectory;
