import React, { useState, useEffect } from 'react';
import {
  Zap,
  Sliders,
  Sun,
  Wind,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Sparkles,
  Info,
} from 'lucide-react';

export const EnergyManagement: React.FC = () => {
  const [machines, setMachines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Simulation Sliders
  const [reduceHours, setReduceHours] = useState(2);
  const [idleShutdown, setIdleShutdown] = useState(true);
  const [extraRenewable, setExtraRenewable] = useState(20);
  const [simResults, setSimResults] = useState<any>(null);

  useEffect(() => {
    fetch('/api/energy/machines')
      .then(res => res.json())
      .then(data => {
        setMachines(data.machines || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch('/api/energy/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reduceHours,
        idleShutdown,
        extraRenewablePercent: extraRenewable,
      }),
    })
      .then(res => res.json())
      .then(data => setSimResults(data))
      .catch(err => console.error(err));
  }, [reduceHours, idleShutdown, extraRenewable]);

  const totalKwh = machines.reduce((acc, m) => acc + m.actualKwh, 0);
  const totalCost = totalKwh * 8.2;
  const anomalies = machines.filter(m => m.isAnomaly);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-dairy-beige">
        <div>
          <h2 className="text-2xl font-serif font-bold text-dairy-olive">
            Energy Tracking & Anomaly Optimization
          </h2>
          <p className="text-xs text-dairy-charcoal/70">
            Software-only mathematical modeling • Historical anomaly detection • Tariff rate: ₹8.20/kWh
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-dairy-sage/40 bg-dairy-sage/10 px-3 py-1 text-xs font-semibold text-dairy-forest">
            ⚡ 3,824 kWh Daily Draw
          </span>
          <span className="rounded-full border border-dairy-terracotta/30 bg-dairy-terracotta/10 px-3 py-1 text-xs font-semibold text-dairy-terracotta">
            ⚠️ {anomalies.length} High Consumption Alerts
          </span>
        </div>
      </div>

      {/* Renewable Energy Panel (PRD Module 5) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="dairy-card p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-dairy-charcoal/70">
            <span>Solar Generation</span>
            <Sun className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold font-serif text-dairy-olive">1,250 kWh</div>
          <p className="text-[11px] text-dairy-charcoal/60">250 kW Rooftop Array (Est.)</p>
        </div>

        <div className="dairy-card p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-dairy-charcoal/70">
            <span>Wind Micro-Turbine</span>
            <Wind className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold font-serif text-dairy-olive">480 kWh</div>
          <p className="text-[11px] text-dairy-charcoal/60">Peripheral Valley Flow (Simulated)</p>
        </div>

        <div className="dairy-card p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-dairy-charcoal/70">
            <span>Renewable Mix</span>
            <Sparkles className="h-4 w-4 text-dairy-forest" />
          </div>
          <div className="text-xl font-bold font-serif text-emerald-700">38.2%</div>
          <p className="text-[11px] text-dairy-charcoal/60">Grid Dependency: 61.8% (2,094 kWh)</p>
        </div>

        <div className="dairy-card p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-dairy-charcoal/70">
            <span>Daily Carbon Offset</span>
            <span className="text-xs font-bold text-emerald-700">CO₂</span>
          </div>
          <div className="text-xl font-bold font-serif text-emerald-800">1,418 kg</div>
          <p className="text-[11px] text-dairy-charcoal/60">Equivalent to planting 64 trees</p>
        </div>
      </div>

      {/* Machine-Wise Energy Tracking & Anomaly Table (PRD Module 1 & 3) */}
      <div className="dairy-card overflow-hidden">
        <div className="p-5 border-b border-dairy-beige flex items-center justify-between">
          <div>
            <h3 className="font-serif font-bold text-lg text-dairy-olive">Machine-Wise Consumption & Anomaly Detection</h3>
            <p className="text-xs text-dairy-charcoal/60">Energy (kWh) = Rated Power (kW) × Operating Hours vs Historical Baselines</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-dairy-charcoal/60 bg-dairy-cream px-3 py-1 rounded-lg border border-dairy-beige">
            <Info className="h-3.5 w-3.5 text-dairy-forest" />
            <span>Detection occurs upon manual or upload logging</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-dairy-cream/60 text-dairy-olive font-semibold border-b border-dairy-beige">
              <tr>
                <th className="py-3 px-4">Machine ID & Name</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Rated (kW)</th>
                <th className="py-3 px-4">Hours (Act/Norm)</th>
                <th className="py-3 px-4">Actual kWh</th>
                <th className="py-3 px-4">Baseline kWh</th>
                <th className="py-3 px-4">Anomaly Status</th>
                <th className="py-3 px-4">Engineering Recommendation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dairy-beige/60">
              {machines.map((m) => (
                <tr key={m.id} className={`hover:bg-dairy-cream/40 transition ${m.isAnomaly ? 'bg-dairy-terracotta/5' : ''}`}>
                  <td className="py-3.5 px-4 font-semibold text-dairy-charcoal">
                    <div>{m.name}</div>
                    <span className="text-[10px] text-dairy-charcoal/50 font-mono">{m.id}</span>
                  </td>
                  <td className="py-3.5 px-4 text-dairy-charcoal/80">{m.department}</td>
                  <td className="py-3.5 px-4 font-mono">{m.ratedPowerKw} kW</td>
                  <td className="py-3.5 px-4 font-mono">
                    <span className="font-bold text-dairy-olive">{m.actualHours}h</span>
                    <span className="text-dairy-charcoal/50"> / {m.normalHoursPerDay}h</span>
                  </td>
                  <td className="py-3.5 px-4 font-bold font-mono text-dairy-olive">{m.actualKwh} kWh</td>
                  <td className="py-3.5 px-4 font-mono text-dairy-charcoal/60">{m.historicalAvgKwh} kWh</td>
                  <td className="py-3.5 px-4">
                    {m.isAnomaly ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-dairy-terracotta/10 px-2 py-0.5 font-bold text-[11px] text-dairy-terracotta border border-dairy-terracotta/20">
                        <AlertTriangle className="h-3 w-3" />
                        +{m.anomalyPercent}% Surge
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 font-medium text-[11px] text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="h-3 w-3" />
                        Optimal
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 max-w-xs">
                    {m.isAnomaly ? (
                      <div className="space-y-0.5">
                        <p className="text-dairy-terracotta font-medium text-[11px]">{m.anomalyReason}</p>
                        <p className="text-dairy-forest font-semibold text-[10px]">{m.recommendation}</p>
                        <span className="text-[10px] text-emerald-800 font-bold">
                          Est. Saving: {m.potentialSavingsKwh} kWh (₹{m.potentialSavingsInr}/day)
                        </span>
                      </div>
                    ) : (
                      <span className="text-dairy-charcoal/60 text-[11px]">{m.recommendation}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Software-Based What-If Interactive Simulator (PRD Module 7) */}
      <div className="dairy-card p-6 border border-dairy-sage/40 bg-gradient-to-br from-white via-dairy-cream/30 to-dairy-ivory space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-dairy-beige">
          <div>
            <div className="flex items-center gap-2">
              <Sliders className="h-5 w-5 text-dairy-forest" />
              <h3 className="font-serif font-bold text-xl text-dairy-olive">
                Interactive What-If Energy Strategy Simulator
              </h3>
            </div>
            <p className="text-xs text-dairy-charcoal/70 mt-1">
              Test energy reduction policies mathematically without affecting live production equipment.
            </p>
          </div>
          <span className="rounded-full bg-dairy-sage/20 px-3 py-1 text-xs font-semibold text-dairy-forest border border-dairy-sage/30">
            Software Analytical Model
          </span>
        </div>

        {/* Sliders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-dairy-charcoal">Reduce Anomaly Operating Hours:</span>
              <span className="text-dairy-forest font-bold">{reduceHours} Hours</span>
            </div>
            <input
              type="range"
              min="0"
              max="4"
              step="1"
              value={reduceHours}
              onChange={(e) => setReduceHours(Number(e.target.value))}
              className="w-full accent-dairy-forest cursor-pointer"
            />
            <p className="text-[11px] text-dairy-charcoal/60">Trims non-essential idle overrun on Chiller & Homogenizer</p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-dairy-charcoal">Idle Machine Shut-off Rule:</span>
              <span className="text-dairy-forest font-bold">{idleShutdown ? 'Enabled' : 'Disabled'}</span>
            </div>
            <button
              onClick={() => setIdleShutdown(!idleShutdown)}
              className={`w-full py-2 px-3 rounded-lg text-xs font-semibold border transition ${
                idleShutdown
                  ? 'bg-dairy-forest text-white border-dairy-forest'
                  : 'bg-white text-dairy-charcoal border-dairy-beige'
              }`}
            >
              {idleShutdown ? '✓ Active Inter-shift Shutdown' : 'Manual Off'}
            </button>
            <p className="text-[11px] text-dairy-charcoal/60">Shuts down thermal pumps during buffer lull periods</p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-dairy-charcoal">Increase Solar/Wind Array:</span>
              <span className="text-dairy-forest font-bold">+{extraRenewable}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="5"
              value={extraRenewable}
              onChange={(e) => setExtraRenewable(Number(e.target.value))}
              className="w-full accent-dairy-forest cursor-pointer"
            />
            <p className="text-[11px] text-dairy-charcoal/60">Models rooftop solar expansion on Warehouse 2</p>
          </div>
        </div>

        {/* Simulation Output Cards */}
        {simResults && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-dairy-beige">
            <div className="rounded-xl border border-dairy-sage/40 bg-white p-4">
              <div className="text-xs text-dairy-charcoal/70 flex items-center gap-1.5">
                <TrendingDown className="h-4 w-4 text-emerald-600" />
                <span>Daily Electricity Saved</span>
              </div>
              <div className="mt-2 text-2xl font-bold font-serif text-emerald-800">
                {simResults.kwhSaved} kWh/day
              </div>
              <p className="text-[11px] text-dairy-charcoal/60 mt-0.5">
                From {simResults.baselineKwh} down to {simResults.simulatedKwh} kWh
              </p>
            </div>

            <div className="rounded-xl border border-dairy-sage/40 bg-white p-4">
              <div className="text-xs text-dairy-charcoal/70">Daily Financial Savings</div>
              <div className="mt-2 text-2xl font-bold font-serif text-dairy-olive">
                ₹{simResults.financialSavingsInr?.toLocaleString()}
              </div>
              <p className="text-[11px] text-dairy-charcoal/60 mt-0.5">Based on ₹8.20/kWh industrial tariff</p>
            </div>

            <div className="rounded-xl border border-dairy-forest bg-dairy-forest/10 p-4">
              <div className="text-xs font-semibold text-dairy-forest">Projected Annual Savings</div>
              <div className="mt-2 text-2xl font-bold font-serif text-dairy-forest">
                ₹{simResults.annualProjectedSavingsInr?.toLocaleString()}
              </div>
              <p className="text-[11px] text-dairy-charcoal/60 mt-0.5">300 operating days per fiscal year</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

