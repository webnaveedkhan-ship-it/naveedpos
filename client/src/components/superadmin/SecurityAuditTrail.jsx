import React from 'react';
import { ShieldAlert, Search, ShieldCheck } from 'lucide-react';

const SecurityAuditTrail = ({
  auditLogs = [],
  auditActionFilter,
  setAuditActionFilter,
  auditSearchTerm,
  setAuditSearchTerm,
}) => {
  return (
    <div className="space-y-6">
      {/* Top Filter & Search */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search audit trail by actor, store, action..."
            value={auditSearchTerm}
            onChange={(e) => setAuditSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-medium text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar w-full md:w-auto">
          {[
            'all',
            'PLAN_OVERRIDE',
            'SUBSCRIPTION_EXTENDED',
            'PAYMENT_APPROVED',
            'PAYMENT_REJECTED',
            'STORE_SUSPENDED',
            'DATA_PURGED',
            'IMPERSONATION_STARTED',
          ].map((act) => (
            <button
              key={act}
              onClick={() => setAuditActionFilter(act)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition whitespace-nowrap ${
                auditActionFilter === act
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700/60'
              }`}
            >
              {act === 'all' ? 'All Security Events' : act.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-850/80 text-[11px] font-black uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Master Admin Actor</th>
                <th className="py-3.5 px-4">Security Action</th>
                <th className="py-3.5 px-4">Target Store</th>
                <th className="py-3.5 px-4">Audit Details & Parameters</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-500">
                    <ShieldAlert className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                    <p className="font-semibold text-sm">No security audit logs matching this criteria</p>
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('en-PK', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-white">{log.actorName || 'Naveed (Super Admin)'}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{log.actorEmail}</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                          log.action === 'PAYMENT_APPROVED'
                            ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800'
                            : log.action === 'PAYMENT_REJECTED' ||
                              log.action === 'STORE_SUSPENDED' ||
                              log.action === 'DATA_PURGED'
                            ? 'bg-red-950/70 text-red-300 border border-red-800'
                            : log.action === 'IMPERSONATION_STARTED'
                            ? 'bg-indigo-950/70 text-indigo-300 border border-indigo-800'
                            : 'bg-brand-950/70 text-brand-300 border border-brand-800'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-200">
                      {log.targetTenantName || log.targetTenantId || 'Global SaaS Platform'}
                    </td>
                    <td className="py-3 px-4">
                      <pre className="font-mono text-[11px] text-slate-300 max-w-md truncate bg-slate-800/80 p-2 rounded-lg border border-slate-700">
                        {JSON.stringify(log.details || {})}
                      </pre>
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

export default SecurityAuditTrail;
