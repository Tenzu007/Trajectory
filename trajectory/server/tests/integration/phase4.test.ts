import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { app } from '../../src/app.js';
import { connectDB, disconnectDB } from '../../src/db/connect.js';
import { Course } from '../../src/db/models/Course.js';
import { Task } from '../../src/db/models/Task.js';
import { Backlog } from '../../src/db/models/Backlog.js';

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
  email = 'phase4pilot@example.edu',
  password = 'Password123!',
  name = 'Flight Commander Priya'
): Promise<{ accessToken: string; studentId: string }> {
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({ email, password, name });
  return {
    accessToken: res.body.data.accessToken,
    studentId: res.body.data.student._id,
  };
}

describe('Phase 4 Integration: University Presets, Physics Engine, & Flight Telemetry Report', () => {
  let student: { accessToken: string; studentId: string };

  beforeAll(async () => {
    student = await registerStudent();

    // Create courses
    const c1 = await Course.create({
      studentId: student.studentId,
      name: 'Aerodynamics of Propulsion',
      code: 'AERO401',
      semester: 6,
      credits: 4,
      currentMarks: 78,
      totalMarks: 100,
    });

    const c2 = await Course.create({
      studentId: student.studentId,
      name: 'Digital Signal Processing',
      code: 'ECE302',
      semester: 6,
      credits: 4,
      currentMarks: 85,
      totalMarks: 100,
    });

    // Create a backlog
    await Backlog.create({
      studentId: student.studentId,
      courseId: c1._id,
      suppExamDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      credits: 4,
      pastScore: 32,
      recoveryValue: 8.5,
    });

    // Create tasks (some done, some pending)
    await Task.create({
      studentId: student.studentId,
      courseId: c1._id,
      title: 'Derive Navier-Stokes simplified equation',
      type: 'study',
      priorityScore: 85,
      estimatedMinutes: 60,
      twoMinuteLaunch: 'Write down mass conservation in vector form.',
      status: 'done',
      completedAt: new Date(),
      scheduledAt: new Date(),
    });

    await Task.create({
      studentId: student.studentId,
      courseId: c2._id,
      title: 'Implement FFT in Python NumPy',
      type: 'practice',
      priorityScore: 75,
      estimatedMinutes: 45,
      twoMinuteLaunch: 'Import numpy as np and generate a test sine wave.',
      status: 'pending',
      scheduledAt: new Date(Date.now() + 86400000),
    });
  });

  describe('GET /api/v1/students/university-presets', () => {
    it('returns all preconfigured Indian university presets publicly', async () => {
      const res = await request(app).get('/api/v1/students/university-presets');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(5);

      const ids = res.body.data.map((p: any) => p.id);
      expect(ids).toContain('vtu');
      expect(ids).toContain('anna_univ');
      expect(ids).toContain('iit_nit');
      expect(ids).toContain('mumbai_pune');
      expect(ids).toContain('autonomous_ugc');
    });
  });

  describe('PATCH /api/v1/students/:studentId/university-preset', () => {
    it('updates student attendance threshold and grading schema to match IIT/NIT preset', async () => {
      const res = await request(app)
        .patch(`/api/v1/students/${student.studentId}/university-preset`)
        .set('Authorization', `Bearer ${student.accessToken}`)
        .send({ presetId: 'iit_nit' });

      expect(res.status).toBe(200);
      expect(res.body.data.universityPreset).toBe('iit_nit');
      expect(res.body.data.config.attendanceThreshold).toBe(0.75);
      expect(res.body.data.config.creditRules.passMark).toBe(35);
    });

    it('updates student config to Anna University preset (75% threshold, 50 pass mark)', async () => {
      const res = await request(app)
        .patch(`/api/v1/students/${student.studentId}/university-preset`)
        .set('Authorization', `Bearer ${student.accessToken}`)
        .send({ presetId: 'anna_univ' });

      expect(res.status).toBe(200);
      expect(res.body.data.universityPreset).toBe('anna_univ');
      expect(res.body.data.config.attendanceThreshold).toBe(0.75);
      expect(res.body.data.config.creditRules.passMark).toBe(50);
    });

    it('updates student config to VTU preset (75% threshold, 40 pass mark)', async () => {
      const res = await request(app)
        .patch(`/api/v1/students/${student.studentId}/university-preset`)
        .set('Authorization', `Bearer ${student.accessToken}`)
        .send({ presetId: 'vtu' });

      expect(res.status).toBe(200);
      expect(res.body.data.universityPreset).toBe('vtu');
      expect(res.body.data.config.attendanceThreshold).toBe(0.75);
      expect(res.body.data.config.creditRules.passMark).toBe(40);
    });

    it('rejects unknown university preset with 400', async () => {
      const res = await request(app)
        .patch(`/api/v1/students/${student.studentId}/university-preset`)
        .set('Authorization', `Bearer ${student.accessToken}`)
        .send({ presetId: 'mars_academy_unknown' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('not found');
    });
  });

  describe('GET /api/v1/students/:studentId/flight-report', () => {
    it('compiles comprehensive flight telemetry report with physics metrics', async () => {
      const res = await request(app)
        .get(`/api/v1/students/${student.studentId}/flight-report`)
        .set('Authorization', `Bearer ${student.accessToken}`);

      expect(res.status).toBe(200);
      const data = res.body.data;
      expect(data).toBeDefined();

      // Student info
      expect(data.student.name).toBe('Flight Commander Priya');
      expect(data.student.universityPreset).toBe('vtu');

      // Academic telemetry
      expect(data.academicTelemetry.totalCredits).toBe(8);
      expect(data.academicTelemetry.enrolledCoursesCount).toBe(2);
      expect(data.academicTelemetry.backlogCount).toBe(1);
      expect(data.academicTelemetry.backlogCredits).toBe(4);

      // Physics telemetry
      expect(data.physicsTelemetry.mass).toBe(8);
      expect(data.physicsTelemetry.velocity).toBeGreaterThan(0);
      expect(data.physicsTelemetry.kineticEnergy).toBeGreaterThan(0);
      expect(data.physicsTelemetry.momentum).toBeGreaterThan(0);
      expect(['OPTIMAL_CLIMB', 'STEADY_CRUISE', 'HIGH_DRAG_WARNING', 'STALL_RISK']).toContain(
        data.physicsTelemetry.flightStatus
      );

      // Active courses
      expect(data.activeCourses.length).toBe(2);
      expect(data.activeCourses[0].code).toBe('AERO401');

      // Upcoming flight path
      expect(data.upcomingFlightPath.length).toBeGreaterThan(0);
      expect(data.upcomingFlightPath[0].twoMinuteLaunch).toBeDefined();
    });
  });
});
