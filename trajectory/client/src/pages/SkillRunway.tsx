import React, { useEffect, useState } from 'react';
import { skillsApi } from '../api/index.js';

interface SkillItem {
  _id: string;
  name: string;
  tier: 'foundation' | 'core' | 'differentiator';
  coveredByCurriculum: boolean;
  masteryLevel: number;
  proofOfWork?: {
    type: 'project' | 'writeup' | 'competition' | 'contribution';
    url?: string;
    description?: string;
  };
}

interface RoleProfileItem {
  _id: string;
  name: string;
  description: string;
  skillMap: Array<{
    name: string;
    tier: 'foundation' | 'core' | 'differentiator';
    prerequisites: string[];
  }>;
}

export const SkillRunway: React.FC = () => {
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [roles, setRoles] = useState<RoleProfileItem[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillTier, setNewSkillTier] = useState<'foundation' | 'core' | 'differentiator'>('foundation');

  // Proof-of-work modal
  const [powSkill, setPowSkill] = useState<SkillItem | null>(null);
  const [powType, setPowType] = useState<'project' | 'writeup' | 'competition' | 'contribution'>('project');
  const [powUrl, setPowUrl] = useState('');
  const [powDesc, setPowDesc] = useState('');
  const [powMastery, setPowMastery] = useState(80);

  const fetchSkills = async () => {
    try {
      const res = await skillsApi.list();
      setSkills(res.data.data || []);
    } catch {
      // ignore
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await skillsApi.listRoles();
      const list = res.data.data || [];
      setRoles(list);
      if (list.length > 0) {
        setSelectedRole(list[0]._id);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchSkills();
    fetchRoles();
  }, []);

  const handleImportRole = async () => {
    if (!selectedRole) return;
    try {
      const res = await skillsApi.importRole(selectedRole);
      setSkills(res.data.data || []);
    } catch {
      // ignore
    }
  };

  const handleCreateSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;
    try {
      await skillsApi.create({
        name: newSkillName,
        tier: newSkillTier,
        coveredByCurriculum: false,
        masteryLevel: 0.1,
      });
      setNewSkillName('');
      setIsAddingSkill(false);
      fetchSkills();
    } catch {
      // ignore
    }
  };

  const handleSaveProofOfWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!powSkill) return;
    try {
      await skillsApi.update(powSkill._id, {
        masteryLevel: powMastery / 100,
        proofOfWork: {
          type: powType,
          url: powUrl,
          description: powDesc,
        },
      });
      setPowSkill(null);
      fetchSkills();
    } catch {
      // ignore
    }
  };

  const foundationSkills = skills.filter((s) => s.tier === 'foundation');
  const coreSkills = skills.filter((s) => s.tier === 'core');
  const diffSkills = skills.filter((s) => s.tier === 'differentiator');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Skill Runway
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
            Progression from foundational math/coding prerequisites to high-leverage differentiators with verifiable proof-of-work.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setIsAddingSkill(!isAddingSkill)} className="btn btn-secondary btn-sm">
            {isAddingSkill ? 'Cancel' : '+ Add Custom Skill'}
          </button>
        </div>
      </div>

      {/* ─── Role Profile Importer ─────────────────────────────────────────── */}
      <div
        className="card-glass"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          padding: '20px 24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '1.5rem' }}>🎯</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>Target Career Role Profile</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
              Import curated industry skill graphs aligned with campus hiring standards.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select
            className="select"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            style={{ width: 'auto', minWidth: '220px' }}
          >
            {roles.map((r) => (
              <option key={r._id} value={r._id}>
                {r.name}
              </option>
            ))}
          </select>
          <button onClick={handleImportRole} className="btn btn-primary btn-sm">
            Import Track ➔
          </button>
        </div>
      </div>

      {/* Add Skill Form */}
      {isAddingSkill && (
        <form onSubmit={handleCreateSkill} className="card" style={{ border: '1px solid var(--color-primary)' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '12px' }}>Add Individual Skill</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div className="form-group">
              <label className="label">Skill Name</label>
              <input
                type="text"
                className="input"
                required
                placeholder="e.g. Docker Containerization"
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="label">Tier</label>
              <select
                className="select"
                value={newSkillTier}
                onChange={(e) => setNewSkillTier(e.target.value as any)}
              >
                <option value="foundation">1. Foundation (Prerequisite)</option>
                <option value="core">2. Core (Job Requirement)</option>
                <option value="differentiator">3. Differentiator (Top 5%)</option>
              </select>
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-sm">
            Save Skill
          </button>
        </form>
      )}

      {/* ─── 3-Tier Visual Runway Track ────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
        {/* Tier 1: Foundation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge badge-accent">Tier 1</span>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Foundation</h3>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
            Mathematical & algorithmic building blocks.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {foundationSkills.map((skill) => (
              <SkillCard key={skill._id} skill={skill} onOpenPow={() => setPowSkill(skill)} />
            ))}
          </div>
        </div>

        {/* Tier 2: Core */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge badge-primary">Tier 2</span>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Core Proficiency</h3>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
            Role-defining competencies tested in technical interviews.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {coreSkills.map((skill) => (
              <SkillCard key={skill._id} skill={skill} onOpenPow={() => setPowSkill(skill)} />
            ))}
          </div>
        </div>

        {/* Tier 3: Differentiator */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge badge-success">Tier 3</span>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Differentiator</h3>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
            High-leverage specialization distinguishing you from peers.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {diffSkills.map((skill) => (
              <SkillCard key={skill._id} skill={skill} onOpenPow={() => setPowSkill(skill)} />
            ))}
          </div>
        </div>
      </div>

      {/* ─── Proof-of-Work Submission Modal ─────────────────────────────────── */}
      {powSkill && (
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
          <form
            onSubmit={handleSaveProofOfWork}
            className="card-elevated"
            style={{ maxWidth: '520px', width: '100%', padding: '32px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Submit Proof-of-Work</h2>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                  Skill: <strong>{powSkill.name}</strong>
                </div>
              </div>
              <button type="button" onClick={() => setPowSkill(null)} className="btn btn-ghost btn-sm">
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="label">Artifact Type</label>
                <select className="select" value={powType} onChange={(e) => setPowType(e.target.value as any)}>
                  <option value="project">GitHub Repository / Live Project</option>
                  <option value="writeup">Technical Blog Post / Deep-Dive</option>
                  <option value="competition">Kaggle / Hackathon Rank</option>
                  <option value="contribution">Open Source Pull Request</option>
                </select>
              </div>

              <div className="form-group">
                <label className="label">Public URL / Link</label>
                <input
                  type="url"
                  className="input"
                  required
                  placeholder="https://github.com/username/project"
                  value={powUrl}
                  onChange={(e) => setPowUrl(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="label">Description / Learnings</label>
                <textarea
                  className="textarea"
                  rows={3}
                  placeholder="What challenges did you solve? What was the outcome?"
                  value={powDesc}
                  onChange={(e) => setPowDesc(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="label">Self-Assessed Mastery Level: {powMastery}%</label>
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={powMastery}
                  onChange={(e) => setPowMastery(Number(e.target.value))}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={() => setPowSkill(null)} className="btn btn-secondary btn-sm">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  Verify & Save Proof-of-Work ➔
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

interface SkillCardProps {
  skill: SkillItem;
  onOpenPow: () => void;
}

const SkillCard: React.FC<SkillCardProps> = ({ skill, onOpenPow }) => {
  const pct = Math.round(skill.masteryLevel * 100);

  return (
    <div
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '16px',
        background: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{skill.name}</span>
        <span
          style={{
            fontSize: '0.8125rem',
            fontWeight: 800,
            color: pct >= 70 ? 'var(--color-success)' : 'var(--color-text-secondary)',
          }}
        >
          {pct}%
        </span>
      </div>

      <div className="progress-bar" style={{ height: '4px' }}>
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>

      {skill.proofOfWork && skill.proofOfWork.url ? (
        <a
          href={skill.proofOfWork.url}
          target="_blank"
          rel="noreferrer"
          style={{
            fontSize: '0.75rem',
            color: 'var(--color-accent)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            textDecoration: 'none',
          }}
        >
          <span>✓ Proof of Work:</span>
          <span style={{ textDecoration: 'underline' }}>{skill.proofOfWork.type}</span>
        </a>
      ) : (
        <button
          onClick={onOpenPow}
          className="btn btn-secondary btn-sm"
          style={{ fontSize: '0.75rem', padding: '4px 8px', width: '100%' }}
        >
          + Add Proof-of-Work
        </button>
      )}
    </div>
  );
};
