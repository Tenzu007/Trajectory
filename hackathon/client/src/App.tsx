import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { UnauthorizedAccess } from './components/UnauthorizedAccess';
import { WelcomePage } from './pages/WelcomePage';
import { LoginPage } from './pages/LoginPage';
import { OverviewDashboard } from './pages/OverviewDashboard';
import { EnergyManagement } from './pages/EnergyManagement';
import { DailyLossLedger } from './pages/DailyLossLedger';
import { LossHotspotAndChangeovers } from './pages/LossHotspotAndChangeovers';
import { PackagingAndResourceTracking } from './pages/PackagingAndResourceTracking';
import { LeakSpillReporter } from './pages/LeakSpillReporter';
import { RupeeImpactEngine } from './pages/RupeeImpactEngine';
import { WasteRegistrationAndClassification } from './pages/WasteRegistrationAndClassification';
import { IndustrialExchangePlatform } from './pages/IndustrialExchangePlatform';
import { DigitalWastePassport } from './pages/DigitalWastePassport';
import { BiometricPreEntry } from './pages/BiometricPreEntry';
import { LiveCCTVMonitoring } from './pages/LiveCCTVMonitoring';
import { VideoHygieneScanner } from './pages/VideoHygieneScanner';
import { EquipmentCleanliness } from './pages/EquipmentCleanliness';
import { AlertsCenter } from './pages/AlertsCenter';
import { ReportsAndAnalytics } from './pages/ReportsAndAnalytics';
import { AdminConfiguration } from './pages/AdminConfiguration';

type AppScreen = 'welcome' | 'login' | 'dashboard';
export type UserRole = 'admin' | 'staff' | 'worker';

// ─── Role-Based Dashboard Configuration & Access Control Matrix ───────────────
export const ROLE_CONFIGS: Record<UserRole, {
  defaultTab: string;
  allowedTabs: string[];
}> = {
  admin: {
    defaultTab: 'overview',
    allowedTabs: [
      'overview',
      'energy',
      'ledger',
      'hotspots',
      'resources',
      'leaks',
      'financial',
      'classification',
      'marketplace',
      'passport',
      'pre-entry',
      'cctv',
      'video-scanner',
      'equipment',
      'alerts',
      'reports',
      'config',
    ],
  },
  staff: {
    // Operations + Waste Logging + Reports ONLY
    defaultTab: 'ledger',
    allowedTabs: [
      'ledger',         // Operations: Daily Loss Ledger & Milk Mass Balance
      'hotspots',       // Operations: Loss Hotspots & CIP Changeovers
      'resources',      // Operations: Packaging Yield & Resource Consumption
      'leaks',          // Operations: Leak & Spill Incident Logger
      'classification', // Waste Logging: Milk Wastage, Quantity, Reason & 3-Tier
      'reports',        // Reports: Operational & Waste Reports Export
    ],
  },
  worker: {
    // Pre-Entry Hygiene + Equipment Checks + Alerts ONLY
    defaultTab: 'pre-entry',
    allowedTabs: [
      'pre-entry',      // Pre-Entry Hygiene Verification
      'equipment',      // Equipment & Machine Cleanliness Checks
      'alerts',         // Assigned Floor Alerts & Hygiene Violations
    ],
  },
};

export const App: React.FC = () => {
  const [screen, setScreen] = useState<AppScreen>('welcome');
  const [userRole, setUserRole] = useState<UserRole>('admin');
  const [userName, setUserName] = useState('');

  const [activeTab, setActiveTab] = useState('overview');
  const [alertCount, setAlertCount] = useState(4);
  const [selectedPassportId, setSelectedPassportId] = useState('PASSPORT-IN-WHEY-091');

  // Fetch alerts for authorized roles (Admin and Worker)
  const fetchAlerts = () => {
    if (userRole === 'staff') return; // Staff does not have alerts module
    fetch('/api/alerts')
      .then(res => {
        if (!res.ok) return null;
        return res.json();
      })
      .then(data => {
        if (data && data.alerts) {
          const unresolved = data.alerts.filter((a: any) => !a.isResolved);
          setAlertCount(unresolved.length);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (screen === 'dashboard') {
      fetchAlerts();
      const interval = setInterval(fetchAlerts, 10000);
      return () => clearInterval(interval);
    }
  }, [screen, userRole]);

  const handleResetDemo = () => {
    if (userRole !== 'admin') {
      alert('Unauthorized: Only Administrators can reset the system demo data.');
      return;
    }

    if (confirm('Restore pristine demo scenarios (Scenario 1-6) and reset initial records?')) {
      fetch('/api/demo/reset', { method: 'POST' }).then(() => {
        alert('Demo data successfully restored! All 6 scenarios are ready for evaluation.');
        window.location.reload();
      });
    }
  };

  const handleNavigateToPassport = (passportId: string) => {
    if (userRole !== 'admin') {
      setActiveTab('passport'); // Will trigger the UnauthorizedAccess component cleanly
      return;
    }
    setSelectedPassportId(passportId);
    setActiveTab('passport');
  };

  const handleLogin = (role: UserRole, name: string) => {
    setUserRole(role);
    setUserName(name);
    sessionStorage.setItem('dairypulse_user_role', role);

    // Redirect to each role's specific dashboard landing view
    const targetTab = ROLE_CONFIGS[role].defaultTab;
    setActiveTab(targetTab);
    setScreen('dashboard');
  };

  const handleLogout = () => {
    sessionStorage.removeItem('dairypulse_user_role');
    setScreen('welcome');
    setUserName('');
  };

  // ── Welcome Screen ──────────────────────────────────────────────
  if (screen === 'welcome') {
    return <WelcomePage onGetStarted={() => setScreen('login')} />;
  }

  // ── Login Screen ────────────────────────────────────────────────
  if (screen === 'login') {
    return <LoginPage onLogin={handleLogin} />;
  }

  // ── Active Role Permissions ─────────────────────────────────────
  const currentRoleConfig = ROLE_CONFIGS[userRole];
  const isAuthorizedForTab = currentRoleConfig.allowedTabs.includes(activeTab);

  // ── Dashboard ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-dairy-ivory text-dairy-charcoal flex flex-col font-sans">
      <Navbar
        alertCount={alertCount}
        onResetDemo={handleResetDemo}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userName={userName}
        userRole={userRole}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          unresolvedAlertCount={alertCount}
          userRole={userRole}
        />

        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {/* RBAC Security Guard: Render Access Denied if unauthorized */}
          {!isAuthorizedForTab ? (
            <UnauthorizedAccess
              attemptedTab={activeTab}
              userRole={userRole}
              onNavigateToDefault={() => setActiveTab(currentRoleConfig.defaultTab)}
            />
          ) : (
            <>
              {/* Authorized Modules */}
              {activeTab === 'overview' && <OverviewDashboard onNavigate={setActiveTab} />}
              {activeTab === 'energy' && <EnergyManagement />}
              {activeTab === 'ledger' && <DailyLossLedger />}
              {activeTab === 'hotspots' && <LossHotspotAndChangeovers />}
              {activeTab === 'resources' && <PackagingAndResourceTracking />}
              {activeTab === 'leaks' && <LeakSpillReporter />}
              {activeTab === 'financial' && <RupeeImpactEngine />}
              {activeTab === 'classification' && <WasteRegistrationAndClassification />}
              {activeTab === 'marketplace' && (
                <IndustrialExchangePlatform onNavigateToPassport={handleNavigateToPassport} />
              )}
              {activeTab === 'passport' && (
                <DigitalWastePassport initialPassportId={selectedPassportId} />
              )}
              {activeTab === 'pre-entry' && <BiometricPreEntry />}
              {activeTab === 'cctv' && <LiveCCTVMonitoring />}
              {activeTab === 'video-scanner' && <VideoHygieneScanner />}
              {activeTab === 'equipment' && <EquipmentCleanliness />}
              {activeTab === 'alerts' && <AlertsCenter onNavigate={setActiveTab} />}
              {activeTab === 'reports' && <ReportsAndAnalytics />}
              {activeTab === 'config' && <AdminConfiguration />}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
