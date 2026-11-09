import React from 'react';
import {
  Zap,
  Scale,
  IndianRupee,
  ShieldCheck,
  AlertTriangle,
  Leaf,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface OverviewDashboardProps {
  onNavigate: (tab: string) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({ onNavigate }) => {
  // Chart datasets
  const departmentEnergyData = [
    { name: 'Pasteurization', kwh: 1050, cost: 8610 },
    { name: 'Cold Chain', kwh: 900, cost: 7380 },
    { name: 'Processing', kwh: 720, cost: 5904 },
    { name: 'Utilities', kwh: 690, cost: 5658 },
    { name: 'Packaging', kwh: 288, cost: 2361 },
    { name: 'Sanitation', kwh: 176, cost: 1443 },
  ];

  const wasteCategoryDistribution = [
    { name: 'Reusable (Whey/By-products)', value: 65, color: '#526B58' },
    { name: 'Treatable (Sludge/DAF)', value: 25, color: '#E09F3E' },
    { name: 'Disposal (Scrap Film)', value: 10, color: '#C97A63' },
  ];

  const hotspotData = [
    { stage: 'Changeovers', loss: 1250, fill: '#354C3C' },
    { stage: 'Tank Leaks', loss: 890, fill: '#526B58' },
    { stage: 'Pouch Scrap', loss: 710, fill: '#AFC4AD' },
    { stage: 'CIP Rinse', loss: 580, fill: '#D4A373' },
    { stage: 'Bay Spills', loss: 420, fill: '#C97A63' },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-dairy-beige bg-gradient-to-r from-dairy-olive via-dairy-forest to-dairy-olive p-7 text-dairy-ivory shadow-sm">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide text-dairy-sage border border-white/10 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5" />
            Unified Plant Intelligence Platform
          </div>
          <h2 className="text-3xl font-serif font-bold text-white tracking-tight">
            Account for Every Litre, kWh, and Hygiene Protocol
          </h2>
          <p className="text-sm text-dairy-ivory/80 leading-relaxed font-light">
            Centralized software-only platform tracking electricity anomalies, mass-balance milk losses, industrial circular waste exchange, and AI biometric CCTV hygiene.
          </p>
        </div>

        {/* Subtle decorative circles */}
        <div className="absolute -right-10 -bottom-10 h-64 w-64 rounded-full bg-white/5 blur-2xl pointer-events-none" />
      </div>

      {/* Primary KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Daily Milk Mass Balance */}
        <div className="dairy-card p-5 dairy-card-hover cursor-pointer" onClick={() => onNavigate('ledger')}>
          <div className="flex items-center justify-between text-xs font-semibold text-dairy-charcoal/70">
            <span>Unexplained Milk Loss</span>
            <div className="rounded-lg bg-dairy-terracotta/10 p-2 text-dairy-terracotta">
              <Scale className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-serif text-dairy-terracotta">1,000 L</span>
            <span className="ml-2 text-xs font-semibold text-dairy-terracotta">2.06%</span>
          </div>
          <p className="mt-1 text-xs text-dairy-charcoal/60">
            Exceeds 1.5% normal threshold (₹45,000 loss)
          </p>
          <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-dairy-forest">
            <span>Inspect Daily Loss Ledger</span>
            <ArrowUpRight className="h-3 w-3" />
          </div>
        </div>

        {/* Card 2: Total Electricity & Anomaly */}
        <div className="dairy-card p-5 dairy-card-hover cursor-pointer" onClick={() => onNavigate('energy')}>
          <div className="flex items-center justify-between text-xs font-semibold text-dairy-charcoal/70">
            <span>Daily Power Consumption</span>
            <div className="rounded-lg bg-dairy-amber/10 p-2 text-dairy-amber">
              <Zap className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-serif text-dairy-olive">3,824 kWh</span>
            <span className="ml-2 text-xs font-semibold text-dairy-terracotta">+12% surge</span>
          </div>
          <p className="mt-1 text-xs text-dairy-charcoal/60">
            3 equipment anomalies flagged (₹31,356/day)
          </p>
          <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-dairy-forest">
            <span>View Energy Simulation</span>
            <ArrowUpRight className="h-3 w-3" />
          </div>
        </div>

        {/* Card 3: Circular Economy Recovery */}
        <div className="dairy-card p-5 dairy-card-hover cursor-pointer" onClick={() => onNavigate('marketplace')}>
          <div className="flex items-center justify-between text-xs font-semibold text-dairy-charcoal/70">
            <span>Industrial Waste Diversion</span>
            <div className="rounded-lg bg-dairy-forest/10 p-2 text-dairy-forest">
              <Leaf className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-serif text-emerald-800">4,700 kg/L</span>
            <span className="ml-2 text-xs font-semibold text-emerald-700">89% Diverted</span>
          </div>
          <p className="mt-1 text-xs text-dairy-charcoal/60">
            ₹19,450 net recovery value in exchange
          </p>
          <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-dairy-forest">
            <span>Explore Industrial Matching</span>
            <ArrowUpRight className="h-3 w-3" />
          </div>
        </div>

        {/* Card 4: AI Hygiene & Biometric Gate */}
        <div className="dairy-card p-5 dairy-card-hover cursor-pointer" onClick={() => onNavigate('pre-entry')}>
          <div className="flex items-center justify-between text-xs font-semibold text-dairy-charcoal/70">
            <span>Hygiene & Cleanliness Compliance</span>
            <div className="rounded-lg bg-dairy-sage/20 p-2 text-dairy-olive">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-serif text-dairy-olive">92.4%</span>
            <span className="ml-2 text-xs font-semibold text-amber-600">2 Alerts</span>
          </div>
          <p className="mt-1 text-xs text-dairy-charcoal/60">
            Gate B mask denial + Tank 3 valve leak
          </p>
          <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-dairy-forest">
            <span>Audit Live CCTV & Biometrics</span>
            <ArrowUpRight className="h-3 w-3" />
          </div>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Department Power Breakdown */}
        <div className="dairy-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between pb-4 border-b border-dairy-beige">
            <div>
              <h3 className="font-serif font-bold text-lg text-dairy-olive">Department-Wise Energy Consumption</h3>
              <p className="text-xs text-dairy-charcoal/60">Daily electric draw (kWh) across processing and utilities</p>
            </div>
            <button
              onClick={() => onNavigate('energy')}
              className="text-xs font-semibold text-dairy-forest hover:text-dairy-olive"
            >
              Analyze &rarr;
            </button>
          </div>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentEnergyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#353A35' }} />
                <YAxis tick={{ fontSize: 11, fill: '#353A35' }} />
                <Tooltip
                  formatter={(val: number) => [`${val} kWh (₹${(val * 8.2).toLocaleString()})`, 'Energy Draw']}
                  contentStyle={{ backgroundColor: '#FAF8F2', borderRadius: '8px', border: '1px solid #E8E2D6' }}
                />
                <Bar dataKey="kwh" fill="#526B58" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: 3-Tier Waste Classification */}
        <div className="dairy-card p-5">
          <div className="pb-4 border-b border-dairy-beige">
            <h3 className="font-serif font-bold text-lg text-dairy-olive">3-Tier Waste Classification</h3>
            <p className="text-xs text-dairy-charcoal/60">AI categorized resource recovery distribution</p>
          </div>
          <div className="mt-4 h-52 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={wasteCategoryDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                >
                  {wasteCategoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: number) => [`${val}%`, 'Proportion']}
                  contentStyle={{ backgroundColor: '#FAF8F2', borderRadius: '8px', border: '1px solid #E8E2D6' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 space-y-1.5 text-xs">
            {wasteCategoryDistribution.map((c, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="text-dairy-charcoal/80 text-[11px]">{c.name}</span>
                </div>
                <span className="font-semibold text-dairy-olive">{c.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Production Loss Hotspot Map & Active Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hotspot Horizontal Chart */}
        <div className="dairy-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between pb-4 border-b border-dairy-beige">
            <div>
              <h3 className="font-serif font-bold text-lg text-dairy-olive">Loss Hotspot Distribution Map</h3>
              <p className="text-xs text-dairy-charcoal/60">Cumulative volume lost (Litres) by production stage</p>
            </div>
            <button
              onClick={() => onNavigate('hotspots')}
              className="text-xs font-semibold text-dairy-forest hover:text-dairy-olive"
            >
              Full Breakdown &rarr;
            </button>
          </div>
          <div className="mt-4 space-y-3">
            {hotspotData.map((h, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-dairy-charcoal">{h.stage}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-dairy-olive">{h.loss} L</span>
                    <span className="text-[11px] text-dairy-charcoal/60">
                      (₹{(h.loss * 45).toLocaleString()})
                    </span>
                  </div>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-dairy-beige/50">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(h.loss / 1250) * 100}%`,
                      backgroundColor: h.fill,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Problem Notice Board */}
        <div className="dairy-card p-5 space-y-3">
          <div className="pb-3 border-b border-dairy-beige">
            <h3 className="font-serif font-bold text-lg text-dairy-olive">Immediate Interventions</h3>
            <p className="text-xs text-dairy-charcoal/60">Flagged by Rupee Impact & Anomaly Engines</p>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="rounded-xl border border-dairy-terracotta/30 bg-dairy-terracotta/5 p-3 space-y-1">
              <div className="flex items-center justify-between font-semibold text-dairy-terracotta">
                <span className="flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Tank 3 Recurring Leak (5x)
                </span>
                <span className="text-[10px] bg-dairy-terracotta text-white rounded px-1.5 py-0.2">P1 Critical</span>
              </div>
              <p className="text-dairy-charcoal/70 text-[11px]">
                Valve near Tank 3 has leaked 5 times this month. Maintenance inspection recommended (₹18,400 impact).
              </p>
            </div>

            <div className="rounded-xl border border-dairy-amber/30 bg-dairy-amber/5 p-3 space-y-1">
              <div className="flex items-center justify-between font-semibold text-amber-700">
                <span>Line 2 Changeover Order</span>
                <span className="text-[10px] bg-amber-600 text-white rounded px-1.5 py-0.2">P2 Schedule</span>
              </div>
              <p className="text-dairy-charcoal/70 text-[11px]">
                Chocolate flavoured milk run before plain milk caused 130L rinse dump. Reorder production sequence.
              </p>
            </div>

            <div className="rounded-xl border border-dairy-sage/40 bg-dairy-sage/10 p-3 space-y-1">
              <div className="flex items-center justify-between font-semibold text-dairy-forest">
                <span>Rinse Recovery What-If</span>
                <span className="text-[10px] bg-dairy-forest text-white rounded px-1.5 py-0.2">Opportunity</span>
              </div>
              <p className="text-dairy-charcoal/70 text-[11px]">
                Recovering 70% of currently unrecovered rinse milk saves 3,150 L/month (₹1,41,750 net monthly benefit).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

