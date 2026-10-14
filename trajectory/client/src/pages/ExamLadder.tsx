import React, { useEffect, useState } from 'react';
import { examsApi, coursesApi } from '../api/index.js';
import type { CourseBase } from '@trajectory/shared';

interface ExamItem {
  _id: string;
  name: string;
  date: string;
  courseId: { _id: string; name: string } | string;
  syllabusTopics: string[];
  ladderTests: Array<{
    _id: string;
    tier: number;
    scheduledDate: string;
    completedDate?: string;
    openNotes: boolean;
    scoredMarks?: number;
    maxMarks?: number;
    compressed: boolean;
  }>;
}

export const ExamLadder: React.FC = () => {
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [courses, setCourses] = useState<CourseBase[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [examName, setExamName] = useState('Mid-Term Exam');
  const [examDate, setExamDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 25);
    return d.toISOString().split('T')[0];
  });
  const [topics, setTopics] = useState('Process Synchronization, CPU Scheduling, Virtual Memory');

  // Error Autopsy modal state
  const [activeAutopsyTestId, setActiveAutopsyTestId] = useState<string | null>(null);
  const [conceptGaps, setConceptGaps] = useState('Peterson Algorithm Proof');
  const [carelessMistakes, setCarelessMistakes] = useState('Arithmetic error in average turnaround time calculation');
  const [timePressureItems, setTimePressureItems] = useState('Question 5 (Multilevel feedback queue)');
  const [autopsySaved, setAutopsySaved] = useState(false);

  const fetchExams = async () => {
    try {
      const res = await examsApi.list();
      setExams(res.data.data || []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchExams();
    coursesApi.list().then((res) => {
      setCourses(res.data.data || []);
      if (res.data.data && res.data.data.length > 0) {
        setSelectedCourseId(res.data.data[0]._id);
      }
    });
  }, []);

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId || !examDate) return;

    await examsApi.create({
      courseId: selectedCourseId,
      name: examName,
      date: new Date(examDate).toISOString(),
      syllabusTopics: topics.split(',').map((s) => s.trim()).filter(Boolean),
    });

    setIsAdding(false);
    fetchExams();
  };

  const handleSaveAutopsy = async () => {
    if (!activeAutopsyTestId) return;
    try {
      await examsApi.submitAttempt(activeAutopsyTestId, {
        answers: [],
        autopsy: {
          conceptGaps: conceptGaps.split(',').map((s) => s.trim()).filter(Boolean),
          carelessMistakes: carelessMistakes.split(',').map((s) => s.trim()).filter(Boolean),
          timePressureItems: timePressureItems.split(',').map((s) => s.trim()).filter(Boolean),
          fixList: [
            { item: 'Review Peterson Solution', action: 'Re-derive on paper', priority: 'high' },
          ],
        },
        timeTaken: 45,
      });
      setAutopsySaved(true);
      setTimeout(() => {
        setActiveAutopsyTestId(null);
        setAutopsySaved(false);
        fetchExams();
      }, 1200);
    } catch {
      // ignore
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Exam Ladder & Error Autopsy
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
            Three-tier progressive retrieval practice (T1 Foundation → T2 Speed → T3 Full Mock) to guarantee exam readiness.
          </p>
        </div>
        <button onClick={() => setIsAdding(!isAdding)} className="btn btn-primary btn-sm">
          {isAdding ? 'Cancel' : '+ Schedule Exam'}
        </button>
      </div>

      {/* ─── Add Exam Form ─────────────────────────────────────────────────── */}
      {isAdding && (
        <form onSubmit={handleCreateExam} className="card" style={{ border: '1px solid var(--color-primary)' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Schedule Exam with Auto-Ladder</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <div className="form-group">
              <label className="label">Course</label>
              <select
                className="select"
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
              >
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Exam Name</label>
              <input
                type="text"
                className="input"
                required
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="label">Exam Date</label>
              <input
                type="date"
                className="input"
                required
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="label">Syllabus Topics (comma-separated)</label>
            <input
              type="text"
              className="input"
              value={topics}
              onChange={(e) => setTopics(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary btn-sm">
            Generate T1/T2/T3 Ladder ➔
          </button>
        </form>
      )}

      {/* ─── Exams List ────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {exams.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🎯</div>
            <h3>No exams scheduled</h3>
            <p style={{ color: 'var(--color-text-secondary)', marginTop: '4px', fontSize: '0.875rem' }}>
              Schedule an upcoming mid-term or end-term to automatically generate your 3-tier retrieval practice ladder.
            </p>
          </div>
        ) : (
          exams.map((exam) => {
            const courseName = typeof exam.courseId === 'object' && exam.courseId ? exam.courseId.name : 'Course';
            const daysLeft = Math.ceil((new Date(exam.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

            return (
              <div key={exam._id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>{exam.name}</h2>
                      <span className="badge badge-primary">{courseName}</span>
                      <span className="badge badge-accent">In {daysLeft} Days</span>
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                      Scheduled Date: {new Date(exam.date).toLocaleDateString(undefined, { dateStyle: 'full' })}
                    </div>
                  </div>
                </div>

                {/* 3-Tier Ladder Horizontal Track */}
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
                  {exam.ladderTests &&
                    exam.ladderTests.map((tierTest) => {
                      const tierDate = new Date(tierTest.scheduledDate).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      });
                      const tierTitles = ['T1: Foundation', 'T2: Speed & Pressure', 'T3: Full Mock Exam'];
                      const tierDesc = [
                        'Open notes allowed. Focus on fundamental definitions & concept mastery.',
                        'Closed notes, timed conditions. Focus on question speed & accuracy.',
                        'Simulated exam hall conditions. Full syllabus test.',
                      ];

                      return (
                        <div
                          key={tierTest._id}
                          style={{
                            background: 'var(--color-bg-surface)',
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-md)',
                            padding: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <span className="badge badge-accent">Tier {tierTest.tier}</span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{tierDate}</span>
                            </div>
                            <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>
                              {tierTitles[tierTest.tier - 1]}
                            </div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                              {tierDesc[tierTest.tier - 1]}
                            </p>
                            {tierTest.compressed && (
                              <div style={{ fontSize: '0.7rem', color: '#f59e0b', marginTop: '6px' }}>
                                ⚡ Compressed schedule
                              </div>
                            )}
                          </div>

                          <div style={{ marginTop: '16px' }}>
                            <button
                              onClick={() => setActiveAutopsyTestId(tierTest._id)}
                              className="btn btn-secondary btn-sm"
                              style={{ width: '100%', fontSize: '0.75rem' }}
                            >
                              🔬 Run Error Autopsy
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ─── Error Autopsy Modal ─────────────────────────────────────────────── */}
      {activeAutopsyTestId && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px',
          }}
        >
          <div
            className="card-elevated"
            style={{
              maxWidth: '560px',
              width: '100%',
              padding: '32px',
              border: '1px solid var(--color-border)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Error Autopsy Diagnostic</h2>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem', marginTop: '2px' }}>
                  Categorize errors so revision targets real deficits rather than passive rereading.
                </p>
              </div>
              <button
                onClick={() => setActiveAutopsyTestId(null)}
                className="btn btn-ghost btn-sm"
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="label">
                  <span style={{ color: '#f87171', fontWeight: 700 }}>1. Concept Gaps</span> (didn't know how to solve)
                </label>
                <input
                  type="text"
                  className="input"
                  value={conceptGaps}
                  onChange={(e) => setConceptGaps(e.target.value)}
                  placeholder="e.g. Peterson proof, Banker algorithm"
                />
              </div>

              <div className="form-group">
                <label className="label">
                  <span style={{ color: '#f59e0b', fontWeight: 700 }}>2. Careless Mistakes</span> (knew concept, slipped in execution)
                </label>
                <input
                  type="text"
                  className="input"
                  value={carelessMistakes}
                  onChange={(e) => setCarelessMistakes(e.target.value)}
                  placeholder="e.g. Sign error, didn't read unit"
                />
              </div>

              <div className="form-group">
                <label className="label">
                  <span style={{ color: '#38bdf8', fontWeight: 700 }}>3. Time Pressure</span> (ran out of minutes)
                </label>
                <input
                  type="text"
                  className="input"
                  value={timePressureItems}
                  onChange={(e) => setTimePressureItems(e.target.value)}
                  placeholder="e.g. Q4 Long proof"
                />
              </div>

              {autopsySaved && (
                <div style={{ color: '#10b981', fontSize: '0.875rem', fontWeight: 600 }}>
                  ✓ Error autopsy logged! Fix tasks added to flight plan.
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button onClick={() => setActiveAutopsyTestId(null)} className="btn btn-secondary btn-sm">
                  Cancel
                </button>
                <button onClick={handleSaveAutopsy} className="btn btn-primary btn-sm">
                  Save Autopsy & Generate Fix Tasks
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
