import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  PlusCircle,
  Wrench,
  CheckCircle2,
  Clock,
  IndianRupee,
  ShieldAlert,
} from 'lucide-react';

export const LeakSpillReporter: React.FC = () => {
  const [leaks, setLeaks] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);

  // Form State
  const [location, setLocation] = useState('Raw Milk Storage Bay');
  const [tankOrMachine, setTankOrMachine] = useState('Tank 3 (Raw Silo 30KL)');
  const [type, setType] = useState('Valve Leak');
  const [quantity, setQuantity] = useState(25);
  const [shift, setShift] = useState('Shift A');
  const [reportedBy, setReportedBy] = useState('Floor Technician');
  const [assignedTo, setAssignedTo] = useState('Ramesh Verma (Senior Fitter)');

  const fetchLeaks = () => {
    fetch('/api/leaks')
      .then(res => res.json())
      .then(data => setLeaks(data.leaks || []));
  };

  useEffect(() => {
    fetchLeaks();
  }, []);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    fetch('/api/leaks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location,
        tankOrMachine,
        type,
        quantity,
        shift,
        reportedBy,
        assignedTo,
      }),
    })
      .then(res => res.json())
      .then(() => {
        fetchLeaks();
        setShowForm(false);
      });
  };

  const handleStatusChange = (id: string, status: string) => {
    fetch(`/api/leaks/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
      .then(res => res.json())
      .then(() => fetchLeaks());
  };

  const recurringIncidents = leaks.filter(l => l.isRecurring);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-dairy-beige">
        <div>
          <h2 className="text-2xl font-serif font-bold text-dairy-olive">
            Leak & Spill Incident Reporter
          </h2>
          <p className="text-xs text-dairy-charcoal/70">
            Rapid mobile-friendly incident logging • Automatic repeated-incident detection • Maintenance ticket tracking
          </p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-dairy-terracotta px-4 py-2 text-xs font-semibold text-white transition hover:bg-dairy-terracotta/90 shadow-sm"
        >
          <PlusCircle className="h-4 w-4" />
          <span>{showForm ? 'Close Incident Form' : 'Log New Leak / Spill'}</span>
        </button>
      </div>

      {/* Repeated Incident Notification Banner (Scenario 3) */}
      {recurringIncidents.length > 0 && (
        <div className="rounded-xl border-2 border-dairy-terracotta bg-dairy-terracotta/10 p-5 space-y-2">
          <div className="flex items-center gap-2 font-bold text-dairy-terracotta">
            <ShieldAlert className="h-5 w-5" />
            <span className="text-sm">CRITICAL REPEATED INCIDENT DETECTED</span>
          </div>
          <p className="text-xs text-dairy-charcoal leading-relaxed font-medium">
            Valve near <span className="font-bold text-dairy-terracotta">Tank 3</span> has leaked <span className="font-bold underline">5 times this month</span>. Cumulative estimated milk loss: <span className="font-bold">400 Litres (₹18,400)</span>. Mandatory maintenance inspection and seat ring replacement ticket has been escalated.
          </p>
        </div>
      )}

      {/* Incident Logging Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="dairy-card p-6 space-y-4 border-2 border-dairy-terracotta/40">
          <h3 className="font-serif font-bold text-lg text-dairy-olive border-b border-dairy-beige pb-2">
            Report Physical Fluid Leak or Floor Spill
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="font-semibold text-dairy-charcoal">Location Area</label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="mt-1 w-full rounded-lg border border-dairy-beige p-2 bg-white"
              />
            </div>

            <div>
              <label className="font-semibold text-dairy-charcoal">Tank / Machine Tag</label>
              <input
                type="text"
                value={tankOrMachine}
                onChange={e => setTankOrMachine(e.target.value)}
                className="mt-1 w-full rounded-lg border border-dairy-beige p-2 bg-white font-mono font-bold"
              />
            </div>

            <div>
              <label className="font-semibold text-dairy-charcoal">Type of Leak</label>
              <select
                value={type}
                onChange={e => setType(e.target.value)}
                className="mt-1 w-full rounded-lg border border-dairy-beige p-2 bg-white"
              >
                <option>Valve Leak</option>
                <option>Gasket Failure</option>
                <option>Pipe Flange Seepage</option>
                <option>Pump Mechanical Seal</option>
                <option>Tank Overflow Spill</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-dairy-charcoal">Estimated Loss (Litres)</label>
              <input
                type="number"
                value={quantity}
                onChange={e => setQuantity(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-dairy-beige p-2 bg-white font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-semibold text-dairy-charcoal">Operating Shift</label>
              <select
                value={shift}
                onChange={e => setShift(e.target.value)}
                className="mt-1 w-full rounded-lg border border-dairy-beige p-2 bg-white"
              >
                <option>Shift A (Morning)</option>
                <option>Shift B (Evening)</option>
                <option>Shift C (Night)</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-dairy-charcoal">Reported By</label>
              <input
                type="text"
                value={reportedBy}
                onChange={e => setReportedBy(e.target.value)}
                className="mt-1 w-full rounded-lg border border-dairy-beige p-2 bg-white"
              />
            </div>

            <div>
              <label className="font-semibold text-dairy-charcoal">Assigned Maintenance Fitter</label>
              <input
                type="text"
                value={assignedTo}
                onChange={e => setAssignedTo(e.target.value)}
                className="mt-1 w-full rounded-lg border border-dairy-beige p-2 bg-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-dairy-beige">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-dairy-beige px-4 py-2 text-xs font-semibold hover:bg-dairy-cream"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-dairy-terracotta px-5 py-2 text-xs font-bold text-white hover:bg-dairy-terracotta/90"
            >
              Dispatch Incident Report
            </button>
          </div>
        </form>
      )}

      {/* Leaks History & Status Grid */}
      <div className="dairy-card overflow-hidden">
        <div className="p-5 border-b border-dairy-beige flex items-center justify-between">
          <div>
            <h3 className="font-serif font-bold text-lg text-dairy-olive">Active Leaks & Incident Register</h3>
            <p className="text-xs text-dairy-charcoal/60">Automated repetition tracking flags hardware requiring maintenance overhaul</p>
          </div>
          <span className="text-xs font-semibold text-dairy-charcoal/70 bg-dairy-cream px-3 py-1 rounded-lg border border-dairy-beige">
            {leaks.length} Incidents Recorded This Month
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-dairy-cream/60 text-dairy-olive font-semibold border-b border-dairy-beige">
              <tr>
                <th className="py-3 px-4">Equipment & Location</th>
                <th className="py-3 px-4">Leak Category</th>
                <th className="py-3 px-4">Time & Shift</th>
                <th className="py-3 px-4">Quantity Lost</th>
                <th className="py-3 px-4">Financial Impact</th>
                <th className="py-3 px-4">Repeat Count</th>
                <th className="py-3 px-4">Maintenance Assignee</th>
                <th className="py-3 px-4">Workflow Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dairy-beige/60">
              {leaks.map((l) => (
                <tr key={l.id} className={`hover:bg-dairy-cream/40 transition ${l.isRecurring ? 'bg-dairy-terracotta/5' : ''}`}>
                  <td className="py-3.5 px-4 font-semibold text-dairy-charcoal">
                    <div className="font-bold text-dairy-olive">{l.tankOrMachine}</div>
                    <span className="text-[10px] text-dairy-charcoal/60">{l.location}</span>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-dairy-charcoal/80">{l.type}</td>
                  <td className="py-3.5 px-4 text-dairy-charcoal/70">
                    <div>{l.timestamp}</div>
                    <span className="text-[10px] text-dairy-charcoal/50">{l.shift}</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-dairy-terracotta">
                    {l.estimatedQuantityLostLiters} L
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-dairy-olive">
                    ₹{l.financialImpactInr?.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4">
                    {l.repeatIncidentCount > 1 ? (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                        l.isRecurring
                          ? 'bg-dairy-terracotta text-white'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {l.repeatIncidentCount}x this month
                      </span>
                    ) : (
                      <span className="text-dairy-charcoal/50">1st report</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-dairy-charcoal/80">
                    <div className="font-medium">{l.assignedMaintenancePerson}</div>
                    <span className="text-[10px] text-dairy-charcoal/50">Rep by: {l.reportedBy}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <select
                      value={l.status}
                      onChange={e => handleStatusChange(l.id, e.target.value)}
                      className={`text-[11px] font-semibold rounded-lg px-2 py-1 border transition ${
                        l.status === 'Repaired' || l.status === 'Verified'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : l.status === 'In Progress'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-dairy-terracotta/10 text-dairy-terracotta border-dairy-terracotta/30'
                      }`}
                    >
                      <option value="Reported">Reported</option>
                      <option value="Assigned">Assigned</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Repaired">Repaired</option>
                      <option value="Verified">Verified</option>
                    </select>
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

