import React from 'react';
import { Bell, RefreshCw, Factory, ShieldCheck, LogOut, Shield } from 'lucide-react';

type UserRole = 'admin' | 'staff' | 'worker';

const ROLE_ICONS: Record<UserRole, string> = {
  admin: '🛡️',
  staff: '👷',
  worker: '🧑‍🔧',
};

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'System Admin',
  staff: 'Floor Operations Staff',
  worker: 'Production Worker',
};

interface NavbarProps {
  alertCount: number;
  onResetDemo: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userName?: string;
  userRole?: UserRole;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  alertCount,
  onResetDemo,
  setActiveTab,
  userName = 'Dr. Sunita Mehta',
  userRole = 'admin',
  onLogout,
}) => {
  const initials = (userName || 'Admin')
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-dairy-beige bg-dairy-ivory/90 px-6 py-3.5 backdrop-blur-md">
      {/* Brand & Plant Name */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-dairy-olive text-dairy-ivory shadow-sm">
          <Factory className="h-5 w-5 text-dairy-sage" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight text-dairy-olive">
              Dairy<span className="text-dairy-forest">Pulse</span>
            </h1>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold border ${
                userRole === 'admin'
                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                  : userRole === 'staff'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full animate-pulse ${
                  userRole === 'admin'
                    ? 'bg-blue-600'
                    : userRole === 'staff'
                    ? 'bg-emerald-600'
                    : 'bg-amber-600'
                }`}
              />
              {userRole === 'admin' && 'Admin Console'}
              {userRole === 'staff' && 'Staff Operations'}
              {userRole === 'worker' && 'Worker Terminal'}
            </span>
          </div>
          <p className="text-xs text-dairy-charcoal/70">Apex Dairy Cooperative • Plant #4 (Central Processing Hub)</p>
        </div>
      </div>

      {/* Center Status Indicators */}
      <div className="hidden md:flex items-center gap-6 rounded-full border border-dairy-beige bg-dairy-cream/60 px-4 py-1.5 text-xs text-dairy-charcoal/80">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-dairy-forest" />
          <span>FSSAI &amp; ISO 22000 Certified</span>
        </div>

        {userRole !== 'worker' ? (
          <>
            <div className="h-3 w-px bg-dairy-beige" />
            <div>
              <span className="text-dairy-charcoal/60">Shift Intake: </span>
              <span className="font-semibold text-dairy-olive">50,000 L</span>
            </div>
            <div className="h-3 w-px bg-dairy-beige" />
            <div>
              <span className="text-dairy-charcoal/60">Renewable Mix: </span>
              <span className="font-semibold text-emerald-700">38.2%</span>
            </div>
          </>
        ) : (
          <>
            <div className="h-3 w-px bg-dairy-beige" />
            <div>
              <span className="text-dairy-charcoal/60">Floor Status: </span>
              <span className="font-semibold text-dairy-olive">Shift B Active</span>
            </div>
            <div className="h-3 w-px bg-dairy-beige" />
            <div>
              <span className="text-dairy-charcoal/60">Station: </span>
              <span className="font-semibold text-emerald-700">Packaging Bay 4</span>
            </div>
          </>
        )}
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* Reset Demo Button – ONLY shown for Admin */}
        {userRole === 'admin' && (
          <button
            onClick={onResetDemo}
            title="Restore pristine demo datasets and scenarios for presentation"
            className="flex items-center gap-1.5 rounded-lg border border-dairy-beige bg-dairy-cream px-3 py-1.5 text-xs font-medium text-dairy-olive transition hover:bg-dairy-beige hover:border-dairy-sage"
          >
            <RefreshCw className="h-3.5 w-3.5 text-dairy-forest" />
            <span className="hidden sm:inline">Reset Demo Scenarios</span>
          </button>
        )}

        {/* Alerts Bell – Shown for Admin & Worker (Staff has no alerts module) */}
        {(userRole === 'admin' || userRole === 'worker') && (
          <button
            onClick={() => setActiveTab('alerts')}
            title="View Central Alerts"
            className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-dairy-beige bg-white text-dairy-charcoal transition hover:border-dairy-sage hover:bg-dairy-cream"
          >
            <Bell className="h-4 w-4" />
            {alertCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-dairy-terracotta px-1 text-[10px] font-bold text-white shadow-sm">
                {alertCount}
              </span>
            )}
          </button>
        )}

        {/* User Pill */}
        <div className="flex items-center gap-2 pl-2">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full font-semibold text-xs text-white shadow-sm ${
              userRole === 'admin'
                ? 'bg-blue-700'
                : userRole === 'staff'
                ? 'bg-emerald-700'
                : 'bg-amber-700'
            }`}
          >
            {initials}
          </div>
          <div className="hidden lg:block text-left text-xs leading-tight">
            <p className="font-semibold text-dairy-olive flex items-center gap-1">
              <span>{ROLE_ICONS[userRole]}</span>
              {userName}
            </p>
            <p className="text-[10px] text-dairy-charcoal/60">{ROLE_LABELS[userRole]}</p>
          </div>
        </div>

        {/* Logout Button */}
        {onLogout && (
          <button
            onClick={onLogout}
            title="Log out of session"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-dairy-beige bg-white text-dairy-charcoal/60 transition hover:border-red-300 hover:bg-red-50 hover:text-red-500"
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>
    </header>
  );
};

export default Navbar;
