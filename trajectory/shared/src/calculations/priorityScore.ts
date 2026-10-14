import type { PriorityScoreInput } from '../types/index.js';

/**
 * Computes a task's priority score (0–100).
 *
 * Formula:
 *   raw = marksAtStake * (1 - mastery) * urgencyFactor / effortHours
 *   urgencyFactor = 1 / max(urgencyDays, 1)   — higher urgency when deadline is closer
 *
 * The result is normalized to 0–100 using a soft ceiling of 100.
 * Lower mastery and higher stakes near a deadline → higher score.
 */
export function priorityScore(input: PriorityScoreInput): number {
  const { marksAtStake, mastery, urgencyDays, effortHours } = input;

  const clampedMastery = Math.max(0, Math.min(1, mastery));
  const clampedEffort = Math.max(0.1, effortHours);
  const clampedDays = Math.max(1, urgencyDays);

  const urgencyFactor = 1 / clampedDays;
  const raw = marksAtStake * (1 - clampedMastery) * urgencyFactor / clampedEffort;

  // Normalize: treat raw=1 as score=50 (a moderate task due in 1 day with 1hr effort)
  const normalized = Math.round(Math.min(100, raw * 100));
  return Math.max(0, normalized);
}
