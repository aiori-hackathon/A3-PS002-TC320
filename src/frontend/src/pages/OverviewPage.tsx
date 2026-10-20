import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { User, Purpose, PrivacyNotice, AuditEvent, AuditVerifyResponse } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import {
  Users,
  Target,
  FileCheck,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Activity,
  Lock,
} from 'lucide-react';

interface OverviewPageProps {
  onNavigate: (tab: string) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ onNavigate }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [purposes, setPurposes] = useState<Purpose[]>([]);
  const [currentNotice, setCurrentNotice] = useState<PrivacyNotice | null>(null);
  const [recentEvents, setRecentEvents] = useState<AuditEvent[]>([]);
  const [verifyResult, setVerifyResult] = useState<AuditVerifyResponse | null>(null);

  const loadData = async () => {
    try {
      const [u, p, n, events, v] = await Promise.all([
        api.getUsers(),
        api.getPurposes(),
        api.getCurrentNotice(),
        api.getAuditEvents(6, 0),
        api.verifyAuditChain(),
      ]);
      setUsers(u);
      setPurposes(p);
      setCurrentNotice(n);
      setRecentEvents(events);
      setVerifyResult(v);
    } catch (err) {
      console.error('Failed to load overview data', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-slate-800">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-semibold mb-4 border border-brand-500/30">
            <Lock className="w-3.5 h-3.5" />
            AIORI-3 Prototype • PS002-TC320
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Purpose-Based Consent Recording &amp; Withdrawal System
          </h1>
          <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed">
            FitTrack Lite enforces explicit, itemized informed consent at data-sharing time.
            Withdrawals take effect immediately, privacy notice revisions invalidate stale consent,
            and every authorization decision is anchored in a tamper-evident SHA-256 hash chain.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('consent')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-sm font-semibold transition shadow-md shadow-brand-600/30"
            >
              <ShieldCheck className="w-4 h-4" />
              Manage Consent
            </button>
            <button
              onClick={() => onNavigate('simulator')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-semibold transition border border-slate-700"
            >
              <Activity className="w-4 h-4" />
              Simulate Data Access
            </button>
            <button
              onClick={() => onNavigate('audit')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-semibold transition border border-slate-700"
            >
              Audit Evidence Trail
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Synthetic Users</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{users.length}</p>
            <p className="text-xs text-slate-400 mt-0.5">{users.filter(u => u.is_active).length} active, {users.filter(u => !u.is_active).length} inactive</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Itemized Purposes</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{purposes.length}</p>
            <p className="text-xs text-slate-400 mt-0.5">Unbundled explicit consent</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Target className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Notice Version</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{currentNotice?.version || '...'}</p>
            <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[140px]" title={currentNotice?.hash_sha256}>
              SHA-256: {currentNotice?.hash_sha256.substring(0, 10)}...
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <FileCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Audit Hash Chain</p>
            <div className="mt-1 flex items-center gap-1.5">
              {verifyResult?.is_valid ? (
                <>
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <span className="text-base font-bold text-emerald-700">Valid</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="text-base font-bold text-red-700">Tampered</span>
                </>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{verifyResult?.total_records || 0} chained events</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Critical Workflow Demonstration Card */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Activity className="w-5 h-5 text-brand-600" />
          Verified Prototype Enforcement Workflow
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          The essential requirement of AIORI-3: Grant Consent → Receive HTTP 200 → Withdraw Consent → Receive HTTP 403.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 relative">
            <span className="absolute -top-2.5 left-3 px-2 py-0.5 bg-brand-600 text-white rounded text-xs font-bold">1</span>
            <p className="font-semibold text-sm text-slate-800">Grant Consent</p>
            <p className="text-xs text-slate-500 mt-1">
              User grants consent for an explicit purpose bound to Notice {currentNotice?.version}. Append-only event logged.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-emerald-50/70 border border-emerald-200 relative">
            <span className="absolute -top-2.5 left-3 px-2 py-0.5 bg-emerald-600 text-white rounded text-xs font-bold">2</span>
            <p className="font-semibold text-sm text-emerald-900">Request Data (Allowed)</p>
            <p className="text-xs text-emerald-700 mt-1">
              Downstream consumer requests data. Server validates active consent. Returns <strong>HTTP 200</strong> with synthetic data.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 relative">
            <span className="absolute -top-2.5 left-3 px-2 py-0.5 bg-rose-600 text-white rounded text-xs font-bold">3</span>
            <p className="font-semibold text-sm text-slate-800">Withdraw Consent</p>
            <p className="text-xs text-slate-500 mt-1">
              User withdraws consent anytime with 1 click. New withdrawal event appended; historical events preserved.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-rose-50/70 border border-rose-200 relative">
            <span className="absolute -top-2.5 left-3 px-2 py-0.5 bg-rose-600 text-white rounded text-xs font-bold">4</span>
            <p className="font-semibold text-sm text-rose-900">Request Data (Blocked)</p>
            <p className="text-xs text-rose-700 mt-1">
              Downstream request immediately denied with <strong>HTTP 403</strong> and reason code <code>CONSENT_WITHDRAWN</code>.
            </p>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Live Audit Activity Stream</h3>
            <p className="text-xs text-slate-500 mt-0.5">Real-time decisions and consent records appended to the hash chain</p>
          </div>
          <button
            onClick={() => onNavigate('audit')}
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            View Full Audit Log &rarr;
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Seq #</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Subject &amp; Purpose</th>
                <th className="py-3 px-4">Decision / Reason</th>
                <th className="py-3 px-4">Record Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {recentEvents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400 font-sans">
                    No audit records yet.
                  </td>
                </tr>
              ) : (
                recentEvents.map((evt) => (
                  <tr key={evt.sequence_number} className="hover:bg-slate-50/80 transition-colors font-sans">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">#{evt.sequence_number}</td>
                    <td className="py-3 px-4 text-slate-500">{new Date(evt.timestamp).toLocaleTimeString()}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {evt.event_type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-900">{evt.user_id || 'System'}</span>
                      {evt.purpose_id && <span className="text-slate-400"> • {evt.purpose_id}</span>}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge reasonCode={evt.reason_code} />
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 truncate max-w-[130px]" title={evt.current_hash}>
                      {evt.current_hash.substring(0, 12)}...
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
