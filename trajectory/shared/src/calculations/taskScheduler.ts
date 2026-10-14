import type { SchedulerConstraints, ScheduledBlock } from '../types/index.js';

/**
 * Deterministic constraint-based daily task scheduler.
 *
 * Algorithm:
 * 1. Sort tasks by priority (descending), then by deadline (ascending).
 * 2. Apply duration multiplier per task type.
 * 3. Apply buffer: estimatedMinutes *= (1 + bufferPercent).
 * 4. Fit tasks greedily into available free slots, preferring peak focus hours.
 * 5. A task is marked compressed if it had to be shortened to fit.
 *
 * This module is pure — no I/O, no randomness.
 */
export function buildDailyPlan(constraints: SchedulerConstraints): ScheduledBlock[] {
  const {
    tasks,
    freeSlots,
    peakFocusHours,
    preferredFocusLength,
    bufferPercent = 0.2,
    durationMultipliers = {},
  } = constraints;

  // Sort: peak-focus slots first, then by start time
  const sortedSlots = [...freeSlots].sort((a, b) => {
    const aIsPeak = peakFocusHours.includes(a.start.getHours());
    const bIsPeak = peakFocusHours.includes(b.start.getHours());
    if (aIsPeak && !bIsPeak) return -1;
    if (!aIsPeak && bIsPeak) return 1;
    return a.start.getTime() - b.start.getTime();
  });

  // Sort tasks: priority desc, deadline asc
  const sortedTasks = [...tasks].sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    if (a.deadlineAt && b.deadlineAt) return a.deadlineAt.getTime() - b.deadlineAt.getTime();
    if (a.deadlineAt) return -1;
    if (b.deadlineAt) return 1;
    return 0;
  });

  const blocks: ScheduledBlock[] = [];

  // Track remaining time in each slot (copy slot ends as mutable pointers)
  const slotCursors = sortedSlots.map((s) => ({ ...s, current: new Date(s.start) }));

  for (const task of sortedTasks) {
    const multiplier = durationMultipliers[task.type] ?? 1.0;
    const bufferedMinutes = Math.ceil(task.estimatedMinutes * multiplier * (1 + bufferPercent));
    let remainingMinutes = bufferedMinutes;

    for (const slot of slotCursors) {
      if (remainingMinutes <= 0) break;

      const slotRemainingMs = slot.end.getTime() - slot.current.getTime();
      const slotRemainingMin = slotRemainingMs / 60000;

      if (slotRemainingMin <= 0) continue;

      // Don't start a block shorter than preferredFocusLength unless it's all we have
      const canFit = Math.min(remainingMinutes, slotRemainingMin);
      if (canFit < Math.min(preferredFocusLength, remainingMinutes)) continue;

      const blockStart = new Date(slot.current);
      const blockDuration = canFit;
      const blockEnd = new Date(blockStart.getTime() + blockDuration * 60000);

      blocks.push({
        taskId: task.id,
        start: blockStart,
        end: blockEnd,
        isCompressed: blockDuration < bufferedMinutes,
      });

      slot.current = blockEnd;
      remainingMinutes -= blockDuration;
    }
  }

  return blocks.sort((a, b) => a.start.getTime() - b.start.getTime());
}
