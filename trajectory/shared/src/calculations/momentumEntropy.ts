import type { MomentumResult, EntropyResult } from '../types/index.js';

interface SessionRecord {
  completedAt: string;        // ISO date
  masteryGained: number;      // 0-1
  wasKept: boolean;            // commitment kept?
}

/**
 * Computes momentum: weekly mastery velocity × commitment keep-rate.
 * Uses the last 4 weeks of session data.
 */
export function momentum(sessions: SessionRecord[]): MomentumResult {
  if (sessions.length === 0) {
    return { velocity: 0, keepRate: 0, trend: 'stable' };
  }

  const now = new Date();
  const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const recent = sessions.filter((s) => new Date(s.completedAt) >= fourWeeksAgo);
  const lastTwoWeeks = recent.filter((s) => new Date(s.completedAt) >= twoWeeksAgo);
  const prevTwoWeeks = recent.filter((s) => new Date(s.completedAt) < twoWeeksAgo);

  const totalMastery = recent.reduce((sum, s) => sum + s.masteryGained, 0);
  const velocity = recent.length > 0 ? totalMastery / 4 : 0; // per week

  const kept = recent.filter((s) => s.wasKept).length;
  const keepRate = recent.length > 0 ? kept / recent.length : 0;

  const lastVel = lastTwoWeeks.reduce((sum, s) => sum + s.masteryGained, 0);
  const prevVel = prevTwoWeeks.reduce((sum, s) => sum + s.masteryGained, 0);

  let trend: MomentumResult['trend'] = 'stable';
  if (lastVel > prevVel * 1.1) trend = 'rising';
  else if (lastVel < prevVel * 0.9) trend = 'falling';

  return {
    velocity: Math.round(velocity * 1000) / 1000,
    keepRate: Math.round(keepRate * 100) / 100,
    trend,
  };
}

/**
 * Computes entropy: plan-vs-actual drift for a week.
 * Returns a drift percentage and a qualitative rating.
 */
export function entropy(plannedHours: number, actualHours: number): EntropyResult {
  const driftPercent = plannedHours > 0
    ? (Math.abs(plannedHours - actualHours) / plannedHours) * 100
    : 0;

  let rating: EntropyResult['rating'] = 'on-track';
  if (driftPercent > 30) rating = 'high-drift';
  else if (driftPercent > 15) rating = 'slight-drift';

  return {
    driftPercent: Math.round(driftPercent * 10) / 10,
    plannedHours,
    actualHours,
    rating,
  };
}
