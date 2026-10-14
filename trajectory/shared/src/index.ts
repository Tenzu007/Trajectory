// Pure calculation modules
export { bunkHeadroom } from './calculations/bunkCalculator.js';
export { gradeNeeded } from './calculations/gradeNeeded.js';
export { priorityScore } from './calculations/priorityScore.js';
export { gapScore } from './calculations/gapScore.js';
export { scheduleLadder } from './calculations/ladderScheduler.js';
export { rankBacklogs } from './calculations/backlogRanker.js';
export { simulate } from './calculations/monteCarlo.js';
export { nextInterval } from './calculations/spacedRepetition.js';
export { buildDailyPlan } from './calculations/taskScheduler.js';
export { momentum, entropy } from './calculations/momentumEntropy.js';
export { UNIVERSITY_PRESETS, getUniversityPreset, type UniversityPreset } from './calculations/universityPresets.js';
export { computePhysicsTelemetry, type ComputeTelemetryInput } from './calculations/physicsEngine.js';

// All types
export * from './types/index.js';

