import type { GradeNeededInput, GradeNeededResult } from '../types/index.js';

/**
 * For each remaining assessment, calculates the minimum score needed
 * to achieve the target percentage overall.
 *
 * Handles partial credit already earned and distributes the remaining
 * requirement proportionally across pending assessments.
 */
export function gradeNeeded(input: GradeNeededInput): GradeNeededResult {
  const { currentMarks, remainingAssessments, targetPercent, totalMax } = input;

  const targetMarks = (targetPercent / 100) * totalMax;
  const marksNeeded = targetMarks - currentMarks;

  const remainingMax = remainingAssessments.reduce((sum, a) => sum + a.maxMarks, 0);

  if (remainingMax <= 0) {
    return {
      feasible: currentMarks >= targetMarks,
      neededPerAssessment: [],
      minimumAverageNeeded: 0,
    };
  }

  const feasible = marksNeeded <= remainingMax;

  // Distribute the needed marks proportionally by maxMarks
  const neededPerAssessment = remainingAssessments.map((a) => {
    const proportion = a.maxMarks / remainingMax;
    const needed = Math.ceil(marksNeeded * proportion);
    return {
      name: a.name,
      needed: Math.max(0, Math.min(needed, a.maxMarks)),
      maxMarks: a.maxMarks,
    };
  });

  const minimumAverageNeeded = remainingMax > 0
    ? Math.ceil((marksNeeded / remainingMax) * 100)
    : 0;

  return {
    feasible,
    neededPerAssessment,
    minimumAverageNeeded: Math.max(0, Math.min(minimumAverageNeeded, 100)),
  };
}
