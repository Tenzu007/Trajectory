import React, { useEffect, useState } from 'react';
import { usePlannerStore } from '../stores/usePlannerStore.js';
import type { TaskBase } from '@trajectory/shared';

export const Planner: React.FC = () => {
  const {
    tasks,
    fetchTasks,
    createTask,
    completeTask,
    releaseTask,
    toggleStep,
    pomodoro,
    pet,
    startPomodoro,
    pausePomodoro,
    resumePomodoro,
    resetPomodoro,
    tickPomodoro,
  } = usePlannerStore();

  const [releaseModalTask, setReleaseModalTask] = useState<TaskBase | null>(null);
  const [releaseImpact, setReleaseImpact] = useState<{ gapScoreDelta: number; gradeForecastDelta: number } | null>(null);

  // New task form state
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newMinutes, setNewMinutes] = useState(45);
  const [newTwoMinute, setNewTwoMinute] = useState('');
  const [newType, setNewType] = useState<'study' | 'assignment' | 'practice'>('study');

  useEffect(() => {
    fetchTasks();
  }, []);

  // Pomodoro countdown ticker
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (pomodoro.isRunning) {
      interval = setInterval(() => {
        tickPomodoro();
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [pomodoro.isRunning]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    await createTask({
      title: newTitle,
      type: newType,
      estimatedMinutes: Number(newMinutes),
      twoMinuteLaunch: newTwoMinute || `Open slides / editor for ${newTitle}`,
      steps: [
        { description: newTwoMinute || 'Open material and read 1st paragraph', completed: false },
        { description: 'Complete primary core practice problem', completed: false },
        { description: 'Active recall summary (retrieval practice)', completed: false },
      ],
      marksAtStake: 5,
      mastery: 0.5,
      urgencyDays: 3,
      effortHours: Number(newMinutes) / 60,
    });
    setNewTitle('');
    setNewTwoMinute('');
    setIsAdding(false);
  };

  const handleOpenReleaseModal = (task: TaskBase) => {
    setReleaseModalTask(task);
    setReleaseImpact({
      gapScoreDelta: 1.8,
      gradeForecastDelta: -0.07,
    });
  };

  const handleConfirmRelease = async () => {
    if (!releaseModalTask) return;
    await releaseTask(releaseModalTask._id);
    setReleaseModalTask(null);
    setReleaseImpact(null);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '32px' }}>
      {/* ─── Flight Plan List ────────────────────────────────────────────────── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Daily Flight Plan
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
              Deterministic priority scheduling with anti-procrastination 2-minute triggers.
            </p>
          </div>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="btn btn-primary btn-sm"
          >
            {isAdding ? 'Cancel' : '+ Add Flight Block'}
          </button>
        </div>

        {/* Add Block Form */}
        {isAdding && (
          <form
            onSubmit={handleCreateTask}
            className="card"
            style={{ marginBottom: '24px', border: '1px solid var(--color-primary)' }}
          >
            <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Schedule New Flight Block</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div className="form-group">
                <label className="label">Block Title</label>
                <input
                  type="text"
                  className="input"
                  required
                  placeholder="e.g. Operating Systems: Semaphore implementation"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="label">Estimated Mins</label>
                <input
                  type="number"
                  className="input"
                  min={10}
                  max={180}
                  value={newMinutes}
                  onChange={(e) => setNewMinutes(Number(e.target.value))}
                />
              </div>
              <div className="form-group">
                <label className="label">Category</label>
                <select
                  className="select"
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                >
                  <option value="study">Study</option>
                  <option value="assignment">Assignment</option>
                  <option value="practice">Practice</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="label">
                2-Minute Launch Step <span style={{ color: 'var(--color-accent)' }}>(Trivially easy action to break inertia)</span>
              </label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Open textbook chapter 4 and read the bold headings"
                value={newTwoMinute}
                onChange={(e) => setNewTwoMinute(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary btn-sm">
              Schedule into Flight Plan
            </button>
          </form>
        )}

        {/* Tasks List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {tasks.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ color: 'var(--color-text-secondary)' }}>No scheduled blocks for today.</p>
            </div>
          ) : (
            tasks.map((task, idx) => {
              const isDone = task.status === 'done';
              const isReleased = task.status === 'released';
              const isActive = pomodoro.activeTaskId === task._id;

              return (
                <div
                  key={task._id}
                  className="card"
                  style={{
                    opacity: isDone || isReleased ? 0.6 : 1,
                    borderLeft: isActive
                      ? '4px solid var(--color-accent)'
                      : isDone
                      ? '4px solid var(--color-success)'
                      : isReleased
                      ? '4px solid var(--color-danger)'
                      : '4px solid var(--color-primary)',
                    background: isActive ? 'rgba(6, 182, 212, 0.05)' : 'var(--color-bg-surface)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: 'var(--color-bg-elevated)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.8125rem',
                          color: 'var(--color-text-secondary)',
                        }}
                      >
                        #{idx + 1}
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span
                            style={{
                              fontSize: '1.05rem',
                              fontWeight: 700,
                              textDecoration: isDone ? 'line-through' : 'none',
                            }}
                          >
                            {task.title}
                          </span>
                          <span className="badge badge-primary">{task.type}</span>
                          <span className="badge badge-muted">{task.estimatedMinutes}m</span>
                          {isDone && <span className="badge badge-success">Completed</span>}
                          {isReleased && <span className="badge badge-danger">Released via Protocol</span>}
                        </div>

                        {task.description && (
                          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem', marginTop: '4px' }}>
                            {task.description}
                          </p>
                        )}

                        {/* 2-minute launcher reminder */}
                        {!isDone && !isReleased && task.twoMinuteLaunch && (
                          <div style={{ fontSize: '0.8125rem', color: 'var(--color-accent)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>🚀 2-Min Launch:</span>
                            <span>{task.twoMinuteLaunch}</span>
                          </div>
                        )}

                        {/* Steps checklist */}
                        {task.steps && task.steps.length > 0 && !isReleased && (
                          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {task.steps.map((step, sIdx) => (
                              <label
                                key={sIdx}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  fontSize: '0.8125rem',
                                  color: step.completed ? 'var(--color-text-muted)' : 'var(--color-text-secondary)',
                                  cursor: 'pointer',
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={step.completed}
                                  onChange={() => toggleStep(task._id, sIdx)}
                                />
                                <span style={{ textDecoration: step.completed ? 'line-through' : 'none' }}>
                                  {step.description}
                                </span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    {!isDone && !isReleased && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => startPomodoro(task._id, 25)}
                          className="btn btn-accent btn-sm"
                        >
                          Focus
                        </button>
                        <button
                          onClick={() => completeTask(task._id)}
                          className="btn btn-secondary btn-sm"
                          style={{ color: 'var(--color-success)' }}
                        >
                          ✓ Done
                        </button>
                        <button
                          onClick={() => handleOpenReleaseModal(task)}
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--color-danger)' }}
                          title="Integrity Protocol: Consciously release with known impact"
                        >
                          Release
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ─── Sidebar: Pomodoro Timer & Pet ───────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Pomodoro Timer Card */}
        <div
          className="card"
          style={{
            textAlign: 'center',
            border: '1px solid var(--color-border)',
            background: 'var(--color-bg-surface)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span className="badge badge-accent" style={{ textTransform: 'uppercase' }}>
              {pomodoro.mode.replace('_', ' ')}
            </span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
              Completed: {pomodoro.completedSessions}
            </span>
          </div>

          {/* Big countdown display */}
          <div
            style={{
              fontSize: '3.75rem',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              letterSpacing: '-0.04em',
              margin: '12px 0',
              color: pomodoro.isRunning ? 'var(--color-accent)' : 'var(--color-text-primary)',
            }}
          >
            {formatTime(pomodoro.timeLeft)}
          </div>

          {/* Progress bar */}
          <div className="progress-bar" style={{ marginBottom: '20px' }}>
            <div
              className="progress-fill"
              style={{
                width: `${((pomodoro.totalDuration - pomodoro.timeLeft) / pomodoro.totalDuration) * 100}%`,
              }}
            />
          </div>

          {/* Timer Controls */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            {pomodoro.isRunning ? (
              <button onClick={pausePomodoro} className="btn btn-secondary" style={{ flex: 1 }}>
                Pause
              </button>
            ) : (
              <button onClick={resumePomodoro} className="btn btn-primary" style={{ flex: 1 }}>
                Start
              </button>
            )}
            <button onClick={() => resetPomodoro(25)} className="btn btn-ghost">
              Reset
            </button>
          </div>

          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginTop: '16px' }}>
            <button
              onClick={() => startPomodoro(pomodoro.activeTaskId || undefined, 2)}
              className="btn btn-ghost btn-sm"
              title="Overcome initial activation energy"
            >
              2m Launch
            </button>
            <button
              onClick={() => startPomodoro(pomodoro.activeTaskId || undefined, 25)}
              className="btn btn-ghost btn-sm"
            >
              25m Focus
            </button>
            <button
              onClick={() => startPomodoro(pomodoro.activeTaskId || undefined, 5)}
              className="btn btn-ghost btn-sm"
            >
              5m Break
            </button>
          </div>
        </div>

        {/* Study Pet Card */}
        <div
          className="card"
          style={{
            background: 'radial-gradient(circle at 50% 20%, rgba(59, 130, 246, 0.1), transparent 70%), var(--color-bg-surface)',
            border: '1px solid var(--color-border)',
            textAlign: 'center',
            padding: '24px',
          }}
        >
          <div
            style={{
              fontSize: '3.5rem',
              animation: pomodoro.isRunning ? 'float 3s ease-in-out infinite' : 'none',
              marginBottom: '8px',
            }}
          >
            {pet.mood === 'ecstatic' ? '🚀' : pomodoro.isRunning ? '🧘' : '🦉'}
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{pet.name}</h3>
          <div style={{ fontSize: '0.8125rem', color: 'var(--color-accent)', fontWeight: 600 }}>
            Level {pet.level} • {pet.mood.toUpperCase()}
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '8px' }}>
            Earns +25 XP per completed task and +30 XP per finished focus session.
          </p>

          <div className="progress-bar" style={{ marginTop: '16px', height: '8px' }}>
            <div
              className="progress-fill"
              style={{ width: `${(pet.xp / pet.nextLevelXp) * 100}%` }}
            />
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '6px' }}>
            {pet.xp} / {pet.nextLevelXp} XP to Level {pet.level + 1}
          </div>
        </div>
      </div>

      {/* ─── Integrity Protocol Modal ────────────────────────────────────────── */}
      {releaseModalTask && (
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
              maxWidth: '480px',
              width: '100%',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              padding: '28px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <span style={{ fontSize: '1.5rem' }}>⚖️</span>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f87171' }}>
                Integrity Protocol: Conscious Release
              </h2>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>
              Instead of silently failing or rescheduling indefinitely, releasing a task is an honest decision.
            </p>

            <div
              style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                margin: '16px 0',
              }}
            >
              <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '8px' }}>
                Projected Consequence:
              </div>
              <div style={{ fontSize: '0.8125rem', display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>Gap Score Increase:</span>
                <strong style={{ color: '#f87171' }}>+{releaseImpact?.gapScoreDelta} pts</strong>
              </div>
              <div style={{ fontSize: '0.8125rem', display: 'flex', justifyContent: 'space-between' }}>
                <span>Grade Forecast Delta:</span>
                <strong style={{ color: '#f87171' }}>{releaseImpact?.gradeForecastDelta} SGPA</strong>
              </div>
            </div>

            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
              Are you sure you want to release <strong>"{releaseModalTask.title}"</strong>?
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setReleaseModalTask(null)}
                className="btn btn-secondary btn-sm"
              >
                Keep in Flight Plan
              </button>
              <button
                onClick={handleConfirmRelease}
                className="btn btn-danger btn-sm"
              >
                Confirm Release
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
