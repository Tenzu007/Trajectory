// ─── Student & Config ─────────────────────────────────────────────────────────

export interface GradePoint {
  grade: string;   // e.g. 'O', 'A+', 'A', 'B+', 'B', 'C', 'F'
  minPercent: number;
  points: number;
}

export interface StudentConfig {
  gradingScale: { max: number };             // default 10
  attendanceThreshold: number;               // default 0.75
  creditRules: { passMark: number };         // default 40 (percent)
  gradeSchema: GradePoint[];
}

export interface StudentPriors {
  taskDurationMultiplier: Record<string, number>; // e.g. { theory: 1.2, practical: 0.9 }
  peakFocusHours: number[];                        // e.g. [9, 10, 11]
  preferredFocusLength: number;                    // minutes
  weeklyFreeHours: number;
}

export interface StudentBase {
  _id: string;
  email: string;
  name: string;
  avatar?: string;
  config: StudentConfig;
  priors: StudentPriors;
  onboardingCompleted: boolean;
  universityPreset?: string;
  mentorEmail?: string;
  parentEmail?: string;
  sharedFields: string[];
  createdAt: string;
  updatedAt: string;
}

// ─── Dream & Targets ──────────────────────────────────────────────────────────

export type DreamStatus = 'draft' | 'compiled' | 'confirmed';

export interface ObstaclePlan {
  description: string;
  ifThenPlan: string;
}

export interface AlternativeTarget {
  description: string;
  cost: string;
}

export interface RealityCheck {
  feasible: boolean;
  obstacles: ObstaclePlan[];
  alternativeTargets: AlternativeTarget[];
}

export interface DreamBase {
  _id: string;
  studentId: string;
  rawText: string;
  compiledAt?: string;
  status: DreamStatus;
  targets: string[];           // ObjectId refs
  realityCheck?: RealityCheck;
  premortem?: { scenario: string; obstacles: string[] };
  contractSharedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type TargetType = 'cgpa' | 'subject_grade' | 'skill' | 'role' | 'backlog_clear' | 'other';

export interface TargetBase {
  _id: string;
  studentId: string;
  dreamId: string;
  type: TargetType;
  description: string;
  measurableValue: number | string;
  deadline: string;
  currentValue: number | string;
  gapScore: number; // 0-100
  createdAt: string;
  updatedAt: string;
}

// ─── Course & Topics ──────────────────────────────────────────────────────────

export interface Topic {
  _id?: string;
  name: string;
  mastery: number;   // 0-1
  lastReviewed?: string;
  syllabusCovered: boolean;
}

export type Semester = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface CourseBase {
  _id: string;
  studentId: string;
  name: string;
  code: string;
  semester: Semester;
  credits: number;
  attendanceConfig: { threshold: number };
  topics: Topic[];
  assessments: string[];  // ObjectId refs
  currentMarks: number;
  totalMarks: number;
  projectedGrade?: string;
  isBacklog: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Assessment ───────────────────────────────────────────────────────────────

export type AssessmentType = 'assignment' | 'quiz' | 'lab' | 'project' | 'exam' | 'other';
export type AssessmentStatus = 'pending' | 'submitted' | 'graded';

export interface AssessmentBase {
  _id: string;
  studentId: string;
  courseId: string;
  name: string;
  type: AssessmentType;
  weight: number;      // 0-1 (fraction of total marks)
  maxMarks: number;
  scoredMarks?: number;
  dueDate: string;
  submittedAt?: string;
  onTime: boolean;
  status: AssessmentStatus;
  createdAt: string;
  updatedAt: string;
}

// ─── Attendance ───────────────────────────────────────────────────────────────

export type AttendanceStatus = 'present' | 'absent' | 'cancelled';
export type ClassType = 'lecture' | 'lab' | 'tutorial';

export interface AttendanceRecordBase {
  _id: string;
  studentId: string;
  courseId: string;
  date: string;
  status: AttendanceStatus;
  classType: ClassType;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceSummary {
  attended: number;
  held: number;
  remaining: number;
  percentage: number;
  canMiss: number;      // bunkHeadroom result
  alreadyBelow: boolean;
  threshold: number;
}

// ─── Exam & Exam Ladder ───────────────────────────────────────────────────────

export interface ExamBase {
  _id: string;
  studentId: string;
  courseId: string;
  name: string;
  date: string;
  syllabusTopics: string[];
  ladderTests: string[];  // ObjectId refs
  isBacklog: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LadderTestBase {
  _id: string;
  studentId: string;
  examId: string;
  tier: 1 | 2 | 3;
  scheduledDate: string;
  completedDate?: string;
  topicsCovered: string[];
  openNotes: boolean;
  scoredMarks?: number;
  maxMarks?: number;
  compressed: boolean;
  compressedReason?: string;
  attemptId?: string;
  createdAt: string;
  updatedAt: string;
}

export type ErrorType = 'concept_gap' | 'careless' | 'time_pressure';

export interface AnswerRecord {
  questionId: string;
  correct: boolean;
  errorType?: ErrorType;
  topic: string;
}

export interface FixItem {
  item: string;
  action: string;
  priority: number;
}

export interface ErrorAutopsy {
  conceptGaps: string[];
  carelessMistakes: string[];
  timePressureItems: string[];
  fixList: FixItem[];
}

export interface TestAttemptBase {
  _id: string;
  studentId: string;
  ladderTestId: string;
  answers: AnswerRecord[];
  autopsy: ErrorAutopsy;
  timeTaken: number;  // minutes
  createdAt: string;
  updatedAt: string;
}

// ─── Backlog ──────────────────────────────────────────────────────────────────

export type BacklogRootCause = 'foundations' | 'technique' | 'attendance' | 'time_clash';

export interface MilestoneReview {
  date: string;
  diagnosticScore: number;
  onTrack: boolean;
}

export interface VectorBConfig {
  default: number;   // minutes
  minimum: number;
}

export interface BacklogBase {
  _id: string;
  studentId: string;
  courseId: string;
  suppExamDate: string;
  syllabusRemaining: string[];
  prerequisiteChain: string[];
  pastScore: number;
  credits: number;
  recoveryValue: number;
  rootCause?: BacklogRootCause;
  vectorBMinutes: VectorBConfig;
  supportMap: string[];  // ObjectId refs
  milestoneReviews: MilestoneReview[];
  createdAt: string;
  updatedAt: string;
}

// ─── Task ─────────────────────────────────────────────────────────────────────

export type TaskType = 'study' | 'assignment' | 'practice' | 'skill' | 'health' | 'other';
export type TaskStatus = 'pending' | 'done' | 'rescheduled' | 'released';

export interface TaskStep {
  _id?: string;
  description: string;
  completed: boolean;
}

export interface ReleaseEffect {
  gapScoreDelta: number;
  gradeForecastDelta: number;
}

export interface TaskBase {
  _id: string;
  studentId: string;
  courseId?: string;
  examId?: string;
  backlogId?: string;
  skillId?: string;
  title: string;
  description?: string;
  type: TaskType;
  priorityScore: number;
  estimatedMinutes: number;
  actualMinutes?: number;
  steps: TaskStep[];
  twoMinuteLaunch: string;
  scheduledAt: string;
  completedAt?: string;
  status: TaskStatus;
  releaseEffect?: ReleaseEffect;
  createdAt: string;
  updatedAt: string;
}

// ─── Commitment ───────────────────────────────────────────────────────────────

export type CommitmentStatus = 'kept' | 'missed' | 'rescheduled' | 'released';

export interface CommitmentBase {
  _id: string;
  studentId: string;
  taskId: string;
  scheduledStart: string;
  scheduledEnd: string;
  status: CommitmentStatus;
  keepRate: number;  // 0-1
  createdAt: string;
  updatedAt: string;
}

// ─── Focus Session ────────────────────────────────────────────────────────────

export type FocusTechnique = 'pomodoro' | 'flow';

export interface FocusSessionBase {
  _id: string;
  studentId: string;
  taskId: string;
  startedAt: string;
  endedAt?: string;
  durationMinutes?: number;
  technique: FocusTechnique;
  interrupted: boolean;
  retrievalPracticeCompleted: boolean;
  petXpAwarded: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Skills & Roles ───────────────────────────────────────────────────────────

export type SkillTier = 'foundation' | 'core' | 'differentiator';
export type ProofOfWorkType = 'project' | 'writeup' | 'competition' | 'contribution';

export interface ProofOfWork {
  type: ProofOfWorkType;
  url?: string;
  description: string;
}

export interface SkillBase {
  _id: string;
  studentId: string;
  roleProfileId: string;
  name: string;
  tier: SkillTier;
  coveredByCurriculum: boolean;
  masteryLevel: number;  // 0-1
  proofOfWork?: ProofOfWork;
  unlocksSkills: string[];  // ObjectId refs
  milestones: string[];     // ObjectId refs
  createdAt: string;
  updatedAt: string;
}

export interface RoleSkillEntry {
  name: string;
  tier: SkillTier;
  prerequisites: string[];
}

export interface RoleProfileBase {
  _id: string;
  name: string;
  description: string;
  skillMap: RoleSkillEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface SkillMilestoneBase {
  _id: string;
  studentId: string;
  skillId: string;
  description: string;
  deadline: string;
  scheduledTaskId?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Flashcard & Review ───────────────────────────────────────────────────────

export type FlashcardSource = 'manual' | 'llm_generated';

export interface FlashcardBase {
  _id: string;
  studentId: string;
  courseId?: string;
  skillId?: string;
  front: string;
  back: string;
  source: FlashcardSource;
  verified: boolean;
  reported: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewLogBase {
  _id: string;
  studentId: string;
  flashcardId: string;
  reviewedAt: string;
  rating: 0 | 1 | 2 | 3 | 4 | 5;
  intervalDays: number;
  easeFactor: number;
  nextDueAt: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Reflection ───────────────────────────────────────────────────────────────

export interface SubjectHours {
  courseId: string;
  planned: number;
  actual: number;
}

export interface OutcomeLink {
  courseId: string;
  studyHours: number;
  scoreMovement: number;
  flaggedAsMethodProblem: boolean;
}

export interface ConfidenceVsScore {
  topic: string;
  predicted: number;
  actual: number;
}

export interface Blocker {
  courseId: string;
  frustration: string;
  controlAction: string;
}

export interface ReflectionBase {
  _id: string;
  studentId: string;
  weekStartDate: string;
  entropyAudit: {
    plannedHours: number;
    actualHours: number;
    bySubject: SubjectHours[];
  };
  outcomeLink: OutcomeLink[];
  confidenceVsScore: ConfidenceVsScore[];
  blockers: Blocker[];
  adjustment: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Support Map ──────────────────────────────────────────────────────────────

export type SupportRole = 'professor' | 'ta' | 'senior' | 'peer' | 'mentor';

export interface SupportMapEntryBase {
  _id: string;
  studentId: string;
  backlogId?: string;
  personName: string;
  role: SupportRole;
  specificAsk: string;
  checkInDate: string;
  messageTemplate: string;
  contacted: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Health Check-in ──────────────────────────────────────────────────────────

export interface HealthCheckinBase {
  _id: string;
  studentId: string;
  date: string;
  sleepHours: number;
  exercised: boolean;
  mood: 1 | 2 | 3 | 4 | 5;
  flaggedForWellbeing: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Forecast ─────────────────────────────────────────────────────────────────

export interface CgpaRange {
  p10: number;
  p50: number;
  p90: number;
}

export interface ForecastScenario {
  action: string;
  cgpaDelta: number;
}

export interface ForecastBase {
  _id: string;
  studentId: string;
  generatedAt: string;
  cgpaRange: CgpaRange;
  simulationInputs: {
    remainingAssessments: Array<{ courseId: string; weight: number; maxMarks: number }>;
    currentPerf: Array<{ courseId: string; currentPct: number }>;
  };
  scenarios: ForecastScenario[];
  seedUsed: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Calculation I/O types ────────────────────────────────────────────────────

export interface BunkHeadroomInput {
  attended: number;
  held: number;
  remaining: number;
  threshold?: number;   // default 0.75
}

export interface BunkHeadroomResult {
  canMiss: number;
  alreadyBelow: boolean;
  currentPct: number;
  projectedPct: number;
}

export interface GradeNeededInput {
  currentMarks: number;
  totalSoFar: number;
  remainingAssessments: Array<{ name: string; maxMarks: number; weight: number }>;
  targetPercent: number;
  totalMax: number;
}

export interface GradeNeededResult {
  feasible: boolean;
  neededPerAssessment: Array<{ name: string; needed: number; maxMarks: number }>;
  minimumAverageNeeded: number;
}

export interface PriorityScoreInput {
  marksAtStake: number;   // e.g. assessment weight * max marks
  mastery: number;         // 0-1 (lower = higher priority)
  urgencyDays: number;     // days until due
  effortHours: number;     // estimated effort
}

export interface GapScoreInput {
  cgpaGap: number;          // 0-10 scale
  backlogCount: number;
  attendanceRisk: number;   // 0-1 (fraction of courses at risk)
  skillGap: number;         // 0-1
  weights?: {
    cgpa?: number;
    backlogs?: number;
    attendance?: number;
    skill?: number;
  };
}

export interface GapScoreResult {
  score: number;    // 0-100
  biggestContributor: 'cgpa' | 'backlogs' | 'attendance' | 'skill';
  breakdown: {
    cgpa: number;
    backlogs: number;
    attendance: number;
    skill: number;
  };
}

export interface LadderScheduleInput {
  examDate: Date;
  now?: Date;
}

export interface LadderScheduleResult {
  t1: Date;
  t2: Date;
  t3: Date;
  compressed: boolean;
  compressedReason?: string;
  daysUntilExam: number;
}

export interface BacklogRankInput {
  id: string;
  credits: number;
  effortHours: number;          // estimated hours to clear
  blocksLaterCourses: boolean;
  suppExamDaysAway: number;
}

export interface BacklogRankResult extends BacklogRankInput {
  recoveryValue: number;
}

export interface MonteCarloInput {
  remainingAssessments: Array<{
    weight: number;         // fraction of total
    maxMarks: number;
    currentExpectedPct: number;
    stdDevPct: number;
  }>;
  currentCgpa: number;
  currentCreditsCompleted: number;
  totalCredits: number;
  seed?: number;
}

export interface MonteCarloResult {
  p10: number;
  p50: number;
  p90: number;
  seedUsed: number;
}

export interface SpacedRepInput {
  rating: 0 | 1 | 2 | 3 | 4 | 5;
  easeFactor: number;     // default 2.5
  intervalDays: number;   // current interval
}

export interface SpacedRepResult {
  intervalDays: number;
  easeFactor: number;
  nextDueAt: Date;
}

export interface SchedulerConstraints {
  tasks: Array<{
    id: string;
    estimatedMinutes: number;
    priority: number;        // higher = schedule earlier
    deadlineAt?: Date;
    type: TaskType;
  }>;
  freeSlots: Array<{ start: Date; end: Date }>;
  peakFocusHours: number[];
  preferredFocusLength: number;
  bufferPercent?: number;    // default 0.2
  durationMultipliers?: Record<string, number>;
}

export interface ScheduledBlock {
  taskId: string;
  start: Date;
  end: Date;
  isCompressed: boolean;
}

export interface MomentumResult {
  velocity: number;        // mastery points gained per week
  keepRate: number;        // 0-1
  trend: 'rising' | 'stable' | 'falling';
}

export interface EntropyResult {
  driftPercent: number;    // (|planned - actual| / planned) * 100
  plannedHours: number;
  actualHours: number;
  rating: 'on-track' | 'slight-drift' | 'high-drift';
}

// ─── API response envelope ────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

// ─── Onboarding payload ───────────────────────────────────────────────────────

export interface OnboardingPayload {
  course: string;
  semester: Semester;
  subjects: Array<{
    name: string;
    code: string;
    credits: number;
    currentMarks: number;
    totalMarks: number;
    isBacklog: boolean;
  }>;
  sleepSchedule: { bedtime: string; wakeup: string };
  preferredFocusLength: number;
  weeklyFreeHours: number;
  targetRole: string;
}

// ─── Phase 4: Physics & University Presets & Flight Report ───────────────────

export interface PhysicsTelemetry {
  mass: number;             // Academic credits weight
  velocity: number;         // Mastery / tasks completed per week
  kineticEnergy: number;    // E_k = 0.5 * m * v^2
  momentum: number;         // p = m * v
  momentumTrend: 'rising' | 'stable' | 'falling';
  friction: number;         // Drag coefficient (backlogs, attendance deficit, task slips)
  entropy: number;          // Delta S (variance/drift from target %)
  entropyRating: 'on-track' | 'slight-drift' | 'high-drift';
  thrust: number;           // Net thrust = momentum - (friction * 10)
  flightStatus: 'OPTIMAL_CLIMB' | 'STEADY_CRUISE' | 'HIGH_DRAG_WARNING' | 'STALL_RISK';
}

export interface FlightReportData {
  student: {
    id: string;
    name: string;
    email: string;
    targetRole?: string;
    universityPreset?: string;
  };
  generatedAt: string;
  academicTelemetry: {
    totalCredits: number;
    enrolledCoursesCount: number;
    backlogCount: number;
    backlogCredits: number;
    attendanceHealth: {
      averageAttendancePct: number;
      coursesAtRiskCount: number;
    };
    cgpaForecast?: {
      p10: number;
      p50: number;
      p90: number;
    };
  };
  physicsTelemetry: PhysicsTelemetry;
  activeCourses: Array<{
    id: string;
    code: string;
    name: string;
    credits: number;
    currentMarks: number;
    totalMarks: number;
    attendancePct: number;
    canMissClasses: number;
    isBacklog: boolean;
  }>;
  ladderTestsSummary: {
    total: number;
    completed: number;
    upcoming: number;
  };
  upcomingFlightPath: Array<{
    id: string;
    title: string;
    type: string;
    scheduledAt: string;
    priorityScore: number;
    twoMinuteLaunch: string;
  }>;
}

