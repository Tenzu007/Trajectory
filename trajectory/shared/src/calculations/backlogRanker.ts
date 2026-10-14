import type { BacklogRankInput, BacklogRankResult } from '../types/index.js';

/**
 * Ranks backlogs by recovery value.
 *
 * recoveryValue = (credits / effortHours) * blockingMultiplier
 *   blockingMultiplier = 1.5 if the subject blocks later courses, else 1.0
 *
 * Subjects that block later courses and have high credit-to-effort ratios
 * should be tackled first. The array is sorted descending by recoveryValue.
 *
 * Additionally, exams coming up sooner get boosted urgency.
 */
export function rankBacklogs(backlogs: BacklogRankInput[]): BacklogRankResult[] {
  return backlogs
    .map((b) => {
      const blockingMultiplier = b.blocksLaterCourses ? 1.5 : 1.0;
      const effort = Math.max(0.5, b.effortHours);
      // Urgency: more points the sooner the exam (1/days normalized)
      const urgencyBoost = 1 + 1 / Math.max(1, b.suppExamDaysAway);
      const recoveryValue =
        (b.credits / effort) * blockingMultiplier * urgencyBoost;
      return { ...b, recoveryValue: Math.round(recoveryValue * 100) / 100 };
    })
    .sort((a, b) => b.recoveryValue - a.recoveryValue);
}
