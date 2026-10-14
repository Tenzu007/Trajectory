import type { SpacedRepInput, SpacedRepResult } from '../types/index.js';

const DEFAULT_EASE = 2.5;
const MIN_EASE = 1.3;

/**
 * FSRS-inspired spaced repetition scheduler.
 *
 * Rating scale (0–5):
 *   0 = complete blackout
 *   1 = wrong, remembered on seeing answer
 *   2 = wrong but easy to recall
 *   3 = correct with significant difficulty
 *   4 = correct with slight hesitation
 *   5 = perfect recall
 *
 * Algorithm:
 *   - If rating < 3: reset interval to 1 day (relearn)
 *   - If rating >= 3: interval = ceil(interval * easeFactor)
 *   - easeFactor adjusted by: EF' = EF + (0.1 - (5-q)*(0.08 + (5-q)*0.02))
 *   - easeFactor is clamped to minimum 1.3
 */
export function nextInterval(input: SpacedRepInput): SpacedRepResult {
  const { rating, easeFactor = DEFAULT_EASE, intervalDays } = input;

  let newInterval: number;
  let newEaseFactor: number;

  if (rating < 3) {
    // Failed — reset
    newInterval = 1;
    newEaseFactor = Math.max(MIN_EASE, easeFactor - 0.2);
  } else {
    // Adjust ease factor
    const q = rating;
    const easeAdjust = 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02);
    newEaseFactor = Math.max(MIN_EASE, easeFactor + easeAdjust);

    if (intervalDays <= 1) {
      newInterval = rating === 3 ? 3 : 4;
    } else if (intervalDays <= 6) {
      newInterval = 6;
    } else {
      newInterval = Math.ceil(intervalDays * newEaseFactor);
    }
  }

  const nextDueAt = new Date();
  nextDueAt.setDate(nextDueAt.getDate() + newInterval);

  return {
    intervalDays: newInterval,
    easeFactor: Math.round(newEaseFactor * 1000) / 1000,
    nextDueAt,
  };
}
