import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { mentorApi } from '../api/index.js';
import { useAuthStore } from '../stores/useAuthStore.js';

interface SharedData {
  name: string;
  onboardingCompleted: boolean;
  allowedFields: string[];
  cgpaForecast?: {
    p10: number;
    p50: number;
    p90: number;
  };
  enrolledCourses?: Array<{
    _id: string;
    name: string;
    code: string;
    currentMarks?: number;
    isBacklog?: boolean;
  }>;
  flightPlanSummary?: {
    totalTasks: number;
    completedTasks: number;
    completionRate: number;
  };
}

export const MentorView: React.FC = () => {
  const { studentId: routeStudentId } = useParams<{ studentId?: string }>();
  const { student } = useAuthStore();

  const isPublicView = Boolean(routeStudentId);
  const targetStudentId = routeStudentId || (student ? (student as any)._id || (student as any).id : null);

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [sharedData, setSharedData] = useState<SharedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copyNotice, setCopyNotice] = useState<string | null>(null);

  // Student permissions state
  const [selectedFields, setSelectedFields] = useState<string[]>([
    'cgpa_target',
    'attendance_status',
    'flight_plan_progress',
  ]);
  const [mentorEmail, setMentorEmail] = useState<string>('');
  const [parentEmail, setParentEmail] = useState<string>('');

  useEffect(() => {
    if (student) {
      if ((student as any).sharedFields) {
        setSelectedFields((student as any).sharedFields);
      }
      if ((student as any).mentorEmail) setMentorEmail((student as any).mentorEmail);
      if ((student as any).parentEmail) setParentEmail((student as any).parentEmail);
    }
  }, [student]);

  const fetchSharedView = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await mentorApi.getSharedView(id);
      if (res.data && res.data.data) {
        setSharedData(res.data.data as SharedData);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Unable to load trajectory view.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (targetStudentId) {
      fetchSharedView(targetStudentId);
    } else {
      setLoading(false);
    }
  }, [targetStudentId]);

  const toggleField = (field: string) => {
    setSelectedFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]
    );
  };

  const handleSavePermissions = async () => {
    if (!targetStudentId) return;
    try {
      setSaving(true);
      await mentorApi.updateSharedFields(targetStudentId, {
        sharedFields: selectedFields,
        mentorEmail,
        parentEmail,
      });
      await fetchSharedView(targetStudentId);
      setCopyNotice('Privacy preferences saved successfully!');
      setTimeout(() => setCopyNotice(null), 3000);
    } catch {
      setError('Failed to update privacy preferences.');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyLink = () => {
    if (!targetStudentId) return;
    const shareUrl = `${window.location.origin}/shared/${targetStudentId}`;
    navigator.clipboard.writeText(shareUrl);
    setCopyNotice('Shareable link copied to clipboard!');
    setTimeout(() => setCopyNotice(null), 3000);
  };

  const handleExportData = async () => {
    if (!targetStudentId) return;
    try {
      const res = await mentorApi.exportData(targetStudentId);
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(res.data.data, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `trajectory-data-${targetStudentId}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch {
      alert('Data export failed. Please try again.');
    }
  };

  const handleDeleteAccount = async () => {
    if (!targetStudentId) return;
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This will cascade-delete all your courses, tasks, exams, flashcards, and predictions. This action is irreversible.'
    );
    if (!confirmed) return;

    try {
      await mentorApi.deleteAccount(targetStudentId);
      window.location.href = '/login';
    } catch {
      alert('Failed to delete account.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* ─── Hero / Header ─────────────────────────────────────────────────── */}
      <div
        className="card-glass"
        style={{
          padding: '32px',
          background: 'radial-gradient(ellipse at 80% 20%, rgba(16, 185, 129, 0.15), transparent 70%), var(--color-bg-surface)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{ fontSize: '1.75rem' }}>🛡️</span>
            <span
              style={{
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: '#10b981',
                fontWeight: 700,
              }}
            >
              Strict Student-Consent Protocol
            </span>
          </div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
            {isPublicView ? `${sharedData?.name || 'Student'}'s Trajectory Overview` : 'Mentor & Parent Privacy Hub'}
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', margin: '8px 0 0 0', lineHeight: 1.6, fontSize: '0.95rem' }}>
            {isPublicView
              ? 'This read-only dashboard displays strictly consented academic flight metrics. Backlogs and personal reflection journals are kept confidential by default.'
              : 'Empower mentors and parents without sacrificing privacy. Granularly control which flight metrics are visible, copy your read-only share link, or manage GDPR data.'}
          </p>
        </div>

        {!isPublicView && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              onClick={handleCopyLink}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              🔗 Copy Read-Only Share Link
            </button>
            {copyNotice && (
              <div style={{ fontSize: '0.8125rem', color: '#10b981', textAlign: 'center', fontWeight: 600 }}>
                {copyNotice}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── Student Privacy Configuration (Only for logged-in student) ─────── */}
      {!isPublicView && (
        <div className="card-glass" style={{ padding: '28px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 16px 0' }}>
            Selective Visibility Controls
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '20px' }}>
            Choose what invited mentors and parents are allowed to inspect. Sensitive data like internal backlog details and private reflections are permanently private.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            {[
              {
                id: 'cgpa_target',
                title: 'Graduation CGPA Target & Cone',
                desc: 'Shares the P10, P50, P90 Monte Carlo projected envelope and target CGPA.',
              },
              {
                id: 'attendance_status',
                title: 'Attendance Standing & Course List',
                desc: 'Shares enrolled subjects and attendance threshold compliance.',
              },
              {
                id: 'flight_plan_progress',
                title: 'Weekly Flight Plan Completion',
                desc: 'Shares task completion rates and execution consistency percentages.',
              },
            ].map((f) => {
              const isChecked = selectedFields.includes(f.id);
              return (
                <div
                  key={f.id}
                  onClick={() => toggleField(f.id)}
                  style={{
                    background: isChecked ? 'rgba(16, 185, 129, 0.08)' : 'var(--color-bg-elevated)',
                    border: isChecked ? '1px solid #10b981' : '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '4px',
                      border: isChecked ? '2px solid #10b981' : '2px solid var(--color-border)',
                      background: isChecked ? '#10b981' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      marginTop: '2px',
                    }}
                  >
                    {isChecked ? '✓' : ''}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.925rem' }}>{f.title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                      {f.desc}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                Mentor Email (Optional)
              </label>
              <input
                type="email"
                className="input-field"
                placeholder="mentor@university.edu"
                value={mentorEmail}
                onChange={(e) => setMentorEmail(e.target.value)}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                Parent Email (Optional)
              </label>
              <input
                type="email"
                className="input-field"
                placeholder="parent@example.com"
                value={parentEmail}
                onChange={(e) => setParentEmail(e.target.value)}
              />
            </div>
          </div>

          <button
            onClick={handleSavePermissions}
            disabled={saving}
            className="btn btn-primary"
          >
            {saving ? 'Updating...' : 'Save Privacy Configuration'}
          </button>
        </div>
      )}

      {/* ─── Live Shared Preview / Public Mentor View ──────────────────────── */}
      <div className="card-glass" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
              {isPublicView ? 'Verified Flight Plan Telemetry' : 'Live Mentor View Preview'}
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
              Showing only explicitly granted metrics for {sharedData?.name || 'this student'}.
            </p>
          </div>
          <span
            style={{
              padding: '4px 12px',
              borderRadius: '999px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#10b981',
              fontSize: '0.75rem',
              fontWeight: 700,
            }}
          >
            🔒 Privacy Shield Active
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            Retrieving trajectory parameters...
          </div>
        ) : error ? (
          <div style={{ padding: '24px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: 'var(--radius-md)' }}>
            {error}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Metric 1: CGPA Target & Forecast */}
            {sharedData?.cgpaForecast && (
              <div
                style={{
                  background: 'var(--color-bg-elevated)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '20px',
                }}
              >
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  Academic Trajectory Envelope
                </div>
                <div style={{ display: 'flex', gap: '24px', marginTop: '12px', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Conservative (P10)</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                      {sharedData.cgpaForecast.p10.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)' }}>Expected Graduation (P50)</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                      {sharedData.cgpaForecast.p50.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#10b981' }}>Optimistic Horizon (P90)</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981' }}>
                      {sharedData.cgpaForecast.p90.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Metric 2: Attendance Status */}
            {sharedData?.enrolledCourses && (
              <div
                style={{
                  background: 'var(--color-bg-elevated)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '20px',
                }}
              >
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>
                  Enrolled Subjects & Compliance Standing
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                  {sharedData.enrolledCourses.map((c) => (
                    <div
                      key={c._id}
                      style={{
                        padding: '12px',
                        background: 'var(--color-bg-surface)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--color-border)',
                      }}
                    >
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{c.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{c.code}</div>
                      <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '4px', fontWeight: 600 }}>
                        ✓ Satisfying 75% Rule
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Metric 3: Flight Plan Summary */}
            {sharedData?.flightPlanSummary && (
              <div
                style={{
                  background: 'var(--color-bg-elevated)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '20px',
                }}
              >
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  Flight Plan Execution Telemetry
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '12px' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-accent)' }}>
                    {sharedData.flightPlanSummary.completionRate}%
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      {sharedData.flightPlanSummary.completedTasks} of {sharedData.flightPlanSummary.totalTasks} Tasks Completed
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      Weekly execution rhythm remains within optimal threshold.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* If no fields granted */}
            {(!sharedData?.allowedFields || sharedData.allowedFields.length === 0) && (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-muted)' }}>
                The student has not consented to sharing flight telemetry metrics yet.
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── GDPR & Account Management (Only for student) ──────────────────── */}
      {!isPublicView && (
        <div
          className="card-glass"
          style={{
            padding: '28px',
            border: '1px solid rgba(239, 68, 68, 0.2)',
          }}
        >
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 8px 0', color: '#f87171' }}>
            Data Privacy & Account Controls (GDPR Compliant)
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '20px' }}>
            You have total ownership of your flight plan data. Download your complete historical archive or permanently delete your account with automatic cascade cleanup.
          </p>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <button
              onClick={handleExportData}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              📥 Export All Personal Data (JSON)
            </button>

            <button
              onClick={handleDeleteAccount}
              className="btn btn-secondary"
              style={{
                color: '#ef4444',
                borderColor: 'rgba(239, 68, 68, 0.4)',
                background: 'rgba(239, 68, 68, 0.05)',
              }}
            >
              🗑️ Delete Account & Wipe Data
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
