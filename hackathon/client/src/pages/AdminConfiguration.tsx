import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Shield,
  Users,
  Settings,
  Check,
  AlertTriangle,
  RefreshCw,
  Lock,
  Plus,
  Save,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff' | 'worker';
  department: string;
  status: 'Active' | 'Inactive';
  lastActive: string;
}

interface AppConfig {
  plantName: string;
  fssaiLicense: string;
  lossAlertThresholdPercent: number;
  electricityTariffInr: number;
  milkBasePriceInr: number;
  autoEscalateAlertsMinutes: number;
  zeroWasteTargetPercent: number;
  users: SystemUser[];
}

export const AdminConfiguration: React.FC = () => {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // New user form state
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'staff' | 'worker'>('staff');
  const [newUserDept, setNewUserDept] = useState('');

  const fetchConfig = () => {
    setLoading(true);
    fetch('/api/config')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load configuration');
        return res.json();
      })
      .then(data => {
        setConfig(data.config);
        setLoading(false);
      })
      .catch(err => {
        console.error('Config load error:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;
    setSaving(true);
    setSaveSuccess(false);

    fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    })
      .then(res => res.json())
      .then(() => {
        setSaving(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      })
      .catch(err => {
        console.error('Save error:', err);
        setSaving(false);
      });
  };

  const handleToggleUserStatus = (user: SystemUser) => {
    const updatedStatus = user.status === 'Active' ? 'Inactive' : 'Active';
    fetch(`/api/config/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: updatedStatus }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.user && config) {
          setConfig({
            ...config,
            users: config.users.map(u => (u.id === user.id ? data.user : u)),
          });
        }
      });
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail || !config) return;

    const newUser: SystemUser = {
      id: `USR-00${config.users.length + 1}`,
      name: newUserName,
      email: newUserEmail,
      role: newUserRole,
      department: newUserDept || 'Processing & Operations',
      status: 'Active',
      lastActive: 'Just registered',
    };

    const updatedUsers = [...config.users, newUser];
    setConfig({ ...config, users: updatedUsers });

    fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ users: updatedUsers }),
    }).then(() => {
      setShowAddUser(false);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserDept('');
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-dairy-olive">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        <span>Loading plant configuration & RBAC rules...</span>
      </div>
    );
  }

  // RBAC Matrix Definition
  const permissionsMatrix = [
    {
      module: 'Executive Overview Dashboard',
      category: 'Analytics & Strategy',
      admin: 'Full Access (View / Manage)',
      staff: 'Denied',
      worker: 'Denied',
    },
    {
      module: 'Energy Management & Simulator',
      category: 'Energy & Power',
      admin: 'Full Access (Simulate / Manage)',
      staff: 'Denied',
      worker: 'Denied',
    },
    {
      module: 'Daily Milk Loss Ledger',
      category: 'Operations & Mass Balance',
      admin: 'Full Access (CRUD)',
      staff: 'Operational (Read / Write)',
      worker: 'Denied',
    },
    {
      module: 'Loss Hotspots & Changeovers',
      category: 'Operations',
      admin: 'Full Access (CRUD)',
      staff: 'Operational (Read / Write)',
      worker: 'Denied',
    },
    {
      module: 'Packaging & Resource Tracking',
      category: 'Operations',
      admin: 'Full Access (CRUD)',
      staff: 'Operational (Read / Write)',
      worker: 'Denied',
    },
    {
      module: 'Leak & Spill Reporter',
      category: 'Operations',
      admin: 'Full Access (CRUD)',
      staff: 'Operational (Read / Write)',
      worker: 'Denied',
    },
    {
      module: 'Rupee Impact & What-If Engine',
      category: 'Financial Analytics',
      admin: 'Full Access (Simulate / View)',
      staff: 'Denied',
      worker: 'Denied',
    },
    {
      module: 'Waste Registration & Classification',
      category: 'Waste Logging',
      admin: 'Full Access + QC Approval',
      staff: 'Operational (Log / Register)',
      worker: 'Denied',
    },
    {
      module: 'Industrial Exchange & Marketplace',
      category: 'Waste Exchange',
      admin: 'Full Access (Manage Deals)',
      staff: 'Denied',
      worker: 'Denied',
    },
    {
      module: 'Digital Waste Passport',
      category: 'Compliance & Tracing',
      admin: 'Full Access (Generate / Print)',
      staff: 'Denied',
      worker: 'Denied',
    },
    {
      module: 'Biometric Pre-Entry Hygiene',
      category: 'Ground-Level Hygiene',
      admin: 'Full Access (Audit / Override)',
      staff: 'Denied',
      worker: 'Ground-Level (Self-Verify)',
    },
    {
      module: 'Live CCTV AI Monitoring',
      category: 'Hygiene & Security AI',
      admin: 'Full Access (Live Streams)',
      staff: 'Denied',
      worker: 'Denied',
    },
    {
      module: 'AI Video Hygiene Scanner',
      category: 'Hygiene AI Audit',
      admin: 'Full Access (Run Scans)',
      staff: 'Denied',
      worker: 'Denied',
    },
    {
      module: 'Equipment Cleanliness Checks',
      category: 'Equipment Maintenance',
      admin: 'Full Access (Approve / Audit)',
      staff: 'Denied',
      worker: 'Ground-Level (Inspect / Log)',
    },
    {
      module: 'Central Alerts & Notifications',
      category: 'System Alerts',
      admin: 'Full Access (Resolve / Manage)',
      staff: 'Denied',
      worker: 'Ground-Level (View / Resolve)',
    },
    {
      module: 'Audit Reports & Data Export',
      category: 'Reports & Audits',
      admin: 'Full Access (Export / Sign-off)',
      staff: 'Operational (Export Reports)',
      worker: 'Denied',
    },
    {
      module: 'Configuration & User Management',
      category: 'Administration',
      admin: 'Full Access (Configure RBAC)',
      staff: 'Denied',
      worker: 'Denied',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="rounded-3xl border border-dairy-beige bg-gradient-to-r from-dairy-olive/10 via-dairy-cream/60 to-dairy-sage/20 p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-900 border border-blue-200">
                <Shield className="h-3.5 w-3.5 text-blue-700" />
                Admin Clearance Level 5
              </span>
              <span className="text-xs text-dairy-charcoal/60">Strict ISO 22000 RBAC</span>
            </div>
            <h1 className="mt-2 text-2xl md:text-3xl font-bold text-dairy-olive font-serif">
              System Configuration &amp; User Permissions
            </h1>
            <p className="mt-1 text-xs md:text-sm text-dairy-charcoal/70">
              Manage plant operating thresholds, user access matrices, and application-level controls.
            </p>
          </div>

          <button
            onClick={() => {
              if (confirm('Restore pristine demo scenarios (Scenario 1-6) and reset initial records?')) {
                fetch('/api/demo/reset', { method: 'POST' }).then(() => {
                  alert('Demo datasets successfully restored!');
                  window.location.reload();
                });
              }
            }}
            className="flex items-center gap-2 rounded-xl border border-dairy-beige bg-white px-4 py-2.5 text-xs font-semibold text-dairy-olive shadow-sm transition hover:bg-dairy-beige hover:border-dairy-sage"
          >
            <RefreshCw className="h-4 w-4 text-dairy-forest" />
            <span>Reset Demo Datasets</span>
          </button>
        </div>
      </div>

      {/* Section 1: Plant Operating Parameters & Thresholds */}
      {config && (
        <form onSubmit={handleSaveConfig} className="dairy-card p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-dairy-beige pb-4">
            <div className="flex items-center gap-2.5">
              <Sliders className="h-5 w-5 text-dairy-forest" />
              <div>
                <h2 className="text-lg font-bold text-dairy-olive">Plant Operating Thresholds</h2>
                <p className="text-xs text-dairy-charcoal/60">Thresholds that trigger automatic plant alerts and calculations</p>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-dairy-olive px-5 py-2.5 text-xs font-semibold text-dairy-ivory shadow-sm transition hover:bg-dairy-forest disabled:opacity-50"
            >
              {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span>{saving ? 'Saving Changes...' : 'Save Parameters'}</span>
            </button>
          </div>

          {saveSuccess && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Plant configuration updated successfully across all server endpoints!</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-dairy-charcoal/70 mb-2">
                Facility / Plant Name
              </label>
              <input
                type="text"
                value={config.plantName}
                onChange={e => setConfig({ ...config, plantName: e.target.value })}
                className="w-full rounded-xl border border-dairy-beige bg-dairy-cream/40 px-3.5 py-2.5 text-xs text-dairy-charcoal focus:border-dairy-forest focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-dairy-charcoal/70 mb-2">
                FSSAI License Number
              </label>
              <input
                type="text"
                value={config.fssaiLicense}
                onChange={e => setConfig({ ...config, fssaiLicense: e.target.value })}
                className="w-full rounded-xl border border-dairy-beige bg-dairy-cream/40 px-3.5 py-2.5 text-xs font-mono text-dairy-charcoal focus:border-dairy-forest focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-dairy-charcoal/70 mb-2">
                Milk Loss Alert Trigger (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={config.lossAlertThresholdPercent}
                  onChange={e => setConfig({ ...config, lossAlertThresholdPercent: parseFloat(e.target.value) || 1.5 })}
                  className="w-full rounded-xl border border-dairy-beige bg-dairy-cream/40 px-3.5 py-2.5 text-xs text-dairy-charcoal focus:border-dairy-forest focus:outline-none"
                />
                <span className="absolute right-3.5 top-2.5 text-xs text-dairy-charcoal/50">% mass-balance</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-dairy-charcoal/70 mb-2">
                Grid Electricity Tariff (₹ / kWh)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.05"
                  value={config.electricityTariffInr}
                  onChange={e => setConfig({ ...config, electricityTariffInr: parseFloat(e.target.value) || 8.2 })}
                  className="w-full rounded-xl border border-dairy-beige bg-dairy-cream/40 px-3.5 py-2.5 text-xs text-dairy-charcoal focus:border-dairy-forest focus:outline-none"
                />
                <span className="absolute right-3.5 top-2.5 text-xs text-dairy-charcoal/50">₹ / kWh</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-dairy-charcoal/70 mb-2">
                Raw Milk Procurement Price (₹ / L)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  value={config.milkBasePriceInr}
                  onChange={e => setConfig({ ...config, milkBasePriceInr: parseFloat(e.target.value) || 35 })}
                  className="w-full rounded-xl border border-dairy-beige bg-dairy-cream/40 px-3.5 py-2.5 text-xs text-dairy-charcoal focus:border-dairy-forest focus:outline-none"
                />
                <span className="absolute right-3.5 top-2.5 text-xs text-dairy-charcoal/50">₹ / Liter</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-dairy-charcoal/70 mb-2">
                Zero-Waste Circular Target (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  value={config.zeroWasteTargetPercent}
                  onChange={e => setConfig({ ...config, zeroWasteTargetPercent: parseFloat(e.target.value) || 95 })}
                  className="w-full rounded-xl border border-dairy-beige bg-dairy-cream/40 px-3.5 py-2.5 text-xs text-dairy-charcoal focus:border-dairy-forest focus:outline-none"
                />
                <span className="absolute right-3.5 top-2.5 text-xs text-dairy-charcoal/50">% circularity</span>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Section 2: Visual RBAC Matrix Table */}
      <div className="dairy-card p-6 md:p-8 space-y-5">
        <div className="flex items-center justify-between border-b border-dairy-beige pb-4">
          <div className="flex items-center gap-2.5">
            <Lock className="h-5 w-5 text-dairy-forest" />
            <div>
              <h2 className="text-lg font-bold text-dairy-olive">Role-Based Access Control (RBAC) Matrix</h2>
              <p className="text-xs text-dairy-charcoal/60">Module clearance and operational boundary enforcement</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 font-medium text-emerald-800">
              <span className="h-2 w-2 rounded-full bg-emerald-600" /> Authorized
            </span>
            <span className="flex items-center gap-1 font-medium text-dairy-terracotta">
              <span className="h-2 w-2 rounded-full bg-dairy-terracotta" /> Denied
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-dairy-beige/50 text-[11px] font-bold uppercase tracking-wider text-dairy-olive">
              <tr>
                <th className="rounded-l-lg py-3 px-3">Module Name</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3 text-center bg-blue-50/70 text-blue-900 border-x border-blue-100">
                  🛡️ Admin (Lead)
                </th>
                <th className="py-3 px-3 text-center bg-emerald-50/70 text-emerald-900 border-r border-emerald-100">
                  👷 Staff (Operations)
                </th>
                <th className="rounded-r-lg py-3 px-3 text-center bg-amber-50/70 text-amber-900">
                  🧑‍🔧 Worker (Floor)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dairy-beige">
              {permissionsMatrix.map((item, idx) => (
                <tr key={idx} className="hover:bg-dairy-cream/50 transition">
                  <td className="py-2.5 px-3 font-semibold text-dairy-olive">{item.module}</td>
                  <td className="py-2.5 px-3 text-dairy-charcoal/60">{item.category}</td>

                  {/* Admin Column */}
                  <td className="py-2.5 px-3 text-center bg-blue-50/30 border-x border-blue-100/50">
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100/80 px-2.5 py-0.5 font-semibold text-blue-900 text-[10px]">
                      <Check className="h-3 w-3 text-blue-700" />
                      {item.admin}
                    </span>
                  </td>

                  {/* Staff Column */}
                  <td className="py-2.5 px-3 text-center bg-emerald-50/30 border-r border-emerald-100/50">
                    {item.staff === 'Denied' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 font-semibold text-red-700 text-[10px]">
                        <XCircle className="h-3 w-3 text-red-600" />
                        Denied
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 font-semibold text-emerald-900 text-[10px]">
                        <Check className="h-3 w-3 text-emerald-700" />
                        {item.staff}
                      </span>
                    )}
                  </td>

                  {/* Worker Column */}
                  <td className="py-2.5 px-3 text-center bg-amber-50/30">
                    {item.worker === 'Denied' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 font-semibold text-red-700 text-[10px]">
                        <XCircle className="h-3 w-3 text-red-600" />
                        Denied
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 font-semibold text-amber-900 text-[10px]">
                        <Check className="h-3 w-3 text-amber-700" />
                        {item.worker}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 3: Registered Users & Status Toggles */}
      {config && (
        <div className="dairy-card p-6 md:p-8 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-dairy-beige pb-4">
            <div className="flex items-center gap-2.5">
              <Users className="h-5 w-5 text-dairy-forest" />
              <div>
                <h2 className="text-lg font-bold text-dairy-olive">Registered Plant Users &amp; Roles</h2>
                <p className="text-xs text-dairy-charcoal/60">Configure roles, permissions, and active statuses</p>
              </div>
            </div>

            <button
              onClick={() => setShowAddUser(!showAddUser)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-dairy-forest bg-dairy-forest/10 px-3.5 py-2 text-xs font-semibold text-dairy-forest hover:bg-dairy-forest hover:text-white transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Plant User</span>
            </button>
          </div>

          {/* Add User Modal/Inline Form */}
          {showAddUser && (
            <form onSubmit={handleAddUser} className="rounded-2xl border border-dairy-sage/40 bg-dairy-cream/80 p-5 space-y-4">
              <h3 className="text-sm font-bold text-dairy-olive">Register New Plant User</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input
                  type="text"
                  placeholder="Full Name (e.g., Rajesh Naik)"
                  value={newUserName}
                  onChange={e => setNewUserName(e.target.value)}
                  className="rounded-xl border border-dairy-beige bg-white px-3 py-2 text-xs focus:outline-none"
                  required
                />
                <input
                  type="email"
                  placeholder="Email (e.g., r.naik@dairypulse.in)"
                  value={newUserEmail}
                  onChange={e => setNewUserEmail(e.target.value)}
                  className="rounded-xl border border-dairy-beige bg-white px-3 py-2 text-xs focus:outline-none"
                  required
                />
                <select
                  value={newUserRole}
                  onChange={e => setNewUserRole(e.target.value as any)}
                  className="rounded-xl border border-dairy-beige bg-white px-3 py-2 text-xs focus:outline-none"
                >
                  <option value="staff">Staff (Operations)</option>
                  <option value="worker">Worker (Floor)</option>
                  <option value="admin">Admin (Plant Lead)</option>
                </select>
                <input
                  type="text"
                  placeholder="Department (e.g., Packing Line 2)"
                  value={newUserDept}
                  onChange={e => setNewUserDept(e.target.value)}
                  className="rounded-xl border border-dairy-beige bg-white px-3 py-2 text-xs focus:outline-none"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddUser(false)}
                  className="px-3 py-1.5 text-xs text-dairy-charcoal/60 hover:text-dairy-charcoal"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-dairy-olive px-4 py-1.5 text-xs font-semibold text-white hover:bg-dairy-forest transition"
                >
                  Register User
                </button>
              </div>
            </form>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-dairy-beige/50 text-[11px] font-bold uppercase tracking-wider text-dairy-olive">
                <tr>
                  <th className="py-2.5 px-3">User ID</th>
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Email</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dairy-beige">
                {config.users.map(user => (
                  <tr key={user.id} className="hover:bg-dairy-cream/40 transition">
                    <td className="py-3 px-3 font-mono text-dairy-charcoal/60">{user.id}</td>
                    <td className="py-3 px-3 font-semibold text-dairy-olive">{user.name}</td>
                    <td className="py-3 px-3 text-dairy-charcoal/80 font-mono text-[11px]">{user.email}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                          user.role === 'admin'
                            ? 'bg-blue-100 text-blue-900 border border-blue-200'
                            : user.role === 'staff'
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                            : 'bg-amber-100 text-amber-900 border border-amber-200'
                        }`}
                      >
                        {user.role === 'admin' && '🛡️ Admin'}
                        {user.role === 'staff' && '👷 Staff'}
                        {user.role === 'worker' && '🧑‍🔧 Worker'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-dairy-charcoal/70">{user.department}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          user.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-dairy-beige text-dairy-charcoal/50'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            user.status === 'Active' ? 'bg-emerald-600' : 'bg-dairy-charcoal/40'
                          }`}
                        />
                        {user.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {user.role !== 'admin' && (
                        <button
                          onClick={() => handleToggleUserStatus(user)}
                          className="rounded-lg border border-dairy-beige px-2.5 py-1 text-[11px] font-semibold text-dairy-olive hover:bg-dairy-cream hover:border-dairy-sage transition"
                        >
                          {user.status === 'Active' ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminConfiguration;

