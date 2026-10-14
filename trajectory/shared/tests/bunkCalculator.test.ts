import { describe, it, expect } from 'vitest';
import { bunkHeadroom } from '../src/calculations/bunkCalculator.js';

describe('bunkHeadroom', () => {
  it('returns correct canMiss when well above threshold', () => {
    // 45 attended, 50 held, 20 remaining, threshold 0.75
    // canMiss = floor(45 + 20 - 0.75 * (50 + 20)) = floor(65 - 52.5) = floor(12.5) = 12
    const result = bunkHeadroom({ attended: 45, held: 50, remaining: 20 });
    expect(result.canMiss).toBe(12);
    expect(result.alreadyBelow).toBe(false);
  });

  it('returns 0 when exactly at threshold', () => {
    // 75 attended, 100 held, 0 remaining
    // canMiss = floor(75 + 0 - 0.75 * 100) = floor(0) = 0
    const result = bunkHeadroom({ attended: 75, held: 100, remaining: 0 });
    expect(result.canMiss).toBe(0);
    expect(result.alreadyBelow).toBe(false);
  });

  it('returns negative canMiss when already below threshold', () => {
    // 70 attended, 100 held, 0 remaining
    // canMiss = floor(70 - 75) = -5
    const result = bunkHeadroom({ attended: 70, held: 100, remaining: 0 });
    expect(result.canMiss).toBe(-5);
    expect(result.alreadyBelow).toBe(true);
  });

  it('uses a custom threshold', () => {
    // 65 attended, 100 held, 10 remaining, threshold 0.60
    // canMiss = floor(65 + 10 - 0.60 * 110) = floor(75 - 66) = 9
    const result = bunkHeadroom({ attended: 65, held: 100, remaining: 10, threshold: 0.60 });
    expect(result.canMiss).toBe(9);
  });

  it('handles zero classes held', () => {
    const result = bunkHeadroom({ attended: 0, held: 0, remaining: 0 });
    expect(result.currentPct).toBe(0);
    expect(result.alreadyBelow).toBe(false);
  });

  it('reports correct currentPct', () => {
    const result = bunkHeadroom({ attended: 80, held: 100, remaining: 0 });
    expect(result.currentPct).toBe(80);
  });

  it('reports correct projectedPct when attending all remaining', () => {
    // attended=70, held=100, remaining=10 → projected = 80/110 ≈ 72.73
    const result = bunkHeadroom({ attended: 70, held: 100, remaining: 10 });
    expect(result.projectedPct).toBeCloseTo(72.73, 1);
  });
});
