import React, { useState, useEffect } from 'react';
import {
  QrCode,
  ShieldCheck,
  Truck,
  CheckCircle2,
  Calendar,
  Building,
  FileText,
  Printer,
  Search,
  Sparkles,
  Layers,
  FlaskConical,
  Thermometer,
  Clock,
  ArrowRight,
  Copy,
  Check,
  AlertCircle,
  Database,
  RefreshCw,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface DigitalWastePassportProps {
  initialPassportId?: string;
}

export const DigitalWastePassport: React.FC<DigitalWastePassportProps> = ({
  initialPassportId = 'DWP-PASSPORT-IN-WHEY-091',
}) => {
  const [passportsList, setPassportsList] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState(initialPassportId);
  const [passport, setPassport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // QR Scanner / Manual Verification Tool
  const [scanInput, setScanInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // 1. Fetch all available waste batches from database
  const fetchPassportsList = () => {
    fetch('/api/passport/list')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load waste batches');
        return res.json();
      })
      .then((data) => {
        const list = data.passports || [];
        setPassportsList(list);
        if (list.length > 0 && !selectedId) {
          setSelectedId(list[0].passportId);
        }
      })
      .catch((err) => {
        console.error('Error fetching passport list:', err);
      });
  };

  // 2. Fetch specific passport by ID directly from database
  const fetchPassportDetail = (id: string) => {
    if (!id) return;
    setLoading(true);
    setError(null);
    fetch(`/api/passport/${encodeURIComponent(id)}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Passport record not found for "${id}"`);
        return res.json();
      })
      .then((data) => {
        setPassport(data.passport);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching passport detail:', err);
        setError(err.message || 'Failed to load passport');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchPassportsList();
  }, []);

  useEffect(() => {
    if (initialPassportId) {
      setSelectedId(initialPassportId);
    }
  }, [initialPassportId]);

  useEffect(() => {
    if (selectedId) {
      fetchPassportDetail(selectedId);
    }
  }, [selectedId]);

  // Handle manual QR scan input or ID search
  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanInput.trim()) return;

    let targetId = scanInput.trim();
    // If user pasted JSON from the QR code, parse it
    try {
      if (targetId.startsWith('{')) {
        const parsed = JSON.parse(targetId);
        targetId = parsed.passportId || parsed.batchId || targetId;
      }
    } catch {
      // Continue with raw text
    }

    setSelectedId(targetId);
    fetchPassportDetail(targetId);
    setScanInput('');
  };

  const handleCopyPayload = () => {
    if (passport?.qrPayload) {
      navigator.clipboard.writeText(JSON.stringify(passport.qrPayload, null, 2));
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const getCategoryBadgeClass = (category: string) => {
    const cat = category?.toLowerCase() || '';
    if (cat.includes('reusable')) return 'bg-emerald-600 text-white border-emerald-500';
    if (cat.includes('treatable')) return 'bg-amber-600 text-white border-amber-500';
    if (cat.includes('disposal')) return 'bg-red-600 text-white border-red-500';
    return 'bg-dairy-olive text-white border-dairy-forest';
  };

  return (
    <div className="space-y-6">
      {/* ── Header & Action Controls ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-dairy-beige">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-serif font-bold text-dairy-olive">
              Digital Waste Passport & Circular Traceability
            </h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
              <Database className="h-3 w-3 text-emerald-600 animate-pulse" />
              Live Database Connected
            </span>
          </div>
          <p className="text-xs text-dairy-charcoal/70 mt-0.5">
            Cryptographic batch QR identity • Integrated Quality, Storage & Waste Exchange records • Automated chain of custody
          </p>
        </div>

        {/* Database Batch Selector & Print Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Dynamic Database Batch Selector */}
          <div className="flex items-center gap-1.5 rounded-xl border border-dairy-beige bg-white px-2.5 py-1.5 shadow-sm text-xs">
            <Layers className="h-4 w-4 text-dairy-forest flex-shrink-0" />
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="bg-transparent font-bold text-dairy-olive focus:outline-none cursor-pointer text-xs max-w-[220px] sm:max-w-[280px] truncate"
            >
              {passportsList.length === 0 ? (
                <option value="">Loading batches...</option>
              ) : (
                passportsList.map((p) => (
                  <option key={p.passportId} value={p.passportId}>
                    {p.materialName} [{p.batchId}]
                  </option>
                ))
              )}
            </select>
          </div>

          <button
            onClick={() => {
              fetchPassportsList();
              if (selectedId) fetchPassportDetail(selectedId);
            }}
            title="Refresh database records"
            className="flex items-center justify-center p-2 rounded-xl border border-dairy-beige bg-white text-dairy-olive hover:bg-dairy-beige transition shadow-sm"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-xl border border-dairy-beige bg-dairy-olive hover:bg-dairy-forest text-white px-3 py-2 text-xs font-bold transition shadow-sm"
          >
            <Printer className="h-3.5 w-3.5 text-dairy-sage" />
            <span className="hidden sm:inline">Print Passport</span>
          </button>
        </div>
      </div>

      {/* ── QR Code Scanner & Batch ID Lookup Bar ────────────────────────────── */}
      <div className="rounded-2xl border border-dairy-beige bg-dairy-cream/30 p-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-dairy-forest flex-shrink-0" />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-dairy-olive">
                QR Scanner & Live Database Resolver
              </h4>
              <p className="text-[11px] text-dairy-charcoal/60">
                Gate inspectors and logistics coordinators can scan or enter any Batch ID / Passport ID to load verified records.
              </p>
            </div>
          </div>

          <form onSubmit={handleScanSubmit} className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-dairy-charcoal/40" />
              <input
                type="text"
                placeholder="Scan / paste QR code or enter Batch ID (e.g. BATCH-WST-101)..."
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                className="w-full rounded-xl border border-dairy-beige bg-white pl-9 pr-3 py-1.5 text-xs text-dairy-olive focus:outline-none focus:ring-1 focus:ring-dairy-forest"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-dairy-forest hover:bg-dairy-olive text-white text-xs font-bold transition whitespace-nowrap shadow-sm"
            >
              Verify Record
            </button>
          </form>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-300 text-red-900 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Main Digital Waste Passport Document ──────────────────────────────── */}
      {passport && (
        <div className="dairy-card overflow-hidden border-2 border-dairy-forest/40 bg-white shadow-md">
          {/* Passport Top Banner */}
          <div className="bg-dairy-olive p-6 text-dairy-ivory flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-dairy-sage/20 px-3 py-0.5 text-xs font-bold text-dairy-sage border border-dairy-sage/30">
                <ShieldCheck className="h-3.5 w-3.5" />
                Verified Digital Circular Waste Passport
              </div>
              <h3 className="text-2xl font-serif font-bold tracking-tight text-white">
                {passport.materialName}
              </h3>
              <div className="flex flex-wrap items-center gap-3 text-xs text-dairy-ivory/80 font-mono">
                <span>Passport ID: <strong className="text-white">{passport.passportId}</strong></span>
                <span>•</span>
                <span>Batch Ref: <strong className="text-white">#{passport.batchId}</strong></span>
                <span>•</span>
                <span>FSSAI: {passport.fssaiLicense}</span>
              </div>
            </div>

            <div className="flex flex-col items-start md:items-end gap-1.5">
              <span
                className={`px-4 py-1.5 rounded-full font-bold text-xs shadow-sm uppercase tracking-wider border ${getCategoryBadgeClass(
                  passport.category
                )}`}
              >
                Classification: {passport.category}
              </span>
              <span className="text-[11px] text-dairy-ivory/70 font-mono">
                Generated: {passport.generationDate}
              </span>
            </div>
          </div>

          {/* Real-time Chain of Custody Stepper Bar */}
          <div className="bg-dairy-cream/60 px-6 py-3 border-b border-dairy-beige flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-dairy-charcoal/70 uppercase tracking-wider text-[11px]">
                Chain of Custody Status:
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
                {passport.chainOfCustodyStatus}
              </span>
            </div>
            <div className="text-[11px] text-dairy-charcoal/60">
              Origin: <strong className="text-dairy-olive">{passport.originFacility}</strong> &rarr; Destination:{' '}
              <strong className="text-dairy-olive">{passport.destinationFacility}</strong>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2 Columns: Multi-Module Database Records */}
            <div className="lg:col-span-2 space-y-6">
              {/* Module 1: Waste Management & Batch Specifications */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1.5 border-b border-dairy-beige">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-dairy-forest" />
                    <h4 className="font-serif font-bold text-sm text-dairy-olive">
                      1. Waste Batch & Generation Specifications
                    </h4>
                  </div>
                  <span className="text-[10px] font-semibold text-dairy-charcoal/50">
                    Source: Waste Management Module
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="rounded-xl border border-dairy-beige bg-dairy-cream/30 p-3 space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-dairy-charcoal/60">
                      Waste Type
                    </span>
                    <p className="font-bold text-dairy-olive">{passport.wasteType}</p>
                  </div>

                  <div className="rounded-xl border border-dairy-beige bg-dairy-cream/30 p-3 space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-dairy-charcoal/60">
                      Certified Quantity
                    </span>
                    <p className="font-bold font-mono text-dairy-olive text-sm">{passport.quantity}</p>
                  </div>

                  <div className="rounded-xl border border-dairy-beige bg-dairy-cream/30 p-3 space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-dairy-charcoal/60">
                      Department & Unit
                    </span>
                    <p className="font-bold text-dairy-olive">{passport.department}</p>
                  </div>

                  <div className="rounded-xl border border-dairy-beige bg-dairy-cream/30 p-3 space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-dairy-charcoal/60">
                      Production Stage
                    </span>
                    <p className="font-semibold text-dairy-olive">{passport.productionStage}</p>
                  </div>

                  <div className="rounded-xl border border-dairy-beige bg-dairy-cream/30 p-3 space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-dairy-charcoal/60">
                      Contamination Status
                    </span>
                    <p className="font-semibold text-dairy-olive">{passport.contaminationStatus}</p>
                  </div>

                  <div className="rounded-xl border border-dairy-beige bg-dairy-cream/30 p-3 space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-dairy-charcoal/60">
                      AI Categorization
                    </span>
                    <p className="font-semibold text-dairy-olive">
                      {passport.aiSuggestedCategory} ({passport.aiConfidence})
                    </p>
                  </div>

                  <div className="sm:col-span-3 rounded-xl border border-dairy-beige bg-dairy-cream/30 p-3 space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-dairy-charcoal/60">
                      Batch Reason & Generation Notes
                    </span>
                    <p className="text-dairy-charcoal/80 font-normal">{passport.reason}</p>
                  </div>
                </div>
              </div>

              {/* Module 2: Quality Management Integration Readings */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1.5 border-b border-dairy-beige">
                  <div className="flex items-center gap-2">
                    <FlaskConical className="h-4 w-4 text-dairy-forest" />
                    <h4 className="font-serif font-bold text-sm text-dairy-olive">
                      2. Laboratory Quality & Chemical Analytics
                    </h4>
                  </div>
                  <span className="text-[10px] font-semibold text-dairy-charcoal/50">
                    Source: Quality Management Module
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="rounded-xl border border-dairy-beige bg-dairy-cream/30 p-3 space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-dairy-charcoal/60">
                      QC Status
                    </span>
                    <p className="font-bold text-dairy-olive">{passport.qcStatus}</p>
                  </div>

                  <div className="rounded-xl border border-dairy-beige bg-dairy-cream/30 p-3 space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-dairy-charcoal/60">
                      QC Certificate #
                    </span>
                    <p className="font-mono font-bold text-dairy-olive truncate">{passport.qcCertificateNumber}</p>
                  </div>

                  <div className="rounded-xl border border-dairy-beige bg-dairy-cream/30 p-3 space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-dairy-charcoal/60">
                      pH Level
                    </span>
                    <p className="font-mono font-bold text-dairy-olive">{passport.phLevel}</p>
                  </div>

                  <div className="rounded-xl border border-dairy-beige bg-dairy-cream/30 p-3 space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-dairy-charcoal/60">
                      Fat Content
                    </span>
                    <p className="font-mono font-bold text-dairy-olive">{passport.fatPercent}</p>
                  </div>

                  <div className="rounded-xl border border-dairy-beige bg-dairy-cream/30 p-3 space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-dairy-charcoal/60">
                      SNF / Dry Matter
                    </span>
                    <p className="font-mono font-bold text-dairy-olive">{passport.snfPercent}</p>
                  </div>

                  <div className="rounded-xl border border-dairy-beige bg-dairy-cream/30 p-3 space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-dairy-charcoal/60">
                      Microbial Purity
                    </span>
                    <p className="font-semibold text-dairy-olive truncate">{passport.microbialPurity}</p>
                  </div>

                  <div className="rounded-xl border border-dairy-beige bg-dairy-cream/30 p-3 space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-dairy-charcoal/60">
                      Sample Temp
                    </span>
                    <p className="font-mono font-bold text-dairy-olive">{passport.temperature}</p>
                  </div>

                  <div className="rounded-xl border border-dairy-beige bg-dairy-cream/30 p-3 space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-dairy-charcoal/60">
                      Moisture %
                    </span>
                    <p className="font-mono font-bold text-dairy-olive">{passport.moisturePercent}</p>
                  </div>

                  <div className="col-span-2 sm:col-span-4 rounded-xl border border-dairy-beige bg-dairy-cream/30 p-3 space-y-0.5">
                    <div className="flex items-center justify-between text-[10px] font-bold text-dairy-charcoal/60">
                      <span>QC Lead / Verified By: {passport.qcVerifiedBy}</span>
                    </div>
                    <p className="text-dairy-charcoal/80 text-xs font-normal">{passport.qualityRemarks}</p>
                  </div>
                </div>
              </div>

              {/* Module 3: Storage & Holding Facility Details */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1.5 border-b border-dairy-beige">
                  <div className="flex items-center gap-2">
                    <Thermometer className="h-4 w-4 text-dairy-forest" />
                    <h4 className="font-serif font-bold text-sm text-dairy-olive">
                      3. Storage & Safe Holding Specifications
                    </h4>
                  </div>
                  <span className="text-[10px] font-semibold text-dairy-charcoal/50">
                    Source: Storage Management Module
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="rounded-xl border border-dairy-beige bg-dairy-cream/30 p-3 space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-dairy-charcoal/60">
                      Storage Condition
                    </span>
                    <p className="font-bold text-dairy-olive">{passport.storageCondition}</p>
                  </div>

                  <div className="rounded-xl border border-dairy-beige bg-dairy-cream/30 p-3 space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-dairy-charcoal/60">
                      Tank / Silo / Bay ID
                    </span>
                    <p className="font-mono font-bold text-dairy-olive">{passport.storageTankOrBay}</p>
                  </div>

                  <div className="rounded-xl border border-dairy-beige bg-dairy-cream/30 p-3 space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-dairy-charcoal/60">
                      Facility Location
                    </span>
                    <p className="font-semibold text-dairy-olive">{passport.storageLocation}</p>
                  </div>

                  <div className="rounded-xl border border-dairy-beige bg-dairy-cream/30 p-3 space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-dairy-charcoal/60">
                      Storage Temperature
                    </span>
                    <p className="font-semibold text-dairy-olive">{passport.storageTemperature}</p>
                  </div>

                  <div className="rounded-xl border border-dairy-beige bg-dairy-cream/30 p-3 space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-dairy-charcoal/60">
                      Max Shelf Life
                    </span>
                    <p className="font-mono font-bold text-dairy-olive">{passport.shelfLifeHours}</p>
                  </div>

                  <div className="rounded-xl border border-dairy-beige bg-dairy-cream/30 p-3 space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-dairy-charcoal/60">
                      Handling Precautions
                    </span>
                    <p className="font-normal text-dairy-charcoal/80 text-[11px] truncate" title={passport.handlingPrecautions}>
                      {passport.handlingPrecautions}
                    </p>
                  </div>
                </div>
              </div>

              {/* Module 4: Inter-Industry Exchange & Complete Historical Ledger */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1.5 border-b border-dairy-beige">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-dairy-forest" />
                    <h4 className="font-serif font-bold text-sm text-dairy-olive">
                      4. Historical Custody Transactions & Logistics Ledger
                    </h4>
                  </div>
                  <span className="text-[10px] font-semibold text-dairy-charcoal/50">
                    Source: Waste Exchange Module
                  </span>
                </div>

                {/* Receiving Industry Banner */}
                <div className="rounded-xl border border-dairy-beige bg-dairy-cream/40 p-3 text-xs grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-dairy-charcoal/60">
                      Designated Receiving Industry:
                    </span>
                    <p className="font-bold text-dairy-olive text-sm">{passport.receivingIndustry}</p>
                    <p className="text-[11px] text-dairy-charcoal/70">{passport.destinationFacility}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-dairy-charcoal/60">
                      Authorized Transport & Driver:
                    </span>
                    <p className="font-mono font-bold text-dairy-olive">{passport.transportVehicleNumber}</p>
                    <p className="text-[11px] text-dairy-charcoal/70">Driver: {passport.driverName}</p>
                  </div>
                </div>

                {/* Historical Exchange Ledger Table (Requirement 12: Preserving history without overwriting) */}
                <div className="rounded-xl border border-dairy-beige overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-dairy-olive text-dairy-ivory text-[10px] uppercase font-bold tracking-wider">
                      <tr>
                        <th className="p-2.5">Step / Action</th>
                        <th className="p-2.5">Partner Industry</th>
                        <th className="p-2.5">Vehicle / Logistics</th>
                        <th className="p-2.5">Date & Time</th>
                        <th className="p-2.5">Signatory</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dairy-beige bg-white">
                      {passport.chainOfCustody && passport.chainOfCustody.length > 0 ? (
                        passport.chainOfCustody.map((step: any, idx: number) => (
                          <tr key={idx} className="hover:bg-dairy-cream/30 transition">
                            <td className="p-2.5">
                              <span className="font-bold text-dairy-olive">{step.step}</span>
                              {step.notes && step.notes !== 'Not Recorded' && (
                                <p className="text-[10px] text-dairy-charcoal/60 mt-0.5">{step.notes}</p>
                              )}
                            </td>
                            <td className="p-2.5 font-semibold text-dairy-forest">
                              {step.partnerIndustry}
                            </td>
                            <td className="p-2.5 font-mono text-[11px] text-dairy-charcoal/70">
                              {step.vehicleNumber}
                              {step.driverName && step.driverName !== 'Not Recorded' && ` (${step.driverName})`}
                            </td>
                            <td className="p-2.5 font-mono text-[11px] text-dairy-charcoal/60 whitespace-nowrap">
                              {step.timestamp}
                            </td>
                            <td className="p-2.5 font-semibold text-dairy-olive">
                              {step.signedBy}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-dairy-charcoal/60">
                            No exchange transactions recorded yet for this batch.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Column: Dynamic Cryptographic QR Code & Verification */}
            <div className="flex flex-col items-center justify-between rounded-2xl border-2 border-dashed border-dairy-sage/60 bg-dairy-cream/20 p-6 text-center space-y-5">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-dairy-forest bg-dairy-sage/20 px-2.5 py-1 rounded-full border border-dairy-sage/30">
                  Cryptographic Verification Seal
                </span>
                <h4 className="font-serif font-bold text-base text-dairy-olive">
                  Unique Batch QR Identifier
                </h4>
                <p className="text-[11px] text-dairy-charcoal/60 max-w-xs">
                  Directly encodes live database parameters for gate scanning and inter-industry custody verification.
                </p>
              </div>

              {/* Scannable SVG QR Code */}
              <div className="rounded-2xl bg-white p-4 shadow-lg border-2 border-dairy-olive">
                <QRCodeSVG
                  value={JSON.stringify(passport.qrPayload || { passportId: passport.passportId })}
                  size={190}
                  level="H"
                  includeMargin={false}
                />
              </div>

              <div className="space-y-2 w-full text-left bg-white p-3.5 rounded-xl border border-dairy-beige text-xs">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-dairy-charcoal/60">Encoded Batch:</span>
                  <span className="font-mono font-bold text-dairy-olive">{passport.batchId}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-dairy-charcoal/60">QC Status:</span>
                  <span className="font-bold text-emerald-800">{passport.qcStatus}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-dairy-charcoal/60">Verified Recipient:</span>
                  <span className="font-bold text-dairy-forest truncate max-w-[130px]" title={passport.receivingIndustry}>
                    {passport.receivingIndustry}
                  </span>
                </div>
              </div>

              <div className="w-full space-y-2">
                <button
                  type="button"
                  onClick={handleCopyPayload}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-dairy-beige bg-dairy-cream/60 py-2 text-xs font-bold text-dairy-olive hover:bg-dairy-beige transition shadow-sm"
                >
                  {copySuccess ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4 text-dairy-forest" />}
                  <span>{copySuccess ? 'QR Payload Copied!' : 'Copy Raw QR Payload'}</span>
                </button>

                <p className="text-[10px] text-dairy-charcoal/50 leading-relaxed">
                  Receiving facilities, transport drivers, and regulatory inspectors scan this code to confirm laboratory purity certificates and log automated receipt.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
