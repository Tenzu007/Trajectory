import React, { useState, useEffect, useRef } from 'react';
import {
  UserCheck,
  ShieldAlert,
  ShieldCheck,
  Camera,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  Video,
  Play,
  Square,
  RotateCcw,
  Bell,
  ChevronDown,
  ChevronUp,
  User,
  Info,
} from 'lucide-react';

export const BiometricPreEntry: React.FC = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [preEntries, setPreEntries] = useState<any[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('DP-2041');

  // Camera & AI Scanner State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<any>(null);
  const [scanCount, setScanCount] = useState(0);
  const [activeAlerts, setActiveAlerts] = useState<string[]>([]);
  const [supervisorNotified, setSupervisorNotified] = useState(false);
  const [showDemoOverrides, setShowDemoOverrides] = useState(false);

  // Manual Demo Overrides (Secondary Kiosk Controls)
  const [hasHairnet, setHasHairnet] = useState(true);
  const [hasMask, setHasMask] = useState(true);
  const [hasApron, setHasApron] = useState(true);
  const [hasGloves, setHasGloves] = useState(true);
  const [hasShoes, setHasShoes] = useState(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scanIntervalRef = useRef<any>(null);

  const fetchHistory = () => {
    fetch('/api/hygiene/employees')
      .then((res) => res.json())
      .then((data) => setEmployees(data.employees || []));

    fetch('/api/hygiene/pre-entries')
      .then((res) => res.json())
      .then((data) => setPreEntries(data.preEntries || []));
  };

  useEffect(() => {
    fetchHistory();
    return () => {
      stopCamera();
    };
  }, []);

  // ── Web Camera Controls ───────────────────────────────────────────────────
  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
      setIsScanning(true);
      // Run first frame check immediately
      setTimeout(() => captureAndVerifyFrame(), 600);
    } catch (err: any) {
      console.warn('Webcam permission or device error:', err);
      setCameraError(
        'Could not access local USB/webcam. If camera is unavailable, you can use the Standalone Station Simulator or upload snapshots below.'
      );
      // Enable simulation mode so user can test the workflow
      setIsCameraActive(false);
      setIsScanning(true);
      captureAndVerifyFrame();
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setIsCameraActive(false);
    setIsScanning(false);
  };

  // Capture frame from video element and send to AI backend
  const captureAndVerifyFrame = () => {
    let frameBase64: string | null = null;

    if (videoRef.current && isCameraActive && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          frameBase64 = canvas.toDataURL('image/jpeg', 0.8);
        }
      }
    }

    // Payload: If manual overrides are active (kiosk testing), pass explicit toggles
    // Otherwise pass pure camera frame for real AI computer vision verification
    const payload: any = {
      employeeId: selectedEmployeeId,
      cameraLocation: 'Gate A - Processing Hall Airlock',
      frameBase64: frameBase64,
    };

    if (showDemoOverrides) {
      const missing: string[] = [];
      if (!hasHairnet) missing.push('Hairnet');
      if (!hasMask) missing.push('Face Mask');
      if (!hasApron) missing.push('Clean Apron');
      if (!hasGloves) missing.push('Protective Gloves');
      if (!hasShoes) missing.push('Safety Footwear');

      payload.hairnet = hasHairnet;
      payload.faceMask = hasMask;
      payload.apron = hasApron;
      payload.gloves = hasGloves;
      payload.safetyShoes = hasShoes;
      payload.simulateMissingPpe = missing;
    }

    fetch('/api/hygiene/verify-webcam-frame', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((data) => {
        setScanResult(data);
        setActiveAlerts(data.alerts || []);
        setScanCount((c) => c + 1);
        setSupervisorNotified(false);
        fetchHistory();
      })
      .catch((err) => {
        console.error('Frame verification error:', err);
      });
  };

  // Continuous scanning loop when active
  useEffect(() => {
    if (isScanning) {
      scanIntervalRef.current = setInterval(() => {
        captureAndVerifyFrame();
      }, 2500);
      return () => {
        if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
      };
    }
  }, [isScanning, selectedEmployeeId, hasHairnet, hasMask, hasApron, hasGloves, hasShoes]);

  const handleNotifySupervisor = () => {
    setSupervisorNotified(true);
    // Send alert to notification center
    fetch('/api/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pillar: 'AI Hygiene',
        title: `Pre-Entry Violation: ${selectedEmployee?.name || selectedEmployeeId}`,
        description: `Worker failed airlock inspection: ${activeAlerts.join('; ')}. Turnstile remains interlocked.`,
        severity: 'High',
        department: selectedEmployee?.department || 'Processing Airlock',
      }),
    }).catch(() => {});
  };

  const selectedEmployee = employees.find((e) => e.employeeId === selectedEmployeeId) || employees[0];
  const isYellow = scanResult?.statusTone === 'yellow' || scanResult?.preEntryStatus?.includes('YELLOW');
  const isGreen = (scanResult?.isApproved ?? false) || (scanResult?.statusTone === 'green' && !isYellow);
  const isRed = scanResult && !isGreen && !isYellow;

  return (
    <div className="space-y-6">
      {/* Hidden offscreen canvas for frame extraction */}
      <canvas ref={canvasRef} className="hidden" />

      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div className="pb-4 border-b border-dairy-beige flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-dairy-olive">
            Standalone AI Pre-Entry Hygiene & PPE Verification
          </h2>
          <p className="text-xs text-dairy-charcoal/70">
            Real-time USB/Laptop webcam inspection • AI object detection for Hairnet, Mask, Apron & Gloves • Turnstile Airlock Interlock
          </p>
        </div>

        {/* Selected Employee Badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-dairy-beige bg-white text-xs font-semibold text-dairy-olive shadow-sm">
            <User className="h-4 w-4 text-dairy-forest" />
            <span>Worker:</span>
            <select
              value={selectedEmployeeId}
              onChange={(e) => {
                setSelectedEmployeeId(e.target.value);
                setScanResult(null);
              }}
              className="bg-transparent font-bold text-dairy-olive focus:outline-none cursor-pointer"
            >
              {employees.map((emp) => (
                <option key={emp.employeeId} value={emp.employeeId}>
                  {emp.name} ({emp.employeeId})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Status Banner (Pre-Entry Decision) ─────────────────────────────────── */}
      <div
        className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm transition-all ${
          !scanResult
            ? 'bg-dairy-cream/60 border-dairy-beige text-dairy-olive'
            : isGreen
            ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
            : isYellow
            ? 'bg-amber-50 border-amber-300 text-amber-950'
            : 'bg-red-50 border-red-300 text-red-950'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-xl text-white ${
              !scanResult
                ? 'bg-dairy-olive'
                : isGreen
                ? 'bg-emerald-600'
                : isYellow
                ? 'bg-amber-500'
                : 'bg-red-600 animate-pulse'
            }`}
          >
            {!scanResult ? (
              <Camera className="h-6 w-6" />
            ) : isGreen ? (
              <ShieldCheck className="h-6 w-6" />
            ) : isYellow ? (
              <AlertTriangle className="h-6 w-6" />
            ) : (
              <ShieldAlert className="h-6 w-6" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-dairy-charcoal/60">
                Airlock Turnstile Status:
              </span>
              <span
                className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                  !scanResult
                    ? 'bg-dairy-cream text-dairy-olive border border-dairy-beige'
                    : isGreen
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : isYellow
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-red-100 text-red-800 border border-red-300'
                }`}
              >
                {!scanResult
                  ? 'READY TO SCAN'
                  : isGreen
                  ? 'UNLOCKED • ENTRY PERMITTED'
                  : isYellow
                  ? 'INTERLOCKED • VERIFICATION REQUIRED'
                  : 'INTERLOCKED • ACCESS DENIED'}
              </span>
            </div>

            <h3 className="text-lg font-serif font-bold mt-0.5">
              {scanResult?.preEntryStatus || 'STAND IN FRONT OF CAMERA TO BEGIN VERIFICATION'}
            </h3>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {!isScanning ? (
            <button
              onClick={startCamera}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-dairy-olive hover:bg-dairy-forest text-white text-xs font-bold transition shadow-sm"
            >
              <Play className="h-4 w-4 text-dairy-sage" />
              Start Live Camera Scan
            </button>
          ) : (
            <>
              <button
                onClick={captureAndVerifyFrame}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-dairy-beige hover:bg-dairy-cream text-dairy-olive text-xs font-bold transition shadow-sm"
              >
                <RotateCcw className="h-4 w-4 text-dairy-forest" />
                Rescan Frame
              </button>
              <button
                onClick={stopCamera}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-sm"
              >
                <Square className="h-3.5 w-3.5 fill-current" />
                Stop Camera
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Main Station Layout (Camera + Checklist + Alerts) ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Live Camera Viewport with Real-Time Bounding Boxes */}
        <div className="dairy-card p-6 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-dairy-beige">
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-dairy-forest" />
              <h3 className="font-serif font-bold text-lg text-dairy-olive">
                Airlock Entry Camera Scanner
              </h3>
            </div>
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
              {isCameraActive ? 'Webcam Live (USB / Laptop Camera)' : 'Camera Ready (Standalone)'}
            </span>
          </div>

          {/* Camera Viewport with SVG Bounding Box Overlays */}
          <div className="relative rounded-2xl bg-dairy-charcoal aspect-video w-full overflow-hidden flex items-center justify-center text-white border-2 border-dairy-olive shadow-inner">
            {/* Live Video Feed */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${!isCameraActive ? 'hidden' : 'block'}`}
            />

            {/* Fallback Graphic when Webcam is inactive or not connected */}
            {!isCameraActive && (
              <div className="flex flex-col items-center justify-center p-6 text-center space-y-3 z-10">
                <div className="relative">
                  <div className="h-24 w-24 rounded-full border-4 border-dairy-sage/60 bg-dairy-forest/40 flex items-center justify-center">
                    <User className="h-12 w-12 text-dairy-sage" />
                  </div>
                  <div className="h-28 w-44 rounded-t-3xl border-4 border-dairy-sage/60 bg-dairy-forest/40 -mt-2" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-dairy-ivory">
                    Worker: {selectedEmployee?.name} [{selectedEmployee?.employeeId}]
                  </p>
                  <p className="text-xs text-dairy-sage/80 max-w-sm">
                    Click <strong>"Start Live Camera Scan"</strong> to activate your USB/laptop webcam, or use simulated controls below.
                  </p>
                </div>
              </div>
            )}

            {/* Inspection Guide Wireframe Box */}
            <div className="absolute inset-8 border border-white/20 rounded-xl pointer-events-none flex flex-col justify-between p-3 z-20">
              <div className="flex justify-between items-start">
                <span className="rounded bg-black/75 px-2.5 py-1 text-[10px] font-mono font-semibold text-dairy-sage border border-dairy-sage/40">
                  Target: {selectedEmployee?.name} [{selectedEmployee?.employeeId}]
                </span>
                <span className="rounded bg-black/75 px-2.5 py-1 text-[10px] font-mono text-white/90">
                  Confidence: {scanResult?.confidencePercent || '97%'}
                </span>
              </div>
              <div className="text-center">
                <span className="rounded-full bg-black/60 px-3 py-1 text-[10px] font-semibold text-white/80">
                  Inspection Guide: Please face the camera with hairnet, mask, apron & gloves visible
                </span>
              </div>
            </div>

            {/* ── Real-Time Bounding Box Overlays (SVG) ─────────────────────────── */}
            {scanResult?.boundingBoxes && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-30">
                {scanResult.boundingBoxes.map((box: any, i: number) => {
                  const nb = box.boxNormalized || { x: 0.3, y: 0.2, width: 0.4, height: 0.5 };
                  const isHygienic = box.status === 'Hygienic';
                  const isUncertain = box.status === 'Uncertain';
                  const stroke = isHygienic ? '#22c55e' : isUncertain ? '#f59e0b' : '#ef4444';
                  const fill = isHygienic ? '#22c55e20' : isUncertain ? '#f59e0b20' : '#ef444425';

                  return (
                    <g key={i}>
                      <rect
                        x={`${nb.x * 100}%`}
                        y={`${nb.y * 100}%`}
                        width={`${nb.width * 100}%`}
                        height={`${nb.height * 100}%`}
                        fill={fill}
                        stroke={stroke}
                        strokeWidth="2.5"
                        rx="4"
                      />
                      {/* Attached Label to Top Border */}
                      <foreignObject
                        x={`${nb.x * 100}%`}
                        y={`${Math.max(2, nb.y * 100 - 4)}%`}
                        width="240"
                        height="30"
                        className="overflow-visible"
                      >
                        <div
                          style={{ backgroundColor: stroke }}
                          className="inline-block text-[9px] font-bold text-white px-2 py-0.5 rounded shadow-md whitespace-nowrap"
                        >
                          {box.status.toUpperCase()}: {box.label}
                        </div>
                      </foreignObject>
                    </g>
                  );
                })}
              </svg>
            )}
          </div>

          {cameraError && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-800">
              <Info className="h-4 w-4 text-amber-600 flex-shrink-0" />
              <span>{cameraError}</span>
            </div>
          )}

          {/* ── Interactive Demo & Kiosk Overrides (Collapsible) ─────────────── */}
          <div className="rounded-xl border border-dairy-beige bg-dairy-cream/20 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowDemoOverrides(!showDemoOverrides)}
              className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-bold text-dairy-olive bg-dairy-cream/40 hover:bg-dairy-cream/70 transition"
            >
              <span>PPE Interactive Tester & Manual Override Controls</span>
              {showDemoOverrides ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            {showDemoOverrides && (
              <div className="p-4 space-y-3 border-t border-dairy-beige">
                <p className="text-[11px] text-dairy-charcoal/70">
                  Toggle individual PPE states to simulate real-world violations (e.g. worker entering without gloves or mask):
                </p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setHasHairnet(!hasHairnet)}
                    className={`px-3 py-1.5 rounded-lg border font-semibold transition ${
                      hasHairnet
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-red-400 bg-red-100 text-red-800 font-bold'
                    }`}
                  >
                    Hairnet: {hasHairnet ? 'Covered' : 'EXPOSED'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setHasMask(!hasMask)}
                    className={`px-3 py-1.5 rounded-lg border font-semibold transition ${
                      hasMask
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-red-400 bg-red-100 text-red-800 font-bold'
                    }`}
                  >
                    Face Mask: {hasMask ? 'Properly Worn' : 'MISSING'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setHasApron(!hasApron)}
                    className={`px-3 py-1.5 rounded-lg border font-semibold transition ${
                      hasApron
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-red-400 bg-red-100 text-red-800 font-bold'
                    }`}
                  >
                    Apron: {hasApron ? 'Clean Coat' : 'MISSING'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setHasGloves(!hasGloves)}
                    className={`px-3 py-1.5 rounded-lg border font-semibold transition ${
                      hasGloves
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-red-400 bg-red-100 text-red-800 font-bold'
                    }`}
                  >
                    Gloves: {hasGloves ? 'Worn on Hands' : 'BARE HANDS'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setHasShoes(!hasShoes)}
                    className={`px-3 py-1.5 rounded-lg border font-semibold transition ${
                      hasShoes
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-red-400 bg-red-100 text-red-800 font-bold'
                    }`}
                  >
                    Footwear: {hasShoes ? 'Sanitized' : 'UNVERIFIED'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: PPE Checklist & Instant Hygiene Alerts */}
        <div className="space-y-6">
          {/* Active Hygiene Alerts Box */}
          {activeAlerts.length > 0 && (
            <div className="dairy-card p-5 border-2 border-red-300 bg-red-50/80 space-y-3 rounded-2xl shadow-sm">
              <div className="flex items-center gap-2 text-red-900 font-bold font-serif">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <span>Instant Hygiene Alerts Flagged</span>
              </div>

              <div className="space-y-2">
                {activeAlerts.map((alertText, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-white border border-red-200 text-xs font-semibold text-red-800 flex items-start gap-2 shadow-xs"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600 mt-1.5 flex-shrink-0" />
                    <span>{alertText}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleNotifySupervisor}
                  disabled={supervisorNotified}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white text-xs font-bold transition shadow-sm"
                >
                  <Bell className="h-4 w-4" />
                  {supervisorNotified ? 'Supervisor Notified via Central Alerts' : 'Notify Shift Supervisor'}
                </button>
              </div>
            </div>
          )}

          {/* Individual PPE Compliance Checklist */}
          <div className="dairy-card p-5 space-y-4 rounded-2xl">
            <div className="pb-3 border-b border-dairy-beige flex items-center justify-between">
              <h3 className="font-serif font-bold text-base text-dairy-olive">
                Mandatory PPE Checklist
              </h3>
              <span className="text-[11px] font-mono text-dairy-forest font-bold">
                {selectedEmployee?.complianceScore || 96}% 30-Day Avg
              </span>
            </div>

            <div className="space-y-2.5">
              {/* Item 1: Hairnet */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-dairy-beige bg-white">
                <div className="flex items-center gap-2.5">
                  {hasHairnet ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  )}
                  <div>
                    <div className="text-xs font-bold text-dairy-olive">Sanitary Hairnet</div>
                    <div className="text-[10px] text-dairy-charcoal/60">
                      {hasHairnet ? 'Covering hair completely' : 'Exposed hair detected'}
                    </div>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    hasHairnet ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {hasHairnet ? '98%' : 'FAILED'}
                </span>
              </div>

              {/* Item 2: Face Mask */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-dairy-beige bg-white">
                <div className="flex items-center gap-2.5">
                  {hasMask ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  )}
                  <div>
                    <div className="text-xs font-bold text-dairy-olive">Protective Face Mask</div>
                    <div className="text-[10px] text-dairy-charcoal/60">
                      {hasMask ? 'Properly worn over nose & mouth' : 'Mask missing / misaligned'}
                    </div>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    hasMask ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {hasMask ? '96%' : 'FAILED'}
                </span>
              </div>

              {/* Item 3: Clean Apron */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-dairy-beige bg-white">
                <div className="flex items-center gap-2.5">
                  {hasApron ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  )}
                  <div>
                    <div className="text-xs font-bold text-dairy-olive">Clean Food-Grade Apron</div>
                    <div className="text-[10px] text-dairy-charcoal/60">
                      {hasApron ? 'Clean protective uniform' : 'Apron missing or stained'}
                    </div>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    hasApron ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {hasApron ? '95%' : 'FAILED'}
                </span>
              </div>

              {/* Item 4: Protective Gloves */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-dairy-beige bg-white">
                <div className="flex items-center gap-2.5">
                  {hasGloves ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  )}
                  <div>
                    <div className="text-xs font-bold text-dairy-olive">Nitrile Protective Gloves</div>
                    <div className="text-[10px] text-dairy-charcoal/60">
                      {hasGloves ? 'Worn on both hands' : 'Bare hands detected'}
                    </div>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    hasGloves ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {hasGloves ? '94%' : 'FAILED'}
                </span>
              </div>

              {/* Item 5: Safety Footwear */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-dairy-beige bg-white">
                <div className="flex items-center gap-2.5">
                  {hasShoes ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  )}
                  <div>
                    <div className="text-xs font-bold text-dairy-olive">Safety Footwear / Boots</div>
                    <div className="text-[10px] text-dairy-charcoal/60">
                      {hasShoes ? 'Sanitized boots verified' : 'Boots unverified'}
                    </div>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    hasShoes ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {hasShoes ? '95%' : 'FAILED'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Inspection History Audit Trail ───────────────────────────────────── */}
      <div className="dairy-card overflow-hidden">
        <div className="p-5 border-b border-dairy-beige flex items-center justify-between">
          <div>
            <h3 className="font-serif font-bold text-lg text-dairy-olive">
              Airlock Turnstile Pre-Entry Verification History
            </h3>
            <p className="text-xs text-dairy-charcoal/60">
              Immutable electronic audit trail of worker entrance verifications
            </p>
          </div>
          <span className="text-xs font-mono font-semibold text-dairy-charcoal/70">
            {preEntries.length} Recorded Entries
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-dairy-cream/60 text-dairy-olive font-semibold border-b border-dairy-beige">
              <tr>
                <th className="py-3 px-4">Verification ID</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Worker Identification</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Pre-Entry Status</th>
                <th className="py-3 px-4">Turnstile Decision</th>
                <th className="py-3 px-4">Confidence</th>
                <th className="py-3 px-4">Missing PPE / Violations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dairy-beige/60">
              {preEntries.slice(0, 10).map((entry) => {
                const isPass = entry.status === 'Passed';
                return (
                  <tr key={entry.id} className="hover:bg-dairy-cream/30 transition">
                    <td className="py-3 px-4 font-mono font-bold text-dairy-olive">
                      {entry.id}
                    </td>
                    <td className="py-3 px-4 font-mono text-dairy-charcoal/70">
                      {entry.timestamp}
                    </td>
                    <td className="py-3 px-4 font-semibold text-dairy-olive">
                      {entry.employeeName} ({entry.employeeId})
                    </td>
                    <td className="py-3 px-4 text-dairy-charcoal/80">
                      {entry.department}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isPass
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {isPass ? 'CLEARED' : 'RESTRICTED'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-dairy-olive">
                      {entry.entryDecision}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-800">
                      {entry.confidenceScore}
                    </td>
                    <td className="py-3 px-4 text-dairy-terracotta font-semibold">
                      {entry.missingItems?.length > 0 ? entry.missingItems.join(', ') : 'None (Full PPE)'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
