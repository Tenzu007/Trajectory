import { describe, it, expect } from 'vitest';
import { gradeNeeded } from '../src/calculations/gradeNeeded.js';

describe('gradeNeeded', () => {
  const assessments = [
    { name: 'Mid-sem', maxMarks: 30, weight: 0.3 },
    { name: 'End-sem', maxMarks: 70, weight: 0.7 },
  ];

  it('computes needed marks for feasible target', () => {
    // currentMarks=20, totalSoFar=100, target=60%, totalMax=200
    // targetMarks = 120, needed = 100, feasible = true
    const result = gradeNeeded({
      currentMarks: 20,
      totalSoFar: 100,
      remainingAssessments: assessments,
      targetPercent: 60,
      totalMax: 200,
    });
    expect(result.feasible).toBe(true);
    expect(result.minimumAverageNeeded).toBeGreaterThan(0);
    expect(result.neededPerAssessment).toHaveLength(2);
  });

  it('returns feasible=false when target is unreachable', () => {
    // currentMarks=0, target=90%, totalMax=100, remaining=5 marks total
    const result = gradeNeeded({
      currentMarks: 0,
      totalSoFar: 95,
      remainingAssessments: [{ name: 'Quiz', maxMarks: 5, weight: 0.05 }],
      targetPercent: 90,
      totalMax: 100,
    });
    expect(result.feasible).toBe(false);
  });

  it('handles no remaining assessments', () => {
    const result = gradeNeeded({
      currentMarks: 80,
      totalSoFar: 100,
      remainingAssessments: [],
      targetPercent: 75,
      totalMax: 100,
    });
    expect(result.feasible).toBe(true);
    expect(result.neededPerAssessment).toHaveLength(0);
  });

  it('clamps needed to maxMarks', () => {
    const result = gradeNeeded({
      currentMarks: 0,
      totalSoFar: 0,
      remainingAssessments: [{ name: 'Final', maxMarks: 100, weight: 1 }],
      targetPercent: 150,  // impossible
      totalMax: 100,
    });
    expect(result.neededPerAssessment[0].needed).toBeLessThanOrEqual(100);
  });
});
