import request from 'supertest';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { app } from '../../src/app.js';
import { connectDB, disconnectDB } from '../../src/db/connect.js';
import { Course } from '../../src/db/models/Course.js';
import { Flashcard } from '../../src/db/models/Flashcard.js';
import { llmComplete } from '../../src/adapters/llm.js';

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
  email = 'phase5engineer@example.edu',
  password = 'Password123!',
  name = 'Production Architect Alex'
): Promise<{ accessToken: string; studentId: string }> {
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({ email, password, name });
  return {
    accessToken: res.body.data.accessToken,
    studentId: res.body.data.student._id,
  };
}

describe('Phase 5 Integration: Production Hardening, Docker Configs, & Automated Syllabus Ingestion', () => {
  let student: { accessToken: string; studentId: string };
  let course: any;

  beforeAll(async () => {
    student = await registerStudent();

    course = await Course.create({
      studentId: student.studentId,
      name: 'Distributed Systems & Cloud Architecture',
      code: 'CS450',
      semester: 7,
      credits: 4,
      currentMarks: 75,
      totalMarks: 100,
      topics: [],
    });
  });

  describe('Production Containerization Artifacts', () => {
    it('verifies Dockerfile for server, Dockerfile for client, and docker-compose.yml exist', () => {
      const serverDockerfile = path.resolve(__dirname, '../../../server/Dockerfile');
      const clientDockerfile = path.resolve(__dirname, '../../../client/Dockerfile');
      const dockerCompose = path.resolve(__dirname, '../../../docker-compose.yml');
      const nginxConf = path.resolve(__dirname, '../../../client/nginx.conf');
      const dockerIgnore = path.resolve(__dirname, '../../../.dockerignore');

      expect(fs.existsSync(serverDockerfile)).toBe(true);
      expect(fs.existsSync(clientDockerfile)).toBe(true);
      expect(fs.existsSync(dockerCompose)).toBe(true);
      expect(fs.existsSync(nginxConf)).toBe(true);
      expect(fs.existsSync(dockerIgnore)).toBe(true);

      const composeContent = fs.readFileSync(dockerCompose, 'utf-8');
      expect(composeContent).toContain('trajectory-mongo');
      expect(composeContent).toContain('trajectory-server');
      expect(composeContent).toContain('trajectory-client');
      expect(composeContent).toContain('27017:27017');
    });
  });

  describe('LLM Mock Adapter Fallback', () => {
    it('returns deterministic structured responses under mock provider', async () => {
      const res = await llmComplete('Generate active recall flashcards');
      expect(res.text).toBeDefined();
      const parsed = JSON.parse(res.text);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed[0].front).toBeDefined();
      expect(parsed[0].back).toBeDefined();
    });
  });

  describe('POST /api/v1/flashcards/ingest-syllabus', () => {
    it('extracts course syllabus topics and creates active recall flashcards', async () => {
      const syllabusText = `
        1. Paxos and Raft Consensus Protocols
        2. CAP Theorem and Eventual Consistency
        3. Two-Phase Commit and Distributed Transactions
        4. Vector Clocks and Causal Consistency
      `;

      const res = await request(app)
        .post('/api/v1/flashcards/ingest-syllabus')
        .set('Authorization', `Bearer ${student.accessToken}`)
        .send({
          courseId: course._id.toString(),
          syllabusText,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.extractedTopicsCount).toBeGreaterThanOrEqual(4);
      expect(res.body.data.generatedFlashcardsCount).toBeGreaterThanOrEqual(4);

      // Verify course topics were updated in DB
      const updatedCourse = await Course.findById(course._id);
      expect(updatedCourse?.topics.length).toBeGreaterThanOrEqual(4);
      const names = updatedCourse?.topics.map((t) => t.name) || [];
      expect(names.some((n) => n.includes('Paxos'))).toBe(true);

      // Verify flashcards were created in DB
      const cards = await Flashcard.find({ courseId: course._id, studentId: student.studentId });
      expect(cards.length).toBeGreaterThanOrEqual(4);
      expect(cards[0].source).toBe('llm_generated');
    });
  });
});
