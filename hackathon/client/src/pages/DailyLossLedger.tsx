import React, { useState, useEffect } from 'react';
import {
  Scale,
  PlusCircle,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  FileSpreadsheet,
  ArrowRight,
} from 'lucide-react';

export const DailyLossLedger: React.FC = () => {
  const [ledgers, setLedgers] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form State
  const [shift, setShift] = useState('Shift A (Morning)');
  const [milkReceived, setMilkReceived] = useState(50000);
  const [fatPercent, setFatPercent] = useState(4.5);
  const [snfPercent, setSnfPercent] = useState(8.5);
  const [pouchMilk, setPouchMilk] = useState(31500);
  const [curdKg, setCurdKg] = useState(8000);
  const [gheeKg, setGheeKg] = useState(200);
  const [paneerKg, setPaneerKg] = useState(300);
  const [rinseRecovered, setRinseRecovered] = useState(320);
  const [milkSentDrain, setMilkSentDrain] = useState(120);
  const [spills, setSpills] = useState(30);

  const fetchLedgers = () => {
    fetch('/api/waste/ledger')
      .then(res => res.json())
      .then(data => setLedgers(data.ledgers || []))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchLedgers();
  }, []);

  // Live client-side conversion preview
  const curdEq = Math.round(curdKg * 1.05);
  const gheeEq = Math.round(gheeKg * 22.5);
  const paneerEq = Math.round(paneerKg * 8.0);
  const totalAccountedProductEq = pouchMilk + curdEq + gheeEq + paneerEq;
  const recordedLosses = milkSentDrain + spills;
  const previewUnexplained = Math.max(0, milkReceived - totalAccountedProductEq - rinseRecovered - recordedLosses);
  const previewLossPercent = Math.round((previewUnexplained / milkReceived) * 1000) / 10;
  const isThresholdExceeded = previewLossPercent > 1.5;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetch('/api/waste/ledger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shift,
        milkReceivedLiters: milkReceived,
        fatPercent,
        snfPercent,
        pouchMilkLiters: pouchMilk,
        curdKg,
        gheeKg,
        paneerKg,
        rinseRecovered,
        milkSentDrain,
        spills,
      }),
    })
      .then(res => res.json())
      .then(() => {
        fetchLedgers();
        setShowAddForm(false);
      });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-dairy-beige">
        <div>
          <h2 className="text-2xl font-serif font-bold text-dairy-olive">
            Daily Milk Loss Ledger & Mass Balance
          </h2>
          <p className="text-xs text-dairy-charcoal/70">
            Every litre accounted for: Finished Products • Recorded Recoveries • Drain/Spills • Unexplained Loss
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-dairy-olive px-4 py-2 text-xs font-semibold text-dairy-ivory transition hover:bg-dairy-forest shadow-sm"
        >
          <PlusCircle className="h-4 w-4 text-dairy-sage" />
          <span>{showAddForm ? 'Close Entry Form' : 'Log Shift Reconciliation'}</span>
        </button>
      </div>

      {/* Accounting Formula Banner (PRD Module 1) */}
      <div className="rounded-xl border border-dairy-sage/40 bg-dairy-cream/60 p-4 text-xs space-y-2">
        <div className="flex items-center gap-2 font-bold text-dairy-olive">
          <Scale className="h-4 w-4 text-dairy-forest" />
          <span>Mass Balance Equation (Strict Solid & Fluid Equivalence)</span>
        </div>
        <div className="font-mono bg-white p-2.5 rounded-lg border border-dairy-beige text-dairy-charcoal text-[11px] overflow-x-auto">
          <span className="text-dairy-terracotta font-bold">Unexplained Loss (L)</span> = Total Input Milk − (Pouch Milk + Curd×1.05 + Ghee×22.5 + Paneer×8.0) − Rinse Recovered − Recorded Drain/Spills
        </div>
        <p className="text-[11px] text-dairy-charcoal/70">
          Conversion factors account for milk solids, cream separation, and water-loss during paneer/curd coagulation.
        </p>
      </div>

      {/* Entry Modal / Form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="dairy-card p-6 space-y-5 border-2 border-dairy-sage/50">
          <h3 className="font-serif font-bold text-lg text-dairy-olive border-b border-dairy-beige pb-2">
            Record Shift Reconciliation & Product Balance
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="font-semibold text-dairy-charcoal">Operating Shift</label>
              <select
                value={shift}
                onChange={e => setShift(e.target.value)}
                className="mt-1 w-full rounded-lg border border-dairy-beige p-2 bg-white"
              >
                <option>Shift A (Morning 06:00 - 14:00)</option>
                <option>Shift B (Evening 14:00 - 22:00)</option>
                <option>Shift C (Night 22:00 - 06:00)</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-dairy-charcoal">Raw Milk Received (Litres)</label>
              <input
                type="number"
                value={milkReceived}
                onChange={e => setMilkReceived(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-dairy-beige p-2 bg-white font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-dairy-charcoal">Fat Percentage (%)</label>
              <input
                type="number"
                step="0.1"
                value={fatPercent}
                onChange={e => setFatPercent(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-dairy-beige p-2 bg-white font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-dairy-charcoal">SNF Percentage (%)</label>
              <input
                type="number"
                step="0.1"
                value={snfPercent}
                onChange={e => setSnfPercent(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-dairy-beige p-2 bg-white font-mono"
              />
            </div>
          </div>

          {/* Finished Product Accounting */}
          <div className="rounded-xl border border-dairy-beige bg-dairy-cream/30 p-4 space-y-3">
            <h4 className="font-semibold text-dairy-olive text-xs">Finished Product Yields (Converted to Milk-Equivalent)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="text-dairy-charcoal/80">Pouch Milk (L)</label>
                <input
                  type="number"
                  value={pouchMilk}
                  onChange={e => setPouchMilk(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-dairy-beige p-2 bg-white font-mono"
                />
              </div>

              <div>
                <label className="text-dairy-charcoal/80">Curd (kg) [Factor 1.05]</label>
                <input
                  type="number"
                  value={curdKg}
                  onChange={e => setCurdKg(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-dairy-beige p-2 bg-white font-mono"
                />
                <span className="text-[10px] text-dairy-charcoal/50">Eq: {curdEq} L</span>
              </div>

              <div>
                <label className="text-dairy-charcoal/80">Ghee (kg) [Factor 22.5]</label>
                <input
                  type="number"
                  value={gheeKg}
                  onChange={e => setGheeKg(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-dairy-beige p-2 bg-white font-mono"
                />
                <span className="text-[10px] text-dairy-charcoal/50">Eq: {gheeEq} L</span>
              </div>

              <div>
                <label className="text-dairy-charcoal/80">Paneer (kg) [Factor 8.0]</label>
                <input
                  type="number"
                  value={paneerKg}
                  onChange={e => setPaneerKg(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-dairy-beige p-2 bg-white font-mono"
                />
                <span className="text-[10px] text-dairy-charcoal/50">Eq: {paneerEq} L</span>
              </div>
            </div>
          </div>

          {/* Recovered & Recorded Losses */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="font-semibold text-dairy-charcoal">Rinse Milk Recovered (L)</label>
              <input
                type="number"
                value={rinseRecovered}
                onChange={e => setRinseRecovered(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-dairy-beige p-2 bg-white font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-dairy-charcoal">Milk Sent to Drain (L)</label>
              <input
                type="number"
                value={milkSentDrain}
                onChange={e => setMilkSentDrain(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-dairy-beige p-2 bg-white font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-dairy-charcoal">Recorded Floor Spills (L)</label>
              <input
                type="number"
                value={spills}
                onChange={e => setSpills(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-dairy-beige p-2 bg-white font-mono"
              />
            </div>
          </div>

          {/* Live Reconciliation Preview Bar */}
          <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs ${
            isThresholdExceeded ? 'bg-dairy-terracotta/10 border-dairy-terracotta/30' : 'bg-emerald-50 border-emerald-200'
          }`}>
            <div>
              <div className="font-bold text-sm">
                Unexplained Loss: <span className="font-mono">{previewUnexplained} Litres</span> ({previewLossPercent}%)
              </div>
              <p className="text-[11px] text-dairy-charcoal/70">
                Total Products: {totalAccountedProductEq} L eq • Recovered: {rinseRecovered} L • Drain & Spills: {recordedLosses} L
              </p>
            </div>

            <div className="flex items-center gap-3">
              {isThresholdExceeded ? (
                <span className="inline-flex items-center gap-1 font-bold text-dairy-terracotta text-xs">
                  <AlertTriangle className="h-4 w-4" />
                  Exceeds 1.5% Threshold!
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-bold text-emerald-700 text-xs">
                  <CheckCircle2 className="h-4 w-4" />
                  Within Normal Bounds
                </span>
              )}

              <button
                type="submit"
                className="rounded-lg bg-dairy-olive px-4 py-2 font-bold text-white hover:bg-dairy-forest transition"
              >
                Save & Reconcile
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Historical Ledgers Table */}
      <div className="dairy-card overflow-hidden">
        <div className="p-5 border-b border-dairy-beige flex items-center justify-between">
          <div>
            <h3 className="font-serif font-bold text-lg text-dairy-olive">Reconciliation Ledger History</h3>
            <p className="text-xs text-dairy-charcoal/60">Shift-wise balance audit, Fat & SNF degradation, and alert status</p>
          </div>
          <span className="text-xs font-semibold text-dairy-forest bg-dairy-sage/20 px-3 py-1 rounded-lg border border-dairy-sage/30">
            Baseline Threshold: 1.5%
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-dairy-cream/60 text-dairy-olive font-semibold border-b border-dairy-beige">
              <tr>
                <th className="py-3 px-4">Date & Shift</th>
                <th className="py-3 px-4">Intake (L)</th>
                <th className="py-3 px-4">Product Eq (L)</th>
                <th className="py-3 px-4">Recovered (L)</th>
                <th className="py-3 px-4">Drain/Spill (L)</th>
                <th className="py-3 px-4">Unexplained Loss</th>
                <th className="py-3 px-4">Fat / SNF Loss</th>
                <th className="py-3 px-4">Loss Value (₹)</th>
                <th className="py-3 px-4">Audit Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dairy-beige/60">
              {ledgers.map((l) => (
                <tr key={l.id} className={`hover:bg-dairy-cream/40 transition ${l.isThresholdExceeded ? 'bg-dairy-terracotta/5' : ''}`}>
                  <td className="py-3.5 px-4 font-semibold text-dairy-charcoal">
                    <div>{l.date}</div>
                    <span className="text-[10px] text-dairy-charcoal/50">{l.shift}</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-medium">{l.milkReceivedLiters?.toLocaleString()} L</td>
                  <td className="py-3.5 px-4 font-mono">{l.totalProductOutputLitersEq?.toLocaleString()} L</td>
                  <td className="py-3.5 px-4 font-mono text-emerald-700 font-semibold">{l.rinseMilkRecoveredLiters} L</td>
                  <td className="py-3.5 px-4 font-mono text-dairy-charcoal/60">{l.totalRecordedLossesLiters} L</td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold font-mono text-dairy-olive">
                      {l.unexplainedLossLiters} L
                    </div>
                    <span className={`text-[10px] font-semibold ${l.isThresholdExceeded ? 'text-dairy-terracotta' : 'text-emerald-700'}`}>
                      {l.lossPercent}% of intake
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px]">
                    <div>Fat: {l.fatLossKg} kg</div>
                    <div className="text-dairy-charcoal/60">SNF: {l.snfLossKg} kg</div>
                  </td>
                  <td className="py-3.5 px-4 font-bold font-mono text-dairy-olive">
                    ₹{l.financialLossInr?.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4">
                    {l.isThresholdExceeded ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-dairy-terracotta/10 px-2 py-0.5 font-bold text-[11px] text-dairy-terracotta border border-dairy-terracotta/20">
                        <AlertTriangle className="h-3 w-3" />
                        Investigation Alert
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 font-medium text-[11px] text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="h-3 w-3" />
                        Normal
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

