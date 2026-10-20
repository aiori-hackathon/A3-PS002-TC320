import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { PrivacyNotice } from '../types';
import {
  FileText,
  History,
  PlusCircle,
  CheckCircle2,
  AlertTriangle,
  Key,
  Hash,
} from 'lucide-react';

export const NoticePage: React.FC = () => {
  const [notices, setNotices] = useState<PrivacyNotice[]>([]);
  const [currentNotice, setCurrentNotice] = useState<PrivacyNotice | null>(null);
  const [selectedNotice, setSelectedNotice] = useState<PrivacyNotice | null>(null);

  // Form State
  const [version, setVersion] = useState<string>('v2.0');
  const [title, setTitle] = useState<string>('FitTrack Lite Privacy Notice v2.0');
  const [content, setContent] = useState<string>(
    'FitTrack Lite Privacy Notice v2.0: We have updated our data processing terms to introduce enhanced heart rate variability analytics and secure academic research data partnerships under India DPDP Act 2023. By re-consenting, you authorize FitTrack Lite to compute aggregate physiological insights according to your selected purposes.'
  );
  const [adminKey, setAdminKey] = useState<string>('fittrack_admin_secret_key_change_in_prod');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const loadNotices = async () => {
    try {
      const list = await api.getNotices();
      setNotices(list);
      const curr = list.find((n) => n.is_current) || list[0] || null;
      setCurrentNotice(curr);
      if (!selectedNotice && curr) {
        setSelectedNotice(curr);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadNotices();
  }, []);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const created = await api.publishNotice(version, title, content, adminKey);
      setMessage({
        text: `Notice ${created.version} successfully published! All existing user consents are now treated as STALE until re-consent is recorded.`,
        type: 'success',
      });
      await loadNotices();
      setSelectedNotice(created);
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <FileText className="w-5 h-5 text-brand-600" />
          Privacy Notice Versioning &amp; Policy Registry
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Every privacy notice is immutable and identified by a cryptographic SHA-256 hash. When an administrator publishes an updated notice, prior user consents automatically transition to <strong>STALE</strong> to ensure re-consent under updated terms.
        </p>
      </div>

      {/* Message Banner */}
      {message && (
        <div
          className={`p-4 rounded-lg text-sm border flex items-center justify-between ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <span>{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            className="text-xs font-semibold ml-4 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Notice Invalidation Principle Alert */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-sm block mb-0.5">
            Notice Invalidation &amp; Re-Consent Policy
          </span>
          Consent is informed only when tied to the exact notice text presented to the data principal. When notice terms change, the SHA-256 hash changes, immediately rendering historical consents stale. The prototype requires users to review and re-consent under the new notice before downstream data access can resume. Historical events are never retroactively modified.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Notice History & Viewer */}
        <div className="lg:col-span-7 space-y-5">
          {/* Active Notice Card */}
          {currentNotice && (
            <div className="bg-white rounded-xl border-2 border-brand-500/40 p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-brand-100 text-brand-800 border border-brand-200">
                    Active Notice Version
                  </span>
                  <h2 className="text-lg font-bold text-slate-900 mt-1">{currentNotice.title}</h2>
                  <p className="text-xs text-slate-500">
                    Version: <strong className="text-slate-800">{currentNotice.version}</strong> • Published:{' '}
                    {new Date(currentNotice.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Active
                  </span>
                </div>
              </div>

              <div className="mt-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-mono text-[11px] text-slate-600 break-all flex items-start gap-1.5">
                <Hash className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-800">SHA-256 Hash:</span>{' '}
                  {currentNotice.hash_sha256}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-700 leading-relaxed max-h-48 overflow-y-auto">
                <p className="font-semibold text-slate-900 mb-1">Notice Content:</p>
                {currentNotice.content}
              </div>
            </div>
          )}

          {/* Historical Versions Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-slate-500" />
                All Privacy Notice Versions
              </h3>
              <span className="text-xs text-slate-500">{notices.length} registered</span>
            </div>

            <div className="divide-y divide-slate-100">
              {notices.map((n) => (
                <div
                  key={n.id}
                  onClick={() => setSelectedNotice(n)}
                  className={`p-4 cursor-pointer transition hover:bg-slate-50 flex items-center justify-between ${
                    selectedNotice?.id === n.id ? 'bg-indigo-50/50' : ''
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-slate-900">{n.version}</span>
                      <span className="text-xs font-semibold text-slate-800">{n.title}</span>
                      {n.is_current && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          CURRENT
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-mono text-slate-400 mt-1">
                      Hash: {n.hash_sha256.substring(0, 16)}...
                    </p>
                  </div>

                  <span className="text-[11px] text-slate-400">
                    {new Date(n.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Admin Notice Publisher */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <PlusCircle className="w-4 h-4 text-brand-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Administrator: Publish New Notice
              </h3>
            </div>

            <form onSubmit={handlePublish} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Version Identifier
                </label>
                <input
                  type="text"
                  required
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="e.g. v2.0"
                  className="w-full text-xs font-mono rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notice Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. FitTrack Lite Privacy Policy v2.0"
                  className="w-full text-xs font-medium rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Policy Content
                </label>
                <textarea
                  required
                  rows={5}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full text-xs leading-relaxed rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-slate-400" />
                  Admin API Key (X-Admin-Key Header)
                </label>
                <input
                  type="password"
                  required
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  className="w-full text-xs font-mono rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Pre-populated with default demo key. Protected by backend authentication.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <FileText className="w-4 h-4" />
                {loading ? 'Publishing & Computing Hash...' : 'Publish New Notice Version'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
