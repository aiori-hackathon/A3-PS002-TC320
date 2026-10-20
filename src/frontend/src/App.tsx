import React, { useEffect, useState } from 'react';
import { Navbar } from './components/Navbar';
import { OverviewPage } from './pages/OverviewPage';
import { ConsentPage } from './pages/ConsentPage';
import { DataSimulatorPage } from './pages/DataSimulatorPage';
import { NoticePage } from './pages/NoticePage';
import { AuditPage } from './pages/AuditPage';

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
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-800">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        systemHealthy={systemHealthy}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && <OverviewPage onNavigate={setActiveTab} />}
        {activeTab === 'consent' && <ConsentPage />}
        {activeTab === 'simulator' && <DataSimulatorPage />}
        {activeTab === 'notices' && <NoticePage />}
        {activeTab === 'audit' && <AuditPage />}
      </main>

      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-6 text-xs mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-slate-300">
              FitTrack Lite • Purpose-Based Consent Recording &amp; Withdrawal System
            </p>
            <p className="text-slate-500 mt-0.5">
              AIORI-3 Problem Statement A3-PS002-TC320 • Developed strictly per submission specifications
            </p>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>India DPDP Act 2023</span>
            <span>•</span>
            <span>GDPR Arts. 6-7</span>
            <span>•</span>
            <span>Kantara Consent Receipts</span>
            <span>•</span>
            <span>RFC 8785 SHA-256 Chain</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
