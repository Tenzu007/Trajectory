import { describe, it, expect } from 'vitest';
import { computePhysicsTelemetry } from '../src/calculations/physicsEngine.js';

describe('computePhysicsTelemetry', () => {
  it('computes kinetic energy, momentum, friction, and optimal climb status for high momentum', () => {
    const telemetry = computePhysicsTelemetry({
      credits: 22,
      velocity: 3.5,
      momentumTrend: 'rising',
      backlogCount: 0,
      attendanceRiskFraction: 0,
      taskSlipRate: 0.05,
      plannedHours: 20,
      actualHours: 21,
    });

    // Mass = 22, Velocity = 3.5
    expect(telemetry.mass).toBe(22);
    expect(telemetry.velocity).toBe(3.5);
    // Kinetic Energy = 0.5 * 22 * (3.5^2) = 11 * 12.25 = 134.75 -> 134.8
    expect(telemetry.kineticEnergy).toBeCloseTo(134.8, 1);
    // Momentum = 22 * 3.5 = 77
    expect(telemetry.momentum).toBe(77);
    expect(telemetry.momentumTrend).toBe('rising');
    // Low friction
    expect(telemetry.friction).toBeLessThan(0.1);
    expect(telemetry.entropyRating).toBe('on-track');
    expect(telemetry.flightStatus).toBe('OPTIMAL_CLIMB');
  });

  it('detects high drag warning when friction or drift increases', () => {
    const telemetry = computePhysicsTelemetry({
      credits: 20,
      velocity: 1.8,
      momentumTrend: 'falling',
      backlogCount: 2, // 2 * 0.15 = 0.3
      attendanceRiskFraction: 0.2, // 0.2 * 0.45 = 0.09
      taskSlipRate: 0.1, // 0.04
      plannedHours: 20,
      actualHours: 12, // 40% drift
    });

    expect(telemetry.friction).toBeGreaterThanOrEqual(0.35);
    expect(telemetry.entropyRating).toBe('high-drift');
    expect(telemetry.flightStatus).toBe('HIGH_DRAG_WARNING');
  });

  it('identifies stall risk when velocity stalls with backlog friction', () => {
    const telemetry = computePhysicsTelemetry({
      credits: 24,
      velocity: 0.4,
      momentumTrend: 'falling',
      backlogCount: 3,
      attendanceRiskFraction: 0.5,
      taskSlipRate: 0.5,
      plannedHours: 25,
      actualHours: 5,
    });

    expect(telemetry.friction).toBeGreaterThan(0.6);
    expect(telemetry.flightStatus).toBe('STALL_RISK');
  });
});
