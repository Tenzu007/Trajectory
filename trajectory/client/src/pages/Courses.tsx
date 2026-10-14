import React, { useEffect, useState } from 'react';
import { useCoursesStore } from '../stores/useCoursesStore.js';

export const Courses: React.FC = () => {
  const {
    courses,
    summaries,
    fetchCourses,
    createCourse,
    deleteCourse,
    logAttendance,
  } = useCoursesStore();

  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [credits, setCredits] = useState(4);
  const [semester, setSemester] = useState(5);
  const [isBacklog, setIsBacklog] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await createCourse({
      name,
      code: code || name.slice(0, 3).toUpperCase() + '101',
      credits: Number(credits),
      semester: Number(semester) as any,
      isBacklog,
      topics: [
        { name: 'Unit 1: Fundamentals', mastery: 0.6, syllabusCovered: true },
        { name: 'Unit 2: Core Concepts', mastery: 0.4, syllabusCovered: false },
        { name: 'Unit 3: Advanced Applications', mastery: 0.2, syllabusCovered: false },
      ],
    });
    setName('');
    setCode('');
    setIsAdding(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Courses & Attendance
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
            Track attendance headroom against the 75% rule and compute grades needed.
          </p>
        </div>
        <button onClick={() => setIsAdding(!isAdding)} className="btn btn-primary btn-sm">
          {isAdding ? 'Cancel' : '+ Add Course'}
        </button>
      </div>

      {/* ─── Add Course Form ───────────────────────────────────────────────── */}
      {isAdding && (
        <form onSubmit={handleCreateCourse} className="card" style={{ border: '1px solid var(--color-primary)' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Enroll Course</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <div className="form-group">
              <label className="label">Course Name</label>
              <input
                type="text"
                className="input"
                required
                placeholder="e.g. Design & Analysis of Algorithms"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="label">Course Code</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. CS301"
                value={code}
                onChange={(e) => setCode(e.target.value)}
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
              <label className="label">Semester</label>
              <input
                type="number"
                className="input"
                min={1}
                max={8}
                value={semester}
                onChange={(e) => setSemester(Number(e.target.value))}
              />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem' }}>
              <input
                type="checkbox"
                checked={isBacklog}
                onChange={(e) => setIsBacklog(e.target.checked)}
              />
              <span>Is this an uncleared backlog subject?</span>
            </label>
          </div>

          <button type="submit" className="btn btn-primary btn-sm">
            Save Course
          </button>
        </form>
      )}

      {/* ─── Courses Grid ──────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '24px' }}>
        {courses.map((course) => {
          const summary = summaries[course._id];
          const pct = summary ? summary.currentPercentage : 80;
          const isWarning = pct < 75;
          const headroom = summary ? summary.bunkHeadroom : 2;

          return (
            <div
              key={course._id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                borderLeft: isWarning ? '4px solid var(--color-danger)' : '4px solid var(--color-success)',
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 700, fontSize: '1.15rem' }}>{course.name}</span>
                    {course.isBacklog && <span className="badge badge-danger">Backlog</span>}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                    {course.code} • {course.credits} Credits • Sem {course.semester}
                  </div>
                </div>
                <button
                  onClick={() => deleteCourse(course._id)}
                  className="btn btn-ghost btn-sm"
                  style={{ color: 'var(--color-text-muted)', padding: '4px 8px' }}
                >
                  ✕
                </button>
              </div>

              {/* Attendance & Bunk Headroom box */}
              <div
                style={{
                  background: 'var(--color-bg-elevated)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  border: '1px solid var(--color-border)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                    Attendance
                  </span>
                  <span
                    style={{
                      fontSize: '1.1rem',
                      fontWeight: 800,
                      color: isWarning ? 'var(--color-danger)' : 'var(--color-success)',
                    }}
                  >
                    {pct.toFixed(1)}%
                  </span>
                </div>

                <div className="progress-bar" style={{ height: '6px', marginBottom: '12px' }}>
                  <div
                    className="progress-fill"
                    style={{
                      width: `${Math.min(pct, 100)}%`,
                      background: isWarning
                        ? 'var(--color-danger)'
                        : 'linear-gradient(90deg, #10b981, #06b6d4)',
                    }}
                  />
                </div>

                {/* Bunk headroom insight */}
                <div
                  style={{
                    fontSize: '0.8125rem',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: isWarning ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                    color: isWarning ? '#f87171' : '#34d399',
                    fontWeight: 500,
                  }}
                >
                  {isWarning ? (
                    <span>⚠️ Below 75%! Attend {Math.abs(headroom)} classes consecutively to recover.</span>
                  ) : (
                    <span>✓ Bunk Headroom: Safe to miss {headroom} more {headroom === 1 ? 'class' : 'classes'}.</span>
                  )}
                </div>

                {/* Attendance Log buttons */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button
                    onClick={() => logAttendance(course._id, 'present')}
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1, color: '#34d399' }}
                  >
                    + Present
                  </button>
                  <button
                    onClick={() => logAttendance(course._id, 'absent')}
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1, color: '#f87171' }}
                  >
                    - Absent
                  </button>
                  <button
                    onClick={() => logAttendance(course._id, 'cancelled')}
                    className="btn btn-ghost btn-sm"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    ↺ Cancelled
                  </button>
                </div>
              </div>

              {/* Topics / Syllabus Preview */}
              {course.topics && course.topics.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                    Syllabus Mastery:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {course.topics.slice(0, 3).map((topic, tIdx) => (
                      <div
                        key={tIdx}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '0.75rem',
                          color: 'var(--color-text-secondary)',
                        }}
                      >
                        <span>{topic.name}</span>
                        <span>{Math.round(topic.mastery * 100)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
