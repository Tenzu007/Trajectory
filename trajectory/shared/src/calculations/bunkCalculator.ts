import type { BunkHeadroomInput, BunkHeadroomResult } from '../types/index.js';

/**
 * Calculates how many more classes a student can miss and still meet the
 * attendance threshold.
 *
 * Formula: canMiss = floor(A + F - threshold * (T + F))
 *   A = attended, T = held so far, F = remaining future classes
 *
 * A negative canMiss means the student is already below threshold.
 */
export function bunkHeadroom(input: BunkHeadroomInput): BunkHeadroomResult {
  const { attended, held, remaining, threshold = 0.75 } = input;

  const totalClasses = held + remaining;
  const canMissRaw = attended + remaining - threshold * totalClasses;
  const canMiss = Math.floor(canMissRaw);

  const currentPct = held > 0 ? attended / held : 0;
  // Best-case projected: attend all remaining
  const projectedPct = totalClasses > 0 ? (attended + remaining) / totalClasses : 0;

  return {
    canMiss,
    alreadyBelow: canMiss < 0,
    currentPct: Math.round(currentPct * 10000) / 100, // e.g. 73.45
    projectedPct: Math.round(projectedPct * 10000) / 100,
  };
}
