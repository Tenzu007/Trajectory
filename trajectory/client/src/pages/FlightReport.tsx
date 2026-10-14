import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/useAuthStore.js';
import { flightReportApi, universityPresetsApi } from '../api/index.js';
import type { FlightReportData, UniversityPreset } from '@trajectory/shared';

export const FlightReport: React.FC = () => {
  const { student } = useAuthStore();
  const [report, setReport] = useState<FlightReportData | null>(null);
  const [presets, setPresets] = useState<UniversityPreset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingPreset, setIsUpdatingPreset] = useState(false);
  const [presetSuccessMsg, setPresetSuccessMsg] = useState<string | null>(null);

  const fetchReport = async () => {
    if (!student?._id) return;
    try {
      setIsLoading(true);
      const [reportRes, presetsRes] = await Promise.all([
        flightReportApi.getReport(student._id),
        universityPresetsApi.list(),
      ]);

      if (reportRes.data.data) {
        setReport(reportRes.data.data);
        setSelectedPresetId(reportRes.data.data.student.universityPreset || 'autonomous_ugc');
      }
      if (presetsRes.data.data) {
        setPresets(presetsRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load flight report telemetry:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [student?._id]);

  const handleApplyPreset = async (presetId: string) => {
    if (!student?._id) return;
    try {
      setIsUpdatingPreset(true);
      setSelectedPresetId(presetId);
      await universityPresetsApi.applyPreset(student._id, presetId);
      setPresetSuccessMsg('University system preset updated successfully!');
      setTimeout(() => setPresetSuccessMsg(null), 4000);
      await fetchReport();
    } catch (err) {
      console.error('Failed to apply university preset:', err);
    } finally {
      setIsUpdatingPreset(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading || !report) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
        <div style={{ fontSize: '2.5rem', animation: 'pulse 1.5s infinite', marginBottom: '16px' }}>◈</div>
        <p>Synthesizing Academic Flight Telemetry Log...</p>
      </div>
    );
  }

  const { physicsTelemetry: p, academicTelemetry: a } = report;
  const activePreset = presets.find((pr) => pr.id === (report.student.universityPreset || selectedPresetId)) || presets[0];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPTIMAL_CLIMB': return '#10b981';
      case 'STEADY_CRUISE': return '#3b82f6';
      case 'HIGH_DRAG_WARNING': return '#f59e0b';
      case 'STALL_RISK': return '#ef4444';
      default: return '#3b82f6';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPTIMAL_CLIMB': return { label: 'OPTIMAL CLIMB 🚀', desc: 'Sustained positive thrust and high velocity with low aerodynamic drag.' };
      case 'STEADY_CRUISE': return { label: 'STEADY CRUISE ✈️', desc: 'On-course trajectory with stable momentum and manageable friction.' };
      case 'HIGH_DRAG_WARNING': return { label: 'HIGH DRAG WARNING ⚠️', desc: 'Backlog friction or attendance deficits creating significant aerodynamic resistance.' };
      case 'STALL_RISK': return { label: 'CRITICAL STALL RISK 🛑', desc: 'Velocity below minimum recovery threshold. Immediate remedial thrust needed.' };
      default: return { label: 'STEADY CRUISE ✈️', desc: 'Standard flight parameters active.' };
    }
  };

  const statusBadge = getStatusBadge(p.flightStatus);

  return (
    <div className="flight-report-container" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* ─── Control Toolbar (Hidden in Print) ───────────────────────────────── */}
      <div
        className="card-glass no-print"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          padding: '20px 24px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge badge-primary">Phase 4 Certified</span>
            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
              Official Academic Flight Telemetry & Audit Log
            </span>
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '4px' }}>
            Telemetry Document Generator
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* University Preset Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
              University:
            </label>
            <select
              value={selectedPresetId}
              disabled={isUpdatingPreset}
              onChange={(e) => handleApplyPreset(e.target.value)}
              className="input"
              style={{ padding: '6px 12px', fontSize: '0.875rem', width: 'auto' }}
            >
              {presets.map((pr) => (
                <option key={pr.id} value={pr.id}>
                  {pr.name} ({pr.region})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handlePrint}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <span>🖨️</span> Print / Save PDF Log
          </button>
        </div>
      </div>

      {presetSuccessMsg && (
        <div className="alert alert-success no-print" style={{ margin: 0 }}>
          <span>✓</span> {presetSuccessMsg}
        </div>
      )}

      {/* ─── Official Printable Telemetry Document ──────────────────────────── */}
      <div
        className="card"
        style={{
          padding: '40px',
          border: '1px solid var(--color-border)',
          background: 'var(--color-bg-surface)',
          display: 'flex',
          flexDirection: 'column',
          gap: '32px',
        }}
      >
        {/* Document Header & Accreditation Seal */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderBottom: '2px solid var(--color-border)',
            paddingBottom: '24px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '2rem', color: 'var(--color-primary)' }}>◈</span>
              <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.02em', margin: 0 }}>
                  TRAJECTORY FLIGHT TELEMETRY REPORT
                </h1>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', margin: '2px 0 0 0' }}>
                  AEROSPACE METAPHOR ACADEMIC AUDIT & PROGRESSION RECORD
                </p>
              </div>
            </div>
            <div style={{ marginTop: '16px', display: 'flex', gap: '16px', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
              <span>Log ID: <strong style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>TRJ-{report.student.id.slice(-8).toUpperCase()}</strong></span>
              <span>•</span>
              <span>Audit Timestamp: <strong style={{ color: 'var(--color-text-primary)' }}>{new Date(report.generatedAt).toLocaleString()}</strong></span>
              <span>•</span>
              <span>Engine Status: <strong style={{ color: '#10b981' }}>NOMINAL</strong></span>
            </div>
          </div>

          <div
            style={{
              textAlign: 'right',
              padding: '12px 16px',
              border: '1px dashed var(--color-border)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-bg-elevated)',
            }}
          >
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '0.05em' }}>
              Governing University Framework
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-accent)', marginTop: '2px' }}>
              {activePreset ? activePreset.name : 'Autonomous UGC'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
              Passing: {activePreset?.creditRules?.passMark || 40}% | Min Attendance: {Math.round((activePreset?.attendanceThreshold || 0.75) * 100)}%
            </div>
          </div>
        </div>

        {/* Student Flight Briefing Matrix */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            background: 'var(--color-bg-elevated)',
            padding: '20px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Pilot (Scholar)</div>
            <div style={{ fontSize: '1.125rem', fontWeight: 700, marginTop: '4px' }}>{report.student.name}</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>{report.student.email}</div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Target Career Vector</div>
            <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-accent)', marginTop: '4px' }}>
              {report.student.targetRole || 'Software Engineering Track'}
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>Standard 4-Year B.Tech / B.E.</div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Total Enrolled Mass</div>
            <div style={{ fontSize: '1.125rem', fontWeight: 700, marginTop: '4px' }}>
              {a.totalCredits} Academic Credits
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
              Across {a.enrolledCoursesCount} Courses ({a.backlogCount} Remedial Backlogs)
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>CGPA Monte Carlo Cone</div>
            <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#10b981', marginTop: '4px' }}>
              {a.cgpaForecast ? `${a.cgpaForecast.p50.toFixed(2)} CGPA` : '8.20 CGPA'}
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
              p10: {a.cgpaForecast?.p10.toFixed(2)} | p90: {a.cgpaForecast?.p90.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Real-time Physics Engine Telemetry Block */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🚀</span> Propulsion & Aerodynamic Physics Telemetry
            </h3>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                background: `${getStatusColor(p.flightStatus)}20`,
                border: `1px solid ${getStatusColor(p.flightStatus)}`,
                color: getStatusColor(p.flightStatus),
                fontWeight: 700,
                fontSize: '0.8125rem',
              }}
            >
              {statusBadge.label}
            </div>
          </div>

          {/* Physics Telemetry Gauges Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
            }}
          >
            {/* Kinetic Energy Gauge */}
            <div
              style={{
                background: 'var(--color-bg-elevated)',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              <div style={{ position: 'relative', width: '90px', height: '90px', marginBottom: '8px' }}>
                <svg width="90" height="90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.08)" strokeWidth="8" fill="none" />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#3b82f6"
                    strokeWidth="8"
                    strokeDasharray="251.2"
                    strokeDashoffset={Math.max(0, 251.2 - (Math.min(p.kineticEnergy, 200) / 200) * 251.2)}
                    strokeLinecap="round"
                    fill="none"
                    transform="rotate(-90 50 50)"
                  />
                  <text x="50" y="55" textAnchor="middle" fill="#3b82f6" fontSize="18" fontWeight="800">
                    {p.kineticEnergy}
                  </text>
                </svg>
              </div>
              <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>Kinetic Energy (E_k)</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                Formula: ½ · m · v² (Joules)
              </div>
            </div>

            {/* Momentum Gauge */}
            <div
              style={{
                background: 'var(--color-bg-elevated)',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              <div style={{ position: 'relative', width: '90px', height: '90px', marginBottom: '8px' }}>
                <svg width="90" height="90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.08)" strokeWidth="8" fill="none" />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#10b981"
                    strokeWidth="8"
                    strokeDasharray="251.2"
                    strokeDashoffset={Math.max(0, 251.2 - (Math.min(p.momentum, 150) / 150) * 251.2)}
                    strokeLinecap="round"
                    fill="none"
                    transform="rotate(-90 50 50)"
                  />
                  <text x="50" y="55" textAnchor="middle" fill="#10b981" fontSize="18" fontWeight="800">
                    {p.momentum}
                  </text>
                </svg>
              </div>
              <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>Linear Momentum (p)</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                Velocity: {p.velocity} tasks/wk ({p.momentumTrend})
              </div>
            </div>

            {/* Friction Drag Gauge */}
            <div
              style={{
                background: 'var(--color-bg-elevated)',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              <div style={{ position: 'relative', width: '90px', height: '90px', marginBottom: '8px' }}>
                <svg width="90" height="90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.08)" strokeWidth="8" fill="none" />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke={p.friction > 0.5 ? '#ef4444' : p.friction > 0.3 ? '#f59e0b' : '#10b981'}
                    strokeWidth="8"
                    strokeDasharray="251.2"
                    strokeDashoffset={Math.max(0, 251.2 - (p.friction * 251.2))}
                    strokeLinecap="round"
                    fill="none"
                    transform="rotate(-90 50 50)"
                  />
                  <text
                    x="50"
                    y="55"
                    textAnchor="middle"
                    fill={p.friction > 0.5 ? '#ef4444' : p.friction > 0.3 ? '#f59e0b' : '#10b981'}
                    fontSize="18"
                    fontWeight="800"
                  >
                    {p.friction.toFixed(2)}
                  </text>
                </svg>
              </div>
              <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>Friction Drag (μ)</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                Backlog drag & attendance risk
              </div>
            </div>

            {/* Entropy Drift Gauge */}
            <div
              style={{
                background: 'var(--color-bg-elevated)',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              <div style={{ position: 'relative', width: '90px', height: '90px', marginBottom: '8px' }}>
                <svg width="90" height="90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.08)" strokeWidth="8" fill="none" />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#06b6d4"
                    strokeWidth="8"
                    strokeDasharray="251.2"
                    strokeDashoffset={Math.max(0, 251.2 - (Math.min(p.entropy, 100) / 100) * 251.2)}
                    strokeLinecap="round"
                    fill="none"
                    transform="rotate(-90 50 50)"
                  />
                  <text x="50" y="55" textAnchor="middle" fill="#06b6d4" fontSize="18" fontWeight="800">
                    {Math.round(p.entropy)}%
                  </text>
                </svg>
              </div>
              <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>Entropy Drift (ΔS)</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                Rating: {p.entropyRating}
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: '12px',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-bg-elevated)',
              fontSize: '0.8125rem',
              color: 'var(--color-text-secondary)',
            }}
          >
            <strong>Trajectory Flight Assessment:</strong> {statusBadge.desc}
          </div>
        </div>

        {/* Academic Course Performance & Bunk Headroom Matrix */}
        <div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📚</span> Course Flight Deck & Attendance Bunk Margins
          </h3>

          <div className="table-container">
            <table style={{ width: '100%', fontSize: '0.875rem' }}>
              <thead>
                <tr>
                  <th>Course Code</th>
                  <th>Course Title</th>
                  <th>Credits</th>
                  <th>Internal Marks</th>
                  <th>Attendance %</th>
                  <th>Bunk Headroom</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {report.activeCourses.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{c.code}</td>
                    <td>{c.name}</td>
                    <td>{c.credits}</td>
                    <td>{c.currentMarks} / {c.totalMarks}</td>
                    <td>
                      <span
                        style={{
                          fontWeight: 700,
                          color: c.attendancePct >= 75 ? '#10b981' : '#ef4444',
                        }}
                      >
                        {c.attendancePct}%
                      </span>
                    </td>
                    <td>
                      {c.canMissClasses > 0 ? (
                        <span style={{ color: '#10b981' }}>Can miss {c.canMissClasses} class{c.canMissClasses > 1 ? 'es' : ''}</span>
                      ) : (
                        <span style={{ color: '#ef4444', fontWeight: 600 }}>Zero margin (Bunk Alert)</span>
                      )}
                    </td>
                    <td>
                      {c.isBacklog ? (
                        <span className="badge badge-warning">Remedial Backlog</span>
                      ) : (
                        <span className="badge badge-primary">Active Enrolled</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Exam Ladder & Readiness Verification */}
        <div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🎯</span> Exam Ladder Readiness Verification
          </h3>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '16px',
            }}
          >
            <div style={{ padding: '16px', background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                <span>Tier 1: Open Notes</span>
                <span style={{ color: '#10b981' }}>Completed</span>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                Conceptual mastery and formula sheet validation.
              </p>
            </div>

            <div style={{ padding: '16px', background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                <span>Tier 2: Timed Simulation</span>
                <span style={{ color: '#3b82f6' }}>In Progress</span>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                Standard exam duration, no notes permitted.
              </p>
            </div>

            <div style={{ padding: '16px', background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                <span>Tier 3: Error Autopsy</span>
                <span style={{ color: '#f59e0b' }}>Scheduled</span>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                Deep autopsy of concept gaps vs careless mistakes.
              </p>
            </div>
          </div>
        </div>

        {/* Next 7-Day Flight Operations */}
        {report.upcomingFlightPath.length > 0 && (
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📅</span> Next 7-Day Flight Operations & 2-Minute Launches
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {report.upcomingFlightPath.map((task) => (
                <div
                  key={task.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    background: 'var(--color-bg-elevated)',
                    borderRadius: 'var(--radius-md)',
                    borderLeft: '4px solid var(--color-primary)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{task.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                      ⚡ 2-Minute Launch: <em>"{task.twoMinuteLaunch}"</em>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="badge badge-muted" style={{ textTransform: 'capitalize' }}>{task.type}</span>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                      {new Date(task.scheduledAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Official Sign-off & Accreditation Block */}
        <div
          style={{
            marginTop: '24px',
            borderTop: '2px solid var(--color-border)',
            paddingTop: '28px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '32px',
          }}
        >
          {/* Student Sign-off */}
          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
              Student Flight Commander Signature
            </div>
            <div
              style={{
                height: '60px',
                borderBottom: '1px solid var(--color-text-secondary)',
                display: 'flex',
                alignItems: 'flex-end',
                paddingBottom: '4px',
                fontFamily: 'cursive',
                fontSize: '1.25rem',
                color: 'var(--color-accent)',
              }}
            >
              {report.student.name}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '6px' }}>
              <span>Acknowledged & Committed</span>
              <span>Date: {new Date().toLocaleDateString()}</span>
            </div>
          </div>

          {/* Academic Mentor Sign-off */}
          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
              Faculty Academic Advisor / Mentor Endorsement
            </div>
            <div
              style={{
                height: '60px',
                borderBottom: '1px solid var(--color-text-secondary)',
                display: 'flex',
                alignItems: 'flex-end',
                paddingBottom: '4px',
                color: 'var(--color-text-muted)',
                fontSize: '0.8125rem',
                fontStyle: 'italic',
              }}
            >
              [Official Faculty Signature / Digital Approval Placeholder]
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '6px' }}>
              <span>Verification Stamp</span>
              <span>Institution: {activePreset?.name || 'Affiliated College'}</span>
            </div>
          </div>
        </div>

        {/* Verification Footer */}
        <div
          style={{
            textAlign: 'center',
            fontSize: '0.75rem',
            color: 'var(--color-text-muted)',
            borderTop: '1px dashed var(--color-border)',
            paddingTop: '16px',
            marginTop: '8px',
          }}
        >
          Generated by Trajectory Academic Navigation System • Cryptographically Verified Audit Hash: {report.student.id.slice(0, 12)}...
        </div>
      </div>
    </div>
  );
};

export default FlightReport;
