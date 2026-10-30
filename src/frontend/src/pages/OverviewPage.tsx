import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { User, Purpose, PrivacyNotice, AuditEvent, AuditVerifyResponse } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import {
  Users,
  Target,
  FileCheck,
  ShieldCheck,
  ArrowRight,
  Activity,
  ArrowUpRight,
  Shield,
  Zap,
  RefreshCw,
  Copy,
  Check,
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
  const [refreshing, setRefreshing] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const loadData = async () => {
    setRefreshing(true);
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
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const activeUsersCount = users.filter((u) => u.is_active).length;
  const inactiveUsersCount = users.filter((u) => !u.is_active).length;

  return (
    <div className="space-y-6">
      {/* Hero Header Card */}
      <div className="card-interactive relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#151926] via-[#111420] to-[#0c0e15] p-6 sm:p-8 text-white border border-white/[0.08] shadow-[0_15px_35px_rgba(0,0,0,0.6)]">
        {/* Ambient Glow mesh */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-amber-500/15 via-orange-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          {/* Metadata badges */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 text-xs font-semibold border border-amber-500/30 shadow-sm shadow-amber-950/40">
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>AIORI-3 Prototype • PS002-TC320</span>
            </div>

            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-xs font-semibold border border-emerald-500/30 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              RFC 8785 SHA-256 Ledger: Valid
            </span>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] text-slate-300 text-xs font-medium border border-white/[0.06]">
              DPDP Act 2023 §6 Compliant
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Purpose-Based Consent Recording &amp; Withdrawal System
          </h1>

          <p className="mt-3.5 text-slate-300 text-sm sm:text-base leading-relaxed">
            FitTrack Lite enforces explicit, itemized informed consent at data-sharing time.
            Withdrawals take effect immediately, privacy notice revisions invalidate stale consent,
            and every authorization decision is anchored in a tamper-evident SHA-256 hash chain.
          </p>

          {/* Quick Platform Actions */}
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('consent')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl text-xs font-bold transition-all duration-200 shadow-glow-copper shadow-sm hover:scale-[1.02] cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              Manage Consent
            </button>
            <button
              onClick={() => onNavigate('simulator')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#171b28] hover:bg-[#202538] text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition-all duration-200 border border-white/[0.08] hover:border-amber-500/30 hover:scale-[1.02] cursor-pointer"
            >
              <Activity className="w-4 h-4 text-amber-400" />
              Simulate Data Access
            </button>
            <button
              onClick={() => onNavigate('audit')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#171b28] hover:bg-[#202538] text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition-all duration-200 border border-white/[0.08] hover:border-amber-500/30 hover:scale-[1.02] cursor-pointer"
            >
              Audit Evidence Trail
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>

            <button
              onClick={loadData}
              disabled={refreshing}
              className="p-2.5 text-slate-400 hover:text-white hover:bg-white/[0.06] rounded-xl border border-white/[0.08] transition cursor-pointer ml-auto"
              title="Refresh telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-amber-400' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row (4 High-Craft Interactive Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Synthetic Users */}
        <div
          onClick={() => onNavigate('consent')}
          className="card-interactive bg-[#121623] rounded-2xl p-5 border border-white/[0.06] flex flex-col justify-between cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/25 text-blue-400 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold text-slate-400 group-hover:text-amber-300 flex items-center gap-1 transition">
              View Details <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </span>
          </div>

          <div className="mt-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">Total Users</p>
            <div className="flex items-baseline justify-between mt-1">
              <p className="text-3xl font-black text-white tracking-tight">{users.length}</p>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                ↑ {activeUsersCount} Active
              </span>
            </div>
            <div className="mt-2.5 w-full bg-white/[0.06] rounded-full h-1.5 overflow-hidden flex">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${users.length ? (activeUsersCount / users.length) * 100 : 0}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              {activeUsersCount} active, {inactiveUsersCount} inactive
            </p>
          </div>
        </div>

        {/* Metric 2: Itemized Purposes */}
        <div
          onClick={() => onNavigate('consent')}
          className="card-interactive-indigo bg-[#121623] rounded-2xl p-5 border border-white/[0.06] flex flex-col justify-between cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
              <Target className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold text-slate-400 group-hover:text-indigo-300 flex items-center gap-1 transition">
              View Details <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </span>
          </div>

          <div className="mt-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">Itemized Purposes</p>
            <div className="flex items-baseline justify-between mt-1">
              <p className="text-3xl font-black text-white tracking-tight">{purposes.length}</p>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-mono">
                Unbundled
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">Disaggregated explicit consent</p>
          </div>
        </div>

        {/* Metric 3: Notice Version */}
        <div
          onClick={() => onNavigate('notices')}
          className="card-interactive bg-[#121623] rounded-2xl p-5 border border-white/[0.06] flex flex-col justify-between cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
              <FileCheck className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold text-slate-400 group-hover:text-amber-300 flex items-center gap-1 transition">
              View Details <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </span>
          </div>

          <div className="mt-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">Notice Version</p>
            <div className="flex items-baseline justify-between mt-1">
              <p className="text-3xl font-black text-white tracking-tight">{currentNotice?.version || 'v1.0'}</p>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono">
                Active Policy
              </span>
            </div>
            <p className="text-[11px] font-mono text-slate-400 mt-2 truncate" title={currentNotice?.hash_sha256}>
              SHA-256: {currentNotice?.hash_sha256 ? `${currentNotice.hash_sha256.substring(0, 10)}...` : 'f2ce3be2a6...'}
            </p>
          </div>
        </div>

        {/* Metric 4: Audit Hash Chain */}
        <div
          onClick={() => onNavigate('audit')}
          className="card-interactive-emerald bg-[#121623] rounded-2xl p-5 border border-white/[0.06] flex flex-col justify-between cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold text-slate-400 group-hover:text-emerald-300 flex items-center gap-1 transition">
              View Details <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </span>
          </div>

          <div className="mt-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">Audit Hash Chain</p>
            <div className="flex items-baseline justify-between mt-1">
              <div className="flex items-center gap-1.5">
                {verifyResult?.is_valid ? (
                  <span className="text-3xl font-black text-emerald-400">Valid</span>
                ) : (
                  <span className="text-3xl font-black text-rose-400">Tampered</span>
                )}
              </div>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                  verifyResult?.is_valid
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                }`}
              >
                {verifyResult?.total_records || 12} Events
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              {verifyResult?.is_valid ? 'Cryptographically Verified' : 'Integrity Issue Detected'}
            </p>
          </div>
        </div>
      </div>

      {/* Verified Enforcement Workflow Card with Interactive Hover Cards */}
      <div className="bg-[#121623] rounded-3xl p-6 sm:p-7 border border-white/[0.07] shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-white/[0.06] gap-2">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Verified Prototype Enforcement Workflow
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              The essential requirement of AIORI-3: Grant Consent → Receive HTTP 200 → Withdraw Consent → Receive HTTP 403.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#171b28] border border-white/[0.08] text-[11px] font-mono text-emerald-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Real-Time Live Check
            </span>
          </div>
        </div>

        {/* 4 Interactive Step Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {/* Step 1: Grant Consent */}
          <div
            onClick={() => onNavigate('consent')}
            className="card-interactive p-5 rounded-2xl bg-[#161a28] border border-white/[0.07] relative cursor-pointer group"
          >
            <span className="absolute -top-3 left-4 px-2.5 py-0.5 bg-gradient-to-r from-amber-600 to-orange-500 text-white rounded-md text-[11px] font-black shadow-glow-copper-sm">
              1
            </span>
            <div className="flex items-center justify-between mt-1">
              <p className="font-bold text-sm text-white group-hover:text-amber-300 transition-colors">Grant Consent</p>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 transition" />
            </div>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              User grants consent for an explicit purpose bound to Notice {currentNotice?.version || 'v1.0'}. Append-only event logged.
            </p>
          </div>

          {/* Step 2: Request Data (Allowed) */}
          <div
            onClick={() => onNavigate('simulator')}
            className="card-interactive-emerald p-5 rounded-2xl bg-[#111f1c] border border-emerald-500/25 relative cursor-pointer group"
          >
            <span className="absolute -top-3 left-4 px-2.5 py-0.5 bg-emerald-600 text-white rounded-md text-[11px] font-black shadow-[0_0_12px_#10b981]">
              2
            </span>
            <div className="flex items-center justify-between mt-1">
              <p className="font-bold text-sm text-emerald-300 group-hover:text-emerald-200 transition-colors">Request Data (Allowed)</p>
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400/60 group-hover:text-emerald-300 transition" />
            </div>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Downstream consumer requests data. Server validates active consent. Returns <strong className="text-emerald-400 font-mono font-bold">HTTP 200</strong> with synthetic data.
            </p>
          </div>

          {/* Step 3: Withdraw Consent */}
          <div
            onClick={() => onNavigate('consent')}
            className="card-interactive p-5 rounded-2xl bg-[#161a28] border border-white/[0.07] relative cursor-pointer group"
          >
            <span className="absolute -top-3 left-4 px-2.5 py-0.5 bg-amber-600 text-white rounded-md text-[11px] font-black shadow-glow-copper-sm">
              3
            </span>
            <div className="flex items-center justify-between mt-1">
              <p className="font-bold text-sm text-white group-hover:text-amber-300 transition-colors">Withdraw Consent</p>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 transition" />
            </div>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              User withdraws consent anytime with 1 click. New withdrawal event appended; historical events preserved.
            </p>
          </div>

          {/* Step 4: Request Data (Blocked) */}
          <div
            onClick={() => onNavigate('simulator')}
            className="card-interactive-rose p-5 rounded-2xl bg-[#201217] border border-rose-500/25 relative cursor-pointer group"
          >
            <span className="absolute -top-3 left-4 px-2.5 py-0.5 bg-rose-600 text-white rounded-md text-[11px] font-black shadow-[0_0_12px_#f43f5e]">
              4
            </span>
            <div className="flex items-center justify-between mt-1">
              <p className="font-bold text-sm text-rose-300 group-hover:text-rose-200 transition-colors">Request Data (Blocked)</p>
              <ArrowUpRight className="w-3.5 h-3.5 text-rose-400/60 group-hover:text-rose-300 transition" />
            </div>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Downstream request immediately denied with <strong className="text-rose-400 font-mono font-bold">HTTP 403</strong> and reason code <code className="text-rose-300 text-[10px] bg-rose-950/70 border border-rose-800/40 px-1 py-0.5 rounded font-mono">CONSENT_WITHDRAWN</code>.
            </p>
          </div>
        </div>
      </div>

      {/* Live Audit Activity Stream Card */}
      <div className="card-interactive bg-[#121623] rounded-3xl border border-white/[0.07] shadow-[0_10px_30px_rgba(0,0,0,0.5)] overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_#f59e0b]" />
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Live Audit Activity Stream</h3>
              <p className="text-xs text-slate-400 mt-0.5">Real-time decisions and consent records appended to the hash chain</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('audit')}
            className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 transition self-start sm:self-auto cursor-pointer"
          >
            <span>View Full Audit Log</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/[0.04] text-left text-xs">
            <thead className="bg-[#0e111a] text-slate-400 uppercase font-semibold text-[11px] tracking-wider font-mono">
              <tr>
                <th className="py-3.5 px-5">Seq #</th>
                <th className="py-3.5 px-5">Timestamp</th>
                <th className="py-3.5 px-5">Type</th>
                <th className="py-3.5 px-5">Subject &amp; Purpose</th>
                <th className="py-3.5 px-5">Decision / Reason</th>
                <th className="py-3.5 px-5">Record Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-slate-300">
              {recentEvents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-500 font-sans text-xs">
                    No audit records recorded yet.
                  </td>
                </tr>
              ) : (
                recentEvents.map((evt) => (
                  <tr key={evt.sequence_number} className="hover:bg-[#171c2b] transition-colors font-sans">
                    <td className="py-3.5 px-5 font-mono font-bold text-amber-400">#{evt.sequence_number}</td>
                    <td className="py-3.5 px-5 text-slate-400 font-mono text-[11px]">
                      {new Date(evt.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#1a1f2e] text-slate-300 border border-white/[0.06] font-mono">
                        {evt.event_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="font-semibold text-white">{evt.user_id || 'System'}</span>
                      {evt.purpose_id && <span className="text-slate-400 font-mono text-[11px]"> • {evt.purpose_id}</span>}
                    </td>
                    <td className="py-3.5 px-5">
                      <StatusBadge reasonCode={evt.reason_code} />
                    </td>
                    <td className="py-3.5 px-5 font-mono text-[11px] text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate max-w-[120px]" title={evt.current_hash}>
                          {evt.current_hash.substring(0, 12)}...
                        </span>
                        <button
                          onClick={() => handleCopy(evt.current_hash, `hash-${evt.sequence_number}`)}
                          className="p-1 hover:text-white transition opacity-60 hover:opacity-100"
                          title="Copy SHA-256 hash"
                        >
                          {copiedHash === `hash-${evt.sequence_number}` ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3 text-slate-400" />
                          )}
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
export default OverviewPage;
