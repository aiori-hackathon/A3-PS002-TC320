import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle, HelpCircle, ShieldAlert, Clock } from 'lucide-react';

interface StatusBadgeProps {
  reasonCode?: string;
  consentStatus?: 'GRANTED' | 'WITHDRAWN' | 'NO_CONSENT';
  isStale?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ reasonCode, consentStatus, isStale }) => {
  if (isStale) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-sm shadow-amber-950/40">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
        STALE (Re-consent Required)
      </span>
    );
  }

  if (consentStatus) {
    if (consentStatus === 'GRANTED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-950/40">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          Active Consent
        </span>
      );
    }
    if (consentStatus === 'WITHDRAWN') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30 shadow-sm shadow-rose-950/40">
          <XCircle className="w-3.5 h-3.5 text-rose-400" />
          Consent Withdrawn
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800/80 text-slate-400 border border-slate-700/70">
        <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
        No Consent Given
      </span>
    );
  }

  if (reasonCode) {
    switch (reasonCode) {
      case 'CONSENT_ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            CONSENT_ACTIVE (200 OK)
          </span>
        );
      case 'CONSENT_WITHDRAWN':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
            CONSENT_WITHDRAWN (403)
          </span>
        );
      case 'CONSENT_STALE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            CONSENT_STALE (403)
          </span>
        );
      case 'NO_CONSENT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/30">
            <ShieldAlert className="w-3.5 h-3.5 text-orange-400" />
            NO_CONSENT (403)
          </span>
        );
      case 'UNKNOWN_USER':
      case 'UNKNOWN_PURPOSE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
            <XCircle className="w-3.5 h-3.5 text-red-400" />
            {reasonCode} (403)
          </span>
        );
      case 'INACTIVE_USER':
      case 'INACTIVE_PURPOSE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800/80 text-slate-400 border border-slate-700/60">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            {reasonCode} (403)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800/80 text-slate-300 border border-slate-700">
            {reasonCode}
          </span>
        );
    }
  }

  return null;
};

