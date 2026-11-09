import React, { useState, useEffect } from 'react';
import {
  Layers,
  PlusCircle,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';

export const WasteRegistrationAndClassification: React.FC = () => {
  const [batches, setBatches] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [materialName, setMaterialName] = useState('Sweet Food-Grade Whey');
  const [department, setDepartment] = useState('Paneer & Cheese Plant');
  const [productionStage, setProductionStage] = useState('Coagulation Drainage');
  const [wasteType, setWasteType] = useState('Dairy Organic');
  const [quantity, setQuantity] = useState(2500);
  const [unit, setUnit] = useState('Liters');
  const [contaminationStatus, setContaminationStatus] = useState('None - Food Grade');
  const [storageCondition, setStorageCondition] = useState('Chilled (4°C)');
  const [shelfLifeHours, setShelfLifeHours] = useState(24);
  const [reason, setReason] = useState('Excess seasonal paneer production');

  const fetchBatches = () => {
    fetch('/api/classification/batches')
      .then(res => res.json())
      .then(data => setBatches(data.batches || []));
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    fetch('/api/classification/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        materialName,
        department,
        productionStage,
        wasteType,
        quantity,
        unit,
        contaminationStatus,
        storageCondition,
        shelfLifeHours,
        reason,
      }),
    })
      .then(res => res.json())
      .then(() => {
        fetchBatches();
        setShowModal(false);
      });
  };

  const handleQCVerify = (id: string, category: string) => {
    fetch(`/api/classification/${id}/qc-verify`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category,
        verifiedBy: 'Dr. Sunita Mehta (QC Lead)',
      }),
    })
      .then(res => res.json())
      .then(() => fetchBatches());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-dairy-beige">
        <div>
          <h2 className="text-2xl font-serif font-bold text-dairy-olive">
            AI-Assisted 3-Tier Waste Classification & Registration
          </h2>
          <p className="text-xs text-dairy-charcoal/70">
            Categorizing by-products into Reusable, Treatable, and Disposal with mandatory QC verification
          </p>
        </div>

        <button
          onClick={() => setShowModal(!showModal)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-dairy-olive px-4 py-2 text-xs font-semibold text-dairy-ivory transition hover:bg-dairy-forest shadow-sm"
        >
          <PlusCircle className="h-4 w-4 text-dairy-sage" />
          <span>Register New Waste Batch</span>
        </button>
      </div>

      {/* 3 Categories Explanation Banner (PRD Section 14) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="dairy-card p-4 border-l-4 border-l-dairy-forest space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-dairy-forest">A. Reusable By-Product</span>
            <span className="badge-reusable text-[10px] px-2 py-0.5 rounded-full font-bold">Food / Feed Grade</span>
          </div>
          <p className="text-[11px] text-dairy-charcoal/70 leading-relaxed">
            Sweet whey, high-solid rinse milk, uncharred packaging. Directly eligible for industrial circular exchange.
          </p>
        </div>

        <div className="dairy-card p-4 border-l-4 border-l-amber-500 space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-amber-800">B. Treatable Matrix</span>
            <span className="badge-treatable text-[10px] px-2 py-0.5 rounded-full font-bold">Requires Processing</span>
          </div>
          <p className="text-[11px] text-dairy-charcoal/70 leading-relaxed">
            DAF clarifier organic sludge, concentrated effluent, CIP wash liquor. Destined for anaerobic biogas methanogenesis.
          </p>
        </div>

        <div className="dairy-card p-4 border-l-4 border-l-dairy-terracotta space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-dairy-terracotta">C. Regulated Disposal</span>
            <span className="badge-disposal text-[10px] px-2 py-0.5 rounded-full font-bold">Authorized Facility</span>
          </div>
          <p className="text-[11px] text-dairy-charcoal/70 leading-relaxed">
            Charred composite packaging scrap, chemical residues. Requires verified chain-of-custody disposal evidence.
          </p>
        </div>
      </div>

      {/* Registration Form Modal */}
      {showModal && (
        <form onSubmit={handleRegister} className="dairy-card p-6 space-y-4 border-2 border-dairy-forest/40">
          <div className="flex items-center justify-between border-b border-dairy-beige pb-3">
            <h3 className="font-serif font-bold text-lg text-dairy-olive">
              Register Production By-Product / Waste Batch
            </h3>
            <span className="text-xs font-semibold text-dairy-forest flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5" /> AI Engine Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-semibold text-dairy-charcoal">Material Name</label>
              <input
                type="text"
                value={materialName}
                onChange={e => setMaterialName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-dairy-beige p-2 bg-white font-medium"
              />
            </div>

            <div>
              <label className="font-semibold text-dairy-charcoal">Department</label>
              <input
                type="text"
                value={department}
                onChange={e => setDepartment(e.target.value)}
                className="mt-1 w-full rounded-lg border border-dairy-beige p-2 bg-white"
              />
            </div>

            <div>
              <label className="font-semibold text-dairy-charcoal">Production Stage</label>
              <input
                type="text"
                value={productionStage}
                onChange={e => setProductionStage(e.target.value)}
                className="mt-1 w-full rounded-lg border border-dairy-beige p-2 bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="font-semibold text-dairy-charcoal">Quantity</label>
              <input
                type="number"
                value={quantity}
                onChange={e => setQuantity(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-dairy-beige p-2 bg-white font-mono font-bold"
              />
            </div>

            <div>
              <label className="font-semibold text-dairy-charcoal">Unit</label>
              <select
                value={unit}
                onChange={e => setUnit(e.target.value)}
                className="mt-1 w-full rounded-lg border border-dairy-beige p-2 bg-white"
              >
                <option>Liters</option>
                <option>Kilograms</option>
                <option>Metric Tonnes</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-dairy-charcoal">Contamination Level</label>
              <select
                value={contaminationStatus}
                onChange={e => setContaminationStatus(e.target.value)}
                className="mt-1 w-full rounded-lg border border-dairy-beige p-2 bg-white"
              >
                <option>None - Food Grade</option>
                <option>Low - Industrial</option>
                <option>High - Contaminated</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-dairy-charcoal">Storage Condition</label>
              <select
                value={storageCondition}
                onChange={e => setStorageCondition(e.target.value)}
                className="mt-1 w-full rounded-lg border border-dairy-beige p-2 bg-white"
              >
                <option>Chilled (4°C)</option>
                <option>Ambient Tank</option>
                <option>Dry Baled</option>
                <option>Sealed Drum</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-dairy-charcoal">Reason for Generation</label>
            <input
              type="text"
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="mt-1 w-full rounded-lg border border-dairy-beige p-2 bg-white text-xs"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-dairy-beige">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="rounded-lg border border-dairy-beige px-4 py-2 text-xs font-semibold hover:bg-dairy-cream"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-dairy-olive px-5 py-2 text-xs font-bold text-white hover:bg-dairy-forest"
            >
              Run AI Classification & Register
            </button>
          </div>
        </form>
      )}

      {/* Batches Table with AI Rationale & QC Verification */}
      <div className="dairy-card overflow-hidden">
        <div className="p-5 border-b border-dairy-beige flex items-center justify-between">
          <div>
            <h3 className="font-serif font-bold text-lg text-dairy-olive">Registered Waste Batches & QC Gate</h3>
            <p className="text-xs text-dairy-charcoal/60">
              AI recommendations require explicit Quality Control Officer sign-off before dispatch
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-dairy-charcoal/60 bg-dairy-cream px-3 py-1 rounded-lg border border-dairy-beige">
            <ShieldCheck className="h-4 w-4 text-dairy-forest" />
            <span>Digital Traceability Guaranteed</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-dairy-cream/60 text-dairy-olive font-semibold border-b border-dairy-beige">
              <tr>
                <th className="py-3 px-4">Batch ID & Material</th>
                <th className="py-3 px-4">Origin Stage</th>
                <th className="py-3 px-4">Quantity</th>
                <th className="py-3 px-4">AI Suggested Category</th>
                <th className="py-3 px-4">AI Scientific Explanation</th>
                <th className="py-3 px-4">Est. Recovery Value</th>
                <th className="py-3 px-4">QC Verified Category</th>
                <th className="py-3 px-4">QC Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dairy-beige/60">
              {batches.map((b) => (
                <tr key={b.id} className="hover:bg-dairy-cream/40 transition">
                  <td className="py-3.5 px-4 font-semibold text-dairy-charcoal">
                    <div className="font-bold text-dairy-olive">{b.materialName}</div>
                    <span className="text-[10px] text-dairy-charcoal/50 font-mono">{b.id}</span>
                  </td>
                  <td className="py-3.5 px-4 text-dairy-charcoal/70">
                    <div>{b.department}</div>
                    <span className="text-[10px] text-dairy-charcoal/50">{b.productionStage}</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-dairy-charcoal">
                    {b.quantity?.toLocaleString()} {b.unit}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold ${
                      b.aiSuggestedCategory === 'Reusable'
                        ? 'badge-reusable'
                        : b.aiSuggestedCategory === 'Treatable'
                        ? 'badge-treatable'
                        : 'badge-disposal'
                    }`}>
                      <Sparkles className="h-3 w-3" />
                      {b.aiSuggestedCategory} ({b.aiConfidencePercent}%)
                    </span>
                  </td>
                  <td className="py-3.5 px-4 max-w-xs text-dairy-charcoal/80 text-[11px]">
                    {b.aiExplanation}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold">
                    {b.netRecoveryValueInr > 0 ? (
                      <span className="text-emerald-800">+₹{b.netRecoveryValueInr?.toLocaleString()}</span>
                    ) : (
                      <span className="text-dairy-terracotta">₹{b.netRecoveryValueInr} (Disposal Fee)</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-dairy-olive">{b.qcVerifiedCategory}</div>
                    <span className="text-[10px] text-dairy-charcoal/50">{b.qcVerifiedBy}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    {b.qcStatus === 'Pending Verification' ? (
                      (sessionStorage.getItem('dairypulse_user_role') || 'admin') === 'admin' ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleQCVerify(b.id, 'Reusable')}
                            className="rounded bg-emerald-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-emerald-700"
                          >
                            Approve Reusable
                          </button>
                          <button
                            onClick={() => handleQCVerify(b.id, 'Treatable')}
                            className="rounded bg-amber-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-amber-700"
                          >
                            Treatable
                          </button>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-800 border border-amber-200">
                          Awaiting Admin QC
                        </span>
                      )
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        Verified
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

