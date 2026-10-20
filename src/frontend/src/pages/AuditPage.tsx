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
        `Tampering injected: ${res.message}. Click "Verify Chain" to observe cryptographic detection!`
      );
      await loadAuditData();
    } catch (e: any) {
      setTamperAlert(`Tampering simulation failed: ${e.message}`);
    } finally {
      setTampering(false);
    }
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
      {/* Title */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-5 h-5 text-brand-600" />
            Audit Evidence Trail &amp; SHA-256 Hash Chain
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Every consent modification and data access decision is recorded in a sequential,
            cryptographically linked append-only ledger.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <a
            href={api.getExportUrl('json')}
            download="fittrack_audit_log.json"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition"
          >
            <FileCode className="w-4 h-4 text-slate-600" />
            Export JSON
          </a>
          <a
            href={api.getExportUrl('csv')}
            download="fittrack_audit_log.csv"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Export CSV
          </a>
          <button
            onClick={loadAuditData}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200"
            title="Refresh log"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Verification & Integrity Status Card */}
      <div
        className={`p-6 rounded-xl border shadow-sm transition-all ${
          verifyResult?.is_valid
            ? 'bg-emerald-50/50 border-emerald-200'
            : 'bg-rose-50/50 border-rose-300 ring-2 ring-rose-200'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className={`p-3 rounded-xl ${
                verifyResult?.is_valid ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
              }`}
            >
              {verifyResult?.is_valid ? (
                <ShieldCheck className="w-6 h-6" />
              ) : (
                <ShieldAlert className="w-6 h-6" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Cryptographic Hash-Chain Verification
                </h2>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                    verifyResult?.is_valid
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}
                >
                  {verifyResult?.is_valid ? 'CHAIN VERIFIED INTACT' : 'INTEGRITY BREACH DETECTED'}
                </span>
              </div>

              {verifyResult?.is_valid ? (
                <p className="text-xs text-emerald-800 mt-1">
                  All {verifyResult.total_records} sequential records successfully validated. Every record hash matches its canonical payload and correctly links to the preceding entry.
                </p>
              ) : (
                <div className="mt-1 space-y-0.5">
                  <p className="text-xs font-semibold text-rose-900">
                    Tampering or breakage discovered at Sequence #{verifyResult?.broken_at_sequence}!
                  </p>
                  <p className="text-xs text-rose-700 font-mono">
                    {verifyResult?.error_message}
                  </p>
                </div>
              )}

              {verifyResult?.latest_hash && (
                <p className="text-[11px] font-mono text-slate-500 mt-2 truncate max-w-xl">
                  Latest Tip Hash: {verifyResult.latest_hash}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleVerify}
              disabled={verifying}
              className="px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-2 disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 ${verifying ? 'animate-spin' : ''}`} />
              {verifying ? 'Re-Verifying Hashes...' : 'Re-Verify Chain Now'}
            </button>
          </div>
        </div>

        {/* Tamper Demonstration Sub-Panel */}
        <div className="mt-5 pt-4 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="text-slate-600 flex items-center gap-1.5">
            <Bug className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Demonstration:</strong> Simulate an adversary attempting to alter audit logs.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleTamperSimulation('payload')}
              disabled={tampering}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 transition"
            >
              Tamper Record Payload
            </button>
            <button
              onClick={() => handleTamperSimulation('hash_link')}
              disabled={tampering}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-100 hover:bg-red-200 text-red-900 border border-red-300 transition"
            >
              Corrupt Hash Linkage
            </button>
          </div>
        </div>

        {tamperAlert && (
          <div className="mt-3 p-3 bg-white/80 rounded-lg border border-amber-300 text-xs text-amber-900 font-medium">
            {tamperAlert}
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by user..."
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className="bg-transparent focus:outline-none text-slate-800 placeholder-slate-400"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none"
          >
            <option value="">All Event Types</option>
            <option value="CONSENT_CHANGE">CONSENT_CHANGE</option>
            <option value="DATA_ACCESS">DATA_ACCESS</option>
            <option value="NOTICE_PUBLISH">NOTICE_PUBLISH</option>
            <option value="SYSTEM_INIT">SYSTEM_INIT</option>
          </select>
        </div>

        <span className="text-slate-500 font-medium">
          Showing {filteredEvents.length} of {events.length} records
        </span>
      </div>

      {/* Main Events Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Seq</th>
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Purpose</th>
                <th className="py-3 px-4">Decision / Code</th>
                <th className="py-3 px-4">Prev Hash &rarr; Current Hash</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No matching audit records found.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((e) => (
                  <tr
                    key={e.sequence_number}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      selectedEvent?.sequence_number === e.sequence_number ? 'bg-indigo-50/60' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      #{e.sequence_number}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(e.timestamp).toISOString().replace('T', ' ').substring(0, 19)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {e.event_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {e.user_id || '—'}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                      {e.purpose_id || '—'}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge reasonCode={e.reason_code} />
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400 max-w-[200px]">
                      <div className="flex items-center gap-1">
                        <span title={e.prev_hash}>{e.prev_hash.substring(0, 8)}...</span>
                        <LinkIcon className="w-3 h-3 text-brand-500 shrink-0" />
                        <span title={e.current_hash} className="text-slate-800 font-bold">
                          {e.current_hash.substring(0, 8)}...
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedEvent(e)}
                        className="text-xs font-semibold text-brand-600 hover:text-brand-800 hover:underline"
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
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Audit Record Details • Sequence #{selectedEvent.sequence_number}
              </h3>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                &times; Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block">Event ID:</span>
                <span className="font-mono text-slate-800 font-medium">{selectedEvent.event_id}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Timestamp:</span>
                <span className="font-mono text-slate-800">{new Date(selectedEvent.timestamp).toISOString()}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Event Type:</span>
                <span className="font-semibold text-slate-900">{selectedEvent.event_type}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Reason Code:</span>
                <StatusBadge reasonCode={selectedEvent.reason_code} />
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t">
              <div className="text-xs font-mono bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1">
                <div>
                  <span className="text-slate-500">Previous Hash:</span> {selectedEvent.prev_hash}
                </div>
                <div>
                  <span className="text-slate-500">Payload Hash:</span> {selectedEvent.payload_hash}
                </div>
                <div className="font-bold text-slate-900">
                  <span className="text-brand-600">Current Hash:</span> {selectedEvent.current_hash}
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-700 block mb-1">
                  Canonical Serialized Payload (RFC 8785 representation):
                </span>
                <pre className="p-3 bg-slate-900 text-slate-200 rounded-lg text-[11px] font-mono overflow-auto max-h-52">
                  {JSON.stringify(JSON.parse(selectedEvent.payload_json), null, 2)}
                </pre>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
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
