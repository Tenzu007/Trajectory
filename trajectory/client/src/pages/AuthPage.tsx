import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore.js';

export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('priya@demo.trajectory.app');
  const [password, setPassword] = useState('demo1234');
  const [name, setName] = useState('Priya Sharma');
  const { student, login, register, error, isLoading, clearError } = useAuthStore();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (student) {
      navigate('/', { replace: true });
    }
  }, [student, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (isLogin) {
      const ok = await login(email, password);
      if (ok) navigate('/');
    } else {
      const ok = await register(email, password, name);
      if (ok) navigate('/onboarding');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at 50% 20%, #1e293b 0%, #0a0f1e 100%)',
        padding: '24px',
      }}
    >
      <div
        className="card-glass"
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '40px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              margin: '0 auto 16px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.75rem',
              boxShadow: '0 0 25px rgba(59, 130, 246, 0.4)',
            }}
          >
            ◈
          </div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
            Trajectory
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem', marginTop: '6px' }}>
            Turn your academic dream into a measurable flight plan.
          </p>
        </div>

        {/* Tab switch */}
        <div
          style={{
            display: 'flex',
            background: 'var(--color-bg-elevated)',
            padding: '4px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '24px',
          }}
        >
          <button
            type="button"
            onClick={() => { setIsLogin(true); clearError(); }}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.875rem',
              transition: 'all 0.2s',
              background: isLogin ? 'var(--color-primary)' : 'transparent',
              color: isLogin ? '#fff' : 'var(--color-text-secondary)',
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(false); clearError(); }}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.875rem',
              transition: 'all 0.2s',
              background: !isLogin ? 'var(--color-primary)' : 'transparent',
              color: !isLogin ? '#fff' : 'var(--color-text-secondary)',
            }}
          >
            Create Account
          </button>
        </div>

        {/* Error alert */}
        {error && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem',
              marginBottom: '20px',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {!isLogin && (
            <div className="form-group">
              <label className="label">Full Name</label>
              <input
                type="text"
                className="input"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Priya Sharma"
              />
            </div>
          )}

          <div className="form-group">
            <label className="label">College Email</label>
            <input
              type="email"
              className="input"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. name@college.edu"
            />
          </div>

          <div className="form-group">
            <label className="label">Password</label>
            <input
              type="password"
              className="input"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: '8px' }}
          >
            {isLoading ? 'Verifying...' : isLogin ? 'Launch Dashboard ➔' : 'Begin Flight Plan ➔'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
          Preset for demo: <code>priya.sharma@example.edu</code> / <code>Password123!</code>
        </div>
      </div>
    </div>
  );
};
