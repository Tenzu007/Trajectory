import React, { useState, useEffect } from 'react';
import {
  IndianRupee,
  TrendingDown,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sliders,
  DollarSign,
} from 'lucide-react';

export const RupeeImpactEngine: React.FC = () => {
  const [summary, setSummary] = useState<any>(null);
  const [rinseTarget, setRinseTarget] = useState(70);
  const [changeoverTarget, setChangeoverTarget] = useState(50);
  const [leakTarget, setLeakTarget] = useState(80);
  const [whatIfResult, setWhatIfResult] = useState<any>(null);

  useEffect(() => {
    fetch('/api/financial/summary')
      .then(res => res.json())
      .then(data => setSummary(data));
  }, []);

  useEffect(() => {
    fetch('/api/financial/what-if', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rinseRecoveryTargetPercent: rinseTarget,
        changeoverImprovementPercent: changeoverTarget,
        leakReductionPercent: leakTarget,
      }),
    })
      .then(res => res.json())
      .then(data => setWhatIfResult(data));
  }, [rinseTarget, changeoverTarget, leakTarget]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-dairy-beige">
        <h2 className="text-2xl font-serif font-bold text-dairy-olive">
          Rupee Impact Engine & Financial Loss Analysis
        </h2>
        <p className="text-xs text-dairy-charcoal/70">
          Translating every lost drop, film scrap, and excess kWh into financial metrics • Prioritizing high-ROI actions
        </p>
      </div>

      {/* Financial Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="dairy-card p-5 space-y-1">
            <span className="text-xs font-semibold text-dairy-charcoal/70">Milk Mass Loss Cost</span>
            <div className="text-2xl font-bold font-serif text-dairy-terracotta">
              ₹{summary.milkLossCostInr?.toLocaleString()}
            </div>
            <p className="text-[11px] text-dairy-charcoal/60">Unexplained + drain reconciliation</p>
          </div>

          <div className="dairy-card p-5 space-y-1">
            <span className="text-xs font-semibold text-dairy-charcoal/70">Hardware Leak Impact</span>
            <div className="text-2xl font-bold font-serif text-dairy-terracotta">
              ₹{summary.leakCostInr?.toLocaleString()}
            </div>
            <p className="text-[11px] text-dairy-charcoal/60">Tank 3 + pump seal seepage</p>
          </div>

          <div className="dairy-card p-5 space-y-1">
            <span className="text-xs font-semibold text-dairy-charcoal/70">Packaging & Resource Waste</span>
            <div className="text-2xl font-bold font-serif text-amber-700">
              ₹{(summary.packagingWastageInr + summary.chemicalExcessInr + summary.waterExcessInr)?.toLocaleString()}
            </div>
            <p className="text-[11px] text-dairy-charcoal/60">Scrap film, caustic lye, excess water</p>
          </div>

          <div className="dairy-card p-5 space-y-1 bg-dairy-cream/60 border-dairy-forest/30">
            <span className="text-xs font-bold text-dairy-olive">Total Monthly Loss Footprint</span>
            <div className="text-2xl font-bold font-serif text-dairy-olive">
              ₹{summary.grandTotalLossInr?.toLocaleString()}
            </div>
            <p className="text-[11px] text-dairy-forest font-semibold">Strict zero-double-counting audit</p>
          </div>
        </div>
      )}

      {/* Ranked Recommendations (PRD Module 3: Section 11) */}
      <div className="dairy-card overflow-hidden">
        <div className="p-5 border-b border-dairy-beige flex items-center justify-between">
          <div>
            <h3 className="font-serif font-bold text-lg text-dairy-olive">Ranked Corrective Actions</h3>
            <p className="text-xs text-dairy-charcoal/60">Ranked by potential monthly savings, implementation speed, and confidence level</p>
          </div>
          <span className="text-xs font-semibold text-dairy-forest bg-dairy-sage/20 px-3 py-1 rounded-lg border border-dairy-sage/30">
            ROI Prioritized List
          </span>
        </div>

        <div className="divide-y divide-dairy-beige/60">
          {summary?.rankedRecommendations?.map((rec: any, idx: number) => (
            <div key={rec.id} className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-dairy-cream/30 transition">
              <div className="flex items-start gap-3 max-w-xl">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-dairy-olive text-xs font-bold text-white">
                  {idx + 1}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-dairy-charcoal">{rec.action}</span>
                    <span className="text-[10px] rounded bg-dairy-forest/10 px-1.5 py-0.2 font-bold text-dairy-forest">
                      {rec.priority}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-dairy-charcoal/60">
                    <span>Effort: <strong className="text-dairy-charcoal">{rec.effort}</strong></span>
                    <span>•</span>
                    <span>Confidence: <strong className="text-dairy-charcoal">{rec.confidence}</strong></span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-right">
                <div>
                  <div className="text-sm font-bold text-emerald-800">
                    +₹{rec.monthlySavingsInr?.toLocaleString()} /mo
                  </div>
                  <div className="text-[10px] text-dairy-charcoal/50">
                    (₹{rec.annualSavingsInr?.toLocaleString()} /yr)
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="h-3.5 w-3.5" /> High Feasibility
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive What-If Financial Simulator (PRD Module 3) */}
      <div className="dairy-card p-6 border-2 border-dairy-forest/40 bg-gradient-to-br from-white via-dairy-cream/40 to-dairy-ivory space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-dairy-beige">
          <div>
            <div className="flex items-center gap-2">
              <Sliders className="h-5 w-5 text-dairy-forest" />
              <h3 className="font-serif font-bold text-xl text-dairy-olive">
                What-If Resource Recovery Simulator
              </h3>
            </div>
            <p className="text-xs text-dairy-charcoal/70 mt-1">
              "What if we recover 70% of currently unrecovered rinse milk?" Dynamically model financial projections.
            </p>
          </div>
          <span className="text-[11px] font-semibold text-dairy-forest bg-dairy-cream px-3 py-1 rounded-lg border border-dairy-beige">
            Mathematical Projection (Non-speculative)
          </span>
        </div>

        {/* Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-dairy-charcoal">Pre-Rinse Milk Recovery Target:</span>
              <span className="text-emerald-800 font-bold">{rinseTarget}%</span>
            </div>
            <input
              type="range"
              min="20"
              max="90"
              step="5"
              value={rinseTarget}
              onChange={(e) => setRinseTarget(Number(e.target.value))}
              className="w-full accent-dairy-forest cursor-pointer"
            />
            <p className="text-[11px] text-dairy-charcoal/60">
              Recoverable: 4,500 L unrecovered/mo across pasteurizer loops
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-dairy-charcoal">Changeover Rule Adherence:</span>
              <span className="text-emerald-800 font-bold">{changeoverTarget}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="10"
              value={changeoverTarget}
              onChange={(e) => setChangeoverTarget(Number(e.target.value))}
              className="w-full accent-dairy-forest cursor-pointer"
            />
            <p className="text-[11px] text-dairy-charcoal/60">
              Enforcing plain milk before flavoured milk sequence
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-dairy-charcoal">Mechanical Leak Elimination:</span>
              <span className="text-emerald-800 font-bold">{leakTarget}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="10"
              value={leakTarget}
              onChange={(e) => setLeakTarget(Number(e.target.value))}
              className="w-full accent-dairy-forest cursor-pointer"
            />
            <p className="text-[11px] text-dairy-charcoal/60">
              Overhauling Tank 3 valve and pump gaskets
            </p>
          </div>
        </div>

        {/* What-If Live Output Banner */}
        {whatIfResult && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-dairy-beige">
            <div className="rounded-xl border border-dairy-sage/40 bg-white p-4">
              <div className="text-xs text-dairy-charcoal/70">Total Milk Saved Monthly</div>
              <div className="mt-2 text-2xl font-bold font-serif text-emerald-800">
                {whatIfResult.totalLitersSavedMonthly?.toLocaleString()} Litres
              </div>
              <p className="text-[11px] text-dairy-charcoal/60 mt-0.5">
                Rinse: +{whatIfResult.additionalRinseRecoveredLiters}L • Changeover: +{whatIfResult.changeoverSavedLiters}L
              </p>
            </div>

            <div className="rounded-xl border border-dairy-forest bg-dairy-forest/10 p-4">
              <div className="text-xs font-semibold text-dairy-forest">Monthly Bottom-Line Impact</div>
              <div className="mt-2 text-2xl font-bold font-serif text-dairy-forest">
                ₹{whatIfResult.monthlySavingsInr?.toLocaleString()} /month
              </div>
              <p className="text-[11px] text-dairy-forest/80 mt-0.5">Calculated at standard procurement price (₹45/L)</p>
            </div>

            <div className="rounded-xl border border-dairy-olive bg-dairy-olive text-dairy-ivory p-4">
              <div className="text-xs font-semibold text-dairy-sage">Projected Annual EBITDA Gain</div>
              <div className="mt-2 text-2xl font-bold font-serif text-white">
                ₹{whatIfResult.annualSavingsInr?.toLocaleString()} /year
              </div>
              <p className="text-[11px] text-dairy-ivory/70 mt-0.5">Recurring operating profit recovery</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

