import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { app } from '../../src/app.js';
import { connectDB, disconnectDB } from '../../src/db/connect.js';
import { RoleProfile } from '../../src/db/models/RoleProfile.js';

let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const testUri = mongod.getUri();
  await connectDB(testUri);

  // Seed sample role profile for tests
  await RoleProfile.create({
    name: 'Machine Learning Engineer',
    description: 'Trains and deploys ML systems',
    skillMap: [
      { name: 'Python Basics', tier: 'foundation', prerequisites: [] },
      { name: 'Linear Algebra', tier: 'foundation', prerequisites: [] },
      { name: 'PyTorch Model Training', tier: 'core', prerequisites: ['Python Basics'] },
      { name: 'MLOps Pipeline Deployment', tier: 'differentiator', prerequisites: ['PyTorch Model Training'] },
    ],
  });
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
  email = 'student1@example.edu',
  password = 'Password123!',
  name = 'Student One'
): Promise<{ accessToken: string; studentId: string }> {
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({ email, password, name });
  return {
    accessToken: res.body.data.accessToken,
    studentId: res.body.data.student._id,
  };
}

describe('Phase 2 Integration Tests: Backlogs, Spaced Repetition, Skills', () => {
  let studentA: { accessToken: string; studentId: string };
  let studentB: { accessToken: string; studentId: string };
  let courseAId: string;
  let backlogId: string;
  let flashcardId: string;
  let skillId: string;

  beforeAll(async () => {
    studentA = await registerStudent('studentA_p2@test.edu', 'Password123!', 'Student A');
    studentB = await registerStudent('studentB_p2@test.edu', 'Password123!', 'Student B');

    // Create a course for Student A
    const courseRes = await request(app)
      .post('/api/v1/courses')
      .set('Authorization', `Bearer ${studentA.accessToken}`)
      .send({
        name: 'Operating Systems',
        code: 'CS301',
        credits: 4,
        semester: 5,
      });
    courseAId = courseRes.body.data._id;
  });

  // ─── 1. Backlog Recovery Protocol ──────────────────────────────────────────

  describe('Backlog Recovery Protocol', () => {
    it('creates a backlog and auto-generates support map outreach templates', async () => {
      const suppDate = new Date();
      suppDate.setDate(suppDate.getDate() + 30);

      const res = await request(app)
        .post('/api/v1/backlogs')
        .set('Authorization', `Bearer ${studentA.accessToken}`)
        .send({
          courseId: courseAId,
          suppExamDate: suppDate.toISOString(),
          syllabusRemaining: ['Unit 2: Deadlocks', 'Unit 3: Memory Management'],
          prerequisiteChain: ['Advanced Operating Systems CS401'],
          pastScore: 32,
          credits: 4,
        });

      expect(res.status).toBe(201);
      expect(res.body.data._id).toBeDefined();
      backlogId = res.body.data._id;

      // Check auto-generated support map
      const mapRes = await request(app)
        .get(`/api/v1/backlogs/${backlogId}/support-map`)
        .set('Authorization', `Bearer ${studentA.accessToken}`);

      expect(mapRes.status).toBe(200);
      expect(mapRes.body.data.length).toBeGreaterThanOrEqual(2);
      const allTemplates = mapRes.body.data.map((e: any) => e.messageTemplate).join(' ');
      expect(allTemplates).toContain('Respected Professor');
    });

    it('lists backlogs with dynamically computed recovery value', async () => {
      const res = await request(app)
        .get('/api/v1/backlogs')
        .set('Authorization', `Bearer ${studentA.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].recoveryValue).toBeGreaterThan(0);
    });

    it('submits root cause diagnostic and receives tailored prescription', async () => {
      const res = await request(app)
        .post(`/api/v1/backlogs/${backlogId}/root-cause`)
        .set('Authorization', `Bearer ${studentA.accessToken}`)
        .send({
          rootCause: 'foundations',
          notes: 'Struggled with Peterson solution and deadlock detection algorithms',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.backlog.rootCause).toBe('foundations');
      expect(res.body.data.recommendation).toContain('fundamental definitions');
    });

    it('cross-student guard: Student B cannot access Student A backlog', async () => {
      const res = await request(app)
        .get(`/api/v1/backlogs/${backlogId}`)
        .set('Authorization', `Bearer ${studentB.accessToken}`);

      expect(res.status).toBe(404);
    });
  });

  // ─── 2. Spaced Repetition Flashcards & Feynman Mode ─────────────────────────

  describe('Spaced Repetition & Feynman Mode', () => {
    it('creates a manual flashcard and generates cards from topic', async () => {
      const createRes = await request(app)
        .post('/api/v1/flashcards')
        .set('Authorization', `Bearer ${studentA.accessToken}`)
        .send({
          courseId: courseAId,
          front: 'What are the 4 Coffman conditions for deadlock?',
          back: 'Mutual Exclusion, Hold and Wait, No Preemption, Circular Wait.',
        });

      expect(createRes.status).toBe(201);
      expect(createRes.body.data._id).toBeDefined();
      flashcardId = createRes.body.data._id;

      // Test generator
      const genRes = await request(app)
        .post('/api/v1/flashcards/generate')
        .set('Authorization', `Bearer ${studentA.accessToken}`)
        .send({
          topic: 'Virtual Memory Paging',
          courseId: courseAId,
        });

      expect(genRes.status).toBe(201);
      expect(genRes.body.data.length).toBeGreaterThan(0);
    });

    it('retrieves cards due today and processes review with FSRS interval scheduling', async () => {
      const dueRes = await request(app)
        .get('/api/v1/review/due')
        .set('Authorization', `Bearer ${studentA.accessToken}`);

      expect(dueRes.status).toBe(200);
      expect(dueRes.body.data.length).toBeGreaterThan(0);

      // Submit review with rating 4 (good recall)
      const reviewRes = await request(app)
        .post('/api/v1/review')
        .set('Authorization', `Bearer ${studentA.accessToken}`)
        .send({
          flashcardId,
          rating: 4,
        });

      expect(reviewRes.status).toBe(200);
      expect(reviewRes.body.data.nextIntervalDays).toBeGreaterThanOrEqual(1);
      expect(reviewRes.body.data.nextDueAt).toBeDefined();
    });

    it('evaluates Feynman explanation for jargon and clarity', async () => {
      const feynmanRes = await request(app)
        .post('/api/v1/feynman/evaluate')
        .set('Authorization', `Bearer ${studentA.accessToken}`)
        .send({
          concept: 'Deadlock',
          explanation: 'A deadlock is like a narrow bridge where two cars meet head to head. Neither can back up and neither can move forward, so both are stuck waiting forever until someone breaks the rule.',
        });

      expect(feynmanRes.status).toBe(200);
      expect(feynmanRes.body.data.clarityScore).toBeGreaterThanOrEqual(60);
      expect(feynmanRes.body.data.advice).toBeDefined();
    });

    it('cross-student guard: Student B cannot review Student A flashcard', async () => {
      const res = await request(app)
        .post('/api/v1/review')
        .set('Authorization', `Bearer ${studentB.accessToken}`)
        .send({
          flashcardId,
          rating: 5,
        });

      expect(res.status).toBe(404);
    });
  });

  // ─── 3. Skill Runway & Role Profiles ───────────────────────────────────────

  describe('Skill Runway & Role Profiles', () => {
    it('lists seed role profiles and imports skills into student runway', async () => {
      const rolesRes = await request(app)
        .get('/api/v1/role-profiles')
        .set('Authorization', `Bearer ${studentA.accessToken}`);

      expect(rolesRes.status).toBe(200);
      expect(rolesRes.body.data.length).toBeGreaterThan(0);
      const roleId = rolesRes.body.data[0]._id;

      // Import skills from role profile
      const importRes = await request(app)
        .post(`/api/v1/skills/import-role/${roleId}`)
        .set('Authorization', `Bearer ${studentA.accessToken}`);

      expect(importRes.status).toBe(201);
      expect(importRes.body.data.length).toBeGreaterThan(0);
      skillId = importRes.body.data[0]._id;
    });

    it('updates mastery level and submits proof-of-work artifact', async () => {
      const updateRes = await request(app)
        .patch(`/api/v1/skills/${skillId}`)
        .set('Authorization', `Bearer ${studentA.accessToken}`)
        .send({
          masteryLevel: 0.85,
          proofOfWork: {
            type: 'project',
            url: 'https://github.com/priya/os-scheduler-sim',
            description: 'Implemented round-robin and multilevel priority scheduling simulation with visualizer.',
          },
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.masteryLevel).toBe(0.85);
      expect(updateRes.body.data.proofOfWork.url).toContain('github.com');
    });

    it('cross-student guard: Student B cannot mutate Student A skill', async () => {
      const res = await request(app)
        .patch(`/api/v1/skills/${skillId}`)
        .set('Authorization', `Bearer ${studentB.accessToken}`)
        .send({ masteryLevel: 1.0 });

      expect(res.status).toBe(404);
    });
  });
});
