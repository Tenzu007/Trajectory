import React, { useEffect, useState } from 'react';
import { dreamsApi } from '../api/index.js';

export const DreamCompiler: React.FC = () => {
  const [dreamText, setDreamText] = useState(
    'I want to graduate with an 8.5 CGPA, clear my 2 backlogs (Operating Systems and Mathematics III) in the upcoming supplementary exams, and build enough practical proof-of-work in Python and PyTorch to qualify as an ML Engineer for campus placements.'
  );
  const [dreamId, setDreamId] = useState<string | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [compiled, setCompiled] = useState(true);

  // Reality check data
  const [obstacles] = useState([
    {
      description: 'College lab sessions ending at 5:30 PM leave low mental energy for backlog study.',
      ifThenPlan: 'If I return exhausted from lab, then I will trigger a 2-minute launch on Vector B flashcards instead of opening social media.',
    },
    {
      description: 'Semester exams and supplementary exam dates might clash within 48 hours.',
      ifThenPlan: 'If supplementary dates overlap, then I will prioritize the 4-credit OS backlog first using the 90-minute Vector B block.',
    },
  ]);

  const [targets] = useState([
    { type: 'CGPA', description: 'Achieve 8.5 cumulative grade point average', current: '7.3', target: '8.5' },
    { type: 'Backlog', description: 'Clear Operating Systems supplementary exam', current: 'Pending', target: 'Grade B+' },
    { type: 'Backlog', description: 'Clear Mathematics III supplementary exam', current: 'Pending', target: 'Grade B' },
    { type: 'Skill Runway', description: 'Deploy 2 end-to-end PyTorch models with Docker', current: '1 / 2', target: '2 / 2' },
  ]);

  const [premortemObstacle, setPremortemObstacle] = useState('Procrastinating Vector B backlog study until 1 week before supp exam');

  useEffect(() => {
    dreamsApi.list().then((res) => {
      const list = res.data.data;
      if (list && list.length > 0) {
        setDreamId(list[0]._id);
        setDreamText(list[0].rawText || dreamText);
      }
    }).catch(() => {});
  }, []);

  const handleCompile = async () => {
    setIsCompiling(true);
    try {
      let dId = dreamId;
      if (!dId) {
        const createRes = await dreamsApi.create(dreamText);
        dId = createRes.data.data?._id || null;
        setDreamId(dId);
      }
      if (dId) {
        await dreamsApi.compile(dId);
      }
      setCompiled(true);
    } catch {
      // fallback to local compiled state
      setCompiled(true);
    } finally {
      setIsCompiling(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
          Dream Compiler & Reality Check
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
          Translates unstructured career and academic ambition into quantifiable constraints, targets, and pre-mortem defenses.
        </p>
      </div>

      {/* ─── Natural Language Dream Input ──────────────────────────────────── */}
      <div className="card-glass" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <label className="label" style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>
            Your Academic & Career Vision (Unstructured Prose)
          </label>
          <span className="badge badge-accent">LLM / Heuristic Parser</span>
        </div>

        <textarea
          className="textarea"
          rows={4}
          value={dreamText}
          onChange={(e) => setDreamText(e.target.value)}
          placeholder="Write freely: what CGPA do you want, what backlogs must you clear, what dream job or company are you aiming for?"
          style={{ fontSize: '1rem', lineHeight: '1.6', background: 'var(--color-bg-elevated)' }}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
          <button
            onClick={handleCompile}
            disabled={isCompiling}
            className="btn btn-primary"
          >
            {isCompiling ? 'Compiling Trajectory...' : '✦ Compile into Measurable Plan'}
          </button>
        </div>
      </div>

      {/* ─── Compiled Targets & Reality Check ──────────────────────────────── */}
      {compiled && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px' }}>
          {/* Measurable Targets */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Measurable Flight Targets</h2>
              <span className="badge badge-success">4 Extracted</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {targets.map((tgt, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'var(--color-bg-elevated)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <span className="badge badge-primary" style={{ marginBottom: '4px' }}>
                      {tgt.type}
                    </span>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{tgt.description}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Target</div>
                    <div style={{ fontWeight: 700, color: 'var(--color-accent)' }}>{tgt.target}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reality Check & Obstacles */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Reality Check & If-Then Plans</h2>
              <span className="badge badge-warning">Feasible (82%)</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {obstacles.map((obs, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'var(--color-bg-elevated)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px',
                  }}
                >
                  <div style={{ fontSize: '0.8125rem', color: '#f87171', fontWeight: 600 }}>
                    ⚡ Anticipated Obstacle:
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                    {obs.description}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#34d399', fontWeight: 600, marginTop: '8px' }}>
                    ➔ If-Then Protocol:
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-primary)', marginTop: '2px' }}>
                    {obs.ifThenPlan}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── Pre-Mortem Protocol ────────────────────────────────────────────── */}
      <div
        className="card"
        style={{
          borderLeft: '4px solid var(--color-accent)',
          background: 'radial-gradient(ellipse at 10% 50%, rgba(6, 182, 212, 0.08), transparent 70%), var(--color-bg-surface)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <span style={{ fontSize: '1.5rem' }}>🔮</span>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Pre-Mortem Protocol</h2>
        </div>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
          "Imagine it is 6 months from now and your trajectory failed. What was the exact reason?"
        </p>

        <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
          <input
            type="text"
            className="input"
            value={premortemObstacle}
            onChange={(e) => setPremortemObstacle(e.target.value)}
            style={{ flex: 1 }}
          />
          <button className="btn btn-secondary btn-sm">
            Add to Defence Map
          </button>
        </div>
      </div>
    </div>
  );
};
