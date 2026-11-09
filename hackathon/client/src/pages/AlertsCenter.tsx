import React, { useState, useEffect } from 'react';
import {
  BellRing,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Zap,
  Scale,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';

interface AlertsCenterProps {
  onNavigate: (tab: string) => void;
}

export const AlertsCenter: React.FC<AlertsCenterProps> = ({ onNavigate }) => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [pillarFilter, setPillarFilter] = useState('All');
  const [severityFilter, setSeverityFilter] = useState('All');

  const fetchAlerts = () => {
    fetch('/api/alerts')
      .then(res => res.json())
      .then(data => setAlerts(data.alerts || []));
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleResolve = (id: string) => {
    fetch(`/api/alerts/${id}/resolve`, {
      method: 'PATCH',
    })
      .then(res => res.json())
      .then(() => fetchAlerts());
  };

  const filteredAlerts = alerts.filter(a => {
    if (pillarFilter !== 'All' && a.pillar !== pillarFilter) return false;
    if (severityFilter !== 'All' && a.severity !== severityFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-dairy-beige">
        <h2 className="text-2xl font-serif font-bold text-dairy-olive">
          Centralized Violation & Alert Dispatch Center
        </h2>
        <p className="text-xs text-dairy-charcoal/70">
          Unified real-time notification engine spanning Energy anomalies, Milk mass losses, and AI Hygiene non-compliance
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="dairy-card p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-bold text-dairy-olive flex items-center gap-1.5">
            <Filter className="h-4 w-4 text-dairy-forest" /> Filter Pillar:
          </span>
          {['All', 'Waste & Loss', 'Energy', 'Hygiene & Cleanliness'].map(p => (
            <button
              key={p}
              onClick={() => setPillarFilter(p)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                pillarFilter === p
                  ? 'bg-dairy-olive text-white'
                  : 'bg-dairy-cream text-dairy-charcoal hover:bg-dairy-beige'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="font-semibold text-dairy-charcoal/70">Severity:</span>
          <select
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value)}
            className="rounded-lg border border-dairy-beige bg-white p-1.5 text-xs font-semibold"
          >
            <option value="All">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
          </select>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {filteredAlerts.map((a) => (
          <div
            key={a.id}
            className={`dairy-card p-5 border-l-4 transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
              a.severity === 'Critical'
                ? 'border-l-dairy-terracotta bg-dairy-terracotta/5'
                : a.severity === 'High'
                ? 'border-l-amber-500 bg-amber-50/20'
                : 'border-l-dairy-forest bg-dairy-cream/20'
            }`}
          >
            <div className="flex items-start gap-3.5 max-w-2xl">
              <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                a.pillar === 'Energy'
                  ? 'bg-amber-100 text-amber-800'
                  : a.pillar === 'Waste & Loss'
                  ? 'bg-dairy-terracotta/20 text-dairy-terracotta'
                  : 'bg-dairy-sage/20 text-dairy-forest'
              }`}>
                {a.pillar === 'Energy' && <Zap className="h-5 w-5" />}
                {a.pillar === 'Waste & Loss' && <Scale className="h-5 w-5" />}
                {a.pillar === 'Hygiene & Cleanliness' && <ShieldCheck className="h-5 w-5" />}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-dairy-charcoal/50">{a.alertId}</span>
                  <span className="text-[10px] uppercase font-bold rounded bg-dairy-beige px-1.5 py-0.2 text-dairy-olive">
                    {a.pillar}
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                    a.severity === 'Critical' ? 'bg-dairy-terracotta text-white' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {a.severity}
                  </span>
                </div>

                <h4 className="font-bold text-sm text-dairy-charcoal">{a.title}</h4>
                <p className="text-xs text-dairy-charcoal/80 leading-relaxed">{a.description}</p>
                <div className="text-[10px] text-dairy-charcoal/50 font-mono">Logged at: {a.timestamp}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
              {a.isResolved ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Resolved
                </span>
              ) : (
                <button
                  onClick={() => handleResolve(a.id)}
                  className="rounded-lg border border-dairy-beige bg-white px-3 py-1.5 text-xs font-semibold text-dairy-olive hover:bg-dairy-cream transition"
                >
                  Mark Resolved
                </button>
              )}

              {a.actionUrl && (
                <button
                  onClick={() => {
                    const tabMap: Record<string, string> = {
                      '/loss-ledger': 'ledger',
                      '/leaks': 'leaks',
                      '/energy': 'energy',
                      '/pre-entry': 'pre-entry',
                      '/equipment': 'equipment',
                    };
                    const target = tabMap[a.actionUrl] || 'overview';
                    onNavigate(target);
                  }}
                  className="flex items-center gap-1.5 rounded-lg bg-dairy-olive px-3.5 py-1.5 text-xs font-bold text-white hover:bg-dairy-forest transition shadow-sm"
                >
                  <span>Investigate</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

