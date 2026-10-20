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
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
        STALE (Re-consent Required)
      </span>
    );
  }

  if (consentStatus) {
    if (consentStatus === 'GRANTED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Active Consent
        </span>
      );
    }
    if (consentStatus === 'WITHDRAWN') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          Consent Withdrawn
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
        <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
        No Consent Given
      </span>
    );
  }

  if (reasonCode) {
    switch (reasonCode) {
      case 'CONSENT_ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            CONSENT_ACTIVE (200 OK)
          </span>
        );
      case 'CONSENT_WITHDRAWN':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            CONSENT_WITHDRAWN (403)
          </span>
        );
      case 'CONSENT_STALE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            CONSENT_STALE (403)
          </span>
        );
      case 'NO_CONSENT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-300">
            <ShieldAlert className="w-3.5 h-3.5 text-orange-600" />
            NO_CONSENT (403)
          </span>
        );
      case 'UNKNOWN_USER':
      case 'UNKNOWN_PURPOSE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-300">
            <XCircle className="w-3.5 h-3.5 text-red-600" />
            {reasonCode} (403)
          </span>
        );
      case 'INACTIVE_USER':
      case 'INACTIVE_PURPOSE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-200 text-slate-800 border border-slate-300">
            <Clock className="w-3.5 h-3.5 text-slate-600" />
            {reasonCode} (403)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-300">
            {reasonCode}
          </span>
        );
    }
  }

  return null;
};
