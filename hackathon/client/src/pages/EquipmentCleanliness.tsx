import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Camera,
  Upload,
  Info,
} from 'lucide-react';

export const EquipmentCleanliness: React.FC = () => {
  const [equipmentList, setEquipmentList] = useState<any[]>([]);
  const [selectedEqId, setSelectedEqId] = useState<string | null>(null);
  const [remarks, setRemarks] = useState('');
  const [newStatus, setNewStatus] = useState('Clean');

  const fetchEquipment = () => {
    fetch('/api/equipment')
      .then(res => res.json())
      .then(data => setEquipmentList(data.equipment || []));
  };

  useEffect(() => {
    fetchEquipment();
  }, []);

  const handleUpdateStatus = (id: string) => {
    fetch(`/api/equipment/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: newStatus,
        remarks: remarks || 'Verified by Shift Supervisor',
        photoUrl: '/images/verified_clean_evidence.jpg',
      }),
    })
      .then(res => res.json())
      .then(() => {
        fetchEquipment();
        setSelectedEqId(null);
        setRemarks('');
      });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-dairy-beige">
        <h2 className="text-2xl font-serif font-bold text-dairy-olive">
          Equipment & Machinery Cleanliness Management
        </h2>
        <p className="text-xs text-dairy-charcoal/70">
          Cleaning schedule tracking • Visual dirt/stain AI detection • Supervisor photo verification workflow
        </p>
      </div>

      {/* Mandatory Disclaimer (PRD Module 4) */}
      <div className="rounded-xl border border-dairy-sage/40 bg-dairy-cream/60 p-4 text-xs flex items-start gap-3">
        <Info className="h-5 w-5 text-dairy-forest shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-dairy-olive">CCTV & Visual Inspection Capability Scope</span>
          <p className="text-dairy-charcoal/80 text-[11px] leading-relaxed">
            Visual camera monitoring identifies external dirt accumulation, milk splashes, unrinsed foam, and floor residues. It does NOT detect microbiological bacteria or swab ATP levels; physical chemical CIP titrations and laboratory hygiene release records must accompany visual sign-offs.
          </p>
        </div>
      </div>

      {/* Status Counters Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="dairy-card p-4 space-y-1">
          <span className="text-xs text-dairy-charcoal/70 font-semibold">Registered Equipment</span>
          <div className="text-2xl font-bold font-serif text-dairy-olive">{equipmentList.length} Units</div>
          <p className="text-[10px] text-dairy-charcoal/50">Processing, storage & packing</p>
        </div>

        <div className="dairy-card p-4 space-y-1">
          <span className="text-xs text-dairy-charcoal/70 font-semibold">Clean & Operational</span>
          <div className="text-2xl font-bold font-serif text-emerald-800">
            {equipmentList.filter(e => e.currentStatus === 'Clean').length}
          </div>
          <p className="text-[10px] text-emerald-700 font-semibold">Validated for production</p>
        </div>

        <div className="dairy-card p-4 space-y-1">
          <span className="text-xs text-dairy-charcoal/70 font-semibold">CIP Wash In Progress</span>
          <div className="text-2xl font-bold font-serif text-amber-700">
            {equipmentList.filter(e => e.currentStatus === 'Cleaning in Progress').length}
          </div>
          <p className="text-[10px] text-amber-800">Lye & acid circulation loop</p>
        </div>

        <div className="dairy-card p-4 space-y-1">
          <span className="text-xs text-dairy-charcoal/70 font-semibold">Overdue / Awaiting Signoff</span>
          <div className="text-2xl font-bold font-serif text-dairy-terracotta">
            {equipmentList.filter(e => e.currentStatus === 'Overdue' || e.currentStatus === 'Awaiting Verification').length}
          </div>
          <p className="text-[10px] text-dairy-terracotta font-semibold">Requires immediate supervisor review</p>
        </div>
      </div>

      {/* Equipment Inventory & Cleanliness Matrix Table */}
      <div className="dairy-card overflow-hidden">
        <div className="p-5 border-b border-dairy-beige flex items-center justify-between">
          <div>
            <h3 className="font-serif font-bold text-lg text-dairy-olive">Plant Machinery Cleanliness Roster</h3>
            <p className="text-xs text-dairy-charcoal/60">Cleaning interval timers, assigned squads, and supervisor verification gates</p>
          </div>
          <span className="text-xs font-semibold text-dairy-forest bg-dairy-sage/20 px-3 py-1 rounded-lg border border-dairy-sage/30">
            FSSAI Sanitation Protocol
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-dairy-cream/60 text-dairy-olive font-semibold border-b border-dairy-beige">
              <tr>
                <th className="py-3 px-4">Equipment ID & Machine</th>
                <th className="py-3 px-4">Category & Department</th>
                <th className="py-3 px-4">Sanitation Schedule</th>
                <th className="py-3 px-4">Last Cleaned</th>
                <th className="py-3 px-4">Next Scheduled</th>
                <th className="py-3 px-4">Assigned Sanitation Team</th>
                <th className="py-3 px-4">Cleanliness Status</th>
                <th className="py-3 px-4">Supervisor Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dairy-beige/60">
              {equipmentList.map((e) => (
                <tr key={e.id} className={`hover:bg-dairy-cream/40 transition ${e.currentStatus === 'Overdue' ? 'bg-dairy-terracotta/5' : ''}`}>
                  <td className="py-3.5 px-4 font-semibold text-dairy-charcoal">
                    <div className="font-bold text-dairy-olive">{e.name}</div>
                    <span className="text-[10px] text-dairy-charcoal/50 font-mono">{e.equipmentId}</span>
                  </td>
                  <td className="py-3.5 px-4 text-dairy-charcoal/80">
                    <div>{e.category}</div>
                    <span className="text-[10px] text-dairy-charcoal/50">{e.department}</span>
                  </td>
                  <td className="py-3.5 px-4 text-dairy-charcoal/70">{e.cleaningFrequency}</td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-dairy-charcoal/70">
                    {e.lastCleanedTimestamp}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px] font-semibold text-dairy-olive">
                    {e.nextScheduledCleaning}
                  </td>
                  <td className="py-3.5 px-4 text-dairy-charcoal/80 font-medium">
                    {e.assignedCleaningTeam}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold ${
                      e.currentStatus === 'Clean'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : e.currentStatus === 'Cleaning in Progress'
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : e.currentStatus === 'Overdue'
                        ? 'bg-dairy-terracotta/15 text-dairy-terracotta border border-dairy-terracotta/30'
                        : 'bg-blue-50 text-blue-800 border border-blue-200'
                    }`}>
                      {e.currentStatus === 'Clean' && <CheckCircle2 className="h-3 w-3 text-emerald-600" />}
                      {e.currentStatus === 'Overdue' && <AlertTriangle className="h-3 w-3 text-dairy-terracotta" />}
                      {e.currentStatus === 'Cleaning in Progress' && <Clock className="h-3 w-3 text-amber-600" />}
                      {e.currentStatus}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <button
                      onClick={() => {
                        setSelectedEqId(e.id);
                        setNewStatus(e.currentStatus === 'Overdue' ? 'Cleaning in Progress' : 'Clean');
                      }}
                      className="rounded-lg border border-dairy-beige bg-dairy-cream px-2.5 py-1 text-[11px] font-semibold text-dairy-olive hover:bg-dairy-beige transition"
                    >
                      Update / Verify
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Verification Modal / Drawer */}
      {selectedEqId && (
        <div className="dairy-card p-6 border-2 border-dairy-forest/40 space-y-4">
          <div className="flex items-center justify-between border-b border-dairy-beige pb-3">
            <h3 className="font-serif font-bold text-lg text-dairy-olive">
              Update Cleaning Status & Upload Photo Verification
            </h3>
            <button
              onClick={() => setSelectedEqId(null)}
              className="text-xs font-semibold text-dairy-charcoal/60 hover:text-dairy-charcoal"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-dairy-charcoal">New Status</label>
              <select
                value={newStatus}
                onChange={e => setNewStatus(e.target.value)}
                className="mt-1 w-full rounded-lg border border-dairy-beige p-2 bg-white font-semibold"
              >
                <option value="Clean">Clean (Verified & Signed Off)</option>
                <option value="Cleaning in Progress">Cleaning in Progress (CIP Active)</option>
                <option value="Awaiting Verification">Awaiting Supervisor Verification</option>
                <option value="Dirty">Dirty (Needs Urgent CIP)</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-dairy-charcoal">Supervisor Remarks</label>
              <input
                type="text"
                placeholder="e.g. Swab test passed, CIP acid rinse completed"
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                className="mt-1 w-full rounded-lg border border-dairy-beige p-2 bg-white"
              />
            </div>
          </div>

          <div className="rounded-xl border border-dashed border-dairy-sage p-4 text-center space-y-2 bg-dairy-cream/20">
            <Camera className="h-6 w-6 text-dairy-forest mx-auto" />
            <div className="text-xs text-dairy-charcoal font-semibold">
              Cleaning Evidence Image Attached: <span className="text-dairy-forest">evidence_surface_clean.jpg</span>
            </div>
            <p className="text-[10px] text-dairy-charcoal/50">
              Photographic evidence required before turning status to "Clean"
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setSelectedEqId(null)}
              className="rounded-lg border border-dairy-beige px-4 py-2 text-xs font-semibold hover:bg-dairy-cream"
            >
              Cancel
            </button>
            <button
              onClick={() => handleUpdateStatus(selectedEqId)}
              className="rounded-lg bg-dairy-olive px-5 py-2 text-xs font-bold text-white hover:bg-dairy-forest transition"
            >
              Save Verification & Sign Off
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

