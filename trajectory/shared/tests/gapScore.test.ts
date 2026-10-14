import { describe, it, expect } from 'vitest';
import { gapScore } from '../src/calculations/gapScore.js';

describe('gapScore', () => {
  it('returns 0 for a student with no gaps', () => {
    const result = gapScore({ cgpaGap: 0, backlogCount: 0, attendanceRisk: 0, skillGap: 0 });
    expect(result.score).toBe(0);
  });

  it('returns near 100 for a student with maximum gaps', () => {
    const result = gapScore({ cgpaGap: 10, backlogCount: 5, attendanceRisk: 1, skillGap: 1 });
    expect(result.score).toBeGreaterThanOrEqual(95);
  });

  it('identifies cgpa as biggest contributor when cgpa gap is large', () => {
    const result = gapScore({ cgpaGap: 8, backlogCount: 0, attendanceRisk: 0, skillGap: 0 });
    expect(result.biggestContributor).toBe('cgpa');
  });

  it('identifies backlogs as biggest contributor when many backlogs', () => {
    const result = gapScore({ cgpaGap: 0, backlogCount: 5, attendanceRisk: 0, skillGap: 0 });
    expect(result.biggestContributor).toBe('backlogs');
  });

  it('clamps inputs to valid ranges', () => {
    const result = gapScore({ cgpaGap: -5, backlogCount: -2, attendanceRisk: -0.5, skillGap: 2 });
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('respects custom weights', () => {
    const result = gapScore({
      cgpaGap: 0, backlogCount: 0, attendanceRisk: 1, skillGap: 0,
      weights: { attendance: 1.0, cgpa: 0, backlogs: 0, skill: 0 }
    });
    expect(result.biggestContributor).toBe('attendance');
    expect(result.score).toBeGreaterThan(0);
  });
});
