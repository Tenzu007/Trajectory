import React, { useState, useEffect } from 'react';
import {
  Box,
  Droplets,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  ShieldAlert,
} from 'lucide-react';

export const PackagingAndResourceTracking: React.FC = () => {
  const [packaging, setPackaging] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/resources/packaging')
      .then(res => res.json())
      .then(data => setPackaging(data.packaging || []));

    fetch('/api/resources/consumption')
      .then(res => res.json())
      .then(data => setResources(data.resources || []));
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-dairy-beige">
        <h2 className="text-2xl font-serif font-bold text-dairy-olive">
          Packaging Yield, Water & Chemical Tracking
        </h2>
        <p className="text-xs text-dairy-charcoal/70">
          Film reconciliation & pouch efficiency • Specific water footprint (L/L) • CIP chemical dosing compliance
        </p>
      </div>

      {/* Safety Notice regarding cleaning chemicals */}
      <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs flex items-start gap-3">
        <ShieldAlert className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-amber-900">Food Safety & Hygiene Primacy Directive</span>
          <p className="text-amber-800/90 text-[11px] leading-relaxed">
            Never reduce chemical concentrations below validated FSSAI/CIP sanitation norms (1.5-2.0% Lye / 0.8-1.2% Nitric Acid) for cost saving. Excessive consumption must be resolved by repairing leaky dosing pumps and optimizing pre-rinse times, NOT under-dosing.
          </p>
        </div>
      </div>

      {/* Packaging Yield Tracker (PRD Module 2: Section 8) */}
      <div className="dairy-card overflow-hidden">
        <div className="p-5 border-b border-dairy-beige flex items-center justify-between">
          <div>
            <h3 className="font-serif font-bold text-lg text-dairy-olive">Packaging Material Yield & Scrap Reconciliation</h3>
            <p className="text-xs text-dairy-charcoal/60">Actual Pouch Yield = Pouches Produced ÷ Net Film Consumed (kg)</p>
          </div>
          <span className="text-xs font-semibold text-dairy-terracotta bg-dairy-terracotta/10 px-3 py-1 rounded-lg border border-dairy-terracotta/20">
            ⚠️ Machine 4 Efficiency Dip Flagged
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-dairy-cream/60 text-dairy-olive font-semibold border-b border-dairy-beige">
              <tr>
                <th className="py-3 px-4">Machine & Shift</th>
                <th className="py-3 px-4">Pouch SKU</th>
                <th className="py-3 px-4">Film Issued / Net Used</th>
                <th className="py-3 px-4">Film Scrap</th>
                <th className="py-3 px-4">Pouches Produced</th>
                <th className="py-3 px-4">Leaking / Rejected</th>
                <th className="py-3 px-4">Yield (Act / Exp)</th>
                <th className="py-3 px-4">Efficiency Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dairy-beige/60">
              {packaging.map((p) => (
                <tr key={p.id} className={`hover:bg-dairy-cream/40 transition ${p.isAbnormal ? 'bg-dairy-terracotta/5' : ''}`}>
                  <td className="py-3.5 px-4 font-semibold text-dairy-charcoal">
                    <div>{p.machine}</div>
                    <span className="text-[10px] text-dairy-charcoal/50">{p.shift} • {p.date}</span>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-dairy-olive">{p.pouchType}</td>
                  <td className="py-3.5 px-4 font-mono">
                    <span className="font-bold text-dairy-charcoal">{p.filmUsedKg} kg used</span>
                    <div className="text-[10px] text-dairy-charcoal/50">{p.filmIssuedKg} kg issued / {p.filmReturnedKg} kg ret</div>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-dairy-terracotta">{p.filmScrapKg} kg</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-dairy-olive">
                    {p.pouchesProduced?.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 font-mono">
                    <span className={`font-bold ${p.leakingOrRejectedPouches > 100 ? 'text-dairy-terracotta' : 'text-dairy-charcoal'}`}>
                      {p.leakingOrRejectedPouches} pouches
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono">
                    <span className="font-bold text-dairy-olive">{p.actualYieldPouchesPerKg}</span>
                    <span className="text-dairy-charcoal/50"> / {p.expectedYieldPouchesPerKg} p/kg</span>
                  </td>
                  <td className="py-3.5 px-4">
                    {p.isAbnormal ? (
                      <div className="space-y-0.5">
                        <span className="inline-flex items-center gap-1 rounded bg-dairy-terracotta/10 px-2 py-0.5 font-bold text-[10px] text-dairy-terracotta border border-dairy-terracotta/20">
                          <AlertTriangle className="h-3 w-3" /> {p.efficiencyPercent}% Efficiency
                        </span>
                        <p className="text-[10px] text-dairy-terracotta">Heat seal jaw alignment required</p>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 font-medium text-[10px] text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="h-3 w-3" /> {p.efficiencyPercent}% (Optimal)
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Water & Chemical Consumption Tracker (PRD Module 2: Section 9) */}
      <div className="dairy-card p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-dairy-beige">
          <div>
            <h3 className="font-serif font-bold text-lg text-dairy-olive">CIP Chemical & Water Consumption Audit</h3>
            <p className="text-xs text-dairy-charcoal/60">Monitored specific consumption ratios per litre of milk intake</p>
          </div>
          <span className="text-xs font-semibold text-dairy-forest bg-dairy-sage/20 px-3 py-1 rounded-lg border border-dairy-sage/30">
            Water Target: 1.40 - 1.50 L/L Milk
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-dairy-beige bg-dairy-cream/30 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-dairy-charcoal/70">
              <span>Specific Water Footprint</span>
              <Droplets className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold font-serif text-dairy-terracotta">1.70 L / L</div>
            <p className="text-[11px] text-dairy-charcoal/70">
              +17% over normal baseline (1.45 L/L). Indicates excessive manual hose washing in Bay 2.
            </p>
          </div>

          <div className="rounded-xl border border-dairy-beige bg-dairy-cream/30 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-dairy-charcoal/70">
              <span>Caustic Soda (Lye NaOH)</span>
              <span className="text-xs font-mono font-bold text-amber-700">125 kg</span>
            </div>
            <div className="text-2xl font-bold font-serif text-dairy-olive">0.0026 kg/L</div>
            <p className="text-[11px] text-dairy-charcoal/70">
              CIP Loop 1 hot wash tank concentration verified at 1.8% w/w.
            </p>
          </div>

          <div className="rounded-xl border border-dairy-beige bg-dairy-cream/30 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-dairy-charcoal/70">
              <span>Nitric Acid (HNO₃)</span>
              <span className="text-xs font-mono font-bold text-amber-700">45 kg</span>
            </div>
            <div className="text-2xl font-bold font-serif text-dairy-olive">0.0009 kg/L</div>
            <p className="text-[11px] text-dairy-charcoal/70">
              Milkstone dissolution acid wash cycle conforming to sanitation recipe.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

