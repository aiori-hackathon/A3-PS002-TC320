import React, { useEffect, useState } from 'react';
import { AppSidebar2 } from './components/AppSidebar2';
import { OverviewPage } from './pages/OverviewPage';
import { ConsentPage } from './pages/ConsentPage';
import { DataSimulatorPage } from './pages/DataSimulatorPage';
import { NoticePage } from './pages/NoticePage';
import { AuditPage } from './pages/AuditPage';
import { Footer8 } from './components/Footer8';
import { ChevronRight } from 'lucide-react';


export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [systemHealthy, setSystemHealthy] = useState<boolean>(true);

  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          setSystemHealthy(true);
        } else {
          setSystemHealthy(false);
        }
      } catch {
        setSystemHealthy(false);
      }
    }
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#0b0d13] text-slate-100 flex flex-col lg:flex-row antialiased selection:bg-amber-500/30 selection:text-amber-200">
      {/* App Sidebar 2: Icon Rail with Hover Flyouts */}
      <AppSidebar2
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        systemHealthy={systemHealthy}
      />


      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0b0d13] overflow-x-hidden">
        {/* Top Command Platform Header Bar */}
        <header className="h-14 px-4 sm:px-6 lg:px-8 border-b border-white/[0.06] bg-[#0c0e16]/90 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 overflow-hidden">
            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
              <span className="hidden sm:inline">Platform</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600 hidden sm:inline" />
              <span className="text-slate-300 font-semibold truncate">FitTrack Consent</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              <span className="text-amber-400 font-bold truncate">
                {activeTab === 'overview' && 'Overview & Telemetry'}
                {activeTab === 'consent' && 'Consent Registry'}
                {activeTab === 'simulator' && 'Data Simulator'}
                {activeTab === 'notices' && 'Notice Management'}
                {activeTab === 'audit' && 'Audit Evidence Trail'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-[11px] font-mono text-slate-300">
              DPDP 2023 • GDPR Arts. 6-7
            </span>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#161a25] border border-white/[0.06] text-[11px]">
              <span className={`w-2 h-2 rounded-full ${systemHealthy ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
              <span className="text-slate-300 font-semibold font-mono">{systemHealthy ? 'FastAPI Active' : 'API Offline'}</span>
            </div>
          </div>
        </header>

        {/* Dynamic Page Workspace */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
          {activeTab === 'overview' && <OverviewPage onNavigate={setActiveTab} />}
          {activeTab === 'consent' && <ConsentPage />}
          {activeTab === 'simulator' && <DataSimulatorPage />}
          {activeTab === 'notices' && <NoticePage />}
          {activeTab === 'audit' && <AuditPage />}
        </main>

        {/* Footer 8: Centered Footer with Social & Platform Action Icons */}
        <Footer8 onNavigate={setActiveTab} />
      </div>
    </div>
  );
};

export default App;

