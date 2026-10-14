import { env } from '../config/env.js';

interface DurationParams {
  taskType: string;
  title: string;
  historicalMultiplier?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
}

interface ProcrastinationParams {
  studentId: string;
  taskId: string;
  daysUntilDeadline: number;
  priorityScore: number;
  historicalCompletionRate?: number;
  hasTwoMinuteTrigger?: boolean;
}

interface NudgeParams {
  studentId: string;
  currentHour?: number;
  pendingTasksCount?: number;
  streakDays?: number;
  peakFocusHour?: boolean;
}

interface MasteryParams {
  studentId: string;
  topic: string;
  outcome: boolean;
  priorMastery: number;
}

/**
 * Calls internal Python FastAPI ML microservice.
 * Falls back to deterministic heuristic algorithms if the ML service is down or times out.
 */
export async function predictTaskDuration(params: DurationParams): Promise<{ predictedMinutes: number; isFallback: boolean }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1200);

    const res = await fetch(`${env.ML_SERVICE_URL}/duration/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = (await res.json()) as { predictedMinutes: number };
      return { predictedMinutes: data.predictedMinutes, isFallback: false };
    }
  } catch {
    // Service offline or timeout — fall back
  }

  // Heuristic Fallback
  const baseMinutes: Record<string, number> = { study: 45, assignment: 60, practice: 30, skill: 60, health: 30 };
  const base = baseMinutes[params.taskType.toLowerCase()] || 45;
  const mult = params.historicalMultiplier || 1.0;
  return {
    predictedMinutes: Math.round(base * mult),
    isFallback: true,
  };
}

export async function assessProcrastinationRisk(
  params: ProcrastinationParams
): Promise<{ riskScore: number; riskLevel: string; antiProcrastinationTrigger: string; isFallback: boolean }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1200);

    const res = await fetch(`${env.ML_SERVICE_URL}/procrastination/risk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = (await res.json()) as { riskScore: number; riskLevel: string; antiProcrastinationTrigger: string };
      return { ...data, isFallback: false };
    }
  } catch {
    // Fall back
  }

  // Heuristic Fallback
  const rawRisk = Math.max(10, Math.min(90, (10 - params.daysUntilDeadline) * 6 + params.priorityScore * 0.3));
  const score = params.hasTwoMinuteTrigger ? rawRisk * 0.75 : rawRisk;
  return {
    riskScore: Math.round(score),
    riskLevel: score > 60 ? 'high' : score > 35 ? 'medium' : 'low',
    antiProcrastinationTrigger: 'Execute your 2-Minute Launch step to overcome cognitive startup inertia.',
    isFallback: true,
  };
}

export async function selectContextualNudge(
  params: NudgeParams
): Promise<{ nudgeId: string; message: string; suggestedAction: string; isFallback: boolean }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1200);

    const res = await fetch(`${env.ML_SERVICE_URL}/nudge/select`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = (await res.json()) as { nudgeId: string; message: string; suggestedAction: string };
      return { ...data, isFallback: false };
    }
  } catch {
    // Fall back
  }

  // Heuristic Fallback
  return {
    nudgeId: 'fallback_steady_step',
    message: 'Small consistent study inputs compound exponentially. Complete your next flight block.',
    suggestedAction: 'start_focus',
    isFallback: true,
  };
}

export async function updateTopicMastery(
  params: MasteryParams
): Promise<{ topic: string; updatedMastery: number; delta: number; isFallback: boolean }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1200);

    const res = await fetch(`${env.ML_SERVICE_URL}/mastery/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = (await res.json()) as { topic: string; updatedMastery: number; delta: number };
      return { ...data, isFallback: false };
    }
  } catch {
    // Fall back
  }

  // Heuristic Fallback (BKT rule)
  const prior = params.priorMastery;
  const newMastery = params.outcome ? prior + (1 - prior) * 0.25 : prior * 0.75;
  const clamped = Math.round(Math.max(0.05, Math.min(0.99, newMastery)) * 1000) / 1000;
  return {
    topic: params.topic,
    updatedMastery: clamped,
    delta: Math.round((clamped - prior) * 1000) / 1000,
    isFallback: true,
  };
}
