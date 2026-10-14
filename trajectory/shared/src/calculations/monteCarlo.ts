import type { MonteCarloInput, MonteCarloResult } from '../types/index.js';

/**
 * Seeded pseudo-random number generator (mulberry32).
 * Deterministic for any given seed — critical for reproducible tests.
 */
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function boxMuller(rand: () => number): number {
  // Box-Muller transform: produces N(0,1)
  const u1 = Math.max(1e-10, rand());
  const u2 = rand();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/**
 * Monte Carlo CGPA forecast over remaining assessments.
 *
 * For each simulation:
 *   - Sample each remaining assessment's score from N(expectedPct, stdDevPct)
 *   - Convert to CGPA contribution using linear interpolation
 *   - Add to current CGPA weighted by credits
 *
 * Returns p10, p50, p90 of the final CGPA distribution.
 * Default iterations: 5000. Default seed: 42.
 */
export function simulate(
  input: MonteCarloInput,
  iterations = 5000
): MonteCarloResult {
  const { remainingAssessments, currentCgpa, currentCreditsCompleted, totalCredits, seed = 42 } = input;

  const rand = mulberry32(seed);
  const results: number[] = [];

  const remainingCredits = totalCredits - currentCreditsCompleted;

  for (let i = 0; i < iterations; i++) {
    let totalWeightedPct = currentCgpa * currentCreditsCompleted;
    let totalWeight = currentCreditsCompleted;

    for (const assessment of remainingAssessments) {
      const z = boxMuller(rand);
      const sampledPct = Math.max(0, Math.min(100,
        assessment.currentExpectedPct + z * assessment.stdDevPct
      ));
      // Convert percent to 10-point scale linearly: 100% = 10.0
      const cgpaContrib = (sampledPct / 100) * 10;
      totalWeightedPct += cgpaContrib * (assessment.weight * remainingCredits);
      totalWeight += assessment.weight * remainingCredits;
    }

    const finalCgpa = totalWeight > 0 ? totalWeightedPct / totalWeight : currentCgpa;
    results.push(Math.min(10, Math.max(0, Math.round(finalCgpa * 100) / 100)));
  }

  results.sort((a, b) => a - b);

  const p10 = results[Math.floor(iterations * 0.1)];
  const p50 = results[Math.floor(iterations * 0.5)];
  const p90 = results[Math.floor(iterations * 0.9)];

  return { p10, p50, p90, seedUsed: seed };
}
