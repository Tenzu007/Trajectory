import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore.js';
import { usePlannerStore } from '../../stores/usePlannerStore.js';

export const AppLayout: React.FC = () => {
  const { student, logout } = useAuthStore();
  const { pet } = usePlannerStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', label: 'Dashboard', icon: '⚡' },
    { to: '/planner', label: 'Flight Plan & Timer', icon: '⏱️' },
    { to: '/cone', label: 'Trajectory Cone', icon: '📐' },
    { to: '/courses', label: 'Courses & Bunk Calc', icon: '📚' },
    { to: '/exams', label: 'Exam Ladder & Autopsy', icon: '🎯' },
    { to: '/backlogs', label: 'Backlog Recovery', icon: '🛡️' },
    { to: '/learning', label: 'Deep Learning Suite', icon: '🗂️' },
    { to: '/skills', label: 'Skill Runway', icon: '🚀' },
    { to: '/study-room', label: 'Silent Study Deck', icon: '🎧' },
    { to: '/mentor', label: 'Mentor & Privacy', icon: '👁️' },
    { to: '/dream', label: 'Dream Compiler', icon: '✨' },
    { to: '/calibration', label: 'Weekly Calibration', icon: '🔄' },
    { to: '/report', label: 'Flight Telemetry Log', icon: '📄' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg-base)' }}>
      {/* ─── Sidebar ────────────────────────────────────────────────────────── */}
      <aside className="nav-sidebar">
        <div className="nav-logo flex items-center justify-between">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.5rem', color: 'var(--color-primary)' }}>◈</span>
            <span style={{ fontWeight: 800, letterSpacing: '-0.03em', fontSize: '1.25rem' }}>
              TRAJECTORY
            </span>
          </div>
        </div>

        {/* Pet status badge in sidebar */}
        <div
          style={{
            background: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '12px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              fontSize: '1.8rem',
              background: 'rgba(59, 130, 246, 0.1)',
              borderRadius: '50%',
              width: '42px',
              height: '42px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {pet.mood === 'ecstatic' ? '🚀' : pet.mood === 'focused' ? '🦉' : '🐾'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
              <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{pet.name}</span>
              <span style={{ color: 'var(--color-accent)', fontWeight: 600 }}>Lv.{pet.level}</span>
            </div>
            <div className="progress-bar" style={{ height: '4px', marginTop: '6px' }}>
              <div
                className="progress-fill"
                style={{ width: `${(pet.xp / pet.nextLevelXp) * 100}%` }}
              />
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              {pet.xp} / {pet.nextLevelXp} XP
            </div>
          </div>
        </div>

        {/* Navigation items */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Card & Logout */}
        <div
          style={{
            borderTop: '1px solid var(--color-border)',
            paddingTop: '16px',
            marginTop: 'auto',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                color: '#fff',
                fontSize: '0.875rem',
              }}
            >
              {student?.name?.charAt(0) || 'S'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {student?.name || 'Student'}
              </div>
              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--color-text-secondary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {student?.email || ''}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="btn btn-secondary btn-sm"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* ─── Main Content Area ──────────────────────────────────────────────── */}
      <main
        style={{
          marginLeft: '240px',
          flex: 1,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--color-bg-base)',
        }}
      >
        {/* Top Header */}
        <header
          style={{
            height: '64px',
            borderBottom: '1px solid var(--color-border)',
            background: 'var(--color-bg-glass)',
            backdropFilter: 'blur(12px)',
            position: 'sticky',
            top: 0,
            zIndex: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 32px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="badge badge-primary">Phase 1 • Active</span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
              Config: {student?.config?.gradingScale?.max || 10}-pt scale • {((student?.config?.attendanceThreshold || 0.75) * 100).toFixed(0)}% attendance rule
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
              <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>Online</span>
            </div>
            <button
              onClick={() => navigate('/dream')}
              className="btn btn-accent btn-sm"
            >
              ✦ Reality Check
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div style={{ padding: '32px', flex: 1, maxWidth: '1400px', width: '100%', margin: '0 auto' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};
