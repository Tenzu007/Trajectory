import React from 'react';
import {
  LayoutDashboard,
  Zap,
  Scale,
  GitCompare,
  Box,
  AlertTriangle,
  IndianRupee,
  Layers,
  Repeat,
  QrCode,
  UserCheck,
  Video,
  FileVideo,
  Sparkles,
  BellRing,
  FileSpreadsheet,
  Settings,
  Shield,
  Briefcase,
  Wrench,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  unresolvedAlertCount: number;
  userRole?: 'admin' | 'staff' | 'worker';
}

interface SidebarItem {
  id: string;
  label: string;
  icon: any;
  badge?: string;
  count?: number;
}

interface SidebarSection {
  group: string;
  items: SidebarItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  unresolvedAlertCount,
  userRole = 'admin',
}) => {
  // ── Role-Specific Sidebar Sections ──────────────────────────────────────────

  let sections: SidebarSection[] = [];

  if (userRole === 'admin') {
    sections = [
      {
        group: 'Executive Overview',
        items: [
          { id: 'overview', label: 'Executive Dashboard', icon: LayoutDashboard },
        ],
      },
      {
        group: 'Part 1: Energy & Power',
        items: [
          { id: 'energy', label: 'Energy & Simulation', icon: Zap, badge: 'Anomaly' },
        ],
      },
      {
        group: 'Part 2: Waste & Loss Analytics',
        items: [
          { id: 'ledger', label: 'Daily Loss Ledger', icon: Scale, badge: '1,000L' },
          { id: 'hotspots', label: 'Hotspots & Changeovers', icon: GitCompare },
          { id: 'resources', label: 'Packaging & Resources', icon: Box },
          { id: 'leaks', label: 'Leak & Spill Reporter', icon: AlertTriangle, badge: 'Tank 3 (5x)' },
          { id: 'financial', label: 'Rupee Impact & What-If', icon: IndianRupee },
          { id: 'classification', label: '3-Tier Classification', icon: Layers },
          { id: 'marketplace', label: 'Industrial Exchange', icon: Repeat },
          { id: 'passport', label: 'Digital Waste Passport', icon: QrCode },
        ],
      },
      {
        group: 'Part 3: Hygiene & Equipment AI',
        items: [
          { id: 'pre-entry', label: 'Biometric Pre-Entry', icon: UserCheck },
          { id: 'cctv', label: 'Live CCTV Monitoring', icon: Video },
          { id: 'video-scanner', label: 'Video & Image Scanner', icon: FileVideo },
          { id: 'equipment', label: 'Equipment Cleanliness', icon: Sparkles },
        ],
      },
      {
        group: 'Part 4: Operations & Audits',
        items: [
          { id: 'alerts', label: 'Central Alerts', icon: BellRing, count: unresolvedAlertCount },
          { id: 'reports', label: 'Audit Reports & Export', icon: FileSpreadsheet },
        ],
      },
      {
        group: 'Part 5: Administration',
        items: [
          { id: 'config', label: 'Configuration & RBAC', icon: Settings, badge: 'Admin' },
        ],
      },
    ];
  } else if (userRole === 'staff') {
    // Staff Dashboard: Operations + Waste Logging + Reports ONLY
    sections = [
      {
        group: 'Daily Floor Operations',
        items: [
          { id: 'ledger', label: 'Daily Loss Ledger', icon: Scale, badge: '1,000L' },
          { id: 'hotspots', label: 'Hotspots & Changeovers', icon: GitCompare },
          { id: 'resources', label: 'Packaging & Resources', icon: Box },
          { id: 'leaks', label: 'Leak & Spill Reporter', icon: AlertTriangle, badge: 'Tank 3 (5x)' },
        ],
      },
      {
        group: 'Waste Management',
        items: [
          { id: 'classification', label: 'Waste Logging & 3-Tier', icon: Layers },
        ],
      },
      {
        group: 'Operational Reports',
        items: [
          { id: 'reports', label: 'Operational & Waste Reports', icon: FileSpreadsheet },
        ],
      },
    ];
  } else {
    // Worker Dashboard: Pre-Entry Hygiene + Equipment Checks + Alerts ONLY
    sections = [
      {
        group: 'Mandatory Hygiene',
        items: [
          { id: 'pre-entry', label: 'Biometric Pre-Entry', icon: UserCheck, badge: 'Mandatory' },
        ],
      },
      {
        group: 'Equipment Maintenance',
        items: [
          { id: 'equipment', label: 'Equipment Checks', icon: Sparkles, badge: 'Roster' },
        ],
      },
      {
        group: 'Floor Notifications',
        items: [
          { id: 'alerts', label: 'Assigned Alerts', icon: BellRing, count: unresolvedAlertCount },
        ],
      },
    ];
  }

  return (
    <aside className="w-64 shrink-0 border-r border-dairy-beige bg-dairy-cream/40 p-4 min-h-[calc(100vh-65px)] flex flex-col justify-between overflow-y-auto">
      <div className="space-y-5">
        {/* Role Workspace Banner */}
        <div
          className={`rounded-2xl p-3 border flex items-center gap-2.5 shadow-sm ${
            userRole === 'admin'
              ? 'bg-blue-50/70 border-blue-200 text-blue-900'
              : userRole === 'staff'
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
              : 'bg-amber-50/70 border-amber-200 text-amber-900'
          }`}
        >
          {userRole === 'admin' && <Shield className="h-5 w-5 text-blue-700 shrink-0" />}
          {userRole === 'staff' && <Briefcase className="h-5 w-5 text-emerald-700 shrink-0" />}
          {userRole === 'worker' && <Wrench className="h-5 w-5 text-amber-700 shrink-0" />}

          <div className="overflow-hidden">
            <div className="text-xs font-bold capitalize leading-none">
              {userRole === 'admin' && 'Admin Dashboard'}
              {userRole === 'staff' && 'Staff Operations'}
              {userRole === 'worker' && 'Worker Terminal'}
            </div>
            <p className="text-[10px] text-dairy-charcoal/60 truncate mt-0.5">
              {userRole === 'admin' && 'Full System Control & RBAC'}
              {userRole === 'staff' && 'Operations, Waste & Reports'}
              {userRole === 'worker' && 'Hygiene, Equipment & Alerts'}
            </p>
          </div>
        </div>

        {sections.map((sec, idx) => (
          <div key={idx} className="space-y-1">
            <h2 className="px-2.5 text-[11px] font-bold uppercase tracking-wider text-dairy-olive/60 font-sans">
              {sec.group}
            </h2>
            <div className="space-y-0.5">
              {sec.items.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition ${
                      isActive
                        ? 'bg-dairy-olive text-dairy-ivory shadow-sm'
                        : 'text-dairy-charcoal/80 hover:bg-dairy-beige/60 hover:text-dairy-olive'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`h-4 w-4 ${isActive ? 'text-dairy-sage' : 'text-dairy-forest'}`} />
                      <span>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                          isActive
                            ? 'bg-dairy-sage/20 text-dairy-ivory border border-dairy-sage/30'
                            : 'bg-dairy-terracotta/10 text-dairy-terracotta border border-dairy-terracotta/20'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}

                    {typeof item.count === 'number' && item.count > 0 && (
                      <span className="rounded-full bg-dairy-terracotta px-1.5 py-0.2 text-[10px] font-bold text-white">
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Zero-Waste Roadmap or Role Clearance Footer */}
      <div className="mt-6 rounded-xl border border-dairy-sage/40 bg-dairy-sage/10 p-3 text-xs text-dairy-olive">
        <div className="flex items-center gap-1.5 font-semibold text-dairy-forest">
          <Sparkles className="h-3.5 w-3.5" />
          <span>
            {userRole === 'admin' && 'Enterprise Zero-Waste'}
            {userRole === 'staff' && 'Floor Operations Compliance'}
            {userRole === 'worker' && 'Worker Safety First'}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-dairy-charcoal/70 leading-relaxed">
          {userRole === 'admin' && 'Tracking every drop of milk, kWh of power, and audit record.'}
          {userRole === 'staff' && 'Logged entries feed directly into dairy mass-balance analytics.'}
          {userRole === 'worker' && 'Ensure PPE verification is completed before entering production.'}
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
