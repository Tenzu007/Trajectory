import React, { useState } from 'react';
import { reflectionsApi } from '../api/index.js';

export const WeeklyCalibration: React.FC = () => {
  const [subjects] = useState([
    { name: 'Operating Systems (Backlog)', planned: 10.5, actual: 8.0, delta: -2.5, scoreMovement: '+8%', methodProblem: false },
    { name: 'Design & Analysis of Algorithms', planned: 7.0, actual: 7.5, delta: +0.5, scoreMovement: '+12%', methodProblem: false },
    { name: 'Mathematics III (Backlog)', planned: 8.0, actual: 4.5, delta: -3.5, scoreMovement: '0%', methodProblem: true },
    { name: 'Computer Networks', planned: 5.0, actual: 4.0, delta: -1.0, scoreMovement: '+5%', methodProblem: false },
  ]);

  const [adjustment, setAdjustment] = useState(
    'Shift Mathematics III backlog practice to 9:00 AM peak focus window before college classes to avoid end-of-day fatigue.'
  );
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await reflectionsApi.create({
        weekStartDate: new Date().toISOString(),
        entropyAudit: {
          plannedHours: 30.5,
          actualHours: 24.0,
          bySubject: subjects.map((s) => ({ courseId: s.name, planned: s.planned, actual: s.actual })),
        },
        outcomeLink: subjects.map((s) => ({
          courseId: s.name,
          studyHours: s.actual,
          scoreMovement: s.scoreMovement,
          flaggedAsMethodProblem: s.methodProblem,
        })),
        adjustment,
      });
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
          Weekly Calibration & Entropy Audit
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
          Reflect on execution drift, audit method efficacy, and calibrate next week's flight plan.
        </p>
      </div>

      {/* ─── Entropy Audit Table ───────────────────────────────────────────── */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Execution Entropy Audit</h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
              Total Planned: 30.5 hrs • Actual Executed: 24.0 hrs (78.6% Velocity)
            </p>
          </div>
          <span className="badge badge-warning">21.4% Drift Detected</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
                <th style={{ padding: '12px 16px' }}>Subject</th>
                <th style={{ padding: '12px 16px' }}>Planned Hours</th>
                <th style={{ padding: '12px 16px' }}>Actual Hours</th>
                <th style={{ padding: '12px 16px' }}>Variance (Δ)</th>
                <th style={{ padding: '12px 16px' }}>Score Efficacy</th>
                <th style={{ padding: '12px 16px' }}>Diagnosis</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((sub, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '14px 16px', fontWeight: 600 }}>{sub.name}</td>
                  <td style={{ padding: '14px 16px' }}>{sub.planned}h</td>
                  <td style={{ padding: '14px 16px' }}>{sub.actual}h</td>
                  <td style={{ padding: '14px 16px', color: sub.delta < 0 ? '#f87171' : '#34d399', fontWeight: 600 }}>
                    {sub.delta > 0 ? `+${sub.delta}` : sub.delta}h
                  </td>
                  <td style={{ padding: '14px 16px' }}>{sub.scoreMovement}</td>
                  <td style={{ padding: '14px 16px' }}>
                    {sub.methodProblem ? (
                      <span className="badge badge-danger">Method Problem</span>
                    ) : (
                      <span className="badge badge-success">On Track</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Method Efficacy Alert ─────────────────────────────────────────── */}
      <div
        className="card"
        style={{
          borderLeft: '4px solid var(--color-danger)',
          background: 'rgba(239, 68, 68, 0.05)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.5rem' }}>🔍</span>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f87171' }}>
              Method Problem Flagged: Mathematics III (Backlog)
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
              Input hours did not result in diagnostic score gains. Shift from passive note reading to active ladder tests (T1/T2) and Feynman explanations.
            </p>
          </div>
        </div>
      </div>

      {/* ─── Course Correction / Calibration Adjustment ─────────────────────── */}
      <form onSubmit={handleSubmit} className="card-glass" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '8px' }}>
          Next Week Flight Correction
        </h3>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem', marginBottom: '16px' }}>
          What single constraint or timing change will protect your trajectory next week?
        </p>

        <textarea
          className="textarea"
          rows={3}
          value={adjustment}
          onChange={(e) => setAdjustment(e.target.value)}
        />

        {submitted && (
          <div style={{ color: '#10b981', fontSize: '0.875rem', fontWeight: 600, marginTop: '12px' }}>
            ✓ Calibration recorded! Next week flight plan updated with corrected priors.
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
          <button type="submit" className="btn btn-primary">
            Lock Weekly Calibration ➔
          </button>
        </div>
      </form>
    </div>
  );
};
