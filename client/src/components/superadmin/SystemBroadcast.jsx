import React, { useState } from 'react';
import {
  Megaphone,
  Send,
  Trash2,
  X,
  AlertTriangle,
  Info,
  CheckCircle2,
  AlertOctagon,
  Users,
} from 'lucide-react';

const SystemBroadcast = ({
  broadcasts = [],
  onCreateBroadcast,
  onDeleteBroadcast,
  submitting = false,
}) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info'); // 'info' | 'success' | 'warning' | 'alert'
  const [targetAudience, setTargetAudience] = useState('ALL'); // 'ALL' | 'TRIAL_ONLY' | 'EXPIRED_ONLY'

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    onCreateBroadcast({
      title: title.trim(),
      message: message.trim(),
      type,
      targetAudience,
      isActive: true,
    });

    setTitle('');
    setMessage('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left 2 Cols: Broadcast Composer */}
      <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md text-white space-y-5">
        <div>
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Megaphone className="w-5 h-5 text-brand-400" />
            <span>Global System Announcement Composer</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Broadcast responsive, real-time announcement banners to store owner dashboards.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Announcement Headline / Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Scheduled System Upgrade Tonight at 2:00 AM PKT"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-medium text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Detailed Message Announcement *
            </label>
            <textarea
              rows={3}
              required
              placeholder="Brief message explaining new features, offline payment instructions, or maintenance windows..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-medium text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Severity Pill Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Banner Severity Level
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'info', label: 'Info (Blue)' },
                  { id: 'success', label: 'Success (Green)' },
                  { id: 'warning', label: 'Notice (Amber)' },
                  { id: 'alert', label: 'Critical (Red)' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setType(item.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition text-left border ${
                      type === item.id
                        ? 'bg-brand-500/20 border-brand-500 text-brand-300'
                        : 'border-slate-800 bg-slate-800/60 text-slate-400 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Audience Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Target Audience
              </label>
              <div className="space-y-1.5">
                {[
                  { id: 'ALL', label: 'All Stores (Everyone)' },
                  { id: 'TRIAL_ONLY', label: '14-Day Free Trial Stores Only' },
                  { id: 'EXPIRED_ONLY', label: 'Expired Stores (Renewal Alert)' },
                ].map((aud) => (
                  <button
                    key={aud.id}
                    type="button"
                    onClick={() => setTargetAudience(aud.id)}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-bold transition text-left border ${
                      targetAudience === aud.id
                        ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300'
                        : 'border-slate-800 bg-slate-800/60 text-slate-400 hover:text-white'
                    }`}
                  >
                    {aud.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Live Preview Box */}
          <div className="pt-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Live Merchant Dashboard Banner Preview:
            </label>
            <div
              className={`p-3 rounded-xl border text-xs font-medium flex items-center justify-between shadow-xs ${
                type === 'alert'
                  ? 'bg-red-600 text-white border-red-700'
                  : type === 'warning'
                  ? 'bg-amber-600 text-white border-amber-700'
                  : type === 'success'
                  ? 'bg-emerald-700 text-white border-emerald-800'
                  : 'bg-brand-700 text-white border-brand-800'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Megaphone className="w-4 h-4 flex-shrink-0 animate-bounce" />
                <span>
                  <strong>{title || 'Announcement Title'}:</strong>{' '}
                  {message || 'Announcement message preview will be rendered here.'}
                </span>
              </div>
              <X className="w-4 h-4 opacity-75" />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={submitting || !title || !message}
              className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50 flex items-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Broadcasting...' : 'Publish Announcement'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Right Col: Past Broadcasts */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md text-white space-y-4">
        <h4 className="text-sm font-bold text-white flex items-center justify-between">
          <span>Active Announcements</span>
          <span className="text-xs text-slate-400 font-mono">({broadcasts.length})</span>
        </h4>

        <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
          {broadcasts.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8">
              No broadcast announcements currently recorded.
            </p>
          ) : (
            broadcasts.map((b) => (
              <div
                key={b._id}
                className="p-3.5 rounded-xl border border-slate-850 bg-slate-800/60 flex flex-col justify-between space-y-2"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-white">{b.title}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase ${
                        b.isActive ? 'bg-emerald-950 text-emerald-300' : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {b.isActive ? 'Live' : 'Archived'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2">{b.message}</p>
                  <div className="flex items-center space-x-2 mt-2 text-[10px] text-slate-500">
                    <span className="uppercase font-bold text-slate-400">{b.type}</span>
                    <span>•</span>
                    <span>Audience: {b.targetAudience || 'ALL'}</span>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => onDeleteBroadcast(b._id)}
                    className="text-red-400 hover:text-red-300 text-xs font-bold inline-flex items-center space-x-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemBroadcast;
