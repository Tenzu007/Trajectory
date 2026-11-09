import React from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  ShieldCheck,
  Building,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

export const ReportsAndAnalytics: React.FC = () => {
  const handleDownloadCsv = () => {
    const csvContent = `data:text/csv;charset=utf-8,`
      + `Apex Dairy Cooperative - Monthly Operations Audit Report\n`
      + `Report Period,November 2026\n`
      + `Metric,Value,Unit,Benchmark Status\n`
      + `Raw Milk Intake,50000,Litres,Normal\n`
      + `Accounted Finished Products,46600,Litres Eq,Mass Balanced\n`
      + `Pre-Rinse Recovered Milk,280,Litres,70% Recovery\n`
      + `Recorded Drain & Spills,620,Litres,Spill logged\n`
      + `Unexplained Loss,1000,Litres,2.06% (Alert Exceeded)\n`
      + `Estimated Financial Loss,45000,INR,Action Priority 1\n`
      + `Total Power Consumed,3824,kWh,12% Surge\n`
      + `Renewable Contribution,38.2,Percent,Optimal\n`
      + `Specific Water Footprint,1.70,L/L Milk,High\n`
      + `Hygiene Compliance Rate,92.4,Percent,FSSAI Approved\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Apex_Dairy_Monthly_Audit_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-dairy-beige">
        <div>
          <h2 className="text-2xl font-serif font-bold text-dairy-olive">
            Plant Telemetry & Executive Audit Reports
          </h2>
          <p className="text-xs text-dairy-charcoal/70">
            Comprehensive multi-pillar reconciliation records for faculty, regulatory auditors, and plant directors
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleDownloadCsv}
            className="flex items-center gap-1.5 rounded-xl border border-dairy-beige bg-dairy-cream px-4 py-2 text-xs font-semibold text-dairy-olive hover:bg-dairy-beige transition shadow-sm"
          >
            <Download className="h-4 w-4 text-dairy-forest" />
            <span>Export CSV Audit</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-xl bg-dairy-olive px-4 py-2 text-xs font-bold text-white hover:bg-dairy-forest transition shadow-sm"
          >
            <Printer className="h-4 w-4" />
            <span>Print Official A4 Report</span>
          </button>
        </div>
      </div>

      {/* Official Audit Document Sheet (Styled for Screen & Print) */}
      <div className="dairy-card p-8 bg-white border border-dairy-beige shadow-sm space-y-6">
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b-2 border-dairy-olive">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-widest text-dairy-forest">
              Official Industrial Verification Audit
            </span>
            <h3 className="text-2xl font-serif font-bold text-dairy-olive">
              Apex Dairy Cooperative • Plant #4
            </h3>
            <p className="text-xs text-dairy-charcoal/70">
              Energy Consumption, Milk Mass Loss & AI Hygiene Compliance Ledger
            </p>
          </div>

          <div className="text-right text-xs space-y-1 font-mono text-dairy-charcoal/70">
            <div>Audit Ref: <strong className="text-dairy-olive">AUDIT-2026-NOV-004</strong></div>
            <div>Date: <strong>2026-11-05 18:00 IST</strong></div>
            <div className="inline-flex items-center gap-1 text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <ShieldCheck className="h-3 w-3" /> Certified Compliant
            </div>
          </div>
        </div>

        {/* Section 1: Executive KPI Matrix */}
        <div className="space-y-3">
          <h4 className="font-serif font-bold text-base text-dairy-olive">
            1. Core Operational Telemetry Summary
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="rounded-xl border border-dairy-beige bg-dairy-cream/30 p-3.5 space-y-1">
              <span className="text-dairy-charcoal/60">Milk Intake vs Accounted</span>
              <div className="font-bold font-mono text-base text-dairy-olive">50,000 L / 46,600 L</div>
              <span className="text-[10px] text-dairy-charcoal/50">Mass balanced yield</span>
            </div>

            <div className="rounded-xl border border-dairy-beige bg-dairy-cream/30 p-3.5 space-y-1">
              <span className="text-dairy-charcoal/60">Unexplained Loss</span>
              <div className="font-bold font-mono text-base text-dairy-terracotta">1,000 L (2.06%)</div>
              <span className="text-[10px] text-dairy-terracotta font-semibold">Over 1.5% limit</span>
            </div>

            <div className="rounded-xl border border-dairy-beige bg-dairy-cream/30 p-3.5 space-y-1">
              <span className="text-dairy-charcoal/60">Electricity Draw</span>
              <div className="font-bold font-mono text-base text-dairy-olive">3,824 kWh</div>
              <span className="text-[10px] text-emerald-700 font-semibold">38.2% Green Solar/Wind</span>
            </div>

            <div className="rounded-xl border border-dairy-beige bg-dairy-cream/30 p-3.5 space-y-1">
              <span className="text-dairy-charcoal/60">Hygiene Compliance</span>
              <div className="font-bold font-mono text-base text-emerald-800">92.4%</div>
              <span className="text-[10px] text-emerald-700 font-semibold">Grade A- Verified</span>
            </div>
          </div>
        </div>

        {/* Section 2: Detailed Financial Waste Reconciliation Table */}
        <div className="space-y-3">
          <h4 className="font-serif font-bold text-base text-dairy-olive">
            2. Financial Loss & Waste Footprint Breakdown
          </h4>
          <table className="w-full text-left text-xs border border-dairy-beige rounded-xl overflow-hidden">
            <thead className="bg-dairy-cream/80 text-dairy-olive font-semibold border-b border-dairy-beige">
              <tr>
                <th className="py-2.5 px-4">Waste / Loss Category</th>
                <th className="py-2.5 px-4">Physical Quantity</th>
                <th className="py-2.5 px-4">Monetary Value (₹)</th>
                <th className="py-2.5 px-4">Regulatory / Quality Status</th>
                <th className="py-2.5 px-4">Corrective Action Taken</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dairy-beige/60">
              <tr>
                <td className="py-3 px-4 font-semibold text-dairy-charcoal">Unexplained Shift B Milk Loss</td>
                <td className="py-3 px-4 font-mono font-bold">1,000 Litres</td>
                <td className="py-3 px-4 font-mono font-bold text-dairy-terracotta">₹45,000</td>
                <td className="py-3 px-4 text-dairy-terracotta font-medium">Exceeds Normal Threshold</td>
                <td className="py-3 px-4 text-dairy-charcoal/70">Reconciliation audit underway</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-dairy-charcoal">Tank 3 Recurring Valve Seepage</td>
                <td className="py-3 px-4 font-mono font-bold">400 Litres (5x)</td>
                <td className="py-3 px-4 font-mono font-bold text-dairy-terracotta">₹18,400</td>
                <td className="py-3 px-4 text-amber-700 font-medium">Mechanical Fatigue</td>
                <td className="py-3 px-4 text-dairy-charcoal/70">Replacement stem seal fitted</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-dairy-charcoal">Line 2 Changeover Flush Dump</td>
                <td className="py-3 px-4 font-mono font-bold">180 Litres</td>
                <td className="py-3 px-4 font-mono font-bold text-dairy-olive">₹5,850</td>
                <td className="py-3 px-4 text-dairy-charcoal/70">Schedule Sequence Drift</td>
                <td className="py-3 px-4 text-dairy-charcoal/70">Plain milk prioritized first</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-dairy-charcoal">Pouch Machine 4 Scrapped Film</td>
                <td className="py-3 px-4 font-mono font-bold">5 kg film / 450 leaks</td>
                <td className="py-3 px-4 font-mono font-bold text-dairy-olive">₹18,400</td>
                <td className="py-3 px-4 text-amber-700 font-medium">Heat Seal Misalignment</td>
                <td className="py-3 px-4 text-dairy-charcoal/70">Jaw temperature recalibrated</td>
              </tr>
              <tr className="bg-dairy-cream/30 font-bold">
                <td className="py-3 px-4 text-dairy-olive">Net Recoverable Circular Value (Whey & Sludge)</td>
                <td className="py-3 px-4 font-mono text-emerald-800">4,700 kg/L</td>
                <td className="py-3 px-4 font-mono text-emerald-800">+₹19,450 (Revenue)</td>
                <td className="py-3 px-4 text-emerald-800">QC Verified & QR Passports</td>
                <td className="py-3 px-4 text-dairy-charcoal/70">Dispatched to BakeCraft & GreenBio</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 3: Official Sign-off Blocks */}
        <div className="pt-6 border-t border-dairy-beige space-y-4">
          <h4 className="font-serif font-bold text-sm text-dairy-olive">3. Authorized Personnel Sign-Off</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
            <div className="rounded-xl border border-dairy-beige p-4 space-y-3">
              <span className="text-[10px] text-dairy-charcoal/50 uppercase font-bold">Operations Lead</span>
              <div className="h-10 border-b border-dashed border-dairy-charcoal/30 flex items-end pb-1 font-serif italic text-dairy-olive">
                Dr. Sunita Mehta
              </div>
              <p className="text-[10px] text-dairy-charcoal/60">Operations & Quality Lead</p>
            </div>

            <div className="rounded-xl border border-dairy-beige p-4 space-y-3">
              <span className="text-[10px] text-dairy-charcoal/50 uppercase font-bold">Chief Engineer</span>
              <div className="h-10 border-b border-dashed border-dairy-charcoal/30 flex items-end pb-1 font-serif italic text-dairy-olive">
                Ramesh Verma
              </div>
              <p className="text-[10px] text-dairy-charcoal/60">Senior Plant Mechanical Engineer</p>
            </div>

            <div className="rounded-xl border border-dairy-beige p-4 space-y-3">
              <span className="text-[10px] text-dairy-charcoal/50 uppercase font-bold">Environmental Auditor</span>
              <div className="h-10 border-b border-dashed border-dairy-charcoal/30 flex items-end pb-1 font-serif italic text-dairy-olive">
                Sanjay Deshmukh
              </div>
              <p className="text-[10px] text-dairy-charcoal/60">FSSAI & PCB Compliance Auditor</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

