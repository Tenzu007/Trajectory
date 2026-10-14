import { describe, it, expect } from 'vitest';
import { scheduleLadder } from '../src/calculations/ladderScheduler.js';

const examInDays = (days: number): { examDate: Date; now: Date } => {
  const now = new Date('2024-01-01T10:00:00Z');
  const examDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return { examDate, now };
};

describe('scheduleLadder', () => {
  it('returns uncompressed dates when exam is 30 days away', () => {
    const { examDate, now } = examInDays(30);
    const result = scheduleLadder({ examDate, now });
    expect(result.compressed).toBe(false);
    expect(result.daysUntilExam).toBe(30);
    // T1 = 30-21 = 9 days from now
    expect(Math.round((result.t1.getTime() - now.getTime()) / 86400000)).toBe(9);
    // T2 = 30-10 = 20 days from now
    expect(Math.round((result.t2.getTime() - now.getTime()) / 86400000)).toBe(20);
    // T3 = 30-3 = 27 days from now
    expect(Math.round((result.t3.getTime() - now.getTime()) / 86400000)).toBe(27);
  });

  it('returns uncompressed when exam is exactly 21 days away', () => {
    const { examDate, now } = examInDays(21);
    const result = scheduleLadder({ examDate, now });
    expect(result.compressed).toBe(false);
  });

  it('compresses when exam is 14 days away', () => {
    const { examDate, now } = examInDays(14);
    const result = scheduleLadder({ examDate, now });
    expect(result.compressed).toBe(true);
    expect(result.compressedReason).toBeTruthy();
    expect(result.t1.getTime()).toBeLessThanOrEqual(result.t2.getTime());
    expect(result.t2.getTime()).toBeLessThanOrEqual(result.t3.getTime());
    expect(result.t3.getTime()).toBeLessThanOrEqual(examDate.getTime());
  });

  it('compresses when exam is 5 days away', () => {
    const { examDate, now } = examInDays(5);
    const result = scheduleLadder({ examDate, now });
    expect(result.compressed).toBe(true);
    expect(result.t3.getTime()).toBeLessThanOrEqual(examDate.getTime());
  });

  it('handles exam today gracefully', () => {
    const { examDate, now } = examInDays(0);
    const result = scheduleLadder({ examDate, now });
    expect(result.compressed).toBe(true);
    expect(result.daysUntilExam).toBeLessThanOrEqual(0);
  });

  it('T3 is always before or on exam date', () => {
    for (const days of [1, 3, 7, 10, 14, 21, 30, 60]) {
      const { examDate, now } = examInDays(days);
      const result = scheduleLadder({ examDate, now });
      expect(result.t3.getTime()).toBeLessThanOrEqual(examDate.getTime());
    }
  });
});
