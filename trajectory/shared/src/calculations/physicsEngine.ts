import type { PhysicsTelemetry } from '../types/index.js';

export interface ComputeTelemetryInput {
  credits: number;
  velocity: number;
  momentumTrend?: 'rising' | 'stable' | 'falling';
  backlogCount: number;
  attendanceRiskFraction: number; // 0-1
  taskSlipRate: number;           // 0-1
  plannedHours: number;
  actualHours: number;
}

/**
 * Computes full flight physics telemetry:
 * - Mass (m): total active academic credits
 * - Velocity (v): weekly completion rate of tasks / mastery units
 * - Kinetic Energy: E_k = 1/2 * m * v^2
 * - Momentum: p = m * v
 * - Friction (mu): drag coefficient from backlogs, attendance deficits, and task slips
 * - Entropy (Delta S): drift variance between planned and actual study hours
 * - Thrust: net forward flight vector
 * - Flight Status: categorized health assessment
 */
export function computePhysicsTelemetry(input: ComputeTelemetryInput): PhysicsTelemetry {
  const mass = Math.max(1, Math.round(input.credits));
  const velocity = Math.max(0, Math.round(input.velocity * 100) / 100);
  const trend = input.momentumTrend || 'stable';

  // E_k = 0.5 * m * v^2
  const kineticEnergy = Math.round(0.5 * mass * Math.pow(velocity, 2) * 10) / 10;

  // p = m * v
  const p = Math.round(mass * velocity * 10) / 10;

  // Friction coefficient mu in [0, 1]
  const rawFriction = (input.backlogCount * 0.15) + (input.attendanceRiskFraction * 0.45) + (input.taskSlipRate * 0.4);
  const friction = Math.min(1, Math.max(0, Math.round(rawFriction * 100) / 100));

  // Entropy (Delta S): % drift
  const drift = input.plannedHours > 0
    ? (Math.abs(input.plannedHours - input.actualHours) / input.plannedHours) * 100
    : 0;
  const entropy = Math.round(drift * 10) / 10;

  let entropyRating: PhysicsTelemetry['entropyRating'] = 'on-track';
  if (entropy > 30) entropyRating = 'high-drift';
  else if (entropy > 15) entropyRating = 'slight-drift';

  // Net thrust: momentum minus friction drag force (scaled)
  const thrust = Math.round((p - (friction * 15)) * 10) / 10;

  // Flight status evaluation
  let flightStatus: PhysicsTelemetry['flightStatus'] = 'STEADY_CRUISE';
  if (friction >= 0.6 || (velocity < 0.8 && mass > 5)) {
    flightStatus = 'STALL_RISK';
  } else if (friction >= 0.35 || entropyRating === 'high-drift') {
    flightStatus = 'HIGH_DRAG_WARNING';
  } else if (velocity >= 2.0 && friction < 0.25) {
    flightStatus = 'OPTIMAL_CLIMB';
  }

  return {
    mass,
    velocity,
    kineticEnergy,
    momentum: p,
    momentumTrend: trend,
    friction,
    entropy,
    entropyRating,
    thrust,
    flightStatus,
  };
}
