import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { app } from '../../src/app.js';
import { connectDB, disconnectDB } from '../../src/db/connect.js';
import { Course } from '../../src/db/models/Course.js';
import { Backlog } from '../../src/db/models/Backlog.js';
import { Task } from '../../src/db/models/Task.js';
import { Forecast } from '../../src/db/models/Forecast.js';
import { Student } from '../../src/db/models/Student.js';
import {
  predictTaskDuration,
  assessProcrastinationRisk,
  selectContextualNudge,
  updateTopicMastery,
} from '../../src/adapters/ml.js';

let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const testUri = mongod.getUri();
  await connectDB(testUri);
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await disconnectDB();
  }
  if (mongod) {
    await mongod.stop();
  }
});

async function registerStudent(
  email = 'phase3student@example.edu',
  password = 'Password123!',
  name = 'Phase3 Scholar'
): Promise<{ accessToken: string; studentId: string }> {
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({ email, password, name });
  return {
    accessToken: res.body.data.accessToken,
    studentId: res.body.data.student._id,
  };
}

describe('Phase 3 Integration: Monte Carlo Forecasts, ML Adapters, Mentor Privacy, & GDPR', () => {
  let student: { accessToken: string; studentId: string };

  beforeAll(async () => {
    student = await registerStudent();

    // Create a course and a task for the student
    await Course.create({
      studentId: student.studentId,
      name: 'Advanced Data Structures',
      code: 'CS301',
      semester: 5,
      credits: 4,
      currentMarks: 82,
      totalMarks: 100,
    });

    await Task.create({
      studentId: student.studentId,
      title: 'Graph Algorithms Problem Set',
      type: 'assignment',
      status: 'done',
      estimatedMinutes: 45,
      scheduledAt: new Date(),
    });
  });

  describe('1. Monte Carlo Trajectory Forecasts (/api/v1/forecasts)', () => {
    it('generates a 1,000-run Monte Carlo forecast and stores it', async () => {
      const res = await request(app)
        .post('/api/v1/forecasts/generate')
        .set('Authorization', `Bearer ${student.accessToken}`);

      expect(res.status).toBe(201);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.studentId).toBe(student.studentId);
      expect(res.body.data.cgpaRange).toBeDefined();
      expect(res.body.data.cgpaRange.p10).toBeGreaterThanOrEqual(0);
      expect(res.body.data.cgpaRange.p50).toBeGreaterThanOrEqual(res.body.data.cgpaRange.p10);
      expect(res.body.data.cgpaRange.p90).toBeGreaterThanOrEqual(res.body.data.cgpaRange.p50);
      expect(res.body.data.scenarios.length).toBeGreaterThan(0);
    });

    it('retrieves the latest forecast for the authenticated student', async () => {
      const res = await request(app)
        .get('/api/v1/forecasts/latest')
        .set('Authorization', `Bearer ${student.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.cgpaRange.p50).toBeGreaterThan(0);
    });
  });

  describe('2. Python ML Microservice Adapter Fallbacks', () => {
    it('falls back gracefully to heuristics for task duration prediction when ML service is offline', async () => {
      const result = await predictTaskDuration({
        taskType: 'assignment',
        title: 'Fourier Analysis Practice',
        historicalMultiplier: 1.2,
      });

      expect(result).toBeDefined();
      expect(result.isFallback).toBe(true);
      expect(result.predictedMinutes).toBeGreaterThan(0);
    });

    it('falls back gracefully for procrastination risk assessment', async () => {
      const result = await assessProcrastinationRisk({
        studentId: student.studentId,
        taskId: 'some-task-id',
        daysUntilDeadline: 2,
        priorityScore: 85,
        hasTwoMinuteTrigger: true,
      });

      expect(result.isFallback).toBe(true);
      expect(result.riskScore).toBeGreaterThanOrEqual(0);
      expect(['low', 'medium', 'high']).toContain(result.riskLevel);
      expect(result.antiProcrastinationTrigger).toBeDefined();
    });

    it('falls back gracefully for smart nudge generation', async () => {
      const result = await selectContextualNudge({
        studentId: student.studentId,
        currentHour: 10,
        pendingTasksCount: 3,
        streakDays: 5,
        peakFocusHour: true,
      });

      expect(result.isFallback).toBe(true);
      expect(result.message).toBeDefined();
      expect(result.suggestedAction).toBeDefined();
    });

    it('computes Bayesian Knowledge Tracing locally when ML service is offline', async () => {
      const result = await updateTopicMastery({
        studentId: student.studentId,
        topic: 'Graph Theory',
        outcome: true,
        priorMastery: 0.5,
      });

      expect(result.isFallback).toBe(true);
      expect(result.updatedMastery).toBeGreaterThan(0.5);
      expect(result.delta).toBeGreaterThan(0);
    });
  });

  describe('3. Mentor & Parent Strict Consent Privacy Protocol', () => {
    it('allows a student to configure sharedFields', async () => {
      const res = await request(app)
        .patch(`/api/v1/students/${student.studentId}/shared-fields`)
        .set('Authorization', `Bearer ${student.accessToken}`)
        .send({
          sharedFields: ['cgpa_target', 'flight_plan_progress'],
          mentorEmail: 'faculty.advisor@iit.ac.in',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.sharedFields).toEqual(['cgpa_target', 'flight_plan_progress']);
      expect(res.body.data.mentorEmail).toBe('faculty.advisor@iit.ac.in');
    });

    it('serves public shared-view without student login, strictly filtering unconsented fields', async () => {
      const testCourse = await Course.create({
        studentId: student.studentId,
        name: 'Electronic Circuits',
        code: 'EC201',
        semester: 3,
        credits: 4,
        isBacklog: true,
      });

      // Create a backlog to ensure it remains confidential
      await Backlog.create({
        studentId: student.studentId,
        courseId: testCourse._id,
        suppExamDate: new Date(Date.now() + 86400000 * 30),
        credits: 4,
        pastScore: 32,
      });

      const res = await request(app).get(`/api/v1/students/shared-view/${student.studentId}`);

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Phase3 Scholar');
      // Consented fields
      expect(res.body.data.cgpaForecast).toBeDefined();
      expect(res.body.data.flightPlanSummary).toBeDefined();
      // Non-consented fields
      expect(res.body.data.enrolledCourses).toBeUndefined();
      // Confidential fields: backlogs and reflections must NEVER be present
      expect(res.body.data.backlogs).toBeUndefined();
      expect(res.body.data.reflections).toBeUndefined();
    });
  });

  describe('4. GDPR Export & Cascade Account Deletion', () => {
    it('exports all student data as JSON', async () => {
      const res = await request(app)
        .get(`/api/v1/students/${student.studentId}/export`)
        .set('Authorization', `Bearer ${student.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.header['content-disposition']).toContain('trajectory-export.json');
      expect(res.body.data).toBeDefined();
      expect(res.body.data.student).toBeDefined();
      expect(res.body.data.courses).toBeDefined();
    });

    it('cascade-deletes the student and all linked records', async () => {
      const res = await request(app)
        .delete(`/api/v1/students/${student.studentId}`)
        .set('Authorization', `Bearer ${student.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.deleted).toBe(true);

      // Verify student and dependent collections are deleted
      const foundStudent = await Student.findById(student.studentId);
      const foundCourses = await Course.find({ studentId: student.studentId });
      const foundTasks = await Task.find({ studentId: student.studentId });
      const foundForecasts = await Forecast.find({ studentId: student.studentId });
      const foundBacklogs = await Backlog.find({ studentId: student.studentId });

      expect(foundStudent).toBeNull();
      expect(foundCourses.length).toBe(0);
      expect(foundTasks.length).toBe(0);
      expect(foundForecasts.length).toBe(0);
      expect(foundBacklogs.length).toBe(0);
    });
  });
});
