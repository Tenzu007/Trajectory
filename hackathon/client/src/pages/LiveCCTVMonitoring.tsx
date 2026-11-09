import React, { useState, useEffect } from 'react';
import {
  Video,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Eye,
  Radio,
  SlidersHorizontal,
} from 'lucide-react';

export const LiveCCTVMonitoring: React.FC = () => {
  const [cameras, setCameras] = useState<any[]>([]);
  const [violations, setViolations] = useState<any[]>([]);
  const [activeCamId, setActiveCamId] = useState('CAM-03');

  useEffect(() => {
    fetch('/api/hygiene/cctv-cameras')
      .then(res => res.json())
      .then(data => setCameras(data.cameras || []));

    fetch('/api/hygiene/cctv-violations')
      .then(res => res.json())
      .then(data => setViolations(data.violations || []));
  }, []);

  const activeCam = cameras.find(c => c.id === activeCamId) || cameras[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-dairy-beige">
        <div>
          <h2 className="text-2xl font-serif font-bold text-dairy-olive">
            Continuous CCTV-Based Hygiene Surveillance
          </h2>
          <p className="text-xs text-dairy-charcoal/70">
            Connected to existing plant RTSP camera streams • Zero new hardware • Real-time OpenCV & YOLO violation detection
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200">
            <Radio className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />
            4 Active Streams
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-dairy-terracotta/10 px-3 py-1 text-xs font-semibold text-dairy-terracotta border border-dairy-terracotta/20">
            {violations.length} Real-Time Flags
          </span>
        </div>
      </div>

      {/* Main CCTV Matrix Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Selected Camera Live Stream Viewport */}
        <div className="dairy-card p-5 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-dairy-beige">
            <div className="flex items-center gap-2">
              <Video className="h-5 w-5 text-dairy-forest" />
              <div>
                <h3 className="font-serif font-bold text-lg text-dairy-olive">
                  {activeCam?.name} [{activeCam?.id}]
                </h3>
                <p className="text-xs text-dairy-charcoal/60">Location: {activeCam?.location}</p>
              </div>
            </div>
            <span className="text-xs font-mono font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
              {activeCam?.status}
            </span>
          </div>

          {/* Video Stream Viewport */}
          <div className="relative rounded-2xl bg-dairy-charcoal aspect-video w-full overflow-hidden flex items-center justify-center text-white border-2 border-dairy-olive shadow-lg">
            {/* Live Camera Grid Graphic Overlay */}
            <div className="absolute top-3 left-3 bg-black/60 px-2 py-1 rounded text-[10px] font-mono font-bold text-white flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-600 animate-ping" />
              REC • RTSP STREAM • {activeCam?.id}
            </div>

            <div className="absolute top-3 right-3 bg-black/60 px-2 py-1 rounded text-[10px] font-mono text-dairy-sage">
              2026-11-05 10:14:32 IST
            </div>

            {/* Dual Green & Red AI Detection Boxes Overlaid on CCTV Stream */}
            {/* 🟢 Green Box: Hairnet Correctly Worn */}
            <div className="absolute top-[22%] left-[48%] w-24 h-12 border-2 border-emerald-500 bg-emerald-500/15 rounded-md p-1 flex flex-col justify-between shadow-lg">
              <span className="bg-emerald-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded w-fit shadow">
                HYGIENIC: Hairnet (98%)
              </span>
            </div>

            {/* 🔴 Red Box: Missing Face Mask on Operator */}
            <div className="absolute top-[32%] left-[47%] w-28 h-14 border-2 border-red-500 bg-red-500/15 rounded-md p-1 flex flex-col justify-between animate-pulse shadow-lg">
              <span className="bg-red-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded w-fit shadow">
                UNHYGIENIC: Missing Mask (96%)
              </span>
              <span className="text-[8px] font-mono bg-black/80 text-white px-1 py-0.2 rounded w-fit self-end">
                Operator #4
              </span>
            </div>

            {/* 🟢 Green Box: Clean Protective Uniform */}
            <div className="absolute top-[44%] left-[45%] w-36 h-28 border-2 border-emerald-500 bg-emerald-500/15 rounded-md p-1 flex flex-col justify-between shadow-lg">
              <span className="bg-emerald-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded w-fit shadow">
                HYGIENIC: Clean Uniform (95%)
              </span>
            </div>

            {/* 🟢 Green Box: Sanitized Stainless Steel Machinery */}
            <div className="absolute top-[28%] left-[12%] w-48 h-36 border-2 border-emerald-500 bg-emerald-500/15 rounded-md p-1 flex flex-col justify-between shadow-lg">
              <span className="bg-emerald-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded w-fit shadow">
                HYGIENIC: Machinery Clean (92%)
              </span>
            </div>

            {/* 🔴 Red Box: Localized Floor Liquid Spill */}
            {activeCamId === 'CAM-01' && (
              <div className="absolute bottom-[14%] right-[22%] w-32 h-16 border-2 border-red-500 bg-red-500/20 rounded-md p-1 flex flex-col justify-between animate-pulse shadow-lg">
                <span className="bg-red-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded w-fit shadow">
                  UNHYGIENIC: Food Spillage (97%)
                </span>
                <span className="text-[7px] text-white/90 bg-black/60 px-1 rounded">
                  Raw Milk Ponding
                </span>
              </div>
            )}

            {/* Silhouette Representation of Dairy Line */}
            <div className="space-y-4 text-center opacity-30">
              <div className="flex gap-8 justify-center items-end">
                <div className="h-32 w-16 bg-white/20 rounded-t-lg" />
                <div className="h-44 w-24 bg-white/30 rounded-t-xl" />
                <div className="h-28 w-20 bg-white/20 rounded-t-lg" />
              </div>
              <div className="text-xs font-mono tracking-widest text-white/50">
                [ RTSP://192.168.1.140:554/H264/CH01 ]
              </div>
            </div>
          </div>

          {/* Quick Camera Grid Switcher */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {cameras.map(c => (
              <button
                key={c.id}
                onClick={() => setActiveCamId(c.id)}
                className={`p-3 rounded-xl border text-left transition ${
                  activeCamId === c.id
                    ? 'border-dairy-olive bg-dairy-cream shadow-sm font-bold'
                    : 'border-dairy-beige bg-white hover:bg-dairy-cream/50'
                }`}
              >
                <div className="text-xs font-bold text-dairy-olive">{c.id}</div>
                <div className="text-[11px] text-dairy-charcoal/80 truncate">{c.name}</div>
                <div className="mt-1 flex items-center justify-between text-[10px]">
                  <span className="text-dairy-charcoal/50">{c.location}</span>
                  {c.violationsToday > 0 && (
                    <span className="rounded bg-dairy-terracotta/20 px-1 font-bold text-dairy-terracotta">
                      {c.violationsToday} alerts
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Live Violation Feed & Supervisor Review */}
        <div className="dairy-card p-5 space-y-4">
          <div className="pb-3 border-b border-dairy-beige flex items-center justify-between">
            <h3 className="font-serif font-bold text-base text-dairy-olive">
              Real-Time Violation Alerts
            </h3>
            <span className="text-[10px] font-bold text-dairy-terracotta bg-dairy-terracotta/10 px-2 py-0.5 rounded border border-dairy-terracotta/20">
              CCTV AI Evidence
            </span>
          </div>

          <div className="space-y-3">
            {violations.map((v) => (
              <div key={v.id} className="rounded-xl border border-dairy-beige bg-white p-3.5 space-y-2 hover:border-dairy-sage transition">
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono text-dairy-charcoal/50 font-bold">{v.violationId}</span>
                    <h4 className="font-bold text-xs text-dairy-terracotta flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      {v.category}
                    </h4>
                  </div>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                    v.severity === 'Critical' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {v.severity}
                  </span>
                </div>

                <div className="text-[11px] text-dairy-charcoal/70">
                  Camera: <strong className="text-dairy-charcoal">{v.cameraName}</strong> ({v.location})
                </div>

                <div className="text-[10px] text-dairy-charcoal/50 font-mono">
                  Captured: {v.timestamp} • AI Confidence: {v.confidenceScorePercent}%
                </div>

                {v.correctiveActionTaken && (
                  <div className="rounded bg-dairy-cream/60 p-2 text-[10px] text-dairy-charcoal/80 space-y-0.5">
                    <span className="font-bold text-dairy-forest">Corrective Action Taken:</span>
                    <p>{v.correctiveActionTaken}</p>
                  </div>
                )}

                <div className="pt-1 flex items-center justify-between border-t border-dairy-beige text-[11px]">
                  <span className="text-dairy-charcoal/60">Supervisor: {v.assignedSupervisor}</span>
                  <span className="font-semibold text-dairy-olive">{v.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

