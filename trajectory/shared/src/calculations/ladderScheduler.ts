import type { LadderScheduleInput, LadderScheduleResult } from '../types/index.js';

const T1_DAYS_BEFORE = 21;
const T2_DAYS_BEFORE = 10;
const T3_DAYS_BEFORE = 3;

/**
 * Schedules the 3-tier Exam Ladder (T1 Diagnostic, T2 Targeted, T3 Full Mock).
 *
 * Normal spacing:
 *   T1 = examDate - 21 days
 *   T2 = examDate - 10 days
 *   T3 = examDate - 3 days
 *
 * If the exam is < 21 days away, all tests are compressed proportionally
 * into the available window. T3 is always kept at least 1 day before exam.
 *
 * Returns dates and a compressed flag with the reason.
 */
export function scheduleLadder(input: LadderScheduleInput): LadderScheduleResult {
  const { examDate, now = new Date() } = input;

  const msPerDay = 1000 * 60 * 60 * 24;
  const daysUntilExam = Math.ceil(
    (examDate.getTime() - now.getTime()) / msPerDay
  );

  const addDays = (base: Date, days: number): Date => {
    const d = new Date(base.getTime());
    d.setDate(d.getDate() + days);
    return d;
  };

  if (daysUntilExam <= 0) {
    // Exam is today or in the past — set all to today
    const today = new Date(now);
    return {
      t1: today,
      t2: today,
      t3: today,
      compressed: true,
      compressedReason: 'Exam is today or past — no preparation window available.',
      daysUntilExam,
    };
  }

  if (daysUntilExam >= T1_DAYS_BEFORE) {
    // Normal full-ladder spacing
    return {
      t1: addDays(examDate, -T1_DAYS_BEFORE),
      t2: addDays(examDate, -T2_DAYS_BEFORE),
      t3: addDays(examDate, -T3_DAYS_BEFORE),
      compressed: false,
      daysUntilExam,
    };
  }

  // Compressed: exam is within 21 days
  // Distribute T1/T2/T3 proportionally across available window
  // T3 is anchored 1 day before exam minimum
  const window = daysUntilExam;
  const cutT3 = Math.max(1, Math.floor(window * (T3_DAYS_BEFORE / T1_DAYS_BEFORE)));
  const cutT2 = Math.max(cutT3 + 1, Math.floor(window * (T2_DAYS_BEFORE / T1_DAYS_BEFORE)));
  const cutT1 = Math.max(cutT2 + 1, window);

  const missingFeatures: string[] = [];
  if (daysUntilExam < T1_DAYS_BEFORE) missingFeatures.push('T1 is after optimal date');
  if (cutT1 === cutT2) missingFeatures.push('T1 and T2 merged');
  if (cutT2 === cutT3) missingFeatures.push('T2 and T3 merged');

  return {
    t1: addDays(examDate, -cutT1),
    t2: addDays(examDate, -cutT2),
    t3: addDays(examDate, -cutT3),
    compressed: true,
    compressedReason: `Exam is only ${daysUntilExam} day(s) away. ${missingFeatures.join('; ')}. Ladder compressed proportionally.`,
    daysUntilExam,
  };
}
