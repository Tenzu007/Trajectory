import { describe, it, expect } from 'vitest';
import { priorityScore } from '../src/calculations/priorityScore.js';
import { rankBacklogs } from '../src/calculations/backlogRanker.js';
import { simulate } from '../src/calculations/monteCarlo.js';
import { nextInterval } from '../src/calculations/spacedRepetition.js';

describe('priorityScore', () => {
  it('returns 0 for zero stakes', () => {
    expect(priorityScore({ marksAtStake: 0, mastery: 0, urgencyDays: 1, effortHours: 1 })).toBe(0);
  });

  it('returns higher score for lower mastery', () => {
    const high = priorityScore({ marksAtStake: 10, mastery: 0.9, urgencyDays: 5, effortHours: 2 });
    const low = priorityScore({ marksAtStake: 10, mastery: 0.1, urgencyDays: 5, effortHours: 2 });
    expect(low).toBeGreaterThan(high);
  });

  it('returns higher score when deadline is closer', () => {
    const far = priorityScore({ marksAtStake: 10, mastery: 0.5, urgencyDays: 30, effortHours: 2 });
    const near = priorityScore({ marksAtStake: 10, mastery: 0.5, urgencyDays: 1, effortHours: 2 });
    expect(near).toBeGreaterThan(far);
  });

  it('stays within 0-100', () => {
    const score = priorityScore({ marksAtStake: 1000, mastery: 0, urgencyDays: 1, effortHours: 0.1 });
    expect(score).toBeLessThanOrEqual(100);
    expect(score).toBeGreaterThanOrEqual(0);
  });
});

describe('rankBacklogs', () => {
  const backlogs = [
    { id: 'a', credits: 3, effortHours: 20, blocksLaterCourses: false, suppExamDaysAway: 60 },
    { id: 'b', credits: 4, effortHours: 15, blocksLaterCourses: true, suppExamDaysAway: 30 },
    { id: 'c', credits: 2, effortHours: 5, blocksLaterCourses: false, suppExamDaysAway: 10 },
  ];

  it('returns all backlogs', () => {
    expect(rankBacklogs(backlogs)).toHaveLength(3);
  });

  it('sorts descending by recoveryValue', () => {
    const ranked = rankBacklogs(backlogs);
    expect(ranked[0].recoveryValue).toBeGreaterThanOrEqual(ranked[1].recoveryValue);
    expect(ranked[1].recoveryValue).toBeGreaterThanOrEqual(ranked[2].recoveryValue);
  });

  it('boosts blocking subjects', () => {
    const [blocker] = backlogs.filter((b) => b.blocksLaterCourses);
    const ranked = rankBacklogs(backlogs);
    const blockerRanked = ranked.find((r) => r.id === blocker.id)!;
    const nonBlockers = ranked.filter((r) => r.id !== blocker.id);
    // blocker should rank higher than non-blockers with similar credit/effort
    expect(blockerRanked.recoveryValue).toBeGreaterThan(nonBlockers[nonBlockers.length - 1].recoveryValue);
  });
});

describe('monteCarlo (seeded, deterministic)', () => {
  const input = {
    remainingAssessments: [
      { weight: 0.3, maxMarks: 30, currentExpectedPct: 70, stdDevPct: 10 },
      { weight: 0.7, maxMarks: 70, currentExpectedPct: 65, stdDevPct: 12 },
    ],
    currentCgpa: 7.0,
    currentCreditsCompleted: 60,
    totalCredits: 120,
    seed: 42,
  };

  it('returns deterministic results with the same seed', () => {
    const r1 = simulate(input);
    const r2 = simulate(input);
    expect(r1.p10).toBe(r2.p10);
    expect(r1.p50).toBe(r2.p50);
    expect(r1.p90).toBe(r2.p90);
  });

  it('returns different results with different seeds', () => {
    const r1 = simulate(input, 5000);
    const r2 = simulate({ ...input, seed: 99 }, 5000);
    expect(r1.p50).not.toBe(r2.p50);
  });

  it('p10 <= p50 <= p90', () => {
    const r = simulate(input);
    expect(r.p10).toBeLessThanOrEqual(r.p50);
    expect(r.p50).toBeLessThanOrEqual(r.p90);
  });

  it('all values within valid CGPA range', () => {
    const r = simulate(input);
    expect(r.p10).toBeGreaterThanOrEqual(0);
    expect(r.p90).toBeLessThanOrEqual(10);
  });
});

describe('spacedRepetition', () => {
  it('resets interval on failure (rating < 3)', () => {
    const result = nextInterval({ rating: 1, easeFactor: 2.5, intervalDays: 10 });
    expect(result.intervalDays).toBe(1);
  });

  it('increases interval on success (rating >= 3)', () => {
    const result = nextInterval({ rating: 4, easeFactor: 2.5, intervalDays: 6 });
    expect(result.intervalDays).toBeGreaterThanOrEqual(6);
    // Verify that going from interval=10 also grows
    const result2 = nextInterval({ rating: 4, easeFactor: 2.5, intervalDays: 10 });
    expect(result2.intervalDays).toBeGreaterThan(10);
  });

  it('does not let easeFactor drop below 1.3', () => {
    let ef = 1.4;
    for (let i = 0; i < 10; i++) {
      const r = nextInterval({ rating: 0, easeFactor: ef, intervalDays: 1 });
      ef = r.easeFactor;
    }
    expect(ef).toBeGreaterThanOrEqual(1.3);
  });

  it('sets a future nextDueAt', () => {
    const result = nextInterval({ rating: 4, easeFactor: 2.5, intervalDays: 4 });
    expect(result.nextDueAt.getTime()).toBeGreaterThan(Date.now());
  });
});
