import React, { useState, useEffect } from 'react';
import {
  Repeat,
  Sparkles,
  TrendingUp,
  MapPin,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Send,
  QrCode,
} from 'lucide-react';

interface IndustrialExchangePlatformProps {
  onNavigateToPassport: (passportId: string) => void;
}

export const IndustrialExchangePlatform: React.FC<IndustrialExchangePlatformProps> = ({ onNavigateToPassport }) => {
  const [matches, setMatches] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<string[]>(['EX-01']);

  useEffect(() => {
    fetch('/api/marketplace/matches')
      .then(res => res.json())
      .then(data => setMatches(data.matches || []));

    fetch('/api/marketplace/demand-predictions')
      .then(res => res.json())
      .then(data => setPredictions(data.predictions || []));
  }, []);

  const handleSendRequest = (match: any) => {
    const id = match.id;
    if (!sentRequests.includes(id)) {
      setSentRequests([...sentRequests, id]);
    }

    const batchId =
      match.batchId ||
      (match.sourceMaterial?.toLowerCase().includes('sludge') || match.material?.toLowerCase().includes('sludge')
        ? 'PASSPORT-IN-SLUDGE-042'
        : 'PASSPORT-IN-WHEY-091');

    fetch('/api/marketplace/transaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        batchId: batchId,
        partnerIndustry: match.partnerIndustry || match.partnerName || 'Circular Exchange Partner',
        receivingFacility: `${match.partnerIndustry || match.partnerName} Commercial Facility`,
        action: 'Circular Exchange Inquiry & Logistics Scheduled',
        vehicleNumber: 'MH-12-QZ-4091',
        driverName: 'Vijay Shinde',
        agreedPriceInr: match.pricePerLiterInr || 4.5,
        quantity: match.availableQuantity || match.quantityLiters || 3500,
        unit: match.unit || 'Liters',
        notes: `Inter-industry offtake scheduled for ${match.sourceMaterial || match.material}. Compatibility: ${
          match.compatibilityScorePercent || 94
        }%.`,
      }),
    }).catch(console.error);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-dairy-beige">
        <div>
          <h2 className="text-2xl font-serif font-bold text-dairy-olive">
            Industrial Waste-to-Resource Exchange Marketplace
          </h2>
          <p className="text-xs text-dairy-charcoal/70">
            Reverse industrial matching • Converting verified by-products into secondary raw materials • Demand forecasting
          </p>
        </div>

        <button
          onClick={() => onNavigateToPassport('PASSPORT-IN-WHEY-091')}
          className="inline-flex items-center gap-1.5 rounded-xl border border-dairy-forest bg-dairy-forest/10 px-4 py-2 text-xs font-semibold text-dairy-forest transition hover:bg-dairy-forest hover:text-white shadow-sm"
        >
          <QrCode className="h-4 w-4" />
          <span>View Active Digital Waste Passports</span>
        </button>
      </div>

      {/* Reverse Matching Cards Grid (PRD Section 16 & 17) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Repeat className="h-5 w-5 text-dairy-forest" />
            <h3 className="font-serif font-bold text-lg text-dairy-olive">
              AI Reverse Industrial Matching Matches
            </h3>
          </div>
          <span className="text-xs font-semibold text-dairy-forest bg-dairy-sage/20 px-3 py-1 rounded-lg border border-dairy-sage/30">
            Circular Economy Engine
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {matches.map((m) => {
            const isSent = sentRequests.includes(m.id);
            return (
              <div key={m.id} className="dairy-card p-5 space-y-4 flex flex-col justify-between dairy-card-hover border-dairy-sage/40">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-dairy-forest tracking-wider">
                        Available By-Product
                      </span>
                      <h4 className="font-bold text-base text-dairy-olive mt-0.5">{m.sourceMaterial}</h4>
                      <p className="text-xs text-dairy-charcoal/60 font-mono">
                        {m.availableQuantity?.toLocaleString()} {m.unit}
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
                      {m.compatibilityScorePercent}% Match
                    </span>
                  </div>

                  {/* Partner Industry Profile */}
                  <div className="rounded-xl border border-dairy-beige bg-dairy-cream/50 p-3 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-dairy-olive">{m.partnerIndustry}</span>
                      <span className="flex items-center gap-1 text-[11px] text-dairy-charcoal/60">
                        <MapPin className="h-3 w-3 text-dairy-forest" /> {m.distanceKm} km
                      </span>
                    </div>
                    <div className="text-[11px] text-dairy-charcoal/80 font-medium">{m.suggestedMaterialUse}</div>
                  </div>

                  {/* Financial Recovery Projection */}
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-dairy-beige">
                    <span className="text-dairy-charcoal/70">Estimated Net Value:</span>
                    <span className="text-sm font-bold font-mono text-emerald-800">
                      +₹{m.estimatedNetValueInr?.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  {isSent ? (
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Request Dispatched
                      </span>
                      <button
                        onClick={() =>
                          onNavigateToPassport(
                            m.batchId ||
                              (m.sourceMaterial?.toLowerCase().includes('sludge') || m.material?.toLowerCase().includes('sludge')
                                ? 'DWP-PASSPORT-IN-SLUDGE-042'
                                : 'DWP-PASSPORT-IN-WHEY-091')
                          )
                        }
                        className="text-xs font-bold text-dairy-forest hover:underline flex items-center gap-1"
                      >
                        Passport QR &rarr;
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSendRequest(m)}
                      className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-dairy-olive py-2 text-xs font-bold text-white hover:bg-dairy-forest transition"
                    >
                      <Send className="h-3.5 w-3.5" />
                      Send Circular Exchange Request
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Industrial Resource Demand Prediction (PRD Section 19) */}
      <div className="dairy-card p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-dairy-beige">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-dairy-forest" />
              <h3 className="font-serif font-bold text-lg text-dairy-olive">
                Upcoming Industrial Resource Demand Forecast
              </h3>
            </div>
            <p className="text-xs text-dairy-charcoal/60 mt-0.5">
              Predictive models analyzing regional industrial consumption history and seasonal purchase patterns
            </p>
          </div>
          <span className="text-xs font-semibold text-dairy-olive bg-dairy-cream px-3 py-1 rounded-lg border border-dairy-beige">
            Next 30 Days Forecast
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {predictions.map((p, idx) => (
            <div key={idx} className="rounded-xl border border-dairy-beige bg-dairy-cream/30 p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-xs text-dairy-olive">{p.material}</h4>
                  <span className="text-[11px] text-dairy-charcoal/60">{p.targetSector}</span>
                </div>
                <span className="rounded bg-dairy-sage/20 px-2 py-0.5 text-[10px] font-bold text-dairy-forest">
                  {p.confidenceScore} Conf.
                </span>
              </div>

              <div>
                <div className="text-xl font-bold font-serif text-dairy-olive font-mono">
                  {p.predictedQuantity?.toLocaleString()} {p.unit}
                </div>
                <div className="text-[11px] text-emerald-800 font-semibold">{p.historicalGrowth}</div>
              </div>

              <div className="pt-2 border-t border-dairy-beige flex items-center justify-between text-xs">
                <span className="text-dairy-charcoal/60 text-[11px]">Potential Revenue:</span>
                <span className="font-bold text-emerald-800 font-mono">₹{p.estimatedRevenueInr?.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

