import type { GapScoreInput, GapScoreResult } from '../types/index.js';

const DEFAULT_WEIGHTS = {
  cgpa: 0.35,
  backlogs: 0.30,
  attendance: 0.20,
  skill: 0.15,
};

/**
 * Computes the Gap Score (0–100) — the student's weighted distance from their target.
 * A higher score means a larger gap (more "potential energy" to convert).
 *
 * Inputs:
 *   cgpaGap       — difference between target and current CGPA (0–10 scale)
 *   backlogCount  — number of active backlogs
 *   attendanceRisk — fraction of courses where attendance is at-risk (0–1)
 *   skillGap      — fraction of required skills not yet met (0–1)
 *
 * Each component is normalized to 0–1 before weighting.
 */
export function gapScore(input: GapScoreInput): GapScoreResult {
  const { cgpaGap, backlogCount, attendanceRisk, skillGap, weights } = input;

  const w = { ...DEFAULT_WEIGHTS, ...weights };

  // Normalize each dimension to [0, 1]
  const cgpaNorm = Math.min(1, Math.max(0, cgpaGap / 10));
  const backlogNorm = Math.min(1, Math.max(0, backlogCount / 5));   // 5+ backlogs = max risk
  const attendNorm = Math.min(1, Math.max(0, attendanceRisk));
  const skillNorm = Math.min(1, Math.max(0, skillGap));

  const cgpaComponent = cgpaNorm * w.cgpa;
  const backlogComponent = backlogNorm * w.backlogs;
  const attendanceComponent = attendNorm * w.attendance;
  const skillComponent = skillNorm * w.skill;

  const raw = cgpaComponent + backlogComponent + attendanceComponent + skillComponent;
  const score = Math.round(Math.min(100, raw * 100));

  // Identify biggest contributor (uses raw fractional component)
  const components = {
    cgpa: cgpaComponent,
    backlogs: backlogComponent,
    attendance: attendanceComponent,
    skill: skillComponent,
  } as const;

  const biggestContributor = (Object.keys(components) as Array<keyof typeof components>)
    .reduce((a, b) => (components[a] >= components[b] ? a : b));

  return {
    score,
    biggestContributor,
    breakdown: {
      cgpa: Math.round(cgpaComponent * 100),
      backlogs: Math.round(backlogComponent * 100),
      attendance: Math.round(attendanceComponent * 100),
      skill: Math.round(skillComponent * 100),
    },
  };
}
