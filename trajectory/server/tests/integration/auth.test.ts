import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { app } from '../../src/app.js';
import { connectDB, disconnectDB } from '../../src/db/connect.js';

// ─── Test setup ───────────────────────────────────────────────────────────────

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

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function registerAndLogin(
  email = 'test@example.com',
  password = 'password123',
  name = 'Test Student'
): Promise<{ accessToken: string; studentId: string }> {
  const res = await request(app).post('/api/v1/auth/register').send({ email, password, name });
  return {
    accessToken: res.body.data.accessToken,
    studentId: res.body.data.student._id,
  };
}

// ─── Auth tests ───────────────────────────────────────────────────────────────

describe('POST /api/v1/auth/register', () => {
  it('registers a new student and returns access token', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'new@example.com',
      password: 'password123',
      name: 'New Student',
    });
    expect(res.status).toBe(201);
    expect(res.body.data.accessToken).toBeTruthy();
    expect(res.body.data.student.email).toBe('new@example.com');
    // CRITICAL: password must never appear in response
    expect(JSON.stringify(res.body)).not.toContain('passwordHash');
    expect(JSON.stringify(res.body)).not.toContain('refreshTokenHash');
  });

  it('returns 409 on duplicate email', async () => {
    await request(app).post('/api/v1/auth/register').send({ email: 'dup@example.com', password: 'password123', name: 'A' });
    const res = await request(app).post('/api/v1/auth/register').send({ email: 'dup@example.com', password: 'password123', name: 'B' });
    expect(res.status).toBe(409);
  });

  it('returns 400 on invalid email', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({ email: 'not-an-email', password: 'password123', name: 'Test' });
    expect(res.status).toBe(400);
  });

  it('returns 400 on weak password (< 8 chars)', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({ email: 'test2@test.com', password: 'short', name: 'Test' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/auth/login', () => {
  it('logs in and returns access token', async () => {
    await request(app).post('/api/v1/auth/register').send({ email: 'login@test.com', password: 'password123', name: 'Login Test' });
    const res = await request(app).post('/api/v1/auth/login').send({ email: 'login@test.com', password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTruthy();
  });

  it('returns 401 on wrong password', async () => {
    await request(app).post('/api/v1/auth/register').send({ email: 'wrong@test.com', password: 'correctPass', name: 'Test' });
    const res = await request(app).post('/api/v1/auth/login').send({ email: 'wrong@test.com', password: 'wrongPass' });
    expect(res.status).toBe(401);
  });

  it('returns 401 on non-existent email', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email: 'nobody@test.com', password: 'anything' });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/v1/auth/me', () => {
  it('returns current student for valid token', async () => {
    const { accessToken } = await registerAndLogin('me@test.com');
    const res = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('me@test.com');
  });

  it('returns 401 with no token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns 401 with malformed token', async () => {
    const res = await request(app).get('/api/v1/auth/me').set('Authorization', 'Bearer not.a.token');
    expect(res.status).toBe(401);
  });
});

// ─── Cross-student access tests ───────────────────────────────────────────────

describe('Cross-student access guard', () => {
  it('student A cannot access student B\'s courses', async () => {
    const a = await registerAndLogin('a@test.com', 'passwordA123', 'Student A');
    const b = await registerAndLogin('b@test.com', 'passwordB123', 'Student B');

    // Student B creates a course
    const courseRes = await request(app)
      .post('/api/v1/courses')
      .set('Authorization', `Bearer ${b.accessToken}`)
      .send({ name: 'Maths', code: 'MA101', semester: 1, credits: 3 });
    const courseId = courseRes.body.data._id;

    // Student A tries to get student B's course
    const res = await request(app)
      .get(`/api/v1/courses/${courseId}`)
      .set('Authorization', `Bearer ${a.accessToken}`);

    expect(res.status).toBe(404); // Scoped query returns nothing for wrong studentId
  });

  it('student A cannot delete student B\'s course', async () => {
    const a = await registerAndLogin('adel@test.com', 'passwordA123', 'Student A');
    const b = await registerAndLogin('bdel@test.com', 'passwordB123', 'Student B');

    const courseRes = await request(app)
      .post('/api/v1/courses')
      .set('Authorization', `Bearer ${b.accessToken}`)
      .send({ name: 'Physics', code: 'PH101', semester: 1, credits: 3 });
    const courseId = courseRes.body.data._id;

    const res = await request(app)
      .delete(`/api/v1/courses/${courseId}`)
      .set('Authorization', `Bearer ${a.accessToken}`);

    expect(res.status).toBe(404);
  });
});

// ─── Courses tests ────────────────────────────────────────────────────────────

describe('Courses API', () => {
  let accessToken: string;

  beforeEach(async () => {
    const result = await registerAndLogin('courses@test.com');
    accessToken = result.accessToken;
  });

  it('creates a course', async () => {
    const res = await request(app)
      .post('/api/v1/courses')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Data Structures', code: 'CS201', semester: 3, credits: 4 });
    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Data Structures');
  });

  it('lists only own courses', async () => {
    await request(app).post('/api/v1/courses').set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'C1', code: 'X1', semester: 1, credits: 3 });
    const res = await request(app).get('/api/v1/courses').set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
  });

  it('returns attendance summary with bunk headroom', async () => {
    const courseRes = await request(app).post('/api/v1/courses')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Maths', code: 'MA101', semester: 1, credits: 3 });
    const courseId = courseRes.body.data._id;

    const res = await request(app)
      .get(`/api/v1/courses/${courseId}/attendance-summary?remaining=20`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('canMiss');
    expect(res.body.data).toHaveProperty('alreadyBelow');
  });
});

// ─── Exam ladder tests ────────────────────────────────────────────────────────

describe('Exam Ladder API', () => {
  let accessToken: string;
  let courseId: string;

  beforeEach(async () => {
    const result = await registerAndLogin('exam@test.com');
    accessToken = result.accessToken;
    const courseRes = await request(app).post('/api/v1/courses')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'OS', code: 'CS301', semester: 5, credits: 4 });
    courseId = courseRes.body.data._id;
  });

  it('creates an exam and auto-schedules T1/T2/T3', async () => {
    const examDate = new Date(Date.now() + 30 * 86400000).toISOString();
    const res = await request(app).post('/api/v1/exams')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ courseId, name: 'End Sem', date: examDate, syllabusTopics: ['Processes', 'Memory', 'Deadlock'] });

    expect(res.status).toBe(201);
    expect(res.body.data.ladderTests).toHaveLength(3);
    expect(res.body.data.ladderCompressed).toBe(false);
  });

  it('compresses ladder when exam < 21 days away', async () => {
    const examDate = new Date(Date.now() + 10 * 86400000).toISOString();
    const res = await request(app).post('/api/v1/exams')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ courseId, name: 'Mid Sem', date: examDate, syllabusTopics: ['Topic A'] });

    expect(res.status).toBe(201);
    expect(res.body.data.ladderCompressed).toBe(true);
    expect(res.body.data.compressedReason).toBeTruthy();
  });
});
