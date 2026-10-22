import React from 'react';
import {
  Github,
  Twitter,
  Linkedin,
  ShieldCheck,
  FileCode,
  Globe,
  Database,
  ArrowUpRight,
} from 'lucide-react';

export interface Footer8Props {
  onNavigate?: (tab: string) => void;
}

export const Footer8: React.FC<Footer8Props> = ({ onNavigate }) => {
  const navLinks = [
    { label: 'Overview', id: 'overview' },
    { label: 'Consent Registry', id: 'consent' },
    { label: 'Access Simulator', id: 'simulator' },
    { label: 'Notice Management', id: 'notices' },
    { label: 'Audit Trail', id: 'audit' },
    { label: 'API Docs', href: 'http://127.0.0.1:8000/docs', external: true },
  ];

  const socialLinks = [
    {
      name: 'GitHub Repository',
      icon: Github,
      href: 'https://github.com',
      ariaLabel: 'View Source Code on GitHub',
    },
    {
      name: 'Platform Telemetry',
      icon: Globe,
      href: 'http://127.0.0.1:8000/api/health',
      ariaLabel: 'Inspect Health Telemetry',
    },
    {
      name: 'FastAPI OpenAPI Specs',
      icon: FileCode,
      href: 'http://127.0.0.1:8000/docs',
      ariaLabel: 'Open OpenAPI / Swagger Docs',
    },
    {
      name: 'RFC 8785 Ledger',
      icon: Database,
      actionId: 'audit',
      ariaLabel: 'Inspect RFC 8785 Hash Chain',
    },
    {
      name: 'DPDP Compliance Shield',
      icon: ShieldCheck,
      actionId: 'consent',
      ariaLabel: 'DPDP 2023 Compliance Enforcer',
    },
    {
      name: 'Twitter / X',
      icon: Twitter,
      href: 'https://twitter.com',
      ariaLabel: 'Follow on Twitter',
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      href: 'https://linkedin.com',
      ariaLabel: 'Connect on LinkedIn',
    },
  ];

  const complianceStandards = [
    'India DPDP Act 2023 §6',
    'GDPR EU 2016/679 Arts. 6-7',
    'Kantara Consent Receipts v1.1',
    'RFC 8785 Canonical SHA-256',
  ];

  return (
    <footer className="w-full bg-[#080a0f] border-t border-white/[0.06] text-slate-400 mt-16 relative overflow-hidden">
      {/* Top Ambient Glow Hairline */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 flex flex-col items-center text-center">
        {/* Brand / Logo Emblem & Mission Section (Centered) */}
        <div className="flex flex-col items-center space-y-3 max-w-xl">
          <div
            onClick={() => onNavigate?.('overview')}
            className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 via-orange-600/30 to-amber-700/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black text-xl shadow-glow-copper-sm cursor-pointer hover:scale-105 transition-transform"
          >
            ❖
          </div>

          <div className="flex items-center gap-2 mt-1">
            <h3 className="text-xl font-bold text-white tracking-tight">
              FitTrack <span className="text-amber-400">Lite</span>
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono">
              AIORI-3 Prototype
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-lg">
            Purpose-based explicit consent recording &amp; withdrawal system with an immutable RFC 8785 SHA-256 cryptographic hash chain, built strictly to India DPDP Act 2023 and GDPR specifications.
          </p>
        </div>

        {/* Centered Navigation Links */}
        <nav
          aria-label="Footer Navigation"
          className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2.5 my-8 text-xs sm:text-sm font-medium"
        >
          {navLinks.map((link) => {
            if (link.external) {
              return (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-400 hover:text-amber-400 transition-colors duration-200 flex items-center gap-1 group"
                >
                  <span>{link.label}</span>
                  <ArrowUpRight className="w-3 h-3 text-slate-400 group-hover:text-amber-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              );
            }
            return (
              <button
                key={link.label}
                onClick={() => link.id && onNavigate?.(link.id)}
                className="text-slate-400 hover:text-amber-300 transition-colors duration-200 cursor-pointer"
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Centered Social & Platform Action Icons */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
          {socialLinks.map((item) => {
            const Icon = item.icon;
            if (item.actionId) {
              return (
                <button
                  key={item.name}
                  onClick={() => onNavigate?.(item.actionId!)}
                  aria-label={item.ariaLabel}
                  title={item.name}
                  className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/[0.08] hover:border-amber-500/40 hover:bg-amber-500/10 text-slate-400 hover:text-amber-300 flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-sm cursor-pointer"
                >
                  <Icon className="w-4 h-4" />
                </button>
              );
            }
            return (
              <a
                key={item.name}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                aria-label={item.ariaLabel}
                title={item.name}
                className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/[0.08] hover:border-amber-500/40 hover:bg-amber-500/10 text-slate-400 hover:text-amber-300 flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-sm"
              >
                <Icon className="w-4 h-4" />
              </a>
            );
          })}
        </div>

        {/* Subtle Centered Separator */}
        <div className="w-full max-w-2xl h-[1px] bg-gradient-to-r from-transparent via-white/[0.08] to-transparent my-2" />

        {/* Compliance Standards Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-6 mb-4">
          {complianceStandards.map((std, idx) => (
            <span
              key={idx}
              className="px-2.5 py-1 rounded-lg bg-[#11141e] border border-white/[0.06] text-[11px] font-medium text-slate-400 font-mono hover:border-amber-500/30 hover:text-amber-300 transition"
            >
              {std}
            </span>
          ))}
        </div>

        {/* Copyright & Live Ledger Status Notice */}
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-xs text-slate-400">
          <p>
            © {new Date().getFullYear()} FitTrack Lite • AIORI-3 Problem Statement A3-PS002-TC320.
          </p>
          <span className="hidden sm:inline text-slate-400">•</span>
          <p className="flex items-center gap-1.5 text-emerald-400 font-mono text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            RFC 8785 SHA-256 Ledger Active
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer8;
