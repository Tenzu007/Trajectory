import React, { useState, useRef, useEffect } from 'react';
import {
  FileVideo,
  Image as ImageIcon,
  UploadCloud,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Play,
  Download,
  ShieldCheck,
  X,
  Film,
  Eye,
  Check,
  Layers,
  Info,
} from 'lucide-react';

type ScannerMode = 'video' | 'image';

export const VideoHygieneScanner: React.FC = () => {
  // Top level mode: Video vs Image
  const [scannerMode, setScannerMode] = useState<ScannerMode>('video');

  // ══════════════════════════════════════════════════════════════════════════════
  // 1. VIDEO HYGIENE SCANNER STATE
  // ══════════════════════════════════════════════════════════════════════════════
  const [videoSourceType, setVideoSourceType] = useState<'upload' | 'sample'>('upload');
  const [selectedSampleVideo, setSelectedSampleVideo] = useState('CCTV_Packaging_Line4_ShiftB.mp4');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [isVideoScanning, setIsVideoScanning] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoReport, setVideoReport] = useState<any>(null);
  const [videoViewMode, setVideoViewMode] = useState<'annotated' | 'original'>('annotated');
  const [videoErrorMessage, setVideoErrorMessage] = useState<string | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const videoPlayerRef = useRef<HTMLVideoElement | null>(null);

  // ══════════════════════════════════════════════════════════════════════════════
  // 2. IMAGE HYGIENE SCANNER STATE
  // ══════════════════════════════════════════════════════════════════════════════
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isImageScanning, setIsImageScanning] = useState(false);
  const [imageProgress, setImageProgress] = useState(0);
  const [imageReport, setImageReport] = useState<any>(null);
  const [imageViewMode, setImageViewMode] = useState<'annotated' | 'original' | 'interactive'>('annotated');
  const [selectedDetectionId, setSelectedDetectionId] = useState<string | null>(null);
  const [imageErrorMessage, setImageErrorMessage] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (videoPreviewUrl && videoPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(videoPreviewUrl);
      }
      if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [videoPreviewUrl, imagePreviewUrl]);

  // ────────────────────────────────────────────────────────────────────────────
  // VIDEO HANDLERS
  // ────────────────────────────────────────────────────────────────────────────
  const handleVideoSelect = (file: File) => {
    if (file.type.startsWith('video/') || /\.(mp4|avi|mov|mkv|webm)$/i.test(file.name)) {
      if (videoPreviewUrl && videoPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(videoPreviewUrl);
      }
      const url = URL.createObjectURL(file);
      setVideoFile(file);
      setVideoPreviewUrl(url);
      setVideoReport(null);
      setVideoErrorMessage(null);
    } else {
      setVideoErrorMessage('Please upload a supported video format (.MP4, .MOV, .AVI, .MKV).');
    }
  };

  const handleVideoDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleVideoSelect(e.dataTransfer.files[0]);
    }
  };

  const handleRunVideoAnalysis = async () => {
    setIsVideoScanning(true);
    setVideoProgress(10);
    setVideoReport(null);
    setVideoErrorMessage(null);

    const progressTimer = setInterval(() => {
      setVideoProgress((prev) => (prev >= 90 ? 90 : prev + 12));
    }, 450);

    try {
      let res: Response;
      if (videoSourceType === 'upload' && videoFile) {
        const formData = new FormData();
        formData.append('file', videoFile);
        res = await fetch('/api/hygiene/upload-and-scan', {
          method: 'POST',
          body: formData,
        });
      } else {
        res = await fetch('/api/hygiene/scan-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoFileName: selectedSampleVideo }),
        });
      }

      const data = await res.json();
      clearInterval(progressTimer);

      if (!res.ok) {
        throw new Error(data.detail || 'Video analysis failed. Please check the video format.');
      }

      setVideoProgress(100);
      setTimeout(() => {
        setIsVideoScanning(false);
        setVideoReport(data.report);
        setVideoViewMode('annotated');
      }, 500);
    } catch (err: any) {
      clearInterval(progressTimer);
      setIsVideoScanning(false);
      setVideoErrorMessage(err.message || 'Error occurred while processing video frames.');
    }
  };

  const handleSeekVideo = (timestampSec: number) => {
    if (videoPlayerRef.current) {
      videoPlayerRef.current.currentTime = timestampSec;
      videoPlayerRef.current.play();
    }
  };

  const handleExportVideoCSV = () => {
    if (!videoReport) return;
    const items = videoReport.findings || videoReport.detectedViolations || [];
    const headers = [
      'Timestamp',
      'Frame #',
      'Condition Status',
      'Category',
      'Finding Label',
      'Confidence',
      'Severity',
      'Description',
      'Corrective Action',
    ];
    const rows = items.map((f: any) => [
      `"${f.timestampFormatted || f.timestamp || ''}"`,
      f.frameNumber || '',
      `"${f.status || (f.severity === 'High' ? 'Unhygienic' : 'Hygienic')}"`,
      `"${f.category || f.location || ''}"`,
      `"${f.label || f.category || ''}"`,
      `"${f.confidencePercent || f.confidence || ''}"`,
      `"${f.severity || 'None'}"`,
      `"${(f.description || f.evidenceNote || '').replace(/"/g, '""')}"`,
      `"${(f.correctiveAction || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `Video_Hygiene_Audit_${videoReport.fileName || 'report'}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ────────────────────────────────────────────────────────────────────────────
  // IMAGE HANDLERS
  // ────────────────────────────────────────────────────────────────────────────
  const handleImageSelect = (file: File) => {
    if (file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(file.name)) {
      if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
      const url = URL.createObjectURL(file);
      setImageFile(file);
      setImagePreviewUrl(url);
      setImageReport(null);
      setImageErrorMessage(null);
      setSelectedDetectionId(null);
    } else {
      setImageErrorMessage('Please upload a supported image format (.JPG, .JPEG, .PNG, .WEBP).');
    }
  };

  const handleImageDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageSelect(e.dataTransfer.files[0]);
    }
  };

  const handleRunImageAnalysis = async () => {
    if (!imageFile) {
      setImageErrorMessage('Please select or drop an image file first.');
      return;
    }

    setIsImageScanning(true);
    setImageProgress(15);
    setImageReport(null);
    setImageErrorMessage(null);

    const progressTimer = setInterval(() => {
      setImageProgress((prev) => (prev >= 90 ? 90 : prev + 25));
    }, 300);

    try {
      const formData = new FormData();
      formData.append('file', imageFile);

      const res = await fetch('/api/hygiene/scan-image', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      clearInterval(progressTimer);

      if (!res.ok) {
        throw new Error(data.detail || 'Image analysis failed. Please verify the image file.');
      }

      setImageProgress(100);
      setTimeout(() => {
        setIsImageScanning(false);
        setImageReport(data.report);
        setImageViewMode('annotated');
      }, 400);
    } catch (err: any) {
      clearInterval(progressTimer);
      setIsImageScanning(false);
      setImageErrorMessage(err.message || 'Error occurred while performing AI image inference.');
    }
  };

  const handleExportImageCSV = () => {
    if (!imageReport || !imageReport.detections) return;
    const headers = [
      'Detection ID',
      'Condition Status',
      'Category',
      'Label',
      'Confidence',
      'Severity',
      'Bounding Box [x,y,w,h]',
      'Description',
      'Corrective Action',
    ];
    const rows = imageReport.detections.map((d: any) => [
      `"${d.id}"`,
      `"${d.status}"`,
      `"${d.category}"`,
      `"${d.label}"`,
      `"${d.confidencePercent}"`,
      `"${d.severity}"`,
      `"[${(d.box || []).join(',')}]"`,
      `"${(d.description || '').replace(/"/g, '""')}"`,
      `"${(d.correctiveAction || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `Image_Hygiene_Audit_${imageReport.imageFileName || 'report'}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header ───────────────────────────────────────────────────────── */}
      <div className="pb-4 border-b border-dairy-beige flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-dairy-olive">
            AI-Powered Video & Image Hygiene Scanner
          </h2>
          <p className="text-xs text-dairy-charcoal/70 mt-0.5">
            Computer vision detection of PPE compliance, machinery sanitation, and surface cleanliness with green & red bounding boxes
          </p>
        </div>

        {/* ── Primary Mode Selector Tabs ───────────────────────────────────────── */}
        <div className="flex bg-dairy-cream/60 p-1 rounded-2xl border border-dairy-beige shadow-inner">
          <button
            type="button"
            onClick={() => setScannerMode('video')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              scannerMode === 'video'
                ? 'bg-dairy-olive text-white shadow-sm'
                : 'text-dairy-olive/70 hover:text-dairy-olive'
            }`}
          >
            <FileVideo className="h-4 w-4" />
            Video Hygiene Scanner
          </button>
          <button
            type="button"
            onClick={() => setScannerMode('image')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              scannerMode === 'image'
                ? 'bg-dairy-olive text-white shadow-sm'
                : 'text-dairy-olive/70 hover:text-dairy-olive'
            }`}
          >
            <ImageIcon className="h-4 w-4" />
            Image Hygiene Scanner
          </button>
        </div>
      </div>

      {/* ── Bounding Box Legend Banner ─────────────────────────────────────────── */}
      <div className="dairy-card px-5 py-3 bg-white border-dairy-beige/90 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-bold text-dairy-olive">
          <ShieldCheck className="h-4 w-4 text-dairy-forest" />
          <span>AI Detection Bounding Box Legend:</span>
        </div>
        <div className="flex flex-wrap items-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded border-2 border-emerald-500 bg-emerald-500/20" />
            <span className="font-semibold text-emerald-800">
              Green Box: Hygienic Condition (Full PPE, Clean Machinery, Sanitized Surface)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded border-2 border-red-500 bg-red-500/20" />
            <span className="font-semibold text-red-700">
              Red Box: Unhygienic Condition (Missing PPE, Spills, Residue, Stains)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded border-2 border-amber-500 bg-amber-500/20" />
            <span className="font-semibold text-amber-700">
              Amber Box: Uncertain / Low Confidence
            </span>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {/* OPTION 1: VIDEO HYGIENE SCANNER                                            */}
      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {scannerMode === 'video' && (
        <div className="space-y-6">
          {/* Video Sub-mode: Upload custom file vs Preloaded Plant CCTV */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setVideoSourceType('upload')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                videoSourceType === 'upload'
                  ? 'bg-dairy-forest text-white'
                  : 'bg-white border border-dairy-beige text-dairy-olive hover:bg-dairy-cream'
              }`}
            >
              <UploadCloud className="h-3.5 w-3.5" />
              Upload CCTV Video (.MP4, .MOV, .AVI)
            </button>
            <button
              type="button"
              onClick={() => setVideoSourceType('sample')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                videoSourceType === 'sample'
                  ? 'bg-dairy-forest text-white'
                  : 'bg-white border border-dairy-beige text-dairy-olive hover:bg-dairy-cream'
              }`}
            >
              <Film className="h-3.5 w-3.5" />
              Preloaded Plant CCTV Samples
            </button>
          </div>

          {/* Video Upload & Action Box */}
          <div className="dairy-card p-6 space-y-5 border-2 border-dashed border-dairy-forest/40 bg-dairy-cream/20 rounded-2xl">
            {videoSourceType === 'upload' ? (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleVideoDrop}
                className="space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-dairy-olive p-3 text-dairy-ivory">
                      <UploadCloud className="h-6 w-6 text-dairy-sage" />
                    </div>
                    <div>
                      <h3 className="font-serif font-bold text-lg text-dairy-olive">
                        Upload Video for AI Computer Vision Hygiene Audit
                      </h3>
                      <p className="text-xs text-dairy-charcoal/60 mt-0.5">
                        Supports MP4, MOV, AVI CCTV recordings from packaging, processing, and airlock halls
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/mp4,video/avi,video/quicktime,video/x-matroska,video/webm,video/*"
                      onChange={(e) => e.target.files?.[0] && handleVideoSelect(e.target.files[0])}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => videoInputRef.current?.click()}
                      className="rounded-xl border border-dairy-beige bg-white px-4 py-2 text-xs font-bold text-dairy-olive hover:bg-dairy-cream transition shadow-sm"
                    >
                      Browse Video...
                    </button>

                    <button
                      onClick={handleRunVideoAnalysis}
                      disabled={isVideoScanning || !videoFile}
                      className="flex items-center gap-2 rounded-xl bg-dairy-olive px-5 py-2 text-xs font-bold text-white hover:bg-dairy-forest transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isVideoScanning ? (
                        <>
                          <Sparkles className="h-4 w-4 animate-spin text-dairy-sage" />
                          Analyzing Frames...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 text-dairy-sage" />
                          Analyse Video
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {videoFile && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-dairy-beige/80 text-xs text-dairy-olive">
                    <div className="flex items-center gap-2.5">
                      <FileVideo className="h-5 w-5 text-dairy-forest" />
                      <span className="font-bold">{videoFile.name}</span>
                      <span className="text-dairy-charcoal/50">
                        ({(videoFile.size / (1024 * 1024)).toFixed(2)} MB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setVideoFile(null);
                        setVideoPreviewUrl(null);
                        setVideoReport(null);
                      }}
                      className="p-1 rounded-lg hover:bg-dairy-cream text-dairy-charcoal/60 hover:text-dairy-terracotta"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-dairy-olive p-3 text-dairy-ivory">
                    <Film className="h-6 w-6 text-dairy-sage" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-lg text-dairy-olive">
                      Select Preloaded Plant CCTV Recording
                    </h3>
                    <p className="text-xs text-dairy-charcoal/60 mt-0.5">
                      Test multi-object hygiene computer vision on standardized shift footage
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <select
                    value={selectedSampleVideo}
                    onChange={(e) => setSelectedSampleVideo(e.target.value)}
                    className="rounded-xl border border-dairy-beige bg-white p-2 text-xs font-semibold text-dairy-olive"
                  >
                    <option value="CCTV_Packaging_Line4_ShiftB.mp4">CCTV_Packaging_Line4_ShiftB.mp4 (Conveyor & Airlock)</option>
                    <option value="CCTV_Receiving_Bay1_ShiftA.mp4">CCTV_Receiving_Bay1_ShiftA.mp4 (Raw Milk Reception)</option>
                    <option value="CCTV_Pasteurizer_Hall_Night.mp4">CCTV_Pasteurizer_Hall_Night.mp4 (Pasteurizer CIP Clean)</option>
                  </select>

                  <button
                    onClick={handleRunVideoAnalysis}
                    disabled={isVideoScanning}
                    className="flex items-center gap-2 rounded-xl bg-dairy-olive px-5 py-2 text-xs font-bold text-white hover:bg-dairy-forest transition shadow-sm disabled:opacity-50"
                  >
                    {isVideoScanning ? (
                      <>
                        <Sparkles className="h-4 w-4 animate-spin text-dairy-sage" />
                        Analyzing Frames...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 text-dairy-sage" />
                        Analyse Video
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {videoErrorMessage && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
                <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
                <span>{videoErrorMessage}</span>
              </div>
            )}

            {isVideoScanning && (
              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-xs font-semibold text-dairy-olive">
                  <span>Extracting frames via OpenCV & performing multi-object hygiene evaluation...</span>
                  <span>{videoProgress}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-dairy-beige">
                  <div
                    className="h-full bg-dairy-forest transition-all duration-300 rounded-full"
                    style={{ width: `${videoProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Video Player & Bounding Box Viewport */}
          {(videoPreviewUrl || videoReport) && (
            <div className="dairy-card overflow-hidden">
              <div className="p-4 border-b border-dairy-beige flex flex-wrap items-center justify-between gap-3 bg-dairy-cream/40">
                <div className="flex items-center gap-2 text-xs font-bold text-dairy-olive">
                  <FileVideo className="h-4 w-4 text-dairy-forest" />
                  <span>
                    {videoReport ? 'Analysed Video Playback (Green / Red Bounding Boxes Overlaid)' : 'Uploaded Video Preview'}
                  </span>
                </div>

                {videoReport && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-dairy-charcoal/60 font-semibold mr-1">View Stream:</span>
                    <button
                      type="button"
                      onClick={() => setVideoViewMode('annotated')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        videoViewMode === 'annotated'
                          ? 'bg-dairy-olive text-white'
                          : 'bg-white border border-dairy-beige text-dairy-olive hover:bg-dairy-cream'
                      }`}
                    >
                      AI Annotated Stream (Bounding Boxes)
                    </button>
                    {videoPreviewUrl && (
                      <button
                        type="button"
                        onClick={() => setVideoViewMode('original')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                          videoViewMode === 'original'
                            ? 'bg-dairy-olive text-white'
                            : 'bg-white border border-dairy-beige text-dairy-olive hover:bg-dairy-cream'
                        }`}
                      >
                        Original Footage
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-black/95 p-2 flex justify-center items-center min-h-[360px] relative">
                <video
                  ref={videoPlayerRef}
                  src={
                    videoReport && videoViewMode === 'annotated' && videoReport.annotatedVideoUrl
                      ? videoReport.annotatedVideoUrl
                      : videoPreviewUrl || undefined
                  }
                  controls
                  className="max-h-[480px] w-full rounded-lg shadow-inner bg-black"
                />
              </div>
            </div>
          )}

          {/* Video Analysis Report */}
          {videoReport && (
            <div className="space-y-6">
              {/* Summary Score Banner */}
              <div className="dairy-card p-6 border-dairy-sage/60 bg-gradient-to-r from-white via-dairy-cream/30 to-dairy-ivory flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 shadow-sm">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase shadow-sm ${
                        videoReport.summary?.overallStatusTone === 'green' || videoReport.unhygienicDetectionsCount === 0
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-red-100 text-red-800 border border-red-300'
                      }`}
                    >
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          videoReport.summary?.overallStatusTone === 'green' || videoReport.unhygienicDetectionsCount === 0
                            ? 'bg-emerald-500 animate-pulse'
                            : 'bg-red-500 animate-ping'
                        }`}
                      />
                      {videoReport.overallHygieneStatus ||
                        (videoReport.unhygienicDetectionsCount === 0
                          ? 'GREEN – HYGIENE COMPLIANT'
                          : 'RED – HYGIENE VIOLATION')}
                    </span>
                  </div>
                  <h3 className="text-xl font-serif font-bold text-dairy-olive">{videoReport.fileName}</h3>
                  <p className="text-xs text-dairy-charcoal/60">
                    Analysed {videoReport.analyzedFramesCount} frames ({videoReport.fps} FPS) across {videoReport.videoDurationSec}s of footage • Avg Confidence: {videoReport.summary?.detectionConfidence || '95.8%'}
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 lg:gap-6 border-t lg:border-t-0 pt-4 lg:pt-0 border-dairy-beige">
                  <div className="text-left lg:text-right">
                    <div className="text-xs font-semibold text-dairy-charcoal/60">Total Detected Areas</div>
                    <div className="text-2xl font-bold font-serif text-dairy-olive">
                      {videoReport.summary?.totalDetectedAreas ?? ((videoReport.hygienicDetectionsCount || 0) + (videoReport.unhygienicDetectionsCount || 0))}
                    </div>
                    <span className="text-[10px] text-dairy-charcoal/60 font-semibold">Dual Objects Tracked</span>
                  </div>

                  <div className="text-left lg:text-right">
                    <div className="text-xs font-semibold text-emerald-800 flex items-center gap-1 lg:justify-end">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Green Bounding Boxes
                    </div>
                    <div className="text-2xl font-bold font-serif text-emerald-700">
                      {videoReport.hygienicDetectionsCount ?? videoReport.summary?.hygienicDetectionsCount ?? 0}
                    </div>
                    <span className="text-[10px] text-emerald-700 font-semibold">Hygienic Areas</span>
                  </div>

                  <div className="text-left lg:text-right">
                    <div className="text-xs font-semibold text-red-700 flex items-center gap-1 lg:justify-end">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      Red Bounding Boxes
                    </div>
                    <div className="text-2xl font-bold font-serif text-red-600">
                      {videoReport.unhygienicDetectionsCount ?? videoReport.summary?.unhygienicDetectionsCount ?? 0}
                    </div>
                    <span className="text-[10px] text-red-600 font-semibold">Hygiene Violations</span>
                  </div>

                  <div className="text-left lg:text-right">
                    <div className="text-xs font-semibold text-dairy-charcoal/60">Overall Hygiene Score</div>
                    <div className="text-3xl font-bold font-serif text-dairy-olive">
                      {videoReport.complianceScorePercent}%
                    </div>
                    <span className="text-[10px] text-dairy-forest font-semibold">
                      {videoReport.complianceScorePercent >= 90 ? 'Grade A - Verified' : 'Corrective Action Required'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Timestamp Findings Table */}
              <div className="dairy-card overflow-hidden">
                <div className="p-5 border-b border-dairy-beige flex items-center justify-between">
                  <div>
                    <h3 className="font-serif font-bold text-lg text-dairy-olive">
                      Timestamped Hygiene Findings & Detected Areas
                    </h3>
                    <p className="text-xs text-dairy-charcoal/60">
                      Click any row or timestamp to immediately jump the video player to that moment in time
                    </p>
                  </div>

                  <button
                    onClick={handleExportVideoCSV}
                    className="flex items-center gap-1.5 rounded-lg border border-dairy-beige bg-dairy-cream px-3 py-1.5 text-xs font-semibold text-dairy-olive hover:bg-dairy-beige transition shadow-sm"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Export Video Audit Report (CSV)
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-dairy-cream/60 text-dairy-olive font-semibold border-b border-dairy-beige">
                      <tr>
                        <th className="py-3 px-4">Timestamp</th>
                        <th className="py-3 px-4">Status & Condition</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Finding Description</th>
                        <th className="py-3 px-4">Severity</th>
                        <th className="py-3 px-4">Recommended Corrective Action</th>
                        <th className="py-3 px-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dairy-beige/60">
                      {(videoReport.findings || videoReport.detectedViolations || []).map((f: any, idx: number) => {
                        const isHygienic = f.status === 'Hygienic' || (f.severity === 'None' && !f.status);
                        return (
                          <tr
                            key={idx}
                            onClick={() => f.timestampSec !== undefined && handleSeekVideo(f.timestampSec)}
                            className="hover:bg-dairy-cream/40 transition cursor-pointer group"
                          >
                            <td className="py-3.5 px-4 font-mono font-bold text-dairy-olive">
                              <span className="flex items-center gap-1.5 group-hover:text-dairy-forest">
                                <Clock className="h-3.5 w-3.5 text-dairy-forest" />
                                {f.timestampFormatted || f.timestamp}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                  isHygienic
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : 'bg-red-100 text-red-800 border border-red-300'
                                }`}
                              >
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    isHygienic ? 'bg-emerald-500' : 'bg-red-500'
                                  }`}
                                />
                                {f.status || (isHygienic ? 'Hygienic' : 'Unhygienic')}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-dairy-olive">
                              {f.category || f.location || 'General'}
                            </td>
                            <td className="py-3.5 px-4 text-dairy-charcoal/90 max-w-sm">
                              <div className="font-semibold text-dairy-olive mb-0.5">
                                {f.label || f.category}
                              </div>
                              <div className="text-[11px] text-dairy-charcoal/70">
                                {f.description || f.evidenceNote}
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  f.severity === 'High'
                                    ? 'bg-red-100 text-red-800'
                                    : f.severity === 'Medium'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-emerald-50 text-emerald-700'
                                }`}
                              >
                                {f.severity || 'None'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-dairy-charcoal/80 text-[11px] max-w-xs">
                              {f.correctiveAction || 'Maintain standard sanitation schedule.'}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  f.timestampSec !== undefined && handleSeekVideo(f.timestampSec);
                                }}
                                className="px-2.5 py-1 rounded bg-dairy-cream border border-dairy-beige text-[11px] font-bold text-dairy-olive hover:bg-dairy-beige transition"
                              >
                                Jump to Time
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {/* OPTION 2: IMAGE HYGIENE SCANNER                                            */}
      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {scannerMode === 'image' && (
        <div className="space-y-6">
          {/* Image Upload Box */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleImageDrop}
            className="dairy-card p-6 space-y-5 border-2 border-dashed border-dairy-forest/40 bg-dairy-cream/20 rounded-2xl"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-dairy-olive p-3 text-dairy-ivory">
                  <ImageIcon className="h-6 w-6 text-dairy-sage" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-dairy-olive">
                    Upload Still Image for AI Hygiene Inspection
                  </h3>
                  <p className="text-xs text-dairy-charcoal/60 mt-0.5">
                    Supports high-resolution JPG, JPEG, PNG, and WEBP photographs of workers, machinery, or plant floor
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={(e) => e.target.files?.[0] && handleImageSelect(e.target.files[0])}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="rounded-xl border border-dairy-beige bg-white px-4 py-2 text-xs font-bold text-dairy-olive hover:bg-dairy-cream transition shadow-sm"
                >
                  Browse Image...
                </button>

                <button
                  onClick={handleRunImageAnalysis}
                  disabled={isImageScanning || !imageFile}
                  className="flex items-center gap-2 rounded-xl bg-dairy-olive px-5 py-2 text-xs font-bold text-white hover:bg-dairy-forest transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isImageScanning ? (
                    <>
                      <Sparkles className="h-4 w-4 animate-spin text-dairy-sage" />
                      Analysing Image...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 text-dairy-sage" />
                      Analyse Image
                    </>
                  )}
                </button>
              </div>
            </div>

            {imageFile && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-dairy-beige/80 text-xs text-dairy-olive">
                <div className="flex items-center gap-2.5">
                  <ImageIcon className="h-5 w-5 text-dairy-forest" />
                  <span className="font-bold">{imageFile.name}</span>
                  <span className="text-dairy-charcoal/50">
                    ({(imageFile.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreviewUrl(null);
                    setImageReport(null);
                  }}
                  className="p-1 rounded-lg hover:bg-dairy-cream text-dairy-charcoal/60 hover:text-dairy-terracotta"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {imageErrorMessage && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
                <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
                <span>{imageErrorMessage}</span>
              </div>
            )}

            {isImageScanning && (
              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-xs font-semibold text-dairy-olive">
                  <span>Executing YOLO object detection & hygiene region classification...</span>
                  <span>{imageProgress}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-dairy-beige">
                  <div
                    className="h-full bg-dairy-forest transition-all duration-300 rounded-full"
                    style={{ width: `${imageProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Image Viewport & Detection Overlay */}
          {imagePreviewUrl && (
            <div className="dairy-card overflow-hidden">
              <div className="p-4 border-b border-dairy-beige flex flex-wrap items-center justify-between gap-3 bg-dairy-cream/40">
                <div className="flex items-center gap-2 text-xs font-bold text-dairy-olive">
                  <Eye className="h-4 w-4 text-dairy-forest" />
                  <span>
                    {imageReport
                      ? 'Analysed Image Detection Visualisation (Coloured Bounding Boxes)'
                      : 'Image Upload Preview (Awaiting Analysis)'}
                  </span>
                </div>

                {imageReport && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-dairy-charcoal/60 font-semibold mr-1">Display:</span>
                    <button
                      type="button"
                      onClick={() => setImageViewMode('annotated')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        imageViewMode === 'annotated'
                          ? 'bg-dairy-olive text-white'
                          : 'bg-white border border-dairy-beige text-dairy-olive hover:bg-dairy-cream'
                      }`}
                    >
                      AI Annotated View (Green / Red Boxes)
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageViewMode('interactive')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        imageViewMode === 'interactive'
                          ? 'bg-dairy-olive text-white'
                          : 'bg-white border border-dairy-beige text-dairy-olive hover:bg-dairy-cream'
                      }`}
                    >
                      Interactive Box Overlay
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageViewMode('original')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        imageViewMode === 'original'
                          ? 'bg-dairy-olive text-white'
                          : 'bg-white border border-dairy-beige text-dairy-olive hover:bg-dairy-cream'
                      }`}
                    >
                      Original Image
                    </button>
                  </div>
                )}
              </div>

              {/* Image Canvas / Viewport */}
              <div className="p-4 bg-dairy-cream/20 flex justify-center items-center min-h-[360px] relative">
                {imageViewMode === 'annotated' && imageReport?.annotatedImageUrl ? (
                  <img
                    src={imageReport.annotatedImageUrl}
                    alt="AI Annotated Hygiene Inspection"
                    className="max-h-[500px] w-auto rounded-xl shadow-md border border-dairy-beige object-contain"
                  />
                ) : imageViewMode === 'interactive' && imageReport?.detections ? (
                  <div className="relative inline-block max-h-[500px]">
                    <img
                      src={imagePreviewUrl}
                      alt="Raw Image"
                      className="max-h-[500px] w-auto rounded-xl shadow-md border border-dairy-beige object-contain block"
                    />
                    {/* SVG Interactive Bounding Boxes Overlay */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-auto">
                      {imageReport.detections.map((det: any) => {
                        const nb = det.boxNormalized || { x: 0, y: 0, width: 0, height: 0 };
                        const isSelected = selectedDetectionId === det.id;
                        const isHygienic = det.status === 'Hygienic';
                        const strokeColor = isHygienic ? '#22c55e' : '#ef4444';
                        return (
                          <g
                            key={det.id}
                            className="cursor-pointer transition-all"
                            onClick={() => setSelectedDetectionId(det.id)}
                          >
                            <rect
                              x={`${nb.x * 100}%`}
                              y={`${nb.y * 100}%`}
                              width={`${nb.width * 100}%`}
                              height={`${nb.height * 100}%`}
                              fill={isSelected ? `${strokeColor}33` : `${strokeColor}15`}
                              stroke={strokeColor}
                              strokeWidth={isSelected ? 4 : 2}
                              rx="4"
                            />
                            {/* Label Tag */}
                            <foreignObject
                              x={`${nb.x * 100}%`}
                              y={`${Math.max(0, nb.y * 100 - 4)}%`}
                              width="200"
                              height="30"
                              className="overflow-visible"
                            >
                              <div
                                style={{ backgroundColor: strokeColor }}
                                className="inline-block text-[10px] font-bold text-white px-2 py-0.5 rounded shadow-sm whitespace-nowrap"
                              >
                                {det.status.toUpperCase()}: {det.label} ({det.confidencePercent})
                              </div>
                            </foreignObject>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                ) : (
                  <img
                    src={imagePreviewUrl}
                    alt="Uploaded Inspection Image"
                    className="max-h-[500px] w-auto rounded-xl shadow-md border border-dairy-beige object-contain"
                  />
                )}
              </div>
            </div>
          )}

          {/* Image Analysis Report */}
          {imageReport && (
            <div className="space-y-6">
              {/* Summary Score Banner */}
              <div className="dairy-card p-6 border-dairy-sage/60 bg-gradient-to-r from-white via-dairy-cream/30 to-dairy-ivory flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 shadow-sm">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase shadow-sm ${
                        imageReport.summary?.overallStatusTone === 'green' || imageReport.summary?.unhygienicCount === 0
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-red-100 text-red-800 border border-red-300'
                      }`}
                    >
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          imageReport.summary?.overallStatusTone === 'green' || imageReport.summary?.unhygienicCount === 0
                            ? 'bg-emerald-500 animate-pulse'
                            : 'bg-red-500 animate-ping'
                        }`}
                      />
                      {imageReport.summary?.overallHygieneStatus ||
                        (imageReport.summary?.unhygienicCount === 0
                          ? 'GREEN – HYGIENE COMPLIANT'
                          : 'RED – HYGIENE VIOLATION')}
                    </span>
                  </div>
                  <h3 className="text-xl font-serif font-bold text-dairy-olive">{imageReport.imageFileName}</h3>
                  <p className="text-xs text-dairy-charcoal/60">
                    Resolution {imageReport.imageDimensions?.width}x{imageReport.imageDimensions?.height} px • Multi-Object Area Segmentation • Detection Confidence: {imageReport.summary?.detectionConfidence || '95.0%'}
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 lg:gap-6 border-t lg:border-t-0 pt-4 lg:pt-0 border-dairy-beige">
                  <div className="text-left lg:text-right">
                    <div className="text-xs font-semibold text-dairy-charcoal/60">Total Detected Areas</div>
                    <div className="text-2xl font-bold font-serif text-dairy-olive">
                      {imageReport.summary?.totalDetectedAreas ?? imageReport.summary?.totalDetections}
                    </div>
                    <span className="text-[10px] text-dairy-charcoal/60 font-semibold">Localized Objects</span>
                  </div>

                  <div className="text-left lg:text-right">
                    <div className="text-xs font-semibold text-emerald-800 flex items-center gap-1 lg:justify-end">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Green Bounding Boxes
                    </div>
                    <div className="text-2xl font-bold font-serif text-emerald-700">
                      {imageReport.summary?.greenBoundingBoxCount ?? imageReport.summary?.hygienicCount}
                    </div>
                    <span className="text-[10px] text-emerald-700 font-semibold">Hygienic Areas</span>
                  </div>

                  <div className="text-left lg:text-right">
                    <div className="text-xs font-semibold text-red-700 flex items-center gap-1 lg:justify-end">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      Red Bounding Boxes
                    </div>
                    <div className="text-2xl font-bold font-serif text-red-600">
                      {imageReport.summary?.redBoundingBoxCount ?? imageReport.summary?.unhygienicCount}
                    </div>
                    <span className="text-[10px] text-red-600 font-semibold">Hygiene Violations</span>
                  </div>

                  <div className="text-left lg:text-right">
                    <div className="text-xs font-semibold text-dairy-charcoal/60">Overall Hygiene Score</div>
                    <div className="text-3xl font-bold font-serif text-dairy-olive">
                      {imageReport.summary?.overallHygieneScore ?? imageReport.summary?.complianceScorePercent}%
                    </div>
                    <span className="text-[10px] text-dairy-forest font-semibold">
                      {imageReport.summary?.complianceScorePercent >= 90 ? 'Grade A - Verified' : 'Action Required'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Detected Objects & Detailed Findings Table */}
              <div className="dairy-card overflow-hidden">
                <div className="p-5 border-b border-dairy-beige flex items-center justify-between">
                  <div>
                    <h3 className="font-serif font-bold text-lg text-dairy-olive">
                      Individual Detection Results (Dual Green & Red Bounding Boxes)
                    </h3>
                    <p className="text-xs text-dairy-charcoal/60">
                      Specific detected objects, compliance classification, confidence scores, and corrective recommendations
                    </p>
                  </div>

                  <button
                    onClick={handleExportImageCSV}
                    className="flex items-center gap-1.5 rounded-lg border border-dairy-beige bg-dairy-cream px-3 py-1.5 text-xs font-semibold text-dairy-olive hover:bg-dairy-beige transition shadow-sm"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Export Image Audit Report (CSV)
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-dairy-cream/60 text-dairy-olive font-semibold border-b border-dairy-beige">
                      <tr>
                        <th className="py-3 px-4">Detected Item</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Detection Confidence</th>
                        <th className="py-3 px-4">Description (Why Classified)</th>
                        <th className="py-3 px-4">Recommended Corrective Action</th>
                        <th className="py-3 px-4">Bounding Box [X,Y,W,H]</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dairy-beige/60">
                      {imageReport.detections?.map((d: any) => {
                        const isSelected = selectedDetectionId === d.id;
                        const isHygienic = d.status === 'Hygienic';
                        return (
                          <tr
                            key={d.id}
                            onClick={() => setSelectedDetectionId(d.id)}
                            className={`transition cursor-pointer ${
                              isSelected
                                ? 'bg-dairy-cream/70 font-semibold'
                                : 'hover:bg-dairy-cream/40'
                            }`}
                          >
                            <td className="py-3.5 px-4 font-semibold text-dairy-olive">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`w-2.5 h-2.5 rounded-full ${
                                    isHygienic ? 'bg-emerald-500' : 'bg-red-500'
                                  }`}
                                />
                                <div>
                                  <div className="font-bold text-dairy-olive">{d.label}</div>
                                  <div className="text-[10px] text-dairy-charcoal/50 font-mono">{d.id} • {d.category}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                  isHygienic
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : 'bg-red-100 text-red-800 border border-red-300'
                                }`}
                              >
                                {isHygienic ? 'HYGIENIC (Green Box)' : 'UNHYGIENIC (Red Box)'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-mono font-bold text-emerald-800">
                              {d.confidencePercent}
                            </td>
                            <td className="py-3.5 px-4 text-dairy-charcoal/90 max-w-sm text-[11px]">
                              {d.description}
                            </td>
                            <td className="py-3.5 px-4 text-dairy-charcoal/80 text-[11px] max-w-xs">
                              {d.correctiveAction}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-dairy-charcoal/60 text-[10px]">
                              [{d.box?.join(', ')}]
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
