import { describe, it, expect } from 'vitest';
import { UNIVERSITY_PRESETS, getUniversityPreset } from '../src/index.js';

describe('University Presets Module', () => {
  it('contains standard major Indian university systems', () => {
    expect(UNIVERSITY_PRESETS.length).toBeGreaterThanOrEqual(4);
    const ids = UNIVERSITY_PRESETS.map((p) => p.id);
    expect(ids).toContain('vtu');
    expect(ids).toContain('anna_univ');
    expect(ids).toContain('iit_nit');
    expect(ids).toContain('mumbai_pune');
  });

  it('VTU preset has 75% threshold and 40% passing mark with condonation details', () => {
    const vtu = getUniversityPreset('vtu');
    expect(vtu.attendanceThreshold).toBe(0.75);
    expect(vtu.condonationThreshold).toBe(0.65);
    expect(vtu.creditRules.passMark).toBe(40);
    expect(vtu.gradeSchema.length).toBeGreaterThanOrEqual(7);
  });

  it('Anna University preset enforces 50% passing mark and RA grade', () => {
    const anna = getUniversityPreset('anna_univ');
    expect(anna.creditRules.passMark).toBe(50);
    const raGrade = anna.gradeSchema.find((g) => g.grade === 'RA');
    expect(raGrade).toBeDefined();
    expect(raGrade?.points).toBe(0);
  });

  it('falls back to default preset on unknown id', () => {
    const fallback = getUniversityPreset('non_existent_preset');
    expect(fallback).toBeDefined();
    expect(fallback.id).toBe('vtu');
  });
});
