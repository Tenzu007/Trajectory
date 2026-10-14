import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore.js';
import api from '../api/index.js';

export const Onboarding: React.FC = () => {
  const { student, updateStudent } = useAuthStore();
  const navigate = useNavigate();

  const [scaleMax, setScaleMax] = useState(10);
  const [attendanceThreshold, setAttendanceThreshold] = useState(75);
  const [passMark, setPassMark] = useState(40);
  const [theoryMultiplier, setTheoryMultiplier] = useState(1.2);
  const [practicalMultiplier, setPracticalMultiplier] = useState(0.9);
  const [peakHours, setPeakHours] = useState<number[]>([9, 10, 11]);

  const toggleHour = (hour: number) => {
    if (peakHours.includes(hour)) {
      setPeakHours(peakHours.filter((h) => h !== hour));
    } else {
      setPeakHours([...peakHours, hour]);
    }
  };

  const handleFinish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) {
      navigate('/');
      return;
    }

    try {
      const res = await api.patch(`/students/${student._id}/config`, {
        config: {
          gradingScale: { max: scaleMax },
          attendanceThreshold: attendanceThreshold / 100,
          creditRules: { passMark },
          gradeSchema: student.config?.gradeSchema || [],
        },
        priors: {
          taskDurationMultiplier: { theory: theoryMultiplier, practical: practicalMultiplier },
          peakFocusHours: peakHours,
          preferredFocusLength: 25,
          weeklyFreeHours: 25,
        },
        onboardingCompleted: true,
      });

      if (res.data.data) {
        updateStudent(res.data.data);
      }
    } catch {
      // ignore
    }
    navigate('/');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--color-bg-base)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
      }}
    >
      <div className="card-glass" style={{ maxWidth: '640px', width: '100%', padding: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🧭</div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Calibrate Your Academic Environment</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '6px' }}>
            Set your college's specific evaluation thresholds and your personal focus windows.
          </p>
        </div>

        <form onSubmit={handleFinish} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Indian College Defaults Section */}
          <div
            style={{
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px',
            }}
          >
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '14px' }}>
              Academic Rules & Thresholds
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              <div className="form-group">
                <label className="label">Grading Scale</label>
                <input
                  type="number"
                  className="input"
                  min={4}
                  max={10}
                  value={scaleMax}
                  onChange={(e) => setScaleMax(Number(e.target.value))}
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Default: 10-point CGPA</span>
              </div>

              <div className="form-group">
                <label className="label">Attendance Req (%)</label>
                <input
                  type="number"
                  className="input"
                  min={50}
                  max={90}
                  value={attendanceThreshold}
                  onChange={(e) => setAttendanceThreshold(Number(e.target.value))}
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Default: 75% rule</span>
              </div>

              <div className="form-group">
                <label className="label">Pass Mark (%)</label>
                <input
                  type="number"
                  className="input"
                  min={30}
                  max={50}
                  value={passMark}
                  onChange={(e) => setPassMark(Number(e.target.value))}
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Default: 40%</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginTop: '16px' }}>
              <div className="form-group">
                <label className="label">Theory Multiplier (x)</label>
                <input
                  type="number"
                  step="0.1"
                  className="input"
                  min={0.5}
                  max={3.0}
                  value={theoryMultiplier}
                  onChange={(e) => setTheoryMultiplier(Number(e.target.value))}
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Buffer for dense reading</span>
              </div>
              <div className="form-group">
                <label className="label">Practical Multiplier (x)</label>
                <input
                  type="number"
                  step="0.1"
                  className="input"
                  min={0.5}
                  max={3.0}
                  value={practicalMultiplier}
                  onChange={(e) => setPracticalMultiplier(Number(e.target.value))}
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Buffer for labs/coding</span>
              </div>
            </div>
          </div>

          {/* Personal Focus Hours */}
          <div
            style={{
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px',
            }}
          >
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '6px' }}>
              Peak Focus Windows (When your brain is sharpest)
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginBottom: '14px' }}>
              High-resistance tasks (backlogs, proofs) are scheduled into selected hours.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {[7, 8, 9, 10, 11, 14, 15, 16, 17, 19, 20, 21, 22].map((hour) => {
                const isSelected = peakHours.includes(hour);
                const displayTime = `${hour % 12 || 12}:00 ${hour >= 12 ? 'PM' : 'AM'}`;
                return (
                  <button
                    key={hour}
                    type="button"
                    onClick={() => toggleHour(hour)}
                    className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    {displayTime}
                  </button>
                );
              })}
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
            Save Configuration & Enter Flight Deck ➔
          </button>
        </form>
      </div>
    </div>
  );
};
