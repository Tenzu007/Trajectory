import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Droplets,
  PlusCircle,
  ShieldCheck,
  Sliders,
  Thermometer,
  FlaskConical,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  X,
  Check,
  AlertCircle,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

interface RinseRecord {
  id: number;
  recordId: string;
  line: string;
  lineName: string;
  product: string;
  productName: string;
  dateTime: string;
  date: string;
  time: string;
  shift: string;
  recoverableEstimateLiters: number;
  actualRecoveredLiters: number;
  unrecoveredLiters: number;
  recoveryPercent: number;
  costPerLiterInr: number;
  unrecoveredLossInr: number;
  financialValueUnrecoveredInr: number;
  temperatureCelsius: number | null;
  phLevel: number | null;
  fatPercent: number | null;
  snfPercent: number | null;
  microbiologicalStatus: string;
  qcStatus: 'Verified' | 'Pending' | 'Rejected' | string;
  qcApprovalStatus: string;
  qcRemarks: string | null;
  qcVerifiedBy: string | null;
  qcVerifiedAt: string | null;
  productionReady: boolean;
  isDemo: boolean;
  operatorName: string;
}

interface SummaryMetrics {
  totalRecoverableEstimatedL: number;
  totalActualRecoveredL: number;
  totalUnrecoveredL: number;
  overallRecoveryPercent: number;
  totalUnrecoveredLossInr: number;
  verifiedCount: number;
  pendingCount: number;
  rejectedCount: number;
  totalRecords: number;
}

interface Thresholds {
  costPerLiterInr: number;
  minPh: number;
  maxPh: number;
  maxTemp: number;
  minSnf: number;
  minFat: number;
}

export const LossHotspotAndChangeovers: React.FC = () => {
  const [changeovers, setChangeovers] = useState<any[]>([]);
  const [rinseRecords, setRinseRecords] = useState<RinseRecord[]>([]);
  const [summary, setSummary] = useState<SummaryMetrics>({
    totalRecoverableEstimatedL: 640.0,
    totalActualRecoveredL: 531.0,
    totalUnrecoveredL: 109.0,
    overallRecoveryPercent: 83.0,
    totalUnrecoveredLossInr: 2180.0,
    verifiedCount: 3,
    pendingCount: 1,
    rejectedCount: 1,
    totalRecords: 5,
  });
  const [thresholds, setThresholds] = useState<Thresholds>({
    costPerLiterInr: 20.0,
    minPh: 6.4,
    maxPh: 6.8,
    maxTemp: 8.0,
    minSnf: 8.0,
    minFat: 0.5,
  });
  const [loading, setLoading] = useState(false);
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);

  // Modals
  const [showNewModal, setShowNewModal] = useState(false);
  const [showQCModal, setShowQCModal] = useState(false);
  const [showThresholdsModal, setShowThresholdsModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<RinseRecord | null>(null);

  // Form State: New Recovery Entry
  const [newForm, setNewForm] = useState({
    lineName: 'Line 01',
    productName: 'Skimmed Milk',
    shift: 'Shift A',
    recoverableEstimateLiters: 120,
    actualRecoveredLiters: 108,
    temperatureCelsius: 4.2,
    phLevel: 6.65,
    fatPercent: 0.52,
    snfPercent: 8.6,
    operatorName: 'Floor Operator',
  });

  // Form State: QC Verification
  const [qcForm, setQCForm] = useState({
    temperatureCelsius: 4.2,
    phLevel: 6.65,
    fatPercent: 0.52,
    snfPercent: 8.6,
    microbiologicalStatus: 'Pass (< 10 CFU/ml)',
    qcStatus: 'Verified',
    qcRemarks: '',
    verifiedBy: 'Dr. Sunita Mehta (QC Lead)',
  });

  // Form State: Admin Thresholds
  const [threshForm, setThreshForm] = useState({
    costPerLiterInr: 20.0,
    minPh: 6.4,
    maxPh: 6.8,
    maxTemp: 8.0,
    minSnf: 8.0,
    minFat: 0.5,
  });

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const getAuthHeaders = () => {
    const token = sessionStorage.getItem('dairypulse_token');
    return {
      'Content-Type': 'application/json',
      'x-user-role': 'admin',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const fetchRinseRecords = () => {
    setLoading(true);
    fetch('/api/waste/rinse-recovery', { headers: getAuthHeaders() })
      .then((res) => res.json())
      .then((data) => {
        if (data.rinseRecords) setRinseRecords(data.rinseRecords);
        if (data.summary) setSummary(data.summary);
        if (data.thresholds) {
          setThresholds(data.thresholds);
          setThreshForm(data.thresholds);
        }
      })
      .catch((err) => console.error('Error fetching rinse recoveries:', err))
      .finally(() => setLoading(false));
  };

  const fetchChangeovers = () => {
    fetch('/api/waste/changeovers', { headers: getAuthHeaders() })
      .then((res) => res.json())
      .then((data) => setChangeovers(data.changeovers || []))
      .catch((err) => console.error('Error fetching changeovers:', err));
  };

  useEffect(() => {
    fetchChangeovers();
    fetchRinseRecords();
  }, []);

  // Automatic calculation helpers for new recovery entry
  const estL = Number(newForm.recoverableEstimateLiters) || 0;
  const actL = Number(newForm.actualRecoveredLiters) || 0;
  const unrecL = Math.max(0, estL - actL);
  const recPct = estL > 0 ? Math.round((actL / estL) * 1000) / 10 : 0;
  const unrecLossInr = Math.round(unrecL * thresholds.costPerLiterInr * 100) / 100;

  const handleCreateRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    fetch('/api/waste/rinse-recovery', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        lineName: newForm.lineName,
        productName: newForm.productName,
        shift: newForm.shift,
        recoverableEstimateLiters: estL,
        actualRecoveredLiters: actL,
        temperatureCelsius: newForm.temperatureCelsius,
        phLevel: newForm.phLevel,
        fatPercent: newForm.fatPercent,
        snfPercent: newForm.snfPercent,
        operatorName: newForm.operatorName,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to create recovery record');
        return res.json();
      })
      .then((data) => {
        setShowNewModal(false);
        setNotification({ type: 'success', message: data.message || 'Recovery record saved successfully!' });
        setTimeout(() => setNotification(null), 4000);
        fetchRinseRecords();
      })
      .catch((err) => {
        setNotification({ type: 'error', message: err.message || 'Error saving record' });
        setTimeout(() => setNotification(null), 4000);
      });
  };

  const handleOpenQCModal = (rec: RinseRecord) => {
    setSelectedRecord(rec);
    setQCForm({
      temperatureCelsius: rec.temperatureCelsius ?? 4.2,
      phLevel: rec.phLevel ?? 6.65,
      fatPercent: rec.fatPercent ?? 0.5,
      snfPercent: rec.snfPercent ?? 8.5,
      microbiologicalStatus: rec.microbiologicalStatus || 'Pass (< 10 CFU/ml)',
      qcStatus: rec.qcStatus === 'Pending' ? 'Verified' : rec.qcStatus,
      qcRemarks: rec.qcRemarks || '',
      verifiedBy: rec.qcVerifiedBy || 'Dr. Sunita Mehta (QC Lead)',
    });
    setShowQCModal(true);
  };

  const handleVerifyQC = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;

    fetch(`/api/waste/rinse-recovery/${selectedRecord.recordId}/qc-verify`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(qcForm),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to verify QC');
        return res.json();
      })
      .then((data) => {
        setShowQCModal(false);
        setNotification({
          type: data.record.qcStatus === 'Verified' ? 'success' : 'error',
          message: data.message,
        });
        setTimeout(() => setNotification(null), 5000);
        fetchRinseRecords();
      })
      .catch((err) => {
        setNotification({ type: 'error', message: err.message || 'Error updating QC status' });
        setTimeout(() => setNotification(null), 4000);
      });
  };

  const handleUpdateThresholds = (e: React.FormEvent) => {
    e.preventDefault();
    fetch('/api/waste/rinse-recovery/thresholds', {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(threshForm),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to update thresholds');
        return res.json();
      })
      .then((data) => {
        setShowThresholdsModal(false);
        setThresholds(data.thresholds);
        setNotification({ type: 'success', message: 'Food safety quality thresholds updated successfully!' });
        setTimeout(() => setNotification(null), 4000);
        fetchRinseRecords();
      })
      .catch((err) => {
        setNotification({ type: 'error', message: err.message || 'Error updating thresholds' });
        setTimeout(() => setNotification(null), 4000);
      });
  };

  const hotspotStages = [
    { stage: 'Product Changeovers', volume: 1250, cost: 56250, fill: '#354C3C' },
    { stage: 'Airlock & Valve Leaks', volume: 890, cost: 40050, fill: '#526B58' },
    { stage: 'Pouch Packaging Scrap', volume: 710, cost: 31950, fill: '#AFC4AD' },
    { stage: 'Unrecovered CIP Rinse', volume: 580, cost: 26100, fill: '#D4A373' },
    { stage: 'Receiving Bay Spills', volume: 420, cost: 18900, fill: '#C97A63' },
  ];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-xl px-4 py-3 shadow-lg text-xs font-semibold border transition ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
              : 'bg-rose-50 text-rose-800 border-rose-300'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-600" />
          )}
          <span>{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            className="ml-2 text-dairy-charcoal/50 hover:text-dairy-charcoal"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-4 border-b border-dairy-beige gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-dairy-olive">
            Production Loss Hotspots & Changeover Tracking
          </h2>
          <p className="text-xs text-dairy-charcoal/70">
            Pinpointing stage-wise product losses • Transition flush minimization • Pre-rinse milk recovery & QC
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowThresholdsModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-dairy-beige bg-dairy-cream px-3 py-1.5 text-xs font-semibold text-dairy-olive hover:bg-dairy-beige/40 transition"
          >
            <Sliders className="h-3.5 w-3.5 text-dairy-forest" />
            <span>Admin QC Thresholds</span>
          </button>
          <button
            onClick={() => setShowNewModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-dairy-olive px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-dairy-olive/90 transition"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>Log Recovery Entry</span>
          </button>
        </div>
      </div>

      {/* Visual Hotspot Stage Graph */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="dairy-card p-5 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-dairy-beige">
            <div>
              <h3 className="font-serif font-bold text-lg text-dairy-olive">Factory Loss Hotspot Map</h3>
              <p className="text-xs text-dairy-charcoal/60">Stages responsible for highest physical milk and solid losses</p>
            </div>
            <span className="rounded-full bg-dairy-terracotta/10 px-3 py-1 text-xs font-semibold text-dairy-terracotta border border-dairy-terracotta/20">
              #1 Hotspot: Changeovers (32.5%)
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hotspotStages} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="stage" tick={{ fontSize: 11, fill: '#353A35' }} />
                <YAxis tick={{ fontSize: 11, fill: '#353A35' }} />
                <Tooltip
                  formatter={(val: number) => [`${val} Litres (₹${(val * 45).toLocaleString()})`, 'Loss Volume']}
                  contentStyle={{ backgroundColor: '#FAF8F2', borderRadius: '8px', border: '1px solid #E8E2D6' }}
                />
                <Bar dataKey="volume" fill="#526B58" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Changeover Smart Optimization Principle */}
        <div className="dairy-card p-5 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-bold text-dairy-olive">
              <Sparkles className="h-4 w-4 text-dairy-forest" />
              <h3 className="font-serif text-lg">Changeover Sequencing Rule</h3>
            </div>
            <p className="text-xs text-dairy-charcoal/70 leading-relaxed">
              Transitioning from darker or flavoured products (e.g. Chocolate Milk) to unflavoured products demands massive intermediate water rinsing and push-to-drain flushes.
            </p>
          </div>

          <div className="rounded-xl border border-dairy-sage/40 bg-dairy-cream/60 p-3 space-y-2 text-xs">
            <div className="font-semibold text-dairy-olive">Recommended Production Order:</div>
            <div className="flex items-center gap-2 text-dairy-forest font-semibold">
              <span className="rounded bg-white px-2 py-1 border border-dairy-beige">1. Skimmed Milk</span>
              <ArrowRight className="h-3 w-3" />
              <span className="rounded bg-white px-2 py-1 border border-dairy-beige">2. Full Cream</span>
              <ArrowRight className="h-3 w-3" />
              <span className="rounded bg-white px-2 py-1 border border-dairy-beige">3. Flavoured Milk</span>
            </div>
            <p className="text-[10px] text-dairy-charcoal/60">
              Cuts changeover drainage volume by up to 72% across all filler lines.
            </p>
          </div>
        </div>
      </div>

      {/* Changeover Loss Tracker Table */}
      <div className="dairy-card overflow-hidden">
        <div className="p-5 border-b border-dairy-beige flex items-center justify-between">
          <div>
            <h3 className="font-serif font-bold text-lg text-dairy-olive">Changeover Drainage & Transition Logs</h3>
            <p className="text-xs text-dairy-charcoal/60">Benchmarked against equipment baseline volume</p>
          </div>
          <span className="text-xs font-semibold text-dairy-forest bg-dairy-cream px-3 py-1 rounded-lg border border-dairy-beige">
            Historical Baseline Average: 45 - 50 L
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-dairy-cream/60 text-dairy-olive font-semibold border-b border-dairy-beige">
              <tr>
                <th className="py-3 px-4">Line & Machine</th>
                <th className="py-3 px-4">Transition Sequence</th>
                <th className="py-3 px-4">Time & Shift</th>
                <th className="py-3 px-4">Drained (L)</th>
                <th className="py-3 px-4">Baseline (L)</th>
                <th className="py-3 px-4">Excess Loss</th>
                <th className="py-3 px-4">Financial Loss</th>
                <th className="py-3 px-4">Status & Recommendation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dairy-beige/60">
              {changeovers.map((c) => (
                <tr
                  key={c.id}
                  className={`hover:bg-dairy-cream/40 transition ${
                    c.isAbnormal ? 'bg-dairy-terracotta/5' : ''
                  }`}
                >
                  <td className="py-3.5 px-4 font-semibold text-dairy-charcoal">
                    <div>{c.line || c.lineName}</div>
                    <span className="text-[10px] text-dairy-charcoal/50">{c.machine || c.cipType}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 font-medium text-dairy-olive">
                      <span>{c.previousProduct || c.fromProduct}</span>
                      <ArrowRight className="h-3 w-3 text-dairy-charcoal/40" />
                      <span className="font-bold">{c.nextProduct || c.toProduct}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-dairy-charcoal/70">
                    <div>{c.timestamp}</div>
                    <span className="text-[10px] text-dairy-charcoal/50">{c.shift || 'Shift A'}</span>
                  </td>
                  <td className="py-3.5 px-4 font-bold font-mono text-dairy-olive">
                    {c.quantityDrainedLiters || c.actualRinseLiters} L
                  </td>
                  <td className="py-3.5 px-4 font-mono text-dairy-charcoal/60">
                    {c.historicalBaselineLiters || c.benchmarkLiters} L
                  </td>
                  <td className="py-3.5 px-4 font-mono">
                    {c.isAbnormal ? (
                      <span className="font-bold text-dairy-terracotta">
                        +{c.excessWastedLiters || c.excessLiters} L excess
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-medium">Within baseline</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-bold font-mono text-dairy-olive">
                    ₹{c.estimatedLossInr?.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 max-w-xs">
                    {c.isAbnormal ? (
                      <div className="space-y-0.5">
                        <span className="inline-flex items-center gap-1 rounded bg-dairy-terracotta/10 px-1.5 py-0.5 font-bold text-[10px] text-dairy-terracotta border border-dairy-terracotta/20">
                          <AlertTriangle className="h-2.5 w-2.5" /> High Changeover Drain
                        </span>
                        <p className="text-dairy-forest font-semibold text-[10px]">
                          {c.recommendation || 'Excess transition rinse detected.'}
                        </p>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 font-medium text-[10px] text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="h-2.5 w-2.5" /> Normal
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* Pre-Rinse Milk Recovery Tracking Section */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        {/* Real-Time Summary Analytics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="dairy-card p-3.5 space-y-1">
            <span className="text-[10px] uppercase font-bold text-dairy-charcoal/60 tracking-wider">
              Total Recoverable
            </span>
            <div className="text-lg font-bold font-mono text-dairy-olive">
              {summary.totalRecoverableEstimatedL.toLocaleString()} <span className="text-xs font-sans">L</span>
            </div>
            <p className="text-[10px] text-dairy-charcoal/50">Baseline estimate</p>
          </div>

          <div className="dairy-card p-3.5 space-y-1">
            <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">
              Actual Recovered
            </span>
            <div className="text-lg font-bold font-mono text-emerald-800">
              {summary.totalActualRecoveredL.toLocaleString()} <span className="text-xs font-sans">L</span>
            </div>
            <p className="text-[10px] text-emerald-700/70">Captured from initial flush</p>
          </div>

          <div className="dairy-card p-3.5 space-y-1">
            <span className="text-[10px] uppercase font-bold text-dairy-terracotta tracking-wider">
              Total Unrecovered
            </span>
            <div className="text-lg font-bold font-mono text-dairy-terracotta">
              {summary.totalUnrecoveredL.toLocaleString()} <span className="text-xs font-sans">L</span>
            </div>
            <p className="text-[10px] text-dairy-terracotta/70">Sent to drain/ETP</p>
          </div>

          <div className="dairy-card p-3.5 space-y-1">
            <span className="text-[10px] uppercase font-bold text-dairy-olive tracking-wider">
              Overall Recovery %
            </span>
            <div className="flex items-baseline gap-1.5">
              <span
                className={`text-lg font-bold font-mono ${
                  summary.overallRecoveryPercent >= 75 ? 'text-emerald-700' : 'text-amber-700'
                }`}
              >
                {summary.overallRecoveryPercent}%
              </span>
              <span className="text-[10px] text-dairy-charcoal/50">Target &gt;75%</span>
            </div>
            <p className="text-[10px] text-dairy-charcoal/50">Efficiency ratio</p>
          </div>

          <div className="dairy-card p-3.5 space-y-1">
            <span className="text-[10px] uppercase font-bold text-dairy-olive tracking-wider">
              Total Financial Loss
            </span>
            <div className="text-lg font-bold font-mono text-dairy-olive">
              ₹{summary.totalUnrecoveredLossInr.toLocaleString()}
            </div>
            <p className="text-[10px] text-dairy-charcoal/50">@ ₹{thresholds.costPerLiterInr}/L valuation</p>
          </div>

          <div className="dairy-card p-3.5 space-y-1">
            <span className="text-[10px] uppercase font-bold text-dairy-charcoal/60 tracking-wider">
              QC Verification
            </span>
            <div className="flex items-center gap-1.5 pt-0.5">
              <span className="inline-flex items-center justify-center rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 border border-emerald-300">
                {summary.verifiedCount} Verified
              </span>
              <span className="inline-flex items-center justify-center rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 border border-amber-300">
                {summary.pendingCount} Pend
              </span>
              <span className="inline-flex items-center justify-center rounded-md bg-rose-100 text-rose-800 text-[10px] font-bold px-1.5 py-0.5 border border-rose-300">
                {summary.rejectedCount} Rej
              </span>
            </div>
            <p className="text-[10px] text-dairy-charcoal/50">{summary.totalRecords} batches tracked</p>
          </div>
        </div>

        {/* Rinse Milk Recovery Tracker Table */}
        <div className="dairy-card overflow-hidden">
          <div className="p-5 border-b border-dairy-beige flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-lg text-dairy-olive">
                  Pre-Rinse Milk Recovery Tracking
                </h3>
                <span className="inline-flex items-center gap-1 rounded bg-dairy-cream px-2 py-0.5 text-[10px] font-bold text-dairy-olive border border-dairy-beige">
                  <Droplets className="h-3 w-3 text-dairy-forest" />
                  Live Operational Records
                </span>
              </div>
              <p className="text-xs text-dairy-charcoal/60">
                Recovered initial rinse milk must pass mandatory physicochemical & microbiological QC before re-entering production
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchRinseRecords}
                disabled={loading}
                className="inline-flex items-center gap-1 rounded-lg border border-dairy-beige bg-dairy-cream px-2.5 py-1 text-xs font-medium text-dairy-olive hover:bg-dairy-beige/40 transition"
                title="Refresh from Database"
              >
                <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              <button
                onClick={() => setShowNewModal(true)}
                className="inline-flex items-center gap-1 rounded-lg bg-dairy-forest px-3 py-1 text-xs font-semibold text-white shadow-sm hover:bg-dairy-forest/90 transition"
              >
                <PlusCircle className="h-3 w-3" />
                <span>Add Record</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-dairy-cream/60 text-dairy-olive font-semibold border-b border-dairy-beige">
                <tr>
                  <th className="py-3 px-4">Line & Product</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Recoverable Estimated (L)</th>
                  <th className="py-3 px-4">Actual Recovered (L)</th>
                  <th className="py-3 px-4">Unrecovered (L)</th>
                  <th className="py-3 px-4">Recovery %</th>
                  <th className="py-3 px-4">Unrecovered Loss (₹)</th>
                  <th className="py-3 px-4">Quality Verification Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dairy-beige/60">
                {rinseRecords.map((r) => {
                  const isExpanded = expandedRecordId === r.recordId;
                  const isVerified = r.qcStatus === 'Verified';
                  const isPending = r.qcStatus === 'Pending';
                  const isRejected = r.qcStatus === 'Rejected';

                  return (
                    <React.Fragment key={r.recordId || r.id}>
                      <tr className={`hover:bg-dairy-cream/40 transition ${isExpanded ? 'bg-dairy-cream/30' : ''}`}>
                        {/* Line & Product */}
                        <td className="py-3.5 px-4 font-semibold text-dairy-charcoal">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-dairy-olive">{r.line || r.lineName}</span>
                            <span className="text-dairy-charcoal/40">•</span>
                            <span>{r.product || r.productName}</span>
                            {r.isDemo && (
                              <span className="rounded bg-indigo-50 border border-indigo-200 px-1 py-0.2 text-[9px] font-bold text-indigo-700">
                                DEMO
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-dairy-charcoal/50 font-mono">
                            ID: {r.recordId}
                          </span>
                        </td>

                        {/* Date & Time */}
                        <td className="py-3.5 px-4 text-dairy-charcoal/70">
                          <div>{r.dateTime || `${r.date} ${r.time}`}</div>
                          <span className="text-[10px] font-medium text-dairy-charcoal/50">
                            {r.shift || 'Shift A'}
                          </span>
                        </td>

                        {/* Recoverable Estimated (L) */}
                        <td className="py-3.5 px-4 font-mono font-medium text-dairy-charcoal">
                          {r.recoverableEstimateLiters} L
                        </td>

                        {/* Actual Recovered (L) */}
                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-800">
                          {r.actualRecoveredLiters} L
                        </td>

                        {/* Unrecovered (L) */}
                        <td className="py-3.5 px-4 font-mono font-semibold text-dairy-terracotta">
                          {r.unrecoveredLiters} L
                        </td>

                        {/* Recovery % */}
                        <td className="py-3.5 px-4 font-mono font-bold">
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] ${
                              r.recoveryPercent >= 75
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {r.recoveryPercent}%
                          </span>
                        </td>

                        {/* Unrecovered Loss (₹) */}
                        <td className="py-3.5 px-4 font-bold font-mono text-dairy-olive">
                          ₹{r.unrecoveredLossInr?.toLocaleString() ?? r.financialValueUnrecoveredInr?.toLocaleString()}
                        </td>

                        {/* Quality Verification Status */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            {isVerified && (
                              <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                Verified / Approved
                              </span>
                            )}
                            {isPending && (
                              <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                                <Clock className="h-3 w-3 text-amber-600" />
                                Pending Verification
                              </span>
                            )}
                            {isRejected && (
                              <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-300">
                                <XCircle className="h-3 w-3 text-rose-600" />
                                Rejected / Not Suitable
                              </span>
                            )}

                            <div>
                              {r.productionReady ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700">
                                  <ShieldCheck className="h-2.5 w-2.5" /> Production Ready: Yes
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-dairy-terracotta">
                                  <AlertCircle className="h-2.5 w-2.5" /> Production Ready: No (Held)
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenQCModal(r)}
                              className="rounded-lg border border-dairy-beige bg-white px-2.5 py-1 text-[11px] font-semibold text-dairy-olive hover:bg-dairy-cream transition"
                            >
                              Verify QC
                            </button>
                            <button
                              onClick={() => setExpandedRecordId(isExpanded ? null : r.recordId)}
                              className="rounded-lg p-1 text-dairy-charcoal/60 hover:text-dairy-charcoal hover:bg-dairy-beige/40 transition"
                              title="Toggle QC measurements"
                            >
                              {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded QC Measurements Row */}
                      {isExpanded && (
                        <tr className="bg-dairy-cream/30">
                          <td colSpan={9} className="px-6 py-3 border-t border-dairy-beige/40">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                              {/* Physicochemical Parameters */}
                              <div className="rounded-lg bg-white p-3 border border-dairy-beige/80 space-y-1.5">
                                <div className="flex items-center gap-1.5 font-bold text-dairy-olive">
                                  <Thermometer className="h-3.5 w-3.5 text-dairy-forest" />
                                  <span>Physical Parameters</span>
                                </div>
                                <div className="space-y-1 text-dairy-charcoal/80">
                                  <div className="flex justify-between">
                                    <span>Temperature:</span>
                                    <span
                                      className={`font-mono font-bold ${
                                        r.temperatureCelsius !== null && r.temperatureCelsius > thresholds.maxTemp
                                          ? 'text-rose-700'
                                          : 'text-emerald-700'
                                      }`}
                                    >
                                      {r.temperatureCelsius !== null ? `${r.temperatureCelsius} °C` : 'Not Recorded'}
                                      <span className="text-[10px] text-dairy-charcoal/40 font-normal">
                                        {' '}(max {thresholds.maxTemp}°C)
                                      </span>
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>pH Level:</span>
                                    <span
                                      className={`font-mono font-bold ${
                                        r.phLevel !== null && (r.phLevel < thresholds.minPh || r.phLevel > thresholds.maxPh)
                                          ? 'text-rose-700'
                                          : 'text-emerald-700'
                                      }`}
                                    >
                                      {r.phLevel !== null ? r.phLevel : 'Not Recorded'}
                                      <span className="text-[10px] text-dairy-charcoal/40 font-normal">
                                        {' '}({thresholds.minPh}-{thresholds.maxPh})
                                      </span>
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Solid Composition */}
                              <div className="rounded-lg bg-white p-3 border border-dairy-beige/80 space-y-1.5">
                                <div className="flex items-center gap-1.5 font-bold text-dairy-olive">
                                  <FlaskConical className="h-3.5 w-3.5 text-dairy-forest" />
                                  <span>Milk Solids Composition</span>
                                </div>
                                <div className="space-y-1 text-dairy-charcoal/80">
                                  <div className="flex justify-between">
                                    <span>Fat Content:</span>
                                    <span className="font-mono font-bold text-dairy-olive">
                                      {r.fatPercent !== null ? `${r.fatPercent}%` : 'Not Recorded'}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>SNF (Solids-Not-Fat):</span>
                                    <span className="font-mono font-bold text-dairy-olive">
                                      {r.snfPercent !== null ? `${r.snfPercent}%` : 'Not Recorded'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Microbiological Purity */}
                              <div className="rounded-lg bg-white p-3 border border-dairy-beige/80 space-y-1.5">
                                <div className="flex items-center gap-1.5 font-bold text-dairy-olive">
                                  <ShieldCheck className="h-3.5 w-3.5 text-dairy-forest" />
                                  <span>Microbiological Status</span>
                                </div>
                                <p className="font-medium text-dairy-charcoal text-[11px]">
                                  {r.microbiologicalStatus || 'Standard Microbiological Testing Pass'}
                                </p>
                                <p className="text-[10px] text-dairy-charcoal/60">
                                  FSSAI Schedule 4 Hygienic Recovery Protocol
                                </p>
                              </div>

                              {/* QC Sign-off & Audit Remarks */}
                              <div className="rounded-lg bg-white p-3 border border-dairy-beige/80 space-y-1.5">
                                <div className="flex items-center gap-1.5 font-bold text-dairy-olive">
                                  <Check className="h-3.5 w-3.5 text-dairy-forest" />
                                  <span>QC Audit Details</span>
                                </div>
                                <div className="text-[11px] text-dairy-charcoal/80 space-y-0.5">
                                  <div>Verified By: <span className="font-semibold">{r.qcVerifiedBy || 'Pending'}</span></div>
                                  <div>Timestamp: <span className="font-mono text-[10px]">{r.qcVerifiedAt || 'Awaiting verification'}</span></div>
                                  {r.qcRemarks && (
                                    <p className="text-[10px] italic text-dairy-charcoal/70 pt-0.5 border-t border-dairy-beige">
                                      "{r.qcRemarks}"
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* Modal: Log New Recovery Entry */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="dairy-card w-full max-w-xl p-6 space-y-5 bg-white shadow-2xl rounded-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-dairy-beige">
              <div>
                <h3 className="font-serif font-bold text-lg text-dairy-olive">
                  Log Pre-Rinse Milk Recovery Measurement
                </h3>
                <p className="text-xs text-dairy-charcoal/60">
                  Initial CIP flush milk captured prior to chemical wash cycle
                </p>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                className="rounded-lg p-1 text-dairy-charcoal/50 hover:text-dairy-charcoal hover:bg-dairy-beige/40 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRecovery} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Line Selection */}
                <div className="space-y-1">
                  <label className="font-semibold text-dairy-charcoal">Line Identifier</label>
                  <select
                    value={newForm.lineName}
                    onChange={(e) => setNewForm({ ...newForm, lineName: e.target.value })}
                    className="w-full rounded-lg border border-dairy-beige bg-dairy-cream/40 p-2 text-xs focus:outline-none focus:ring-1 focus:ring-dairy-forest"
                  >
                    <option value="Line 01">Line 01 – Skimmed Milk</option>
                    <option value="Line 02">Line 02 – Full Cream Milk</option>
                    <option value="Line 03">Line 03 – Flavoured Milk</option>
                    <option value="Line 04">Line 04 – Skimmed Milk</option>
                    <option value="Line 05">Line 05 – Full Cream Milk</option>
                    <option value="Line 06">Line 06 – Standardized Toned</option>
                    <option value="Line 07">Line 07 – Cow Milk Line</option>
                  </select>
                </div>

                {/* Product Name */}
                <div className="space-y-1">
                  <label className="font-semibold text-dairy-charcoal">Product Displaced</label>
                  <input
                    type="text"
                    value={newForm.productName}
                    onChange={(e) => setNewForm({ ...newForm, productName: e.target.value })}
                    className="w-full rounded-lg border border-dairy-beige bg-white p-2 text-xs focus:outline-none focus:ring-1 focus:ring-dairy-forest"
                    placeholder="e.g. Skimmed Milk"
                    required
                  />
                </div>

                {/* Shift */}
                <div className="space-y-1">
                  <label className="font-semibold text-dairy-charcoal">Operating Shift</label>
                  <select
                    value={newForm.shift}
                    onChange={(e) => setNewForm({ ...newForm, shift: e.target.value })}
                    className="w-full rounded-lg border border-dairy-beige bg-white p-2 text-xs focus:outline-none focus:ring-1 focus:ring-dairy-forest"
                  >
                    <option value="Shift A">Shift A (06:00 - 14:00)</option>
                    <option value="Shift B">Shift B (14:00 - 22:00)</option>
                    <option value="Shift C">Shift C (22:00 - 06:00)</option>
                  </select>
                </div>

                {/* Operator Name */}
                <div className="space-y-1">
                  <label className="font-semibold text-dairy-charcoal">Operator Name</label>
                  <input
                    type="text"
                    value={newForm.operatorName}
                    onChange={(e) => setNewForm({ ...newForm, operatorName: e.target.value })}
                    className="w-full rounded-lg border border-dairy-beige bg-white p-2 text-xs focus:outline-none focus:ring-1 focus:ring-dairy-forest"
                    required
                  />
                </div>
              </div>

              {/* Volume Measurements */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-dairy-beige">
                <div className="space-y-1">
                  <label className="font-semibold text-dairy-charcoal">
                    Estimated Recoverable Volume (Liters)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    value={newForm.recoverableEstimateLiters}
                    onChange={(e) =>
                      setNewForm({ ...newForm, recoverableEstimateLiters: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full rounded-lg border border-dairy-beige bg-white p-2 text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-dairy-forest"
                    required
                  />
                  <p className="text-[10px] text-dairy-charcoal/50">Line internal holding capacity</p>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-dairy-charcoal">
                    Actual Recovered Volume (Liters)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={newForm.actualRecoveredLiters}
                    onChange={(e) =>
                      setNewForm({ ...newForm, actualRecoveredLiters: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full rounded-lg border border-dairy-beige bg-white p-2 text-xs font-mono font-bold text-emerald-800 focus:outline-none focus:ring-1 focus:ring-dairy-forest"
                    required
                  />
                  <p className="text-[10px] text-dairy-charcoal/50">Flowmeter / recovery vat volume</p>
                </div>
              </div>

              {/* Automated Calculations Card */}
              <div className="rounded-xl border border-dairy-beige bg-dairy-cream/50 p-3.5 space-y-2">
                <div className="font-semibold text-dairy-olive flex items-center justify-between">
                  <span>Automated Balance & Loss Calculation</span>
                  <span className="text-[10px] text-dairy-charcoal/50">@ ₹{thresholds.costPerLiterInr}/L</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                  <div className="rounded-lg bg-white p-2 border border-dairy-beige">
                    <span className="text-[10px] text-dairy-charcoal/60 block">Unrecovered Milk</span>
                    <span className="font-mono font-bold text-dairy-terracotta text-sm">{unrecL} L</span>
                  </div>
                  <div className="rounded-lg bg-white p-2 border border-dairy-beige">
                    <span className="text-[10px] text-dairy-charcoal/60 block">Recovery Rate</span>
                    <span
                      className={`font-mono font-bold text-sm ${
                        recPct >= 75 ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {recPct}%
                    </span>
                  </div>
                  <div className="rounded-lg bg-white p-2 border border-dairy-beige">
                    <span className="text-[10px] text-dairy-charcoal/60 block">Unrecovered Loss</span>
                    <span className="font-mono font-bold text-dairy-olive text-sm">₹{unrecLossInr}</span>
                  </div>
                </div>
                <p className="text-[10px] text-dairy-charcoal/60 text-center">
                  Notice: Newly logged recoveries are marked as <strong>Pending Verification</strong> and held from production until QC approved.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-dairy-beige">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="rounded-lg border border-dairy-beige px-4 py-2 text-xs font-semibold text-dairy-charcoal hover:bg-dairy-beige/30 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-dairy-olive px-4 py-2 text-xs font-semibold text-white hover:bg-dairy-olive/90 transition shadow-sm"
                >
                  Save Recovery Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* Modal: QC Verification Workflow */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      {showQCModal && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="dairy-card w-full max-w-xl p-6 space-y-5 bg-white shadow-2xl rounded-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-dairy-beige">
              <div>
                <h3 className="font-serif font-bold text-lg text-dairy-olive">
                  Quality Verification Workflow
                </h3>
                <p className="text-xs text-dairy-charcoal/60">
                  Batch: {selectedRecord.recordId} • {selectedRecord.line || selectedRecord.lineName} ({selectedRecord.product || selectedRecord.productName})
                </p>
              </div>
              <button
                onClick={() => setShowQCModal(false)}
                className="rounded-lg p-1 text-dairy-charcoal/50 hover:text-dairy-charcoal hover:bg-dairy-beige/40 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleVerifyQC} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                {/* Temperature */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="font-semibold text-dairy-charcoal">Temperature (°C)</label>
                    <span className="text-[10px] text-dairy-charcoal/50">Max: {thresholds.maxTemp}°C</span>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    value={qcForm.temperatureCelsius}
                    onChange={(e) =>
                      setQCForm({ ...qcForm, temperatureCelsius: parseFloat(e.target.value) || 0 })
                    }
                    className={`w-full rounded-lg border p-2 text-xs font-mono font-bold focus:outline-none ${
                      qcForm.temperatureCelsius > thresholds.maxTemp
                        ? 'border-rose-400 bg-rose-50/50 text-rose-800'
                        : 'border-dairy-beige bg-white text-dairy-olive'
                    }`}
                    required
                  />
                  {qcForm.temperatureCelsius > thresholds.maxTemp && (
                    <p className="text-[10px] text-rose-600 font-semibold">
                      Exceeds {thresholds.maxTemp}°C maximum chilling threshold
                    </p>
                  )}
                </div>

                {/* pH Level */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="font-semibold text-dairy-charcoal">pH Level</label>
                    <span className="text-[10px] text-dairy-charcoal/50">
                      Band: {thresholds.minPh} - {thresholds.maxPh}
                    </span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    value={qcForm.phLevel}
                    onChange={(e) => setQCForm({ ...qcForm, phLevel: parseFloat(e.target.value) || 0 })}
                    className={`w-full rounded-lg border p-2 text-xs font-mono font-bold focus:outline-none ${
                      qcForm.phLevel < thresholds.minPh || qcForm.phLevel > thresholds.maxPh
                        ? 'border-rose-400 bg-rose-50/50 text-rose-800'
                        : 'border-dairy-beige bg-white text-dairy-olive'
                    }`}
                    required
                  />
                  {(qcForm.phLevel < thresholds.minPh || qcForm.phLevel > thresholds.maxPh) && (
                    <p className="text-[10px] text-rose-600 font-semibold">
                      pH is outside the safe fresh milk band [{thresholds.minPh} - {thresholds.maxPh}]
                    </p>
                  )}
                </div>

                {/* Fat % */}
                <div className="space-y-1">
                  <label className="font-semibold text-dairy-charcoal">Fat Percentage (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={qcForm.fatPercent}
                    onChange={(e) => setQCForm({ ...qcForm, fatPercent: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-dairy-beige bg-white p-2 text-xs font-mono font-bold text-dairy-olive focus:outline-none focus:ring-1 focus:ring-dairy-forest"
                    required
                  />
                </div>

                {/* SNF % */}
                <div className="space-y-1">
                  <label className="font-semibold text-dairy-charcoal">SNF Percentage (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={qcForm.snfPercent}
                    onChange={(e) => setQCForm({ ...qcForm, snfPercent: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-dairy-beige bg-white p-2 text-xs font-mono font-bold text-dairy-olive focus:outline-none focus:ring-1 focus:ring-dairy-forest"
                    required
                  />
                </div>
              </div>

              {/* Microbiological Purity */}
              <div className="space-y-1">
                <label className="font-semibold text-dairy-charcoal">Microbiological Verification Status</label>
                <select
                  value={qcForm.microbiologicalStatus}
                  onChange={(e) => setQCForm({ ...qcForm, microbiologicalStatus: e.target.value })}
                  className="w-full rounded-lg border border-dairy-beige bg-white p-2 text-xs focus:outline-none focus:ring-1 focus:ring-dairy-forest"
                >
                  <option value="Pass (< 10 CFU/ml)">Pass (&lt; 10 CFU/ml - Rapid Bioluminescence Pass)</option>
                  <option value="Pass - Standard Plate Count Clear">Pass - Standard Plate Count Clear</option>
                  <option value="Pending Culture Incubation (12h)">Pending Culture Incubation (12h)</option>
                  <option value="Failed (Acidic fermentation detected)">Failed (Acidic fermentation detected)</option>
                  <option value="Failed (Microbial count above limit)">Failed (Microbial count above limit)</option>
                </select>
              </div>

              {/* QC Approval Decision */}
              <div className="space-y-1">
                <label className="font-semibold text-dairy-charcoal">QC Approval Status</label>
                <select
                  value={qcForm.qcStatus}
                  onChange={(e) => setQCForm({ ...qcForm, qcStatus: e.target.value })}
                  className="w-full rounded-lg border border-dairy-beige bg-white p-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-dairy-forest"
                >
                  <option value="Verified">Green – Verified / Approved for Production</option>
                  <option value="Pending">Yellow – Pending Laboratory Verification</option>
                  <option value="Rejected">Red – Rejected / Not Suitable for Production</option>
                </select>
              </div>

              {/* QC Inspector & Remarks */}
              <div className="space-y-1">
                <label className="font-semibold text-dairy-charcoal">QC Verified By</label>
                <input
                  type="text"
                  value={qcForm.verifiedBy}
                  onChange={(e) => setQCForm({ ...qcForm, verifiedBy: e.target.value })}
                  className="w-full rounded-lg border border-dairy-beige bg-white p-2 text-xs focus:outline-none focus:ring-1 focus:ring-dairy-forest"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-dairy-charcoal">QC Audit Notes / Destination</label>
                <textarea
                  rows={2}
                  value={qcForm.qcRemarks}
                  onChange={(e) => setQCForm({ ...qcForm, qcRemarks: e.target.value })}
                  placeholder="e.g. Cleared for standardization blending, or diverted to biogas digestor."
                  className="w-full rounded-lg border border-dairy-beige bg-white p-2 text-xs focus:outline-none focus:ring-1 focus:ring-dairy-forest"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-dairy-beige">
                <button
                  type="button"
                  onClick={() => setShowQCModal(false)}
                  className="rounded-lg border border-dairy-beige px-4 py-2 text-xs font-semibold text-dairy-charcoal hover:bg-dairy-beige/30 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-dairy-forest px-4 py-2 text-xs font-semibold text-white hover:bg-dairy-forest/90 transition shadow-sm"
                >
                  Submit QC Verification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* Modal: Admin Thresholds Configuration */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      {showThresholdsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="dairy-card w-full max-w-lg p-6 space-y-5 bg-white shadow-2xl rounded-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-dairy-beige">
              <div>
                <h3 className="font-serif font-bold text-lg text-dairy-olive">
                  Administrator Quality & Valuation Thresholds
                </h3>
                <p className="text-xs text-dairy-charcoal/60">
                  Approved FSSAI food-safety specifications for pre-rinse milk re-entry
                </p>
              </div>
              <button
                onClick={() => setShowThresholdsModal(false)}
                className="rounded-lg p-1 text-dairy-charcoal/50 hover:text-dairy-charcoal hover:bg-dairy-beige/40 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateThresholds} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-dairy-charcoal">
                  Unrecovered Milk Valuation Cost (₹ / Litre)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={threshForm.costPerLiterInr}
                  onChange={(e) =>
                    setThreshForm({ ...threshForm, costPerLiterInr: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full rounded-lg border border-dairy-beige bg-white p-2 text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-dairy-forest"
                  required
                />
                <p className="text-[10px] text-dairy-charcoal/50">Used to automatically calculate Unrecovered Loss (₹)</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-dairy-beige">
                <div className="space-y-1">
                  <label className="font-semibold text-dairy-charcoal">Minimum pH</label>
                  <input
                    type="number"
                    step="0.05"
                    value={threshForm.minPh}
                    onChange={(e) => setThreshForm({ ...threshForm, minPh: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-dairy-beige bg-white p-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-dairy-forest"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-dairy-charcoal">Maximum pH</label>
                  <input
                    type="number"
                    step="0.05"
                    value={threshForm.maxPh}
                    onChange={(e) => setThreshForm({ ...threshForm, maxPh: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-dairy-beige bg-white p-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-dairy-forest"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-dairy-charcoal">Max Temperature (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={threshForm.maxTemp}
                    onChange={(e) => setThreshForm({ ...threshForm, maxTemp: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-dairy-beige bg-white p-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-dairy-forest"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-dairy-charcoal">Min SNF %</label>
                  <input
                    type="number"
                    step="0.1"
                    value={threshForm.minSnf}
                    onChange={(e) => setThreshForm({ ...threshForm, minSnf: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-dairy-beige bg-white p-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-dairy-forest"
                    required
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-dairy-beige">
                <button
                  type="button"
                  onClick={() => setShowThresholdsModal(false)}
                  className="rounded-lg border border-dairy-beige px-4 py-2 text-xs font-semibold text-dairy-charcoal hover:bg-dairy-beige/30 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-dairy-olive px-4 py-2 text-xs font-semibold text-white hover:bg-dairy-olive/90 transition shadow-sm"
                >
                  Save Thresholds
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
