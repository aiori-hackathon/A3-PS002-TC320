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
  Copy,
  Check,
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
  const [copiedResponse, setCopiedResponse] = useState(false);

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

  const handleCopy = () => {
    if (!responseBody) return;
    navigator.clipboard.writeText(JSON.stringify(responseBody, null, 2));
    setCopiedResponse(true);
    setTimeout(() => setCopiedResponse(false), 2000);
  };

  const isAllowed = responseStatus === 200;
  const reasonCode = getReasonCode();

  return (
    <div className="space-y-6">
      {/* Page Title Card */}
      <div className="card-interactive bg-[#121623] p-6 sm:p-7 rounded-3xl border border-white/[0.08] shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono">
            POLICY ENFORCEMENT ENGINE
          </span>
          <span className="text-xs text-slate-400 font-mono">• HTTP 200 / 403 Validator</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
          <Activity className="w-5 h-5 text-amber-400" />
          Downstream Data-Sharing Access Simulator
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
          Simulate downstream external consumers (partner gyms, marketing campaigns, medical research pipelines)
          requesting protected fitness telemetry. The server-side authorization engine validates active user consent, itemized purpose scope, and privacy notice freshness before releasing any data.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Request Builder */}
        <div className="lg:col-span-5 space-y-5">
          <div className="card-interactive bg-[#121623] p-5 sm:p-6 rounded-3xl border border-white/[0.08] shadow-[0_10px_30px_rgba(0,0,0,0.5)] space-y-4">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 font-mono">
              <Server className="w-4 h-4 text-amber-400" />
              API Request Configuration
            </h2>

            {/* Target User */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
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
                className="w-full text-xs font-semibold rounded-2xl border border-white/[0.08] px-3.5 py-2.5 bg-[#171b28] text-white focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id} className="bg-[#171b28] text-white">
                    {u.name} ({u.id}) {u.is_active ? '• Active' : '• Inactive'}
                  </option>
                ))}
                <option value="__custom__" className="bg-[#171b28] text-white">Manual / Custom ID (for denial testing)</option>
              </select>

              {customUser && (
                <input
                  type="text"
                  placeholder="Enter test user ID e.g. unknown_user"
                  value={customUser}
                  onChange={(e) => setCustomUser(e.target.value)}
                  className="mt-2 w-full text-xs font-mono rounded-xl border border-amber-500/30 px-3 py-2 bg-[#1b1c24] text-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              )}
            </div>

            {/* Purpose */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
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
                className="w-full text-xs font-semibold rounded-2xl border border-white/[0.08] px-3.5 py-2.5 bg-[#171b28] text-white focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
              >
                {purposes.map((p) => (
                  <option key={p.id} value={p.id} className="bg-[#171b28] text-white">
                    {p.name} ({p.id}) {p.is_active ? '• Active' : '• Inactive'}
                  </option>
                ))}
                <option value="__custom__" className="bg-[#171b28] text-white">Manual / Custom Purpose (for denial testing)</option>
              </select>

              {customPurpose && (
                <input
                  type="text"
                  placeholder="Enter test purpose e.g. biometric_harvesting"
                  value={customPurpose}
                  onChange={(e) => setCustomPurpose(e.target.value)}
                  className="mt-2 w-full text-xs font-mono rounded-xl border border-amber-500/30 px-3 py-2 bg-[#1b1c24] text-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              )}
            </div>

            {/* Endpoint Preview */}
            <div className="bg-[#0e111a] rounded-2xl p-3.5 border border-white/[0.06] text-xs font-mono text-slate-400">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-400">POST /api/data/access</span>
                <span className="text-[10px] text-slate-500">Payload Preview</span>
              </div>
              <pre className="mt-2 text-[11px] text-slate-300 font-mono">
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
              className="w-full py-3 px-4 bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-2xl text-xs font-bold shadow-glow-copper transition-all duration-200 hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              {loading ? 'Evaluating Live Consent...' : 'Send Access Request'}
            </button>
          </div>

          {/* Quick Scenario Tests (Interactive Cards) */}
          <div className="card-interactive bg-[#121623] p-5 sm:p-6 rounded-3xl border border-white/[0.08] shadow-[0_10px_30px_rgba(0,0,0,0.5)] space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 font-mono">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Pre-Configured Scenarios
            </h3>
            <div className="space-y-2.5">
              <div
                onClick={() => {
                  setSelectedUser('user_001');
                  setCustomUser('');
                  setSelectedPurpose('fitness_analytics');
                  setCustomPurpose('');
                  handleExecuteRequest('user_001', 'fitness_analytics');
                }}
                className="card-interactive-emerald p-3 rounded-2xl bg-[#141b24] border border-emerald-500/20 text-xs text-slate-300 cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white group-hover:text-emerald-300 transition">1. Valid Consent (HTTP 200 OK)</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">200 OK</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 font-mono">user_001 • fitness_analytics</p>
              </div>

              <div
                onClick={() => {
                  setCustomUser('non_existent_ghost');
                  handleExecuteRequest('non_existent_ghost', 'fitness_analytics');
                }}
                className="card-interactive-rose p-3 rounded-2xl bg-[#1d141a] border border-rose-500/20 text-xs text-slate-300 cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white group-hover:text-rose-300 transition">2. Unknown User (HTTP 403)</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono">403 DENY</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 font-mono">non_existent_ghost • UNKNOWN_USER</p>
              </div>

              <div
                onClick={() => {
                  setCustomPurpose('unregistered_telemetry');
                  handleExecuteRequest('user_001', 'unregistered_telemetry');
                }}
                className="card-interactive-rose p-3 rounded-2xl bg-[#1d141a] border border-rose-500/20 text-xs text-slate-300 cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white group-hover:text-rose-300 transition">3. Unknown Purpose (HTTP 403)</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono">403 DENY</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 font-mono">unregistered_telemetry • UNKNOWN_PURPOSE</p>
              </div>

              <div
                onClick={() => {
                  setSelectedUser('user_inactive');
                  setCustomUser('');
                  handleExecuteRequest('user_inactive', 'fitness_analytics');
                }}
                className="card-interactive p-3 rounded-2xl bg-[#1b1924] border border-amber-500/20 text-xs text-slate-300 cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white group-hover:text-amber-300 transition">4. Deactivated User (HTTP 403)</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">403 DENY</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 font-mono">user_inactive • INACTIVE_USER</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Output: HTTP Response Inspector */}
        <div className="lg:col-span-7">
          <div className="card-interactive bg-[#121623] rounded-3xl border border-white/[0.08] shadow-[0_10px_30px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col h-full min-h-[460px]">
            {/* Header Bar */}
            <div className="bg-[#0e111a] px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Code className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                  HTTP Response Inspector
                </span>
              </div>

              {responseStatus !== null && (
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-mono font-bold ${
                      isAllowed
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
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
                className={`p-4 sm:p-5 border-b text-xs flex items-center justify-between gap-3 ${
                  isAllowed
                    ? 'bg-emerald-950/25 border-emerald-900/40 text-emerald-200'
                    : 'bg-rose-950/25 border-rose-900/40 text-rose-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  {isAllowed ? (
                    <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-6 h-6 text-rose-400 shrink-0" />
                  )}
                  <div>
                    <p className="font-bold text-white text-sm">
                      Decision: {isAllowed ? 'ACCESS GRANTED' : 'ACCESS DENIED'}
                    </p>
                    <p className="text-slate-400 mt-0.5 text-xs">
                      {isAllowed
                        ? 'Consent verified and active under current privacy notice. Data released.'
                        : responseBody?.detail?.message || 'Access blocked by authorization engine.'}
                    </p>
                  </div>
                </div>
                <div>
                  <StatusBadge reasonCode={reasonCode} />
                </div>
              </div>
            ) : (
              <div className="p-10 text-center text-slate-500 flex flex-col items-center justify-center my-auto">
                <div className="w-14 h-14 rounded-2xl bg-[#171b28] border border-white/[0.06] flex items-center justify-center mb-3 text-amber-400 shadow-sm">
                  <Send className="w-6 h-6 text-amber-400" />
                </div>
                <p className="text-base font-bold text-white">Ready to simulate data access request</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Configure a user and purpose on the left, or click any Scenario test above to observe authorization evaluation.
                </p>
              </div>
            )}

            {/* JSON Output Body */}
            {responseBody && (
              <div className="p-5 sm:p-6 overflow-auto flex-1 font-mono text-xs text-slate-300 bg-[#0a0c12]">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06] text-[11px] text-slate-400 font-sans">
                  <span>Timestamp: {requestTimestamp}</span>
                  <div className="flex items-center gap-3">
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
                    <button
                      onClick={handleCopy}
                      className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white transition flex items-center gap-1 font-mono text-[10px]"
                    >
                      {copiedResponse ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedResponse ? 'Copied' : 'Copy JSON'}</span>
                    </button>
                  </div>
                </div>
                <pre className="whitespace-pre-wrap leading-relaxed text-slate-300 font-mono text-xs bg-[#08090f] p-4 rounded-2xl border border-white/[0.04]">
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

export default DataSimulatorPage;
