import React from 'react';
import { ShieldAlert, ArrowLeft, Lock, CheckCircle2 } from 'lucide-react';

interface UnauthorizedAccessProps {
  attemptedTab: string;
  userRole: 'admin' | 'staff' | 'worker';
  onNavigateToDefault: () => void;
}

const ROLE_INFO = {
  admin: {
    label: 'Plant Administrator',
    badge: '🛡️ Admin Access',
    color: 'border-blue-500/30 bg-blue-50/50 text-blue-900',
    allowedList: [
      'Full System Access',
      'Plant Analytics & Overview',
      'System Configuration & RBAC',
      'All Operations & Audits',
      'Waste Management & Passport',
      'Hygiene & Equipment AI',
    ],
  },
  staff: {
    label: 'Operational Staff',
    badge: '👷 Staff Access',
    color: 'border-emerald-500/30 bg-emerald-50/50 text-emerald-900',
    allowedList: [
      'Daily Dairy Operations & Milk Mass-Balance',
      'Loss Hotspots & CIP Changeovers',
      'Packaging Yield & CIP Resource Tracking',
      'Operational Leak & Spill Logging',
      'Waste Logging & 3-Tier Classification',
      'Operational & Waste Audit Reports',
    ],
    restrictedNotice: 'Admin Configuration, User Management, Plant Analytics, and CCTV Surveillance are restricted to Administrators.',
  },
  worker: {
    label: 'Ground-Level Worker',
    badge: '🧑‍🔧 Worker Access',
    color: 'border-amber-500/30 bg-amber-50/50 text-amber-900',
    allowedList: [
      'Pre-Entry Biometric Hygiene Verification',
      'Equipment & Cleanliness Inspections',
      'Assigned Hygiene & Equipment Alerts',
    ],
    restrictedNotice: 'Operations Management, Waste Logging, Financial Analytics, and Reports are restricted to Staff & Administrators.',
  },
};

const TAB_NAMES: Record<string, string> = {
  overview: 'Executive Analytics & Performance',
  energy: 'Energy Management & Power Simulation',
  ledger: 'Daily Loss Ledger & Mass-Balance',
  hotspots: 'Loss Hotspots & CIP Changeovers',
  resources: 'Packaging & Resource Tracking',
  leaks: 'Leak & Spill Reporter',
  financial: 'Rupee Impact & What-If Financial Engine',
  classification: 'Waste Registration & 3-Tier Classification',
  marketplace: 'Industrial Circular Exchange',
  passport: 'Digital Waste Passport',
  'pre-entry': 'Biometric Pre-Entry Hygiene',
  cctv: 'Live CCTV AI Hygiene Monitoring',
  'video-scanner': 'AI Video Hygiene Scanner',
  equipment: 'Equipment Cleanliness & Inspections',
  alerts: 'Centralized Alerts & Notifications',
  reports: 'Audit Reports & Analytics Export',
  config: 'Admin Configuration & System Settings',
};

export const UnauthorizedAccess: React.FC<UnauthorizedAccessProps> = ({
  attemptedTab,
  userRole,
  onNavigateToDefault,
}) => {
  const info = ROLE_INFO[userRole];
  const attemptedModuleName = TAB_NAMES[attemptedTab] || attemptedTab;

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <div className="rounded-3xl border-2 border-dairy-terracotta/40 bg-white p-8 md:p-10 shadow-xl relative overflow-hidden">
        {/* Decorative Top Accent Strip */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-dairy-terracotta via-amber-500 to-dairy-terracotta" />

        <div className="flex flex-col md:flex-row items-start gap-6 mb-8">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-dairy-terracotta/10 text-dairy-terracotta border border-dairy-terracotta/20 shadow-inner">
            <ShieldAlert className="h-9 w-9" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-dairy-terracotta/15 px-3 py-1 text-xs font-bold text-dairy-terracotta">
              <Lock className="h-3.5 w-3.5" />
              <span>403 FORBIDDEN • ACCESS DENIED</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-dairy-charcoal tracking-tight">
              Restricted Module
            </h1>
            <p className="text-sm text-dairy-charcoal/70 leading-relaxed">
              Your active account role is <span className="font-semibold text-dairy-olive">{info.label} ({info.badge})</span>.
              You do not have administrative clearance to access{' '}
              <span className="font-semibold text-dairy-terracotta underline underline-offset-2">
                "{attemptedModuleName}"
              </span>.
            </p>
          </div>
        </div>

        {/* Role Permissions Information Card */}
        <div className="rounded-2xl border border-dairy-beige bg-dairy-cream/60 p-5 space-y-4 mb-8">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-dairy-forest">
              Your Authorized Operations ({userRole.toUpperCase()})
            </span>
            <span className="text-xs text-dairy-charcoal/60 font-mono">RBAC Policy Enforced</span>
          </div>

          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {info.allowedList.map((item, idx) => (
              <li key={idx} className="flex items-center gap-2 text-xs text-dairy-charcoal/90">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          {'restrictedNotice' in info && info.restrictedNotice && (
            <div className="mt-3 pt-3 border-t border-dairy-beige text-xs text-dairy-charcoal/60 italic">
              ℹ️ {info.restrictedNotice}
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-dairy-beige">
          <button
            onClick={onNavigateToDefault}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-dairy-olive px-6 py-3 text-sm font-semibold text-dairy-ivory shadow-md transition hover:bg-dairy-forest hover:shadow-lg"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Authorized Dashboard</span>
          </button>

          <span className="text-xs text-dairy-charcoal/50 text-center sm:text-right">
            Security Event Logged • Plant Protocol ISO 22000
          </span>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedAccess;

