import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore.js';
import { useCoursesStore } from '../stores/useCoursesStore.js';
import { usePlannerStore } from '../stores/usePlannerStore.js';
import { calcApi, flightReportApi, universityPresetsApi } from '../api/index.js';
import type { FlightReportData, UniversityPreset } from '@trajectory/shared';

export const Dashboard: React.FC = () => {
  const { student } = useAuthStore();
  const { courses, fetchCourses, summaries } = useCoursesStore();
  const { tasks, fetchTasks, startPomodoro } = usePlannerStore();
  const navigate = useNavigate();

  const [gapData, setGapData] = useState<{ score: number; biggestContributor: string }>({
    score: 42,
    biggestContributor: 'Backlog recovery requirements (2 backlogs)',
  });
  const [flightReport, setFlightReport] = useState<FlightReportData | null>(null);
  const [presets, setPresets] = useState<UniversityPreset[]>([]);
  const [isUpdatingPreset, setIsUpdatingPreset] = useState(false);

  useEffect(() => {
    fetchCourses();
    fetchTasks();

    if (student?._id) {
      flightReportApi.getReport(student._id).then((res) => {
        if (res.data.data) {
          setFlightReport(res.data.data);
        }
      }).catch(() => {});

      universityPresetsApi.list().then((res) => {
        if (res.data.data) {
          setPresets(res.data.data);
        }
      }).catch(() => {});
    }

    // Compute dynamic gap score
    calcApi.gapScore({
      cgpaGap: 1.2,
      backlogCount: 2,
      attendanceRisk: 15,
      skillGap: 25,
    }).then((res) => {
      if (res.data.data) {
        setGapData({
          score: res.data.data.score,
          biggestContributor: res.data.data.biggestContributor,
        });
      }
    }).catch(() => {});
  }, [student?._id]);

  const handlePresetChange = async (presetId: string) => {
    if (!student?._id) return;
    try {
      setIsUpdatingPreset(true);
      await universityPresetsApi.applyPreset(student._id, presetId);
      const res = await flightReportApi.getReport(student._id);
      if (res.data.data) setFlightReport(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdatingPreset(false);
    }
  };

  const pendingTasks = tasks.filter((t) => t.status === 'pending');
  const nextTask = pendingTasks[0];

  // Check critical attendance
  const criticalCourses = courses.filter((c) => {
    const s = summaries[c._id];
    return s && (s.currentPercentage < 75 || s.bunkHeadroom <= 1);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* ─── Hero / Physics Metaphor Header ─────────────────────────────────── */}
      <div
        className="card-glass"
        style={{
          padding: '32px',
          background: 'radial-gradient(ellipse at 80% 20%, rgba(59, 130, 246, 0.15), transparent 70%), var(--color-bg-surface)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '32px',
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="badge badge-primary">Dynamic Trajectory</span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
              Real-time Physics Metaphor
            </span>
          </div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
            Welcome back, {student?.name?.split(' ')[0] || 'Scholar'}
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '8px', maxWidth: '520px' }}>
            Your academic trajectory is holding a <strong style={{ color: '#fff' }}>Target 8.5 CGPA</strong> with 2 active backlogs in remediation.
          </p>

          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            <button
              onClick={() => navigate('/planner')}
              className="btn btn-primary"
            >
              Open Daily Flight Plan ➔
            </button>
            <button
              onClick={() => navigate('/exams')}
              className="btn btn-secondary"
            >
              View Exam Ladder
            </button>
          </div>
        </div>

        {/* Gap Score Gauge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '24px',
            background: 'var(--color-bg-elevated)',
            padding: '24px',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--color-border)',
          }}
        >
          <div
            style={{
              position: 'relative',
              width: '130px',
              height: '130px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              background: `conic-gradient(#f59e0b 0% ${gapData.score}%, rgba(255,255,255,0.06) ${gapData.score}% 100%)`,
              padding: '12px',
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                background: 'var(--color-bg-elevated)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#f59e0b' }}>
                {Math.round(gapData.score)}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Gap Score
              </div>
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              Primary Resistance Factor
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              {gapData.biggestContributor}
            </div>
            <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
              <span className="badge badge-warning">Moderate Drift</span>
              <span className="badge badge-muted">Target CGPA: 8.5</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Real-time Physics Engine Telemetry Deck ───────────────────────── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🚀</span> Flight Propulsion Telemetry Engine
            </h2>
            {flightReport?.physicsTelemetry && (
              <span
                className="badge"
                style={{
                  background:
                    flightReport.physicsTelemetry.flightStatus === 'OPTIMAL_CLIMB' ? 'rgba(16,185,129,0.15)' :
                    flightReport.physicsTelemetry.flightStatus === 'STEADY_CRUISE' ? 'rgba(59,130,246,0.15)' :
                    flightReport.physicsTelemetry.flightStatus === 'HIGH_DRAG_WARNING' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                  color:
                    flightReport.physicsTelemetry.flightStatus === 'OPTIMAL_CLIMB' ? '#10b981' :
                    flightReport.physicsTelemetry.flightStatus === 'STEADY_CRUISE' ? '#3b82f6' :
                    flightReport.physicsTelemetry.flightStatus === 'HIGH_DRAG_WARNING' ? '#f59e0b' : '#ef4444',
                  border: '1px solid currentColor',
                  fontWeight: 700,
                }}
              >
                {flightReport.physicsTelemetry.flightStatus.replace('_', ' ')}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {presets.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>University System:</span>
                <select
                  value={student?.universityPreset || 'autonomous_ugc'}
                  disabled={isUpdatingPreset}
                  onChange={(e) => handlePresetChange(e.target.value)}
                  className="input"
                  style={{ padding: '4px 8px', fontSize: '0.75rem', width: 'auto' }}
                >
                  {presets.map((pr) => (
                    <option key={pr.id} value={pr.id}>
                      {pr.name} ({pr.region})
                    </option>
                  ))}
                </select>
              </div>
            )}
            <button
              onClick={() => navigate('/report')}
              className="btn btn-secondary"
              style={{ fontSize: '0.8125rem', padding: '6px 12px' }}
            >
              📄 Printable Telemetry Log ➔
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
          {/* Gauge 1: Kinetic Energy */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '24px 16px' }}>
            <div style={{ position: 'relative', width: '100px', height: '100px', marginBottom: '12px' }}>
              <svg width="100" height="100" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.06)" strokeWidth="8" fill="none" />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#3b82f6"
                  strokeWidth="8"
                  strokeDasharray="251.2"
                  strokeDashoffset={Math.max(0, 251.2 - ((flightReport?.physicsTelemetry?.kineticEnergy || 120) / 200) * 251.2)}
                  strokeLinecap="round"
                  fill="none"
                  transform="rotate(-90 50 50)"
                />
                <text x="50" y="55" textAnchor="middle" fill="#3b82f6" fontSize="18" fontWeight="800">
                  {flightReport?.physicsTelemetry?.kineticEnergy ?? 120}
                </text>
              </svg>
            </div>
            <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>Kinetic Energy (E_k)</div>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '4px 0 0 0' }}>
              Formula: ½ · m · v² (Joules metaphorical thrust)
            </p>
          </div>

          {/* Gauge 2: Linear Momentum */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '24px 16px' }}>
            <div style={{ position: 'relative', width: '100px', height: '100px', marginBottom: '12px' }}>
              <svg width="100" height="100" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.06)" strokeWidth="8" fill="none" />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#10b981"
                  strokeWidth="8"
                  strokeDasharray="251.2"
                  strokeDashoffset={Math.max(0, 251.2 - ((flightReport?.physicsTelemetry?.momentum || 70) / 150) * 251.2)}
                  strokeLinecap="round"
                  fill="none"
                  transform="rotate(-90 50 50)"
                />
                <text x="50" y="55" textAnchor="middle" fill="#10b981" fontSize="18" fontWeight="800">
                  {flightReport?.physicsTelemetry?.momentum ?? 70}
                </text>
              </svg>
            </div>
            <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>Linear Momentum (p)</div>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '4px 0 0 0' }}>
              Mass: {flightReport?.physicsTelemetry?.mass ?? 20}cr · Vel: {flightReport?.physicsTelemetry?.velocity ?? 3.5}/wk
            </p>
          </div>

          {/* Gauge 3: Aerodynamic Friction */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '24px 16px' }}>
            <div style={{ position: 'relative', width: '100px', height: '100px', marginBottom: '12px' }}>
              <svg width="100" height="100" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.06)" strokeWidth="8" fill="none" />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke={(flightReport?.physicsTelemetry?.friction || 0.25) > 0.5 ? '#ef4444' : (flightReport?.physicsTelemetry?.friction || 0.25) > 0.3 ? '#f59e0b' : '#10b981'}
                  strokeWidth="8"
                  strokeDasharray="251.2"
                  strokeDashoffset={Math.max(0, 251.2 - ((flightReport?.physicsTelemetry?.friction || 0.25) * 251.2))}
                  strokeLinecap="round"
                  fill="none"
                  transform="rotate(-90 50 50)"
                />
                <text
                  x="50"
                  y="55"
                  textAnchor="middle"
                  fill={(flightReport?.physicsTelemetry?.friction || 0.25) > 0.5 ? '#ef4444' : (flightReport?.physicsTelemetry?.friction || 0.25) > 0.3 ? '#f59e0b' : '#10b981'}
                  fontSize="18"
                  fontWeight="800"
                >
                  {(flightReport?.physicsTelemetry?.friction ?? 0.25).toFixed(2)}
                </text>
              </svg>
            </div>
            <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>Friction Drag (μ)</div>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '4px 0 0 0' }}>
              Backlog drag coefficient & attendance deficit
            </p>
          </div>

          {/* Gauge 4: Entropy Drift */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '24px 16px' }}>
            <div style={{ position: 'relative', width: '100px', height: '100px', marginBottom: '12px' }}>
              <svg width="100" height="100" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.06)" strokeWidth="8" fill="none" />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#06b6d4"
                  strokeWidth="8"
                  strokeDasharray="251.2"
                  strokeDashoffset={Math.max(0, 251.2 - ((flightReport?.physicsTelemetry?.entropy || 10) / 100) * 251.2)}
                  strokeLinecap="round"
                  fill="none"
                  transform="rotate(-90 50 50)"
                />
                <text x="50" y="55" textAnchor="middle" fill="#06b6d4" fontSize="18" fontWeight="800">
                  {Math.round(flightReport?.physicsTelemetry?.entropy ?? 10)}%
                </text>
              </svg>
            </div>
            <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>Momentum Entropy (ΔS)</div>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '4px 0 0 0' }}>
              Variance between planned hours and actual focus
            </p>
          </div>
        </div>
      </div>

      {/* ─── Next Actionable Block / 2-Minute Launch ────────────────────────── */}
      {nextTask ? (
        <div
          className="card"
          style={{
            borderLeft: '4px solid var(--color-primary)',
            background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.08) 0%, var(--color-bg-surface) 100%)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span className="badge badge-accent">Next Actionable Block</span>
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                  Estimated: {nextTask.estimatedMinutes} mins • Priority: {nextTask.priorityScore}
                </span>
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700 }}>{nextTask.title}</h2>
              {nextTask.description && (
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
                  {nextTask.description}
                </p>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => {
                  startPomodoro(nextTask._id, 25);
                  navigate('/planner');
                }}
                className="btn btn-primary"
              >
                ⏱️ Start 25m Focus
              </button>
            </div>
          </div>

          {/* 2-Minute Launch Action */}
          {nextTask.twoMinuteLaunch && (
            <div
              style={{
                background: 'rgba(6, 182, 212, 0.08)',
                border: '1px solid rgba(6, 182, 212, 0.25)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.25rem' }}>🚀</span>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-accent)', textTransform: 'uppercase' }}>
                    2-Minute Launch (Overcome Procrastination Barrier)
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>
                    {nextTask.twoMinuteLaunch}
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  startPomodoro(nextTask._id, 2);
                  navigate('/planner');
                }}
                className="btn btn-accent btn-sm"
              >
                Launch Now (2m)
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '36px' }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🎯</div>
          <h3>All scheduled blocks completed for today!</h3>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '4px', fontSize: '0.875rem' }}>
            Great job! You have zero pending tasks. Review your courses or plan tomorrow.
          </p>
          <button
            onClick={() => navigate('/planner')}
            className="btn btn-secondary btn-sm"
            style={{ marginTop: '16px' }}
          >
            Add Task to Flight Plan
          </button>
        </div>
      )}

      {/* ─── Attendance Alert & Courses Quick Summary ───────────────────────── */}
      {criticalCourses.length > 0 && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ fontSize: '1.75rem' }}>⚠️</span>
            <div>
              <div style={{ fontWeight: 700, color: '#f87171', fontSize: '0.9375rem' }}>
                75% Attendance Rule Alert: {criticalCourses.map((c) => c.name).join(', ')}
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                You have reached your bunk headroom limit. Missing more lectures will debar you from exams.
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate('/courses')}
            className="btn btn-danger btn-sm"
          >
            View Bunk Headroom
          </button>
        </div>
      )}
    </div>
  );
};
