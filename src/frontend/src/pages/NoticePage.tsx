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
  Copy,
  Check,
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
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

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

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2000);
  };

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
      {/* Header Card */}
      <div className="card-interactive bg-[#121623] p-6 sm:p-7 rounded-3xl border border-white/[0.08] shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono">
            LEGAL &amp; COMPLIANCE ANCHOR
          </span>
          <span className="text-xs text-slate-400 font-mono">• Cryptographic Notice Hashes</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
          <FileText className="w-5 h-5 text-amber-400" />
          Privacy Notice Versioning &amp; Policy Registry
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
          Every privacy notice is immutable and identified by a cryptographic SHA-256 digest. When an administrator publishes an updated notice, prior user consents automatically transition to <strong className="text-amber-300">STALE</strong> to ensure informed re-consent under updated terms per DPDP Act 2023.
        </p>
      </div>

      {/* Message Banner */}
      {message && (
        <div
          className={`p-4 rounded-2xl text-xs border flex items-center justify-between animate-in fade-in duration-200 ${
            message.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25 shadow-glow-emerald-sm'
              : 'bg-rose-500/10 text-rose-300 border-rose-500/25'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{message.text}</span>
          </div>
          <button
            onClick={() => setMessage(null)}
            className="text-xs font-bold ml-4 underline opacity-80 hover:opacity-100 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Notice Invalidation Principle Alert Card */}
      <div className="card-interactive bg-amber-500/10 border border-amber-500/30 rounded-3xl p-5 sm:p-6 text-xs text-amber-300 flex items-start gap-3.5 shadow-[0_10px_25px_rgba(0,0,0,0.4)]">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-sm text-white block mb-1">
            Notice Invalidation &amp; Mandatory Re-Consent Principle
          </span>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Consent is valid under DPDP 2023 only when tied to the exact notice terms presented to the data principal. When notice terms change, the SHA-256 digest changes, immediately rendering historical consents stale. The prototype requires users to review and re-consent under the new notice before downstream data access can resume. Historical events are never retroactively modified.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Notice History & Viewer */}
        <div className="lg:col-span-7 space-y-5">
          {/* Active Notice Card */}
          {currentNotice && (
            <div className="card-interactive bg-[#121623] rounded-3xl border border-amber-500/30 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30 font-mono">
                    Active Notice Policy
                  </span>
                  <h2 className="text-lg sm:text-xl font-bold text-white mt-2 tracking-tight">{currentNotice.title}</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Version: <strong className="text-amber-300 font-mono">{currentNotice.version}</strong> • Published:{' '}
                    {new Date(currentNotice.created_at).toLocaleString()}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/15 px-3 py-1 rounded-full border border-emerald-500/30 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Enforced
                </span>
              </div>

              {/* SHA-256 Hash Container */}
              <div className="mt-4 bg-[#0a0c12] p-3.5 rounded-2xl border border-white/[0.06] font-mono text-xs text-slate-400 break-all flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <Hash className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-300">SHA-256 Hash:</span>{' '}
                    <span className="text-amber-300">{currentNotice.hash_sha256}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleCopy(currentNotice.hash_sha256, 'current-hash')}
                  className="p-1 hover:text-white transition opacity-60 hover:opacity-100 shrink-0"
                  title="Copy SHA-256 Hash"
                >
                  {copiedHash === 'current-hash' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                </button>
              </div>

              {/* Notice Content */}
              <div className="mt-4 pt-4 border-t border-white/[0.06] text-xs sm:text-sm text-slate-300 leading-relaxed max-h-56 overflow-y-auto bg-[#0a0c12] p-4 rounded-2xl border border-white/[0.04]">
                <p className="font-semibold text-white mb-1.5 font-mono text-xs">Official Notice Content:</p>
                {currentNotice.content}
              </div>
            </div>
          )}

          {/* Historical Versions List (Interactive Cards) */}
          <div className="card-interactive bg-[#121623] rounded-3xl border border-white/[0.08] shadow-[0_10px_30px_rgba(0,0,0,0.5)] overflow-hidden">
            <div className="p-5 border-b border-white/[0.06] flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 font-mono">
                <History className="w-4 h-4 text-amber-400" />
                All Privacy Notice Versions
              </h3>
              <span className="text-xs text-slate-400 font-mono">{notices.length} registered</span>
            </div>

            <div className="divide-y divide-white/[0.04]">
              {notices.map((n) => (
                <div
                  key={n.id}
                  onClick={() => setSelectedNotice(n)}
                  className={`p-4 sm:p-5 cursor-pointer transition-all duration-200 hover:bg-[#171c2b] flex items-center justify-between ${
                    selectedNotice?.id === n.id ? 'bg-[#171c2b] border-l-2 border-amber-400' : ''
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-xs text-amber-400">{n.version}</span>
                      <span className="text-xs sm:text-sm font-semibold text-white">{n.title}</span>
                      {n.is_current && (
                        <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 font-mono">
                          CURRENT
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-mono text-slate-400 mt-1">
                      Hash: {n.hash_sha256.substring(0, 18)}...
                    </p>
                  </div>

                  <span className="text-xs text-slate-400 font-mono">
                    {new Date(n.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Admin Notice Publisher Card */}
        <div className="lg:col-span-5">
          <div className="card-interactive bg-[#121623] rounded-3xl border border-white/[0.08] p-5 sm:p-6 shadow-[0_10px_30px_rgba(0,0,0,0.5)] space-y-4">
            <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3.5">
              <PlusCircle className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Administrator: Publish New Notice
              </h3>
            </div>

            <form onSubmit={handlePublish} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  New Version Identifier
                </label>
                <input
                  type="text"
                  required
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="e.g. v2.0"
                  className="w-full text-xs font-mono font-semibold rounded-2xl border border-white/[0.08] px-3.5 py-2.5 bg-[#171b28] text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Notice Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. FitTrack Lite Privacy Policy v2.0"
                  className="w-full text-xs font-semibold rounded-2xl border border-white/[0.08] px-3.5 py-2.5 bg-[#171b28] text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Full Policy Content
                </label>
                <textarea
                  required
                  rows={5}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full text-xs leading-relaxed rounded-2xl border border-white/[0.08] px-3.5 py-2.5 bg-[#171b28] text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  Admin API Key (X-Admin-Key Header)
                </label>
                <input
                  type="password"
                  required
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  className="w-full text-xs font-mono rounded-2xl border border-white/[0.08] px-3.5 py-2.5 bg-[#171b28] text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <p className="text-[11px] text-slate-400 mt-1 font-mono">
                  Demo key pre-populated. Validates X-Admin-Key header.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-2xl text-xs font-bold transition-all duration-200 shadow-glow-copper hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
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

export default NoticePage;
