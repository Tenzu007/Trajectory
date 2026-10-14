import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthPage } from '../src/pages/AuthPage.js';
import { Planner } from '../src/pages/Planner.js';
import { useAuthStore } from '../src/stores/useAuthStore.js';
import { usePlannerStore } from '../src/stores/usePlannerStore.js';
import { flashcardsApi, forecastsApi, mentorApi, flightReportApi, universityPresetsApi } from '../src/api/index.js';

vi.spyOn(flashcardsApi, 'due').mockResolvedValue({ data: { data: [] } } as any);
vi.spyOn(flashcardsApi, 'list').mockResolvedValue({ data: { data: [] } } as any);
vi.spyOn(forecastsApi, 'latest').mockResolvedValue({
  data: {
    data: {
      cgpaRange: { p10: 7.2, p50: 8.1, p90: 8.9 },
      scenarios: [{ action: 'Clear all pending backlogs on 1st attempt', cgpaDelta: 0.65 }],
      simulationInputs: { completedCredits: 80, remainingCredits: 40, currentPerformance: 7.8 },
    },
  },
} as any);
vi.spyOn(mentorApi, 'getSharedView').mockResolvedValue({
  data: {
    data: {
      name: 'Priya Sharma',
      onboardingCompleted: true,
      allowedFields: ['cgpa_target', 'flight_plan_progress'],
      cgpaForecast: { p10: 7.2, p50: 8.1, p90: 8.9 },
      flightPlanSummary: { totalTasks: 10, completedTasks: 8, completionRate: 80 },
    },
  },
} as any);
vi.spyOn(universityPresetsApi, 'list').mockResolvedValue({
  data: {
    data: [
      {
        id: 'vtu',
        name: 'VTU',
        fullName: 'Visvesvaraya Technological University',
        region: 'Karnataka',
        attendanceThreshold: 0.75,
        creditRules: { passMark: 40 },
        gradingScale: { max: 10 },
        gradeSchema: [],
        condonationRules: '10% on medical grounds',
        backlogPolicy: '4 backlogs max',
      },
    ],
  },
} as any);
vi.spyOn(flightReportApi, 'getReport').mockResolvedValue({
  data: {
    data: {
      student: {
        id: 'test-student-id',
        name: 'Priya Sharma',
        email: 'priya@test.edu',
        targetRole: 'Software Engineer',
        universityPreset: 'vtu',
      },
      generatedAt: new Date().toISOString(),
      academicTelemetry: {
        totalCredits: 22,
        enrolledCoursesCount: 5,
        backlogCount: 1,
        backlogCredits: 4,
        attendanceHealth: { averageAttendancePct: 84, coursesAtRiskCount: 0 },
        cgpaForecast: { p10: 7.4, p50: 8.2, p90: 8.9 },
      },
      physicsTelemetry: {
        mass: 22,
        velocity: 3.5,
        kineticEnergy: 134.8,
        momentum: 77,
        momentumTrend: 'rising',
        friction: 0.18,
        entropy: 12,
        entropyRating: 'on-track',
        thrust: 74.3,
        flightStatus: 'OPTIMAL_CLIMB',
      },
      activeCourses: [
        {
          id: 'c1',
          code: 'CS301',
          name: 'Advanced Data Structures',
          credits: 4,
          currentMarks: 82,
          totalMarks: 100,
          attendancePct: 88,
          canMissClasses: 3,
          isBacklog: false,
        },
      ],
      ladderTestsSummary: { total: 3, completed: 2, upcoming: 1 },
      upcomingFlightPath: [
        {
          id: 't1',
          title: 'Implement Dijkstra in C++',
          type: 'study',
          scheduledAt: new Date().toISOString(),
          priorityScore: 85,
          twoMinuteLaunch: 'Create graph.cpp and define adjacency list.',
        },
      ],
    },
  },
} as any);



describe('Client React Component Suite', () => {
  beforeEach(() => {
    useAuthStore.setState({
      student: {
        _id: 'test-student-id',
        email: 'priya@test.edu',
        name: 'Priya Sharma',
        config: {
          gradingScale: { max: 10 },
          attendanceThreshold: 0.75,
          creditRules: { passMark: 40 },
          gradeSchema: [],
        },
        priors: {
          taskDurationMultiplier: { theory: 1.2, practical: 0.9 },
          peakFocusHours: [9, 10, 11],
          preferredFocusLength: 25,
          weeklyFreeHours: 20,
        },
        onboardingCompleted: true,
        sharedFields: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      isLoading: false,
      token: 'mock-token',
    });

    usePlannerStore.setState({
      tasks: [
        {
          _id: 'task-1',
          studentId: 'test-student-id',
          title: 'Algorithms: Dynamic Programming DP-1',
          type: 'study',
          priorityScore: 88,
          estimatedMinutes: 45,
          twoMinuteLaunch: 'Open slide 3 and read definition of memoization',
          steps: [
            { description: 'Open slide 3', completed: false },
            { description: 'Implement 1D array memoization', completed: false },
          ],
          status: 'pending',
          scheduledAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      isLoading: false,
      pomodoro: {
        isRunning: false,
        timeLeft: 1500,
        totalDuration: 1500,
        mode: 'focus',
        completedSessions: 2,
        activeTaskId: null,
      },
      pet: {
        name: 'Byte',
        level: 3,
        xp: 45,
        nextLevelXp: 150,
        mood: 'focused',
      },
    });
  });

  it('AuthPage renders and toggles between Sign In and Create Account', () => {
    render(
      <BrowserRouter>
        <AuthPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Trajectory')).toBeDefined();
    expect(screen.getByText('Launch Dashboard ➔')).toBeDefined();

    // Toggle to Create Account
    const createBtn = screen.getByText('Create Account');
    fireEvent.click(createBtn);

    expect(screen.getByText('Full Name')).toBeDefined();
    expect(screen.getByText('Begin Flight Plan ➔')).toBeDefined();
  });

  it('Planner renders Daily Flight Plan with 2-Minute Launch step and Pomodoro Timer', () => {
    render(
      <BrowserRouter>
        <Planner />
      </BrowserRouter>
    );

    // Checks task title
    expect(screen.getByText('Algorithms: Dynamic Programming DP-1')).toBeDefined();

    // Checks 2-Minute Launch text
    expect(screen.getByText(/Open slide 3 and read definition of memoization/)).toBeDefined();

    // Checks Pomodoro timer display (25:00)
    expect(screen.getByText('25:00')).toBeDefined();

    // Checks study pet status
    expect(screen.getByText('Byte')).toBeDefined();
    expect(screen.getByText(/Level 3/)).toBeDefined();
  });

  it('Planner Pomodoro controls trigger start and reset', () => {
    render(
      <BrowserRouter>
        <Planner />
      </BrowserRouter>
    );

    const startBtn = screen.getByText('Start');
    fireEvent.click(startBtn);

    expect(usePlannerStore.getState().pomodoro.isRunning).toBe(true);

    const resetBtn = screen.getByText('Reset');
    fireEvent.click(resetBtn);

    expect(usePlannerStore.getState().pomodoro.isRunning).toBe(false);
  });

  it('LearningTools renders tabs and toggles to Feynman Simulator', async () => {
    const { LearningTools } = await import('../src/pages/LearningTools.js');
    render(
      <BrowserRouter>
        <LearningTools />
      </BrowserRouter>
    );

    expect(screen.getByText('Deep Learning Suite')).toBeDefined();

    // Toggle to Feynman tab
    const feynmanTab = screen.getByText(/Feynman Simulator/);
    fireEvent.click(feynmanTab);

    expect(screen.getByText('Explain Concept Simply')).toBeDefined();
    expect(screen.getByText(/Evaluate with Feynman Jargon Diagnostic/)).toBeDefined();
  });

  it('TrajectoryCone renders Monte Carlo fan chart and What-If interventions', async () => {
    const { TrajectoryCone } = await import('../src/pages/TrajectoryCone.js');
    render(
      <BrowserRouter>
        <TrajectoryCone />
      </BrowserRouter>
    );

    expect(screen.getByText(/Trajectory.*Cone/)).toBeDefined();
    expect(screen.getByText(/Interactive What-If Interventions/)).toBeDefined();
    expect(screen.getByText('Clear all pending backlogs on 1st attempt')).toBeDefined();
  });

  it('MentorView renders privacy controls and consented metrics', async () => {
    const { MentorView } = await import('../src/pages/MentorView.js');
    render(
      <BrowserRouter>
        <MentorView />
      </BrowserRouter>
    );

    expect(screen.getByText('Mentor & Parent Privacy Hub')).toBeDefined();
    expect(screen.getByText('Selective Visibility Controls')).toBeDefined();
    expect(screen.getByText(/Live Mentor View Preview/)).toBeDefined();
  });

  it('Dashboard renders real-time physics propulsion telemetry deck and link to report', async () => {
    const { Dashboard } = await import('../src/pages/Dashboard.js');
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    expect(screen.getByText(/Flight Propulsion Telemetry Engine/)).toBeDefined();
    expect(screen.getByText(/Kinetic Energy/)).toBeDefined();
    expect(screen.getByText(/Linear Momentum/)).toBeDefined();
    expect(screen.getByText(/Friction Drag/)).toBeDefined();
    expect(screen.getByText(/Momentum Entropy/)).toBeDefined();
    expect(screen.getByText(/Printable Telemetry Log/)).toBeDefined();
  });

  it('FlightReport renders comprehensive academic audit, physics meters, and sign-off blocks', async () => {
    const { FlightReport } = await import('../src/pages/FlightReport.js');
    render(
      <BrowserRouter>
        <FlightReport />
      </BrowserRouter>
    );

    expect(await screen.findByText('TRAJECTORY FLIGHT TELEMETRY REPORT')).toBeDefined();
    expect(screen.getByText(/Governing University Framework/)).toBeDefined();
    expect(screen.getByText(/Kinetic Energy \(E_k\)/)).toBeDefined();
    expect(screen.getByText(/Course Flight Deck & Attendance Bunk Margins/)).toBeDefined();
    expect(screen.getByText(/Exam Ladder Readiness Verification/)).toBeDefined();
    expect(screen.getByText(/Student Flight Commander Signature/)).toBeDefined();
    expect(screen.getByText(/Faculty Academic Advisor \/ Mentor Endorsement/)).toBeDefined();
    expect(screen.getByText(/Print \/ Save PDF Log/)).toBeDefined();
  });
});

