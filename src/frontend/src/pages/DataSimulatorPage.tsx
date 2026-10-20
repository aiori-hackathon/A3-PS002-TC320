import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { User, Purpose } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import {
  Activity,
  Send,
  CheckCircle,
  XCircle,
  Code,
  ShieldCheck,
  ShieldAlert,
  Server,
  Sparkles,
} from 'lucide-react';

export const DataSimulatorPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [purposes, setPurposes] = useState<Purpose[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('user_001');
  const [customUser, setCustomUser] = useState<string>('');
  const [selectedPurpose, setSelectedPurpose] = useState<string>('fitness_analytics');
  const [customPurpose, setCustomPurpose] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseBody, setResponseBody] = useState<any | null>(null);
  const [requestTimestamp, setRequestTimestamp] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [u, p] = await Promise.all([api.getUsers(), api.getPurposes()]);
        setUsers(u);
        setPurposes(p);
      } catch (e) {
        console.error(e);
      }
    }
    load();
  }, []);

  const handleExecuteRequest = async (overrideUser?: string, overridePurpose?: string) => {
    const userToUse = overrideUser !== undefined ? overrideUser : customUser.trim() || selectedUser;
    const purposeToUse =
      overridePurpose !== undefined ? overridePurpose : customPurpose.trim() || selectedPurpose;

    setLoading(true);
    setResponseStatus(null);
    setResponseBody(null);
    setRequestTimestamp(new Date().toISOString());

    try {
      const res = await api.requestDataAccess(userToUse, purposeToUse);
      setResponseStatus(res.status);
      setResponseBody(res.body);
    } catch (err: any) {
      setResponseStatus(500);
      setResponseBody({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const getReasonCode = () => {
    if (!responseBody) return undefined;
    if (responseBody.reason_code) return responseBody.reason_code;
    if (responseBody.detail?.reason_code) return responseBody.detail.reason_code;
    return undefined;
  };

  const isAllowed = responseStatus === 200;
  const reasonCode = getReasonCode();

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Activity className="w-5 h-5 text-brand-600" />
          Downstream Data-Sharing Access Simulator
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Simulate downstream external consumers (partner gyms, marketing campaigns, analytics pipelines)
          requesting protected fitness metrics. The server-side authorization engine validates live consent, purpose, and notice freshness before releasing data.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Request Builder */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Server className="w-4 h-4 text-slate-500" />
              API Request Configuration
            </h2>

            {/* Target User */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Data Principal (User ID)
              </label>
              <select
                value={customUser ? '__custom__' : selectedUser}
                onChange={(e) => {
                  if (e.target.value === '__custom__') {
                    setCustomUser('unknown_user_999');
                  } else {
                    setCustomUser('');
                    setSelectedUser(e.target.value);
                  }
                }}
                className="w-full text-xs font-medium rounded-lg border border-slate-300 px-3 py-2 bg-slate-50 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.id}) {u.is_active ? '' : '[INACTIVE]'}
                  </option>
                ))}
                <option value="__custom__">Manual / Custom ID (for denial testing)</option>
              </select>

              {customUser && (
                <input
                  type="text"
                  placeholder="Enter test user ID e.g. unknown_user"
                  value={customUser}
                  onChange={(e) => setCustomUser(e.target.value)}
                  className="mt-2 w-full text-xs font-mono rounded-lg border border-amber-300 px-3 py-2 bg-amber-50 text-amber-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              )}
            </div>

            {/* Purpose */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Declared Processing Purpose
              </label>
              <select
                value={customPurpose ? '__custom__' : selectedPurpose}
                onChange={(e) => {
                  if (e.target.value === '__custom__') {
                    setCustomPurpose('unregistered_purpose_x');
                  } else {
                    setCustomPurpose('');
                    setSelectedPurpose(e.target.value);
                  }
                }}
                className="w-full text-xs font-medium rounded-lg border border-slate-300 px-3 py-2 bg-slate-50 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {purposes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.id}) {p.is_active ? '' : '[INACTIVE]'}
                  </option>
                ))}
                <option value="__custom__">Manual / Custom Purpose (for denial testing)</option>
              </select>

              {customPurpose && (
                <input
                  type="text"
                  placeholder="Enter test purpose e.g. biometric_harvesting"
                  value={customPurpose}
                  onChange={(e) => setCustomPurpose(e.target.value)}
                  className="mt-2 w-full text-xs font-mono rounded-lg border border-amber-300 px-3 py-2 bg-amber-50 text-amber-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              )}
            </div>

            {/* Endpoint Information */}
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 text-xs font-mono text-slate-600">
              <span className="font-bold text-brand-600">POST</span> /api/data/access
              <pre className="mt-2 text-[11px] text-slate-700">
{JSON.stringify(
  {
    user_id: customUser.trim() || selectedUser,
    purpose: customPurpose.trim() || selectedPurpose,
  },
  null,
  2
)}
              </pre>
            </div>

            {/* Submit Button */}
            <button
              onClick={() => handleExecuteRequest()}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-sm font-semibold shadow-md shadow-brand-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {loading ? 'Evaluating Live Consent...' : 'Send Access Request'}
            </button>
          </div>

          {/* Quick Test Presets */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-500" />
              Quick Scenario Tests
            </h3>
            <div className="space-y-1.5">
              <button
                onClick={() => {
                  setSelectedUser('user_001');
                  setCustomUser('');
                  setSelectedPurpose('fitness_analytics');
                  setCustomPurpose('');
                  handleExecuteRequest('user_001', 'fitness_analytics');
                }}
                className="w-full text-left px-3 py-2 text-xs rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium transition"
              >
                1. Test Standard Flow: <code>user_001</code> • <code>fitness_analytics</code>
              </button>
              <button
                onClick={() => {
                  setCustomUser('non_existent_ghost');
                  handleExecuteRequest('non_existent_ghost', 'fitness_analytics');
                }}
                className="w-full text-left px-3 py-2 text-xs rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium transition"
              >
                2. Test Unknown User: <code>non_existent_ghost</code> &rarr; UNKNOWN_USER (403)
              </button>
              <button
                onClick={() => {
                  setCustomPurpose('unregistered_telemetry');
                  handleExecuteRequest('user_001', 'unregistered_telemetry');
                }}
                className="w-full text-left px-3 py-2 text-xs rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium transition"
              >
                3. Test Unknown Purpose: <code>unregistered_telemetry</code> &rarr; UNKNOWN_PURPOSE (403)
              </button>
              <button
                onClick={() => {
                  setSelectedUser('user_inactive');
                  setCustomUser('');
                  handleExecuteRequest('user_inactive', 'fitness_analytics');
                }}
                className="w-full text-left px-3 py-2 text-xs rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium transition"
              >
                4. Test Deactivated User: <code>user_inactive</code> &rarr; INACTIVE_USER (403)
              </button>
            </div>
          </div>
        </div>

        {/* Right Output: HTTP Inspection */}
        <div className="lg:col-span-7">
          <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-hidden flex flex-col h-full min-h-[460px]">
            {/* Header / Status Bar */}
            <div className="bg-slate-950 px-5 py-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-brand-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  HTTP Response Inspector
                </span>
              </div>

              {responseStatus !== null && (
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold ${
                      isAllowed
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    HTTP {responseStatus} {isAllowed ? 'OK' : 'FORBIDDEN'}
                  </span>
                </div>
              )}
            </div>

            {/* Decision Banner */}
            {responseStatus !== null ? (
              <div
                className={`p-4 border-b text-xs flex items-center justify-between ${
                  isAllowed
                    ? 'bg-emerald-950/40 border-emerald-900/50 text-emerald-200'
                    : 'bg-rose-950/40 border-rose-900/50 text-rose-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {isAllowed ? (
                    <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                  )}
                  <div>
                    <p className="font-bold">
                      Decision: {isAllowed ? 'ACCESS GRANTED' : 'ACCESS DENIED'}
                    </p>
                    <p className="text-slate-400 mt-0.5">
                      {isAllowed
                        ? 'Consent verified and active under current privacy notice.'
                        : responseBody?.detail?.message || 'Access blocked by authorization engine.'}
                    </p>
                  </div>
                </div>
                <div>
                  <StatusBadge reasonCode={reasonCode} />
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center my-auto">
                <Send className="w-8 h-8 mb-2 text-slate-600" />
                <p className="text-sm font-medium">Ready to simulate data access request</p>
                <p className="text-xs text-slate-600 mt-1">
                  Click &ldquo;Send Access Request&rdquo; to test authorization and view live HTTP results
                </p>
              </div>
            )}

            {/* JSON Output Body */}
            {responseBody && (
              <div className="p-5 overflow-auto flex-1 font-mono text-xs text-slate-300 bg-slate-900">
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800 text-[11px] text-slate-500">
                  <span>Timestamp: {requestTimestamp}</span>
                  {!isAllowed && (
                    <span className="text-rose-400 font-semibold flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" /> Zero Protected Data Returned
                    </span>
                  )}
                  {isAllowed && (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Authorized Synthetic Telemetry
                    </span>
                  )}
                </div>
                <pre className="whitespace-pre-wrap leading-relaxed text-slate-200">
                  {JSON.stringify(responseBody, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
