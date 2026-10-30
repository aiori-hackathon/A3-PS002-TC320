import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { User, PrivacyNotice, UserConsentSummary, ConsentEvent } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import {
  Shield,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  History,
  AlertTriangle,
  RotateCw,
  Copy,
  Check,
} from 'lucide-react';

export const ConsentPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('user_001');
  const [currentNotice, setCurrentNotice] = useState<PrivacyNotice | null>(null);
  const [consentSummary, setConsentSummary] = useState<UserConsentSummary | null>(null);
  const [history, setHistory] = useState<ConsentEvent[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [copiedHash, setCopiedHash] = useState<boolean>(false);

  // Load initial data
  useEffect(() => {
    async function init() {
      try {
        const [uList, notice] = await Promise.all([api.getUsers(), api.getCurrentNotice()]);
        setUsers(uList);
        setCurrentNotice(notice);
      } catch (err: any) {
        setNotification({ message: err.message, type: 'error' });
      }
    }
    init();
  }, []);

  // Fetch consent state and history when user changes
  const refreshUserData = async (userId: string) => {
    try {
      const [summary, hist, notice] = await Promise.all([
        api.getUserConsentState(userId),
        api.getUserConsentHistory(userId),
        api.getCurrentNotice(),
      ]);
      setConsentSummary(summary);
      setHistory(hist);
      setCurrentNotice(notice);
    } catch (err: any) {
      setNotification({ message: err.message, type: 'error' });
    }
  };

  useEffect(() => {
    if (selectedUserId) {
      refreshUserData(selectedUserId);
    }
  }, [selectedUserId]);

  const handleGrant = async (purposeId: string) => {
    setActionLoading(`grant-${purposeId}`);
    try {
      await api.grantConsent(selectedUserId, purposeId);
      setNotification({
        message: `Consent successfully granted for '${purposeId}' bound to Notice ${currentNotice?.version}`,
        type: 'success',
      });
      await refreshUserData(selectedUserId);
    } catch (err: any) {
      setNotification({ message: err.message, type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleWithdraw = async (purposeId: string) => {
    setActionLoading(`withdraw-${purposeId}`);
    try {
      await api.withdrawConsent(selectedUserId, purposeId);
      setNotification({
        message: `Consent successfully withdrawn for '${purposeId}'. Downstream requests will now be blocked with HTTP 403.`,
        type: 'success',
      });
      await refreshUserData(selectedUserId);
    } catch (err: any) {
      setNotification({ message: err.message, type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCopyHash = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const selectedUser = users.find((u) => u.id === selectedUserId);
  const grantedCount = consentSummary?.states.filter((s) => s.status === 'GRANTED' && !s.is_stale).length || 0;
  const staleCount = consentSummary?.states.filter((s) => s.is_stale).length || 0;
  const withdrawnCount = consentSummary?.states.filter((s) => s.status === 'WITHDRAWN' || s.status === 'NO_CONSENT').length || 0;

  return (
    <div className="space-y-6">
      {/* Page Header Card */}
      <div className="card-interactive bg-[#121623] p-6 sm:p-7 rounded-3xl border border-white/[0.08] shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono">
              DPDP ACT 2023 §6 REGISTRY
            </span>
            <span className="text-xs text-slate-400 font-mono">• Synthetic Subjects</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-amber-400" />
            Purpose-Based Consent Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Individually grant or revoke consent for itemized processing purposes. Every decision is cryptographically bound to privacy notice versions and recorded in an immutable append-only ledger.
          </p>
        </div>

        {/* User Selection & Refresh */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2.5 bg-[#171b28] border border-white/[0.08] hover:border-amber-500/30 rounded-2xl px-3.5 py-2 shadow-sm transition">
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white text-[10px] font-bold">
              {selectedUser?.name ? selectedUser.name.charAt(0) : 'U'}
            </div>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer pr-1"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id} className="bg-[#171b28] text-white">
                  {u.name} ({u.id}) {u.is_active ? '• Active' : '• Inactive'}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => refreshUserData(selectedUserId)}
            className="p-2.5 text-slate-400 hover:text-white hover:bg-white/[0.06] rounded-2xl border border-white/[0.08] hover:border-amber-500/30 transition cursor-pointer"
            title="Refresh user consent state"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* User Summary Stats Bar (Interactive Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="card-interactive bg-[#121623] p-4 rounded-2xl border border-white/[0.06] flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Current User</p>
            <p className="text-sm font-bold text-white mt-0.5">{selectedUser?.name || selectedUserId}</p>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono ${selectedUser?.is_active ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'}`}>
            {selectedUser?.is_active ? 'ACTIVE USER' : 'INACTIVE'}
          </span>
        </div>

        <div className="card-interactive-emerald bg-[#121623] p-4 rounded-2xl border border-emerald-500/20 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Active Grants</p>
            <p className="text-xl font-black text-emerald-400 mt-0.5">{grantedCount} Allowed</p>
          </div>
          <CheckCircle2 className="w-5 h-5 text-emerald-400/80" />
        </div>

        <div className="card-interactive bg-[#121623] p-4 rounded-2xl border border-amber-500/20 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Stale Consents</p>
            <p className="text-xl font-black text-amber-400 mt-0.5">{staleCount} Need Review</p>
          </div>
          <AlertTriangle className="w-5 h-5 text-amber-400/80" />
        </div>

        <div className="card-interactive bg-[#121623] p-4 rounded-2xl border border-white/[0.06] flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Revoked / Inactive</p>
            <p className="text-xl font-black text-slate-300 mt-0.5">{withdrawnCount} Blocked</p>
          </div>
          <XCircle className="w-5 h-5 text-rose-400/80" />
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-4 rounded-2xl text-xs font-medium flex items-center justify-between border animate-in fade-in duration-200 ${
            notification.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25 shadow-glow-emerald-sm'
              : 'bg-rose-500/10 text-rose-300 border-rose-500/25'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-xs font-bold ml-4 underline opacity-80 hover:opacity-100 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Authoritative Notice Banner Card */}
      {currentNotice && (
        <div className="card-interactive bg-[#111524] border border-amber-500/25 rounded-3xl p-5 text-xs text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_10px_25px_rgba(0,0,0,0.4)]">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-2xl mt-0.5 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-white text-sm flex items-center gap-2">
                Active Privacy Notice: {currentNotice.version}
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30 font-mono">
                  AUTHORITATIVE POLICY
                </span>
              </p>
              <div className="flex items-center gap-2 mt-1 font-mono text-[11px] text-slate-400">
                <span className="truncate max-w-sm">SHA-256: {currentNotice.hash_sha256}</span>
                <button
                  onClick={() => handleCopyHash(currentNotice.hash_sha256)}
                  className="p-1 hover:text-white transition opacity-60 hover:opacity-100"
                  title="Copy Notice SHA-256 hash"
                >
                  {copiedHash ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
                </button>
              </div>
            </div>
          </div>
          <div className="text-[11px] text-slate-400 bg-[#161a28] px-3.5 py-1.5 rounded-xl border border-white/[0.06] font-mono shrink-0 self-start sm:self-auto">
            DPDP §6(1) &amp; GDPR Art. 7
          </div>
        </div>
      )}

      {/* Purpose Consent Grid (Interactive Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {consentSummary?.states.map((state) => {
          const isGranted = state.status === 'GRANTED' && !state.is_stale;
          const isStale = state.is_stale;
          const isNoConsent = state.status === 'NO_CONSENT';

          const cardHoverClass = isStale
            ? 'card-interactive border-amber-500/40 bg-[#17151f] ring-1 ring-amber-500/20'
            : isGranted
            ? 'card-interactive-emerald border-emerald-500/25 bg-[#10191c]'
            : 'card-interactive border-white/[0.07] bg-[#121623]';

          return (
            <div
              key={state.purpose_id}
              className={`rounded-3xl p-6 border transition-all duration-200 shadow-[0_10px_30px_rgba(0,0,0,0.4)] flex flex-col justify-between ${cardHoverClass}`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-white text-base tracking-tight">{state.purpose_name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-block font-mono text-[10px] text-slate-400 bg-[#171b28] px-2 py-0.5 rounded border border-white/[0.06]">
                        {state.purpose_id}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Itemized Purpose
                      </span>
                    </div>
                  </div>
                  <div>
                    <StatusBadge consentStatus={state.status} isStale={state.is_stale} />
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 mt-3.5 leading-relaxed">
                  {state.purpose_description}
                </p>

                {/* Stale Warning */}
                {isStale && (
                  <div className="mt-3.5 p-3.5 bg-amber-500/10 border border-amber-500/25 rounded-2xl text-xs text-amber-300 flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-amber-300">Notice Revision Superseded</p>
                      <p className="text-amber-400/90 mt-0.5 text-[11px] leading-relaxed">
                        Consent was granted under notice version <strong>{state.notice_version}</strong>. The active policy is now <strong>{currentNotice?.version}</strong>. Downstream access will be blocked until re-consent is recorded.
                      </p>
                    </div>
                  </div>
                )}

                {/* Metadata Row */}
                <div className="mt-4 pt-3.5 border-t border-white/[0.05] text-[11px] text-slate-400 space-y-1.5">
                  {state.last_updated && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Last Decision: {new Date(state.last_updated).toLocaleString()}</span>
                    </div>
                  )}
                  {state.notice_version && (
                    <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      <span>Bound Notice: {state.notice_version} ({state.notice_hash?.substring(0, 10)}...)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-end gap-2.5">
                {isGranted ? (
                  <button
                    onClick={() => handleWithdraw(state.purpose_id)}
                    disabled={actionLoading !== null}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border border-rose-500/30 transition-all duration-200 hover:scale-[1.02] cursor-pointer"
                  >
                    <XCircle className="w-4 h-4 text-rose-400" />
                    Withdraw Consent
                  </button>
                ) : isStale ? (
                  <button
                    onClick={() => handleGrant(state.purpose_id)}
                    disabled={actionLoading !== null}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-600 to-orange-500 text-white hover:from-amber-500 hover:to-orange-400 shadow-glow-copper-sm transition-all duration-200 hover:scale-[1.02] cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Review &amp; Re-consent ({currentNotice?.version})
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => handleGrant(state.purpose_id)}
                      disabled={actionLoading !== null}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 shadow-sm transition-all duration-200 hover:scale-[1.02] cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Grant Consent
                    </button>
                    {!isNoConsent && (
                      <button
                        onClick={() => handleWithdraw(state.purpose_id)}
                        disabled={actionLoading !== null}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#171b28] text-slate-400 hover:text-white border border-white/[0.06] transition cursor-pointer"
                      >
                        Withdrawn
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Append-Only Event History for User (Interactive Card) */}
      <div className="card-interactive bg-[#121623] rounded-3xl border border-white/[0.08] shadow-[0_10px_30px_rgba(0,0,0,0.5)] overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <History className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Immutable Append-Only Consent History ({selectedUser?.name || selectedUserId})
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-medium font-mono hidden sm:inline">
            ● Append-only immutable log
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/[0.04] text-left text-xs">
            <thead className="bg-[#0e111a] text-slate-400 uppercase font-semibold text-[11px] tracking-wider font-mono">
              <tr>
                <th className="py-3.5 px-5">Event ID</th>
                <th className="py-3.5 px-5">Action</th>
                <th className="py-3.5 px-5">Purpose</th>
                <th className="py-3.5 px-5">Notice Version</th>
                <th className="py-3.5 px-5">Notice Hash</th>
                <th className="py-3.5 px-5">Timestamp (UTC)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-slate-300 font-sans">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-500 text-xs">
                    No historical consent events recorded for this user yet.
                  </td>
                </tr>
              ) : (
                history.map((evt) => (
                  <tr key={evt.id} className="hover:bg-[#171c2b] transition-colors">
                    <td className="py-3.5 px-5 font-mono text-[11px] text-slate-400 truncate max-w-[120px]">
                      {evt.event_id}
                    </td>
                    <td className="py-3.5 px-5">
                      {evt.action === 'GRANT' ? (
                        <span className="px-2.5 py-0.5 rounded-full font-bold text-emerald-400 bg-emerald-500/10 text-[10px] border border-emerald-500/30 font-mono">
                          GRANT
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full font-bold text-rose-400 bg-rose-500/10 text-[10px] border border-rose-500/30 font-mono">
                          WITHDRAW
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 font-semibold text-white">{evt.purpose_id}</td>
                    <td className="py-3.5 px-5 font-mono text-slate-300">{evt.notice_version}</td>
                    <td className="py-3.5 px-5 font-mono text-[11px] text-slate-400 truncate max-w-[140px]" title={evt.notice_hash}>
                      {evt.notice_hash}
                    </td>
                    <td className="py-3.5 px-5 text-slate-400 font-mono text-[11px]">
                      {new Date(evt.timestamp).toISOString()}
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

export default ConsentPage;
