export interface UniversityPreset {
  id: string;
  name: string;
  fullName: string;
  region: string;
  attendanceThreshold: number;
  condonationThreshold?: number;
  condonationRules: string;
  gradingScale: { max: number };
  creditRules: { passMark: number };
  backlogPolicy: string;
  gradeSchema: Array<{ grade: string; minPercent: number; points: number }>;
}

export const UNIVERSITY_PRESETS: UniversityPreset[] = [
  {
    id: 'vtu',
    name: 'VTU',
    fullName: 'Visvesvaraya Technological University',
    region: 'Karnataka',
    attendanceThreshold: 0.75,
    condonationThreshold: 0.65,
    condonationRules: 'Up to 10% condonation permissible on genuine medical grounds certified by college principal.',
    gradingScale: { max: 10 },
    creditRules: { passMark: 40 },
    backlogPolicy: 'Maximum 4 active backlogs allowed for vertical progression to final year.',
    gradeSchema: [
      { grade: 'O',  minPercent: 90, points: 10 },
      { grade: 'A+', minPercent: 80, points: 9 },
      { grade: 'A',  minPercent: 70, points: 8 },
      { grade: 'B+', minPercent: 60, points: 7 },
      { grade: 'B',  minPercent: 55, points: 6 },
      { grade: 'C',  minPercent: 50, points: 5 },
      { grade: 'P',  minPercent: 40, points: 4 },
      { grade: 'F',  minPercent: 0,  points: 0 },
    ],
  },
  {
    id: 'anna_univ',
    name: 'Anna University',
    fullName: 'Anna University Affiliated Colleges',
    region: 'Tamil Nadu',
    attendanceThreshold: 0.75,
    condonationThreshold: 0.65,
    condonationRules: '65%-74% attendance requires Vice-Chancellor condonation approval with medical endorsement.',
    gradingScale: { max: 10 },
    creditRules: { passMark: 50 },
    backlogPolicy: 'Supplementary exams conducted in subsequent semester; no hard year drop.',
    gradeSchema: [
      { grade: 'O',  minPercent: 91, points: 10 },
      { grade: 'A+', minPercent: 81, points: 9 },
      { grade: 'A',  minPercent: 71, points: 8 },
      { grade: 'B+', minPercent: 61, points: 7 },
      { grade: 'B',  minPercent: 50, points: 6 },
      { grade: 'RA', minPercent: 0,  points: 0 },
    ],
  },
  {
    id: 'iit_nit',
    name: 'IIT / NIT / BITS',
    fullName: 'National Institutes of Technology & IITs',
    region: 'National (Central)',
    attendanceThreshold: 0.75,
    condonationThreshold: 0.70,
    condonationRules: 'Under 75% results in automatic DX (Debarred from Exam) award.',
    gradingScale: { max: 10 },
    creditRules: { passMark: 35 },
    backlogPolicy: 'Summer term remedial registration required to clear credits.',
    gradeSchema: [
      { grade: 'EX', minPercent: 90, points: 10 },
      { grade: 'A',  minPercent: 80, points: 9 },
      { grade: 'B',  minPercent: 70, points: 8 },
      { grade: 'C',  minPercent: 60, points: 7 },
      { grade: 'D',  minPercent: 50, points: 6 },
      { grade: 'P',  minPercent: 35, points: 5 },
      { grade: 'F',  minPercent: 0,  points: 0 },
    ],
  },
  {
    id: 'mumbai_pune',
    name: 'MU / SPPU',
    fullName: 'Mumbai University & Savitribai Phule Pune University',
    region: 'Maharashtra',
    attendanceThreshold: 0.75,
    condonationThreshold: 0.65,
    condonationRules: '75% aggregate across theory and practicals required by university mandate.',
    gradingScale: { max: 10 },
    creditRules: { passMark: 40 },
    backlogPolicy: 'ATKT (Allowed to Keep Term) rule permits progression with up to 5 backlogs.',
    gradeSchema: [
      { grade: 'O',  minPercent: 80, points: 10 },
      { grade: 'A+', minPercent: 70, points: 9 },
      { grade: 'A',  minPercent: 60, points: 8 },
      { grade: 'B+', minPercent: 55, points: 7 },
      { grade: 'B',  minPercent: 50, points: 6 },
      { grade: 'C',  minPercent: 45, points: 5 },
      { grade: 'D',  minPercent: 40, points: 4 },
      { grade: 'F',  minPercent: 0,  points: 0 },
    ],
  },
  {
    id: 'autonomous_ugc',
    name: 'Autonomous UGC',
    fullName: 'Autonomous Tier-1 College (UGC Standard)',
    region: 'All India',
    attendanceThreshold: 0.75,
    condonationThreshold: 0.65,
    condonationRules: 'Institutional Academic Council condonation with fee fine and medical cert.',
    gradingScale: { max: 10 },
    creditRules: { passMark: 40 },
    backlogPolicy: 'Fast-track re-exam available during semester breaks.',
    gradeSchema: [
      { grade: 'O',  minPercent: 90, points: 10 },
      { grade: 'A+', minPercent: 80, points: 9 },
      { grade: 'A',  minPercent: 70, points: 8 },
      { grade: 'B+', minPercent: 60, points: 7 },
      { grade: 'B',  minPercent: 50, points: 6 },
      { grade: 'C',  minPercent: 40, points: 5 },
      { grade: 'F',  minPercent: 0,  points: 0 },
    ],
  },
];

export function getUniversityPreset(presetId: string): UniversityPreset {
  const found = UNIVERSITY_PRESETS.find((p) => p.id === presetId);
  return found || UNIVERSITY_PRESETS[0];
}
