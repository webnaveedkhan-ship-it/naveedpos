import React, { useState, useEffect } from 'react';
import { cashDrawerService } from '../../services/api';
import { formatCurrency } from '../../utils/currency';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import {
  Banknote,
  Calculator,
  History,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Lock,
  X,
  Coins,
  ShieldCheck,
  Calendar,
  User,
  Clock,
  RefreshCw,
} from 'lucide-react';

const PAKISTAN_NOTES = [
  { note: 5000, label: 'Rs. 5,000 Note' },
  { note: 1000, label: 'Rs. 1,000 Note' },
  { note: 500, label: 'Rs. 500 Note' },
  { note: 100, label: 'Rs. 100 Note' },
  { note: 50, label: 'Rs. 50 Note' },
  { note: 20, label: 'Rs. 20 Note' },
  { note: 10, label: 'Rs. 10 Note' },
];

export default function CashDrawerModal({ isOpen, onClose }) {
  const { user, planLimits, tenantPlan } = useAuth();
  const [activeTab, setActiveTab] = useState('reconcile'); // 'reconcile' | 'history'
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Daily Summary Data
  const [summary, setSummary] = useState({
    openingCash: 0,
    cashSales: 0,
    khataWasooliCash: 0,
    cashExpenses: 0,
    expectedCash: 0,
  });

  // Reconcile Input State
  const [openingCash, setOpeningCash] = useState(0);
  const [denominationCounts, setDenominationCounts] = useState({
    5000: 0,
    1000: 0,
    500: 0,
    100: 0,
    50: 0,
    20: 0,
    10: 0,
  });
  const [looseCoins, setLooseCoins] = useState(0);
  const [notes, setNotes] = useState('');

  // History State
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const isAllowed = planLimits?.allowDrawerReconciliation ?? true;

  // Calculate counted cash from note counter
  const countedCash = Object.entries(denominationCounts).reduce(
    (sum, [note, count]) => sum + Number(note) * (Number(count) || 0),
    Number(looseCoins) || 0
  );

  const expectedCash =
    Number(openingCash) +
    Number(summary.cashSales || 0) +
    Number(summary.khataWasooliCash || 0) -
    Number(summary.cashExpenses || 0);

  const difference = countedCash - expectedCash;

  useEffect(() => {
    if (isOpen && isAllowed) {
      fetchTodaySummary();
    }
  }, [isOpen, isAllowed]);

  const fetchTodaySummary = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await cashDrawerService.getSummaryToday();
      if (res.data?.success) {
        setSummary(res.data.summary);
        setOpeningCash(res.data.summary.openingCash || 0);
      }
    } catch (err) {
      console.error('Failed to load drawer summary:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to fetch cash summary');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await cashDrawerService.getHistory();
      if (res.data?.success) {
        setHistory(res.data.history || []);
      }
    } catch (err) {
      console.error('Failed to load drawer history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'history') {
      fetchHistory();
    }
  };

  const handleCountChange = (note, val) => {
    const parsed = Math.max(0, parseInt(val, 10) || 0);
    setDenominationCounts((prev) => ({
      ...prev,
      [note]: parsed,
    }));
  };

  const handleReconcileSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setErrorMsg('');
      setSuccessMsg('');

      const denominationsArray = Object.entries(denominationCounts).map(([note, count]) => ({
        note: Number(note),
        count: Number(count),
        subtotal: Number(note) * Number(count),
      }));

      if (Number(looseCoins) > 0) {
        denominationsArray.push({
          note: 1,
          count: Number(looseCoins),
          subtotal: Number(looseCoins),
        });
      }

      const payload = {
        openingCash: Number(openingCash),
        countedCash: Number(countedCash),
        denominations: denominationsArray,
        notes: notes.trim(),
      };

      const res = await cashDrawerService.reconcile(payload);
      if (res.data?.success) {
        setSuccessMsg(res.data.message || 'Cash drawer reconciliation recorded successfully.');
        setTimeout(() => {
          fetchTodaySummary();
        }, 1200);
      }
    } catch (err) {
      console.error('Failed to submit cash reconciliation:', err);
      setErrorMsg(err.response?.data?.message || 'Error recording reconciliation');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <Calculator className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Day-End Cash Drawer Reconciliation</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 font-medium text-slate-700 dark:text-slate-300">
                  شام کا حساب
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Verify physical drawer cash against system sales, wasooli, and daily expenses.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feature Lock Check */}
        {!isAllowed ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950/40 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
              <Lock className="w-8 h-8" />
            </div>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
              <Sparkles className="w-3.5 h-3.5" /> Standard & Premium Feature
            </span>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Cash Drawer Reconciliation (شام کا حساب)
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
              Real-time daily cash drawer balancing and Pakistani banknote counting are included in the <strong>Standard Plan (Rs. 3,000/mo)</strong> and <strong>Premium Plan (Rs. 5,500/mo)</strong>.
            </p>
            <div className="pt-2">
              <Link
                to="/settings/billing"
                onClick={onClose}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-emerald-600/20 text-sm"
              >
                <span>Upgrade Your Subscription</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div>
            {/* Nav Tabs */}
            <div className="flex items-center border-b border-slate-100 dark:border-slate-700 px-6 pt-2 bg-slate-50/30 dark:bg-slate-800/30">
              <button
                onClick={() => handleTabChange('reconcile')}
                className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all ${
                  activeTab === 'reconcile'
                    ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Calculator className="w-4 h-4" />
                <span>Today's Cash Audit</span>
              </button>
              <button
                onClick={() => handleTabChange('history')}
                className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all ${
                  activeTab === 'history'
                    ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <History className="w-4 h-4" />
                <span>Audit History Log</span>
              </button>
            </div>

            {/* Tab 1: Reconcile / Audit */}
            {activeTab === 'reconcile' && (
              <form onSubmit={handleReconcileSubmit} className="p-6 space-y-6">
                {/* Feedback Alerts */}
                {successMsg && (
                  <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 text-xs font-medium rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{successMsg}</span>
                  </div>
                )}
                {errorMsg && (
                  <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 text-xs font-medium rounded-xl border border-rose-200 dark:border-rose-800 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* System Expected Calculation Summary */}
                <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      System Register Breakdown (Today)
                    </span>
                    <button
                      type="button"
                      onClick={fetchTodaySummary}
                      className="text-[11px] text-indigo-600 hover:text-indigo-700 flex items-center gap-1 font-medium"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Recalculate</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="text-[11px] text-slate-500 block mb-1">Opening Cash (Rs.)</label>
                      <input
                        type="number"
                        min="0"
                        value={openingCash}
                        onChange={(e) => setOpeningCash(Number(e.target.value) || 0)}
                        className="w-full font-bold text-slate-900 dark:text-white px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="text-[11px] text-slate-500 block">+ Cash Sales</span>
                      <span className="font-bold text-emerald-600 text-sm">
                        {formatCurrency(summary.cashSales)}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="text-[11px] text-slate-500 block">+ Khata Wasooli</span>
                      <span className="font-bold text-blue-600 text-sm">
                        {formatCurrency(summary.khataWasooliCash)}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="text-[11px] text-slate-500 block">- Cash Expenses</span>
                      <span className="font-bold text-rose-600 text-sm">
                        {formatCurrency(summary.cashExpenses)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      Expected Cash in Register:
                    </span>
                    <span className="font-black text-slate-900 dark:text-white text-base">
                      {formatCurrency(expectedCash)}
                    </span>
                  </div>
                </div>

                {/* Physical Cash Count - Pakistani Denominations */}
                <div>
                  <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                    <Banknote className="w-4 h-4 text-emerald-600" />
                    <span>Physical Cash Count (Pakistani Currency Notes)</span>
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {PAKISTAN_NOTES.map(({ note, label }) => {
                      const count = denominationCounts[note] || 0;
                      const subtotal = note * count;
                      return (
                        <div
                          key={note}
                          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              Rs. {note.toLocaleString()}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {subtotal > 0 ? `Rs. ${subtotal.toLocaleString()}` : ''}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[11px] text-slate-400">Qty:</span>
                            <input
                              type="number"
                              min="0"
                              value={count === 0 ? '' : count}
                              placeholder="0"
                              onChange={(e) => handleCountChange(note, e.target.value)}
                              className="w-full text-xs font-bold text-right px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>
                        </div>
                      );
                    })}

                    {/* Loose Coins / Small change */}
                    <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                          <Coins className="w-3.5 h-3.5 text-amber-500" />
                          <span>Coins / Change</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] text-slate-400">Rs.</span>
                        <input
                          type="number"
                          min="0"
                          value={looseCoins === 0 ? '' : looseCoins}
                          placeholder="0"
                          onChange={(e) => setLooseCoins(Math.max(0, parseInt(e.target.value, 10) || 0))}
                          className="w-full text-xs font-bold text-right px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Real-Time Balance Difference Indicator */}
                <div
                  className={`p-4 rounded-2xl border transition-all ${
                    difference === 0
                      ? 'bg-emerald-50/70 border-emerald-300 dark:bg-emerald-950/30 dark:border-emerald-800'
                      : difference > 0
                      ? 'bg-blue-50/70 border-blue-300 dark:bg-blue-950/30 dark:border-blue-800'
                      : 'bg-rose-50/70 border-rose-300 dark:bg-rose-950/30 dark:border-rose-800'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 block">
                        Counted Drawer Cash:
                      </span>
                      <span className="text-2xl font-black text-slate-900 dark:text-white">
                        {formatCurrency(countedCash)}
                      </span>
                    </div>

                    <div className="text-right sm:text-right">
                      <span className="text-xs text-slate-500 dark:text-slate-400 block">
                        Difference (Counted vs Expected):
                      </span>
                      <div className="flex items-center justify-end gap-1.5 mt-0.5">
                        {difference === 0 ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-xs">
                            <CheckCircle2 className="w-3.5 h-3.5" /> EXACT MATCH (Rs. 0)
                          </span>
                        ) : difference > 0 ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-600 text-white shadow-xs">
                            SURPLUS (+{formatCurrency(difference)})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-600 text-white shadow-xs">
                            DEFICIT ({formatCurrency(difference)})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Audit Notes */}
                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                    Reconciliation Note / Remarks (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Shift closed by Asif. Rs. 20 short due to roundoff."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>{submitting ? 'Recording Audit...' : 'Save & Close Cash Drawer'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* Tab 2: Audit History */}
            {activeTab === 'history' && (
              <div className="p-6">
                {loadingHistory ? (
                  <div className="py-16 text-center text-slate-400 text-xs">
                    Loading historical audits...
                  </div>
                ) : history.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 text-xs italic">
                    No cash drawer audits recorded yet. Reconcile at the end of every business shift.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-700 max-h-96 overflow-y-auto pr-1">
                    {history.map((record) => (
                      <div key={record._id} className="py-3 flex items-center justify-between text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white">
                              {new Date(record.date || record.createdAt).toLocaleDateString('en-PK', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                record.status === 'MATCHED'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : record.status === 'SURPLUS'
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                              }`}
                            >
                              {record.status} ({record.difference >= 0 ? '+' : ''}
                              {formatCurrency(record.difference)})
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-2">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {record.closedByName || 'Store Cashier'}
                            </span>
                            <span>•</span>
                            <span>Expected: {formatCurrency(record.expectedCash)}</span>
                            <span>•</span>
                            <span>Counted: {formatCurrency(record.countedCash)}</span>
                          </div>
                          {record.notes && (
                            <p className="text-[11px] text-slate-500 italic">"{record.notes}"</p>
                          )}
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {formatCurrency(record.countedCash)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
