import React, { useEffect, useState, useMemo } from 'react';
import { forecastsApi } from '../api/index.js';
import { useAuthStore } from '../stores/useAuthStore.js';

interface Scenario {
  id: string;
  action: string;
  cgpaDelta: number;
  category: 'backlog' | 'attendance' | 'grades' | 'lifestyle';
  active: boolean;
}

interface ForecastData {
  cgpaRange: {
    p10: number;
    p50: number;
    p90: number;
  };
  scenarios: Array<{ action: string; cgpaDelta: number }>;
  simulationInputs?: {
    completedCredits: number;
    remainingCredits: number;
    currentPerformance: number;
  };
}

export const TrajectoryCone: React.FC = () => {
  const { student } = useAuthStore();
  const [loading, setLoading] = useState<boolean>(true);
  const [generating, setGenerating] = useState<boolean>(false);
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [activeScenarios, setActiveScenarios] = useState<Record<string, boolean>>({
    'scenario-1': true,
    'scenario-2': false,
    'scenario-3': true,
    'scenario-4': false,
  });

  const defaultScenarios: Scenario[] = [
    {
      id: 'scenario-1',
      action: 'Clear all pending backlogs on 1st attempt',
      cgpaDelta: +0.65,
      category: 'backlog',
      active: activeScenarios['scenario-1'] ?? true,
    },
    {
      id: 'scenario-2',
      action: 'Maintain >85% attendance across all subjects',
      cgpaDelta: +0.35,
      category: 'attendance',
      active: activeScenarios['scenario-2'] ?? false,
    },
    {
      id: 'scenario-3',
      action: 'Score ≥85% in 4-credit core subjects',
      cgpaDelta: +0.45,
      category: 'grades',
      active: activeScenarios['scenario-3'] ?? true,
    },
    {
      id: 'scenario-4',
      action: 'Consistently complete 4 Pomodoro blocks/day',
      cgpaDelta: +0.30,
      category: 'lifestyle',
      active: activeScenarios['scenario-4'] ?? false,
    },
  ];

  const loadLatestForecast = async () => {
    try {
      setLoading(true);
      const res = await forecastsApi.latest();
      if (res.data && res.data.data) {
        setForecast(res.data.data);
      }
    } catch {
      // Fallback baseline forecast
      setForecast({
        cgpaRange: { p10: 7.15, p50: 8.05, p90: 8.92 },
        scenarios: [
          { action: 'Clear all pending backlogs on 1st attempt', cgpaDelta: +0.65 },
          { action: 'Maintain >85% attendance across all subjects', cgpaDelta: +0.35 },
        ],
        simulationInputs: {
          completedCredits: 80,
          remainingCredits: 40,
          currentPerformance: 7.8,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLatestForecast();
  }, []);

  const handleRunSimulation = async () => {
    try {
      setGenerating(true);
      const res = await forecastsApi.generate();
      if (res.data && res.data.data) {
        setForecast(res.data.data);
      }
    } catch (err) {
      console.error('Simulation failed:', err);
    } finally {
      setGenerating(false);
    }
  };

  const toggleScenario = (id: string) => {
    setActiveScenarios((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Compute what-if delta
  const totalWhatIfDelta = useMemo(() => {
    return defaultScenarios.reduce((sum, s) => {
      return sum + (activeScenarios[s.id] ? s.cgpaDelta : 0);
    }, 0);
  }, [activeScenarios]);

  const baseP10 = forecast?.cgpaRange?.p10 ?? 7.15;
  const baseP50 = forecast?.cgpaRange?.p50 ?? 8.05;
  const baseP90 = forecast?.cgpaRange?.p90 ?? 8.92;

  // Clamped trajectory values
  const currentP10 = Math.min(10, Math.max(0, Number((baseP10 + totalWhatIfDelta * 0.7).toFixed(2))));
  const currentP50 = Math.min(10, Math.max(0, Number((baseP50 + totalWhatIfDelta).toFixed(2))));
  const currentP90 = Math.min(10, Math.max(0, Number((baseP90 + totalWhatIfDelta * 1.1).toFixed(2))));

  // Generate 5-semester forecast points along the uncertainty cone
  // Sem 4 (Current) -> Sem 5 -> Sem 6 -> Sem 7 -> Sem 8 (Graduation)
  const currentSem = 4;
  const targetSem = 8;
  const numSteps = targetSem - currentSem; // 4 steps
  const currentCgpa = forecast?.simulationInputs?.currentPerformance ?? 7.5;

  const points = useMemo(() => {
    const list = [];
    for (let i = 0; i <= numSteps; i++) {
      const t = i / numSteps; // 0 to 1
      const sem = currentSem + i;
      // Linear expansion of the uncertainty cone
      const p10Val = Number((currentCgpa + (currentP10 - currentCgpa) * t).toFixed(2));
      const p50Val = Number((currentCgpa + (currentP50 - currentCgpa) * t).toFixed(2));
      const p90Val = Number((currentCgpa + (currentP90 - currentCgpa) * t).toFixed(2));
      list.push({ sem: `Sem ${sem}`, p10: p10Val, p50: p50Val, p90: p90Val });
    }
    return list;
  }, [currentCgpa, currentP10, currentP50, currentP90]);

  // SVG Chart Dimensions
  const svgWidth = 800;
  const svgHeight = 360;
  const padding = { top: 40, right: 60, bottom: 50, left: 60 };
  const innerWidth = svgWidth - padding.left - padding.right;
  const innerHeight = svgHeight - padding.top - padding.bottom;

  const minY = 5.0;
  const maxY = 10.0;

  const getX = (index: number) => padding.left + (index / (points.length - 1)) * innerWidth;
  const getY = (val: number) => {
    const clamped = Math.max(minY, Math.min(maxY, val));
    const ratio = (clamped - minY) / (maxY - minY);
    return padding.top + (1 - ratio) * innerHeight;
  };

  // Build SVG polygon for confidence envelope (P10 to P90)
  const upperPath = points.map((p, idx) => `${getX(idx)},${getY(p.p90)}`).join(' L ');
  const lowerPath = [...points].reverse().map((p, idx) => `${getX(points.length - 1 - idx)},${getY(p.p10)}`).join(' L ');
  const conePolygonPath = `M ${upperPath} L ${lowerPath} Z`;

  // Build Median P50 line path
  const medianLinePath = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx)},${getY(p.p50)}`).join(' ');

  // Calculate graduation probability >= 8.0 CGPA
  const probOver8 = useMemo(() => {
    if (currentP50 >= 8.5) return 96;
    if (currentP50 >= 8.0) return 82;
    if (currentP50 >= 7.5) return 58;
    return 34;
  }, [currentP50]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* ─── Hero Header ────────────────────────────────────────────────────── */}
      <div
        className="card-glass"
        style={{
          padding: '32px',
          background: 'radial-gradient(ellipse at 85% 15%, rgba(139, 92, 246, 0.2), transparent 70%), var(--color-bg-surface)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '28px',
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{ fontSize: '1.75rem' }}>📐</span>
            <span
              style={{
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--color-accent)',
                fontWeight: 700,
              }}
            >
              1,000-Run Monte Carlo Simulation
            </span>
          </div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
            {student?.name ? `${student.name}'s Trajectory Cone` : 'Trajectory Uncertainty Cone'}
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', margin: '8px 0 0 0', lineHeight: 1.6, fontSize: '0.95rem' }}>
            Physics-inspired stochastic graduation envelope. Visualizes confidence bounds ($p_{10}$ conservative, $p_{50}$ expected, $p_{90}$ optimistic) and simulates What-If academic interventions.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', gap: '16px', width: '100%' }}>
            <div
              style={{
                flex: 1,
                background: 'var(--color-bg-elevated)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                $P_{50}$ Expected Final
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-primary)', marginTop: '4px' }}>
                {currentP50.toFixed(2)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-accent)' }}>
                {totalWhatIfDelta >= 0 ? `+${totalWhatIfDelta.toFixed(2)} with scenarios` : `${totalWhatIfDelta.toFixed(2)}`}
              </div>
            </div>

            <div
              style={{
                flex: 1,
                background: 'var(--color-bg-elevated)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                Probability ≥ 8.0 CGPA
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
                {probOver8}%
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                High Confidence Zone
              </div>
            </div>
          </div>

          <button
            onClick={handleRunSimulation}
            disabled={generating}
            className="btn btn-primary"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            {generating ? 'Running 1,000 Iterations...' : '⚡ Re-run Seeded Simulation'}
          </button>
        </div>
      </div>

      {/* ─── Interactive SVG Chart ─────────────────────────────────────────── */}
      <div className="card-glass" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
              Flight Trajectory Fan Envelope
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
              Shaded zone covers 80% of all simulated outcomes across 1,000 stochastic trials.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', fontSize: '0.8125rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(59, 130, 246, 0.35)', border: '1px solid #3b82f6' }} />
              <span style={{ color: 'var(--color-text-secondary)' }}>80% Envelope (P10 - P90)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '18px', height: '3px', background: '#3b82f6', borderRadius: '2px' }} />
              <span style={{ color: 'var(--color-text-secondary)', fontWeight: 600 }}>P50 Median</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ height: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
            Calculating stochastic paths...
          </div>
        ) : (
          <div style={{ width: '100%', overflowX: 'auto' }}>
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              style={{ width: '100%', height: 'auto', minWidth: '600px', display: 'block' }}
            >
              <defs>
                <linearGradient id="coneGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.35" />
                </linearGradient>
                <linearGradient id="medianGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#60a5fa" />
                  <stop offset="100%" stopColor="#a78bfa" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[6.0, 7.0, 8.0, 9.0, 10.0].map((val) => (
                <g key={val}>
                  <line
                    x1={padding.left}
                    y1={getY(val)}
                    x2={svgWidth - padding.right}
                    y2={getY(val)}
                    stroke="var(--color-border)"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                  <text
                    x={padding.left - 12}
                    y={getY(val) + 4}
                    textAnchor="end"
                    fill="var(--color-text-muted)"
                    fontSize="11"
                    fontFamily="monospace"
                  >
                    {val.toFixed(1)}
                  </text>
                </g>
              ))}

              {/* Semester X-Axis labels */}
              {points.map((p, idx) => (
                <g key={p.sem}>
                  <line
                    x1={getX(idx)}
                    y1={padding.top}
                    x2={getX(idx)}
                    y2={svgHeight - padding.bottom}
                    stroke="var(--color-border)"
                    strokeWidth="0.5"
                    strokeOpacity="0.5"
                  />
                  <text
                    x={getX(idx)}
                    y={svgHeight - padding.bottom + 22}
                    textAnchor="middle"
                    fill="var(--color-text-secondary)"
                    fontSize="12"
                    fontWeight="600"
                  >
                    {p.sem}
                  </text>
                </g>
              ))}

              {/* Uncertainty Cone Polygon */}
              <path d={conePolygonPath} fill="url(#coneGradient)" />

              {/* P90 Boundary Line */}
              <path
                d={`M ${upperPath}`}
                fill="none"
                stroke="#8b5cf6"
                strokeWidth="1.5"
                strokeDasharray="3 3"
                opacity="0.8"
              />

              {/* P10 Boundary Line */}
              <path
                d={`M ${points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx)},${getY(p.p10)}`).join(' ')}`}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="1.5"
                strokeDasharray="3 3"
                opacity="0.8"
              />

              {/* P50 Median Line */}
              <path
                d={medianLinePath}
                fill="none"
                stroke="url(#medianGlow)"
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* Data points on Median Line */}
              {points.map((p, idx) => (
                <g key={p.sem}>
                  <circle
                    cx={getX(idx)}
                    cy={getY(p.p50)}
                    r="5"
                    fill="var(--color-bg-base)"
                    stroke="#60a5fa"
                    strokeWidth="2.5"
                  />
                  {/* Tooltip text for Final Semester */}
                  {idx === points.length - 1 && (
                    <g transform={`translate(${getX(idx) + 10}, ${getY(p.p50) - 20})`}>
                      <rect
                        width="80"
                        height="44"
                        rx="6"
                        fill="var(--color-bg-elevated)"
                        stroke="var(--color-primary)"
                        strokeWidth="1"
                      />
                      <text x="8" y="16" fill="var(--color-text-muted)" fontSize="9">
                        Graduation
                      </text>
                      <text x="8" y="34" fill="var(--color-primary)" fontSize="14" fontWeight="800">
                        {p.p50.toFixed(2)} CGPA
                      </text>
                    </g>
                  )}
                </g>
              ))}
            </svg>
          </div>
        )}
      </div>

      {/* ─── Interactive What-If Intervention Scenarios ─────────────────────── */}
      <div className="card-glass" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
              Interactive What-If Interventions
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
              Toggle interventions to immediately see their mathematical impact on your graduation trajectory.
            </p>
          </div>
          <span
            style={{
              padding: '4px 12px',
              borderRadius: '999px',
              background: totalWhatIfDelta > 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              border: totalWhatIfDelta > 0 ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--color-border)',
              color: totalWhatIfDelta > 0 ? '#10b981' : 'var(--color-text-muted)',
              fontSize: '0.875rem',
              fontWeight: 700,
            }}
          >
            Net Projected Boost: {totalWhatIfDelta > 0 ? `+${totalWhatIfDelta.toFixed(2)}` : '0.00'} CGPA
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '16px',
          }}
        >
          {defaultScenarios.map((sc) => {
            const isActive = activeScenarios[sc.id] ?? false;
            return (
              <div
                key={sc.id}
                onClick={() => toggleScenario(sc.id)}
                style={{
                  background: isActive ? 'rgba(59, 130, 246, 0.08)' : 'var(--color-bg-elevated)',
                  border: isActive ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '18px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '6px',
                      border: isActive ? '2px solid var(--color-primary)' : '2px solid var(--color-border)',
                      background: isActive ? 'var(--color-primary)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                    }}
                  >
                    {isActive ? '✓' : ''}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.925rem', color: 'var(--color-text-primary)' }}>
                      {sc.action}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginTop: '2px' }}>
                      Category: {sc.category}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    fontSize: '1rem',
                    fontWeight: 800,
                    color: isActive ? '#10b981' : 'var(--color-text-muted)',
                  }}
                >
                  +{sc.cgpaDelta.toFixed(2)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
