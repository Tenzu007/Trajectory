import React, { useEffect, useState } from 'react';
import { backlogsApi, coursesApi } from '../api/index.js';
import type { CourseBase } from '@trajectory/shared';

interface BacklogItem {
  _id: string;
  courseId: { _id: string; name: string; code: string } | string;
  suppExamDate: string;
  syllabusRemaining: string[];
  prerequisiteChain: string[];
  pastScore: number;
  credits: number;
  recoveryValue: number;
  rootCause?: 'foundations' | 'technique' | 'attendance' | 'time_clash';
  vectorBMinutes: { default: number; minimum: number };
}

interface SupportEntry {
  _id: string;
  personName: string;
  role: 'professor' | 'ta' | 'senior' | 'peer' | 'mentor';
  specificAsk: string;
  messageTemplate: string;
  contacted: boolean;
}

export const BacklogRecovery: React.FC = () => {
  const [backlogs, setBacklogs] = useState<BacklogItem[]>([]);
  const [courses, setCourses] = useState<CourseBase[]>([]);
  const [selectedBacklogId, setSelectedBacklogId] = useState<string | null>(null);
  const [supportEntries, setSupportEntries] = useState<SupportEntry[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Diagnostic wizard state
  const [diagnosticOpen, setDiagnosticOpen] = useState(false);
  const [selectedRootCause, setSelectedRootCause] = useState<'foundations' | 'technique' | 'attendance' | 'time_clash'>('foundations');
  const [diagnosticPrescription, setDiagnosticPrescription] = useState<string | null>(null);

  // New backlog form
  const [courseId, setCourseId] = useState('');
  const [suppExamDate, setSuppExamDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 35);
    return d.toISOString().split('T')[0];
  });
  const [credits, setCredits] = useState(4);
  const [pastScore, setPastScore] = useState(32);
  const [prereq, setPrereq] = useState('Operating Systems CS401');
  const [remainingTopics, setRemainingTopics] = useState('Deadlock algorithms, Virtual memory paging, File systems');

  const fetchBacklogs = async () => {
    try {
      const res = await backlogsApi.list();
      const list = res.data.data || [];
      setBacklogs(list);
      if (list.length > 0 && !selectedBacklogId) {
        setSelectedBacklogId(list[0]._id);
        fetchSupportMap(list[0]._id);
      }
    } catch {
      // ignore
    }
  };

  const fetchSupportMap = async (bId: string) => {
    try {
      const res = await backlogsApi.supportMap(bId);
      setSupportEntries(res.data.data || []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchBacklogs();
    coursesApi.list().then((res) => {
      setCourses(res.data.data || []);
      if (res.data.data && res.data.data.length > 0) {
        setCourseId(res.data.data[0]._id);
      }
    });
  }, []);

  const handleSelectBacklog = (bId: string) => {
    setSelectedBacklogId(bId);
    fetchSupportMap(bId);
    setDiagnosticPrescription(null);
  };

  const handleCreateBacklog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId || !suppExamDate) return;

    await backlogsApi.create({
      courseId,
      suppExamDate: new Date(suppExamDate).toISOString(),
      credits: Number(credits),
      pastScore: Number(pastScore),
      prerequisiteChain: prereq.split(',').map((s) => s.trim()).filter(Boolean),
      syllabusRemaining: remainingTopics.split(',').map((s) => s.trim()).filter(Boolean),
      vectorBMinutes: { default: 90, minimum: 45 },
    });

    setIsAdding(false);
    fetchBacklogs();
  };

  const handleRunDiagnostic = async () => {
    if (!selectedBacklogId) return;
    try {
      const res = await backlogsApi.rootCause(selectedBacklogId, {
        rootCause: selectedRootCause,
      });
      setDiagnosticPrescription(res.data.data.recommendation);
      setDiagnosticOpen(false);
      fetchBacklogs();
    } catch {
      // ignore
    }
  };

  const handleToggleContacted = async (entryId: string, current: boolean) => {
    try {
      await backlogsApi.toggleSupport(entryId, { contacted: !current });
      setSupportEntries((prev) =>
        prev.map((e) => (e._id === entryId ? { ...e, contacted: !current } : e))
      );
    } catch {
      // ignore
    }
  };

  const handleCopyTemplate = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const activeBacklog = backlogs.find((b) => b._id === selectedBacklogId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Backlog Recovery Protocol
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
            Remediate uncleared supplementary exams systematically with Vector B study blocks, root cause diagnostics, and support outreach.
          </p>
        </div>
        <button onClick={() => setIsAdding(!isAdding)} className="btn btn-primary btn-sm">
          {isAdding ? 'Cancel' : '+ Enroll Backlog'}
        </button>
      </div>

      {/* ─── Add Backlog Form ───────────────────────────────────────────────── */}
      {isAdding && (
        <form onSubmit={handleCreateBacklog} className="card" style={{ border: '1px solid var(--color-primary)' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Enroll Uncleared Subject into Recovery</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <div className="form-group">
              <label className="label">Course</label>
              <select className="select" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Supp Exam Date</label>
              <input
                type="date"
                className="input"
                required
                value={suppExamDate}
                onChange={(e) => setSuppExamDate(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="label">Credits</label>
              <input
                type="number"
                className="input"
                min={1}
                max={6}
                value={credits}
                onChange={(e) => setCredits(Number(e.target.value))}
              />
            </div>
            <div className="form-group">
              <label className="label">Previous Marks (Out of 100)</label>
              <input
                type="number"
                className="input"
                min={0}
                max={100}
                value={pastScore}
                onChange={(e) => setPastScore(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="label">Prerequisite Chain (Courses this blocks)</label>
            <input
              type="text"
              className="input"
              value={prereq}
              onChange={(e) => setPrereq(e.target.value)}
              placeholder="e.g. Advanced Operating Systems, Distributed Systems"
            />
          </div>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="label">Remaining High-Weight Syllabus Topics</label>
            <input
              type="text"
              className="input"
              value={remainingTopics}
              onChange={(e) => setRemainingTopics(e.target.value)}
              placeholder="e.g. Semaphore proofs, Virtual memory algorithms"
            />
          </div>

          <button type="submit" className="btn btn-primary btn-sm">
            Compute Recovery Value & Enroll ➔
          </button>
        </form>
      )}

      {/* ─── Backlog Priority Ranking Cards ─────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {backlogs.map((b) => {
          const courseName = typeof b.courseId === 'object' && b.courseId ? b.courseId.name : 'Backlog Subject';
          const isSelected = selectedBacklogId === b._id;
          const daysAway = Math.max(1, Math.ceil((new Date(b.suppExamDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

          return (
            <div
              key={b._id}
              onClick={() => handleSelectBacklog(b._id)}
              className="card"
              style={{
                cursor: 'pointer',
                border: isSelected ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
                background: isSelected ? 'rgba(6, 182, 212, 0.05)' : 'var(--color-bg-surface)',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 700, fontSize: '1.15rem' }}>{courseName}</span>
                    <span className="badge badge-danger">{b.credits} Credits</span>
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                    In {daysAway} Days • Past Score: {b.pastScore}/100
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                    Recovery Value
                  </div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-accent)' }}>
                    {b.recoveryValue}
                  </div>
                </div>
              </div>

              {/* Vector B info */}
              <div
                style={{
                  background: 'var(--color-bg-elevated)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '8px 12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.8125rem',
                }}
              >
                <span>🛡️ Vector B Time Protection:</span>
                <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                  {b.vectorBMinutes?.default || 90}m / day
                </span>
              </div>

              {b.rootCause && (
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                  Diagnosed Root Cause: <strong style={{ color: 'var(--color-text-primary)' }}>{b.rootCause.toUpperCase()}</strong>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ─── Selected Backlog Recovery Workbench ─────────────────────────────── */}
      {activeBacklog && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '28px' }}>
          {/* Left: Root Cause Diagnostic & Recovery Plan */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Root Cause Diagnostic & Prescription</h2>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                  Target the true obstacle rather than blindly repeating failed habits.
                </p>
              </div>
              <button
                onClick={() => setDiagnosticOpen(!diagnosticOpen)}
                className="btn btn-secondary btn-sm"
              >
                {diagnosticOpen ? 'Close' : '🔬 Run Diagnostic'}
              </button>
            </div>

            {/* Diagnostic Modal / Inline form */}
            {diagnosticOpen && (
              <div
                style={{
                  background: 'var(--color-bg-elevated)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '20px',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '12px' }}>
                  What was the primary driver of the backlog?
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                  {[
                    { id: 'foundations', title: 'Foundational Concept Gap', desc: 'Prerequisite mathematics or basics were missing, making lectures incomprehensible.' },
                    { id: 'technique', title: 'Study Technique Failure', desc: 'Read textbooks and slides passively; never practiced actual exam problem derivations.' },
                    { id: 'attendance', title: 'Attendance Debarment / Missed Lectures', desc: 'Missed core class explanations and teacher hints about exam patterns.' },
                    { id: 'time_clash', title: 'Time Conflict / Overload', desc: 'Semester projects and exams happened simultaneously, leaving zero study bandwidth.' },
                  ].map((option) => (
                    <label
                      key={option.id}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        padding: '10px',
                        borderRadius: 'var(--radius-sm)',
                        background: selectedRootCause === option.id ? 'var(--color-primary-muted)' : 'transparent',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="radio"
                        name="rootCause"
                        value={option.id}
                        checked={selectedRootCause === option.id}
                        onChange={() => setSelectedRootCause(option.id as any)}
                        style={{ marginTop: '3px' }}
                      />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{option.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{option.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>

                <button onClick={handleRunDiagnostic} className="btn btn-primary btn-sm">
                  Save Diagnostic & Generate Prescription ➔
                </button>
              </div>
            )}

            {/* Diagnostic Prescription Box */}
            <div
              style={{
                background: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase' }}>
                Remedial Prescription
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)', marginTop: '6px' }}>
                {diagnosticPrescription ||
                  'Enforce strict 90-minute morning Vector B protection blocks. Rebuild core prerequisites first using solved proofs before attempting past 5-year university exam papers.'}
              </p>
            </div>

            {/* Remaining Topics List */}
            {activeBacklog.syllabusRemaining && activeBacklog.syllabusRemaining.length > 0 && (
              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, marginBottom: '8px' }}>
                  High-Priority Remaining Units:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {activeBacklog.syllabusRemaining.map((topic, idx) => (
                    <span key={idx} className="badge badge-muted">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Support Map & Outreach Generator */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Support Map & Outreach</h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                Pre-composed respectful templates to reach out to professors, seniors, and peers without hesitation.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {supportEntries.map((entry, idx) => (
                <div
                  key={entry._id}
                  style={{
                    background: 'var(--color-bg-elevated)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="badge badge-accent">{entry.role.toUpperCase()}</span>
                      <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{entry.personName}</span>
                    </div>

                    <button
                      onClick={() => handleToggleContacted(entry._id, entry.contacted)}
                      className={`btn btn-sm ${entry.contacted ? 'btn-secondary' : 'btn-ghost'}`}
                      style={{ fontSize: '0.75rem', color: entry.contacted ? 'var(--color-success)' : 'inherit' }}
                    >
                      {entry.contacted ? '✓ Contacted' : 'Mark Contacted'}
                    </button>
                  </div>

                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                    Specific Ask: <strong>{entry.specificAsk}</strong>
                  </p>

                  <div
                    style={{
                      background: 'var(--color-bg-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '10px',
                      fontSize: '0.8125rem',
                      lineHeight: '1.5',
                      color: 'var(--color-text-primary)',
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    "{entry.messageTemplate}"
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                    <button
                      onClick={() => handleCopyTemplate(entry.messageTemplate, idx)}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.75rem' }}
                    >
                      {copiedIndex === idx ? '✓ Copied to Clipboard!' : '📋 Copy Message'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
