import React, { useState } from 'react';
import { LineSidebar } from './LineSidebar';
import {
  Menu,
  X,
  LayoutDashboard,
  ShieldCheck,
  Activity,
  FileText,
  Database,
} from 'lucide-react';

export interface AppSidebar2Props {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  systemHealthy: boolean;
}

const TAB_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'consent', label: 'Consent Dashboard', icon: ShieldCheck },
  { id: 'simulator', label: 'Data Simulator', icon: Activity },
  { id: 'notices', label: 'Notice Management', icon: FileText },
  { id: 'audit', label: 'Audit Evidence Trail', icon: Database },
];

export const AppSidebar2: React.FC<AppSidebar2Props> = ({
  activeTab,
  setActiveTab,
  systemHealthy,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeIndex = Math.max(0, TAB_ITEMS.findIndex((t) => t.id === activeTab));

  const handleItemClick = (index: number) => {
    if (TAB_ITEMS[index]) {
      setActiveTab(TAB_ITEMS[index].id);
    }
  };

  return (
    <>
      {/* Mobile Top Header (< 1024px) */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-[#0d0f17] border-b border-white/[0.06] sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 via-orange-600/30 to-amber-700/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-xs shadow-glow-copper-sm">
            ◈
          </div>
          <span className="font-bold text-white text-sm tracking-tight">
            FitTrack <span className="text-amber-400 font-semibold">Lite</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-[#161a25] border border-white/[0.06] text-[11px]">
            <span className={`w-2 h-2 rounded-full ${systemHealthy ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
            <span className="text-slate-300 font-medium">{systemHealthy ? 'API Active' : 'Offline'}</span>
          </div>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="lg:hidden bg-[#0d0f17] border-b border-white/[0.06] px-4 py-3 space-y-1 z-40 sticky top-14 shadow-2xl">
          {TAB_ITEMS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setMobileOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/10 text-amber-300 border border-amber-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-[#161a25]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Transparent Desktop Sidebar Utilizing Full Layout Space */}
      <aside className="hidden lg:flex flex-col w-72 bg-transparent border-r border-white/[0.06] h-screen sticky top-0 shrink-0 z-40 select-none">
        {/* Brand Header */}
        <div className="px-6 py-5 flex items-center gap-3.5 border-b border-white/[0.05]">
          <div
            onClick={() => setActiveTab('overview')}
            className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500/25 via-orange-600/30 to-amber-700/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-glow-copper-sm hover:scale-105 hover:border-amber-400 transition-all cursor-pointer shrink-0"
            title="FitTrack Lite - Purpose-Based Consent"
          >
            <span className="text-lg font-black tracking-tighter">❖</span>
          </div>

          <div className="flex flex-col overflow-hidden">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white text-sm tracking-tight">FitTrack</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 font-mono">
                Lite
              </span>
            </div>
            <span className="text-[11px] text-slate-400 truncate font-mono">
              AIORI-3 • PS002-TC320
            </span>
          </div>
        </div>

        {/* Section Label */}
        <div className="px-6 pt-6 pb-2">
          <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase font-mono">
            Platform Navigation
          </span>
        </div>

        {/* React Bits LineSidebar Navigation (Generous Spacing Across Sidebar) */}
        <div className="flex-1 px-6 py-6 flex flex-col justify-center">
          <LineSidebar
            items={TAB_ITEMS.map((t) => t.label)}
            activeIndex={activeIndex}
            accentColor="#f59e0b"
            textColor="#94a3b8"
            markerColor="#334155"
            showIndex={true}
            showMarker={true}
            proximityRadius={155}
            maxShift={24}
            falloff="smooth"
            markerLength={36}
            markerGap={16}
            tickScale={0.5}
            scaleTick={true}
            itemGap={64}
            fontSize={1.05}
            smoothing={90}
            defaultActive={0}
            onItemClick={handleItemClick}
            className="w-full"
          />
        </div>

        {/* Bottom Section (Status & Officer Profile) */}
        <div className="border-t border-white/[0.05] p-5 flex flex-col gap-3">
          {/* System Telemetry & Health */}
          <div className="px-3.5 py-2.5 rounded-2xl bg-white/[0.02] border border-white/[0.05] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${systemHealthy ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
                FastAPI Engine
              </span>
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded font-mono ${systemHealthy ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300'}`}>
                {systemHealthy ? 'ACTIVE' : 'OFFLINE'}
              </span>
            </div>
            <div className="text-[10px] text-slate-400 flex items-center justify-between font-mono">
              <span>RFC 8785 Chain</span>
              <span className="text-emerald-400 font-mono">12 Verified</span>
            </div>
          </div>

          {/* User Profile Bar */}
          <div className="flex items-center justify-between px-3 py-2 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 to-orange-400 p-[1.5px] shrink-0">
                <div className="w-full h-full rounded-full bg-[#0b0d13] flex items-center justify-center text-white text-[10px] font-bold font-mono">
                  DPO
                </div>
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-white truncate">DPO Admin</p>
                <p className="text-[10px] text-slate-400 truncate font-mono">admin@fittrack.internal</p>
              </div>
            </div>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0 font-mono">
              SEC-ADMIN
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default AppSidebar2;
