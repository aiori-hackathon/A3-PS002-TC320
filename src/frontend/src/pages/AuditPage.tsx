import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { AuditEvent, AuditVerifyResponse } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import {
  Database,
  ShieldCheck,
  ShieldAlert,
  RotateCw,
  Bug,
  FileCode,
  FileSpreadsheet,
  Link as LinkIcon,
  Search,
  Copy,
  Check,
  X,
} from 'lucide-react';

export const AuditPage: React.FC = () => {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [verifyResult, setVerifyResult] = useState<AuditVerifyResponse | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [tampering, setTampering] = useState(false);
  const adminKey = 'fittrack_admin_secret_key_change_in_prod';
  const [filterUser, setFilterUser] = useState('');
  const [filterType, setFilterType] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);
  const [tamperAlert, setTamperAlert] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const loadAuditData = async () => {
    try {
      const [evts, v] = await Promise.all([api.getAuditEvents(200, 0), api.verifyAuditChain()]);
      setEvents(evts);
      setVerifyResult(v);
    } catch (e: any) {
      console.error('Failed to load audit events', e);
    }
  };

  useEffect(() => {
    loadAuditData();
  }, []);

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const v = await api.verifyAuditChain();
      setVerifyResult(v);
      setTamperAlert(null);
    } catch (e: any) {
      console.error(e);
    } finally {
      setVerifying(false);
    }
  };

  const handleTamperSimulation = async (type: 'payload' | 'hash_link') => {
    setTampering(true);
    setTamperAlert(null);
    try {
      const res = await api.simulateTampering(type, adminKey);
      setTamperAlert(
        `Tampering injected: ${res.message}. Click "Re-Verify Chain Now" to observe cryptographic detection!`
      );
      await loadAuditData();
    } catch (e: any) {
      setTamperAlert(`Tampering simulation failed: ${e.message}`);
    } finally {
      setTampering(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const filteredEvents = events.filter((e) => {
    if (filterUser && !e.user_id?.toLowerCase().includes(filterUser.toLowerCase())) {
      return false;
    }
    if (filterType && e.event_type !== filterType) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Title Card */}
      <div className="card-interactive bg-[#121623] p-6 sm:p-7 rounded-3xl border border-white/[0.08] shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono">
              RFC 8785 CANONICAL LEDGER
            </span>
            <span className="text-xs text-slate-400 font-mono">• SHA-256 Hash Chain</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
            <Database className="w-5 h-5 text-amber-400" />
            Audit Evidence Trail &amp; SHA-256 Hash Chain
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Every consent modification and data access authorization decision is sequentially anchored in an append-only, tamper-evident cryptographic ledger.
          </p>
        </div>

        {/* Export & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <a
            href={api.getExportUrl('json')}
            download="fittrack_audit_log.json"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-semibold bg-[#171b28] hover:bg-[#202538] text-slate-200 hover:text-white border border-white/[0.08] hover:border-amber-500/30 transition shadow-sm cursor-pointer"
          >
            <FileCode className="w-4 h-4 text-amber-400" />
            Export JSON
          </a>
          <a
            href={api.getExportUrl('csv')}
            download="fittrack_audit_log.csv"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-semibold bg-[#171b28] hover:bg-[#202538] text-slate-200 hover:text-white border border-white/[0.08] hover:border-emerald-500/30 transition shadow-sm cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            Export CSV
          </a>
          <button
            onClick={loadAuditData}
            className="p-2.5 text-slate-400 hover:text-white hover:bg-white/[0.06] rounded-2xl border border-white/[0.08] hover:border-amber-500/30 transition cursor-pointer"
            title="Refresh audit ledger"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Verification & Integrity Status Card (Interactive) */}
      <div
        className={`p-6 sm:p-7 rounded-3xl border shadow-[0_15px_35px_rgba(0,0,0,0.5)] transition-all ${
          verifyResult?.is_valid
            ? 'card-interactive-emerald bg-[#101c18] border-emerald-500/30'
            : 'card-interactive-rose bg-[#1e1115] border-rose-500/40 ring-1 ring-rose-500/30'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div
              className={`p-3.5 rounded-2xl shrink-0 ${
                verifyResult?.is_valid
                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/15 border border-rose-500/30 text-rose-400'
              }`}
            >
              {verifyResult?.is_valid ? (
                <ShieldCheck className="w-7 h-7" />
              ) : (
                <ShieldAlert className="w-7 h-7" />
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Cryptographic Hash-Chain Verification
                </h2>
                <span
                  className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold font-mono uppercase ${
                    verifyResult?.is_valid
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {verifyResult?.is_valid ? 'CHAIN VERIFIED INTACT' : 'INTEGRITY BREACH DETECTED'}
                </span>
              </div>

              {verifyResult?.is_valid ? (
                <p className="text-xs sm:text-sm text-emerald-300 mt-1.5 leading-relaxed">
                  All {verifyResult.total_records} sequential records successfully validated. Every record hash matches its canonical RFC 8785 payload and cryptographically links to the preceding entry.
                </p>
              ) : (
                <div className="mt-1.5 space-y-0.5">
                  <p className="text-xs sm:text-sm font-semibold text-rose-300">
                    Tampering or breakage discovered at Sequence #{verifyResult?.broken_at_sequence}!
                  </p>
                  <p className="text-xs text-rose-400 font-mono">
                    {verifyResult?.error_message}
                  </p>
                </div>
              )}

              {verifyResult?.latest_hash && (
                <div className="flex items-center gap-2 mt-2 text-xs font-mono text-slate-400">
                  <span className="truncate max-w-lg">Latest Tip Hash: {verifyResult.latest_hash}</span>
                  <button
                    onClick={() => handleCopy(verifyResult.latest_hash!, 'latest-hash')}
                    className="p-1 hover:text-white transition opacity-60 hover:opacity-100"
                    title="Copy tip hash"
                  >
                    {copiedHash === 'latest-hash' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-start lg:self-center">
            <button
              onClick={handleVerify}
              disabled={verifying}
              className="px-5 py-3 bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-2xl text-xs font-bold transition-all duration-200 shadow-glow-copper flex items-center gap-2 disabled:opacity-50 hover:scale-[1.02] cursor-pointer"
            >
              <RotateCw className={`w-3.5 h-3.5 ${verifying ? 'animate-spin' : ''}`} />
              {verifying ? 'Re-Verifying Hashes...' : 'Re-Verify Chain Now'}
            </button>
          </div>
        </div>

        {/* Tamper Demonstration Sub-Panel */}
        <div className="mt-6 pt-5 border-t border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="text-slate-400 flex items-center gap-2">
            <Bug className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong className="text-slate-200">Demonstration Mode:</strong> Simulate an adversary attempting to modify historical logs or corrupt links.
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => handleTamperSimulation('payload')}
              disabled={tampering}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition cursor-pointer"
            >
              Tamper Record Payload
            </button>
            <button
              onClick={() => handleTamperSimulation('hash_link')}
              disabled={tampering}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition cursor-pointer"
            >
              Corrupt Hash Linkage
            </button>
          </div>
        </div>

        {tamperAlert && (
          <div className="mt-4 p-3.5 bg-[#1b1712] rounded-2xl border border-amber-500/30 text-xs text-amber-300 font-medium animate-in fade-in">
            {tamperAlert}
          </div>
        )}
      </div>

      {/* Filter Bar (Interactive Card) */}
      <div className="card-interactive bg-[#121623] p-4 sm:p-5 rounded-3xl border border-white/[0.08] shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-[#171b28] border border-white/[0.08] rounded-2xl px-3.5 py-2">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by user ID..."
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className="bg-transparent focus:outline-none text-white placeholder-slate-500 text-xs w-40 sm:w-52"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-[#171b28] border border-white/[0.08] rounded-2xl px-3.5 py-2 text-white focus:outline-none text-xs cursor-pointer"
          >
            <option value="" className="bg-[#171b28] text-white">All Event Types</option>
            <option value="CONSENT_CHANGE" className="bg-[#171b28] text-white">CONSENT_CHANGE</option>
            <option value="DATA_ACCESS" className="bg-[#171b28] text-white">DATA_ACCESS</option>
            <option value="NOTICE_PUBLISH" className="bg-[#171b28] text-white">NOTICE_PUBLISH</option>
            <option value="SYSTEM_INIT" className="bg-[#171b28] text-white">SYSTEM_INIT</option>
          </select>
        </div>

        <span className="text-slate-400 font-mono text-xs">
          Showing <strong className="text-amber-400">{filteredEvents.length}</strong> of {events.length} records
        </span>
      </div>

      {/* Main Events Table (Interactive Card) */}
      <div className="card-interactive bg-[#121623] rounded-3xl border border-white/[0.08] shadow-[0_10px_30px_rgba(0,0,0,0.5)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/[0.04] text-left text-xs">
            <thead className="bg-[#0e111a] text-slate-400 uppercase font-semibold text-[11px] tracking-wider font-mono">
              <tr>
                <th className="py-3.5 px-5">Seq</th>
                <th className="py-3.5 px-5">Timestamp (UTC)</th>
                <th className="py-3.5 px-5">Type</th>
                <th className="py-3.5 px-5">Subject</th>
                <th className="py-3.5 px-5">Purpose</th>
                <th className="py-3.5 px-5">Decision / Code</th>
                <th className="py-3.5 px-5">Prev Hash &rarr; Current Hash</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-slate-300 font-sans">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-500 text-xs">
                    No matching audit records found.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((e) => (
                  <tr
                    key={e.sequence_number}
                    className={`hover:bg-[#171c2b] transition-colors ${
                      selectedEvent?.sequence_number === e.sequence_number ? 'bg-[#171c2b] border-l-2 border-amber-400' : ''
                    }`}
                  >
                    <td className="py-3.5 px-5 font-mono font-bold text-amber-400">
                      #{e.sequence_number}
                    </td>
                    <td className="py-3.5 px-5 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {new Date(e.timestamp).toISOString().replace('T', ' ').substring(0, 19)}
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#171b28] text-slate-300 border border-white/[0.06] font-mono">
                        {e.event_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 font-semibold text-white">
                      {e.user_id || '—'}
                    </td>
                    <td className="py-3.5 px-5 font-mono text-[11px] text-slate-400">
                      {e.purpose_id || '—'}
                    </td>
                    <td className="py-3.5 px-5">
                      <StatusBadge reasonCode={e.reason_code} />
                    </td>
                    <td className="py-3.5 px-5 font-mono text-[11px] text-slate-400 max-w-[200px]">
                      <div className="flex items-center gap-1.5">
                        <span title={e.prev_hash} className="text-slate-400">{e.prev_hash.substring(0, 8)}...</span>
                        <LinkIcon className="w-3 h-3 text-amber-500 shrink-0" />
                        <span title={e.current_hash} className="text-white font-bold">
                          {e.current_hash.substring(0, 8)}...
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={() => setSelectedEvent(e)}
                        className="px-3 py-1 rounded-xl bg-white/[0.04] hover:bg-amber-500/15 border border-white/[0.06] hover:border-amber-500/30 text-xs font-bold text-amber-400 hover:text-amber-300 transition cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Record Modal / Drawer */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-[#121623] rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-[0_25px_60px_rgba(0,0,0,0.95)] border border-white/[0.1] space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
                  #{selectedEvent.sequence_number}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Audit Record Details
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">Event ID: {selectedEvent.event_id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs bg-[#0e111a] p-4 rounded-2xl border border-white/[0.05]">
              <div>
                <span className="text-slate-400 block text-[11px] font-mono">Timestamp:</span>
                <span className="font-mono text-slate-200">{new Date(selectedEvent.timestamp).toISOString()}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] font-mono">Event Type:</span>
                <span className="font-semibold text-white">{selectedEvent.event_type}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] font-mono">Data Principal:</span>
                <span className="font-semibold text-amber-300">{selectedEvent.user_id || 'System Event'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] font-mono">Decision Reason:</span>
                <StatusBadge reasonCode={selectedEvent.reason_code} />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="text-xs font-mono bg-[#090b10] p-4 rounded-2xl border border-white/[0.05] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Previous Hash:</span>
                  <span className="text-slate-300 break-all">{selectedEvent.prev_hash}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Payload Hash:</span>
                  <span className="text-slate-300 break-all">{selectedEvent.payload_hash}</span>
                </div>
                <div className="flex items-center justify-between font-bold text-white pt-1 border-t border-white/[0.05]">
                  <span className="text-amber-400">Current Hash:</span>
                  <span className="text-amber-300 break-all">{selectedEvent.current_hash}</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-slate-300 font-mono">
                    Canonical RFC 8785 JSON Payload:
                  </span>
                  <button
                    onClick={() => handleCopy(selectedEvent.payload_json, 'modal-payload')}
                    className="p-1 text-slate-400 hover:text-white transition flex items-center gap-1 text-[11px] font-mono"
                  >
                    {copiedHash === 'modal-payload' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedHash === 'modal-payload' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="p-4 bg-[#07080d] text-slate-300 rounded-2xl text-xs font-mono overflow-auto max-h-56 border border-white/[0.05]">
                  {JSON.stringify(JSON.parse(selectedEvent.payload_json), null, 2)}
                </pre>
              </div>
            </div>

            <div className="pt-3 border-t border-white/[0.06] flex items-center justify-end">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-5 py-2.5 bg-[#171b28] hover:bg-[#202538] text-white rounded-xl text-xs font-semibold border border-white/[0.08] transition cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditPage;
