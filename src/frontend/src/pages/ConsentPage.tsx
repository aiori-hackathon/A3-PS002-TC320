import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { User, PrivacyNotice, UserConsentSummary, ConsentEvent } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import {
  Shield,
  User as UserIcon,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  History,
  AlertTriangle,
  RotateCw,
} from 'lucide-react';

export const ConsentPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('user_001');
  const [currentNotice, setCurrentNotice] = useState<PrivacyNotice | null>(null);
  const [consentSummary, setConsentSummary] = useState<UserConsentSummary | null>(null);
  const [history, setHistory] = useState<ConsentEvent[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

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
        message: `Consent successfully granted for '${purposeId}' under notice ${currentNotice?.version}`,
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
        message: `Consent successfully withdrawn for '${purposeId}'. Downstream requests will now be blocked.`,
        type: 'success',
      });
      await refreshUserData(selectedUserId);
    } catch (err: any) {
      setNotification({ message: err.message, type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const selectedUser = users.find((u) => u.id === selectedUserId);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-brand-600" />
            Purpose-Based Consent Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Individually grant or withdraw consent for itemized processing purposes. Consent is bound to privacy notice versions.
          </p>
        </div>

        {/* User Selection */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 shadow-sm">
            <UserIcon className="w-4 h-4 text-slate-500" />
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="bg-transparent text-sm font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.id}) {u.is_active ? '' : '[INACTIVE]'}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => refreshUserData(selectedUserId)}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200"
            title="Refresh state"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-4 rounded-lg text-sm flex items-center justify-between border ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <span>{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            className="text-xs font-semibold ml-4 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Notice Version Banner */}
      {currentNotice && (
        <div className="bg-indigo-50/60 border border-indigo-200 rounded-xl p-4 text-sm text-indigo-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-indigo-600 text-white rounded-lg mt-0.5">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold flex items-center gap-2">
                Active Privacy Notice: {currentNotice.version}
                <span className="text-xs px-2 py-0.5 rounded bg-indigo-200 text-indigo-800 font-semibold">
                  Authoritative Version
                </span>
              </p>
              <p className="text-xs text-indigo-700 mt-0.5 font-mono">
                SHA-256: {currentNotice.hash_sha256}
              </p>
            </div>
          </div>
          <div className="text-xs text-indigo-700 bg-white/80 px-3 py-1.5 rounded-lg border border-indigo-100">
            India DPDP Act 2023 &amp; GDPR Compliant
          </div>
        </div>
      )}

      {/* Purpose Consent Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {consentSummary?.states.map((state) => {
          const isGranted = state.status === 'GRANTED' && !state.is_stale;
          const isStale = state.is_stale;
          const isNoConsent = state.status === 'NO_CONSENT';

          return (
            <div
              key={state.purpose_id}
              className={`bg-white rounded-xl p-5 border transition-shadow shadow-sm flex flex-col justify-between ${
                isStale
                  ? 'border-amber-300 ring-1 ring-amber-200'
                  : isGranted
                  ? 'border-emerald-200'
                  : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{state.purpose_name}</h3>
                    <span className="inline-block mt-0.5 font-mono text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                      {state.purpose_id}
                    </span>
                  </div>
                  <div>
                    <StatusBadge consentStatus={state.status} isStale={state.is_stale} />
                  </div>
                </div>

                <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                  {state.purpose_description}
                </p>

                {/* Stale Warning */}
                {isStale && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Notice Superseded</p>
                      <p className="text-amber-700 mt-0.5">
                        Consent was granted under notice version <strong>{state.notice_version}</strong>. The active notice is now <strong>{currentNotice?.version}</strong>. You must review and grant re-consent to re-enable data processing.
                      </p>
                    </div>
                  </div>
                )}

                {/* Metadata */}
                <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 space-y-1">
                  {state.last_updated && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Last Action: {new Date(state.last_updated).toLocaleString()}</span>
                    </div>
                  )}
                  {state.notice_version && (
                    <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
                      <span>Bound Notice: {state.notice_version} ({state.notice_hash?.substring(0, 8)}...)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                {isGranted ? (
                  <button
                    onClick={() => handleWithdraw(state.purpose_id)}
                    disabled={actionLoading !== null}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition"
                  >
                    <XCircle className="w-4 h-4 text-rose-600" />
                    Withdraw Consent
                  </button>
                ) : isStale ? (
                  <button
                    onClick={() => handleGrant(state.purpose_id)}
                    disabled={actionLoading !== null}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-amber-600 text-white hover:bg-amber-500 shadow-sm transition"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Review &amp; Re-consent ({currentNotice?.version})
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => handleGrant(state.purpose_id)}
                      disabled={actionLoading !== null}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm transition"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Grant Consent
                    </button>
                    {!isNoConsent && (
                      <button
                        onClick={() => handleWithdraw(state.purpose_id)}
                        disabled={actionLoading !== null}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200 transition"
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

      {/* Append-Only Event History for User */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-brand-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Immutable Append-Only Consent History ({selectedUser?.name})
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Events are never updated or deleted
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Event ID</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Purpose</th>
                <th className="py-3 px-4">Notice Version</th>
                <th className="py-3 px-4">Notice Hash</th>
                <th className="py-3 px-4">Timestamp (UTC)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">
                    No historical consent events recorded for this user yet.
                  </td>
                </tr>
              ) : (
                history.map((evt) => (
                  <tr key={evt.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 truncate max-w-[120px]">
                      {evt.event_id}
                    </td>
                    <td className="py-3 px-4">
                      {evt.action === 'GRANT' ? (
                        <span className="px-2 py-0.5 rounded font-bold text-emerald-800 bg-emerald-100 text-[11px] border border-emerald-300">
                          GRANT
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded font-bold text-rose-800 bg-rose-100 text-[11px] border border-rose-300">
                          WITHDRAW
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{evt.purpose_id}</td>
                    <td className="py-3 px-4 font-mono font-medium">{evt.notice_version}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 truncate max-w-[140px]" title={evt.notice_hash}>
                      {evt.notice_hash}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
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
