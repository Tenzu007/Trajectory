/**
 * Seed script: loads 5 role profiles and 1 realistic demo student.
 * Demo student: Priya, 5th semester, 2 backlogs, 5 current subjects, target role = ML Engineer.
 *
 * Run: npm run seed (from /server)
 */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Student } from '../db/models/Student.js';
import { RoleProfile } from '../db/models/RoleProfile.js';
import { Course } from '../db/models/Course.js';
import { Exam } from '../db/models/Exam.js';
import { LadderTest } from '../db/models/LadderTest.js';
import { Task } from '../db/models/Task.js';
import { Backlog } from '../db/models/Backlog.js';
import { Dream } from '../db/models/Dream.js';
import { scheduleLadder } from '@trajectory/shared';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not set in .env');
  process.exit(1);
}

// ─── Role Profiles ────────────────────────────────────────────────────────────

const roleProfiles = [
  {
    name: 'Data Analyst',
    description: 'Extracts insights from data to support business decisions.',
    skillMap: [
      { name: 'Python or R basics', tier: 'foundation', prerequisites: [] },
      { name: 'SQL and databases', tier: 'foundation', prerequisites: [] },
      { name: 'Statistics and probability', tier: 'foundation', prerequisites: [] },
      { name: 'Data wrangling (pandas)', tier: 'core', prerequisites: ['Python or R basics'] },
      { name: 'Data visualisation (Matplotlib, Tableau)', tier: 'core', prerequisites: ['Statistics and probability'] },
      { name: 'A/B testing', tier: 'differentiator', prerequisites: ['Statistics and probability'] },
      { name: 'Dashboard design', tier: 'differentiator', prerequisites: ['Data visualisation (Matplotlib, Tableau)'] },
    ],
  },
  {
    name: 'ML Engineer',
    description: 'Builds, trains, and deploys machine learning models at scale.',
    skillMap: [
      { name: 'Python', tier: 'foundation', prerequisites: [] },
      { name: 'Linear algebra and calculus', tier: 'foundation', prerequisites: [] },
      { name: 'Statistics and probability', tier: 'foundation', prerequisites: [] },
      { name: 'Machine learning fundamentals (sklearn)', tier: 'core', prerequisites: ['Python', 'Statistics and probability'] },
      { name: 'Deep learning (PyTorch/TensorFlow)', tier: 'core', prerequisites: ['Machine learning fundamentals (sklearn)', 'Linear algebra and calculus'] },
      { name: 'MLOps and model serving', tier: 'differentiator', prerequisites: ['Deep learning (PyTorch/TensorFlow)'] },
      { name: 'Distributed training', tier: 'differentiator', prerequisites: ['MLOps and model serving'] },
    ],
  },
  {
    name: 'Web Developer',
    description: 'Designs and builds full-stack web applications.',
    skillMap: [
      { name: 'HTML, CSS, JavaScript', tier: 'foundation', prerequisites: [] },
      { name: 'Version control (Git)', tier: 'foundation', prerequisites: [] },
      { name: 'React or Vue', tier: 'core', prerequisites: ['HTML, CSS, JavaScript'] },
      { name: 'Node.js and REST APIs', tier: 'core', prerequisites: ['HTML, CSS, JavaScript'] },
      { name: 'Databases (SQL + NoSQL)', tier: 'core', prerequisites: [] },
      { name: 'System design basics', tier: 'differentiator', prerequisites: ['Node.js and REST APIs', 'Databases (SQL + NoSQL)'] },
      { name: 'DevOps (Docker, CI/CD)', tier: 'differentiator', prerequisites: ['Version control (Git)'] },
    ],
  },
  {
    name: 'Product Designer',
    description: 'Creates user-centred digital product experiences.',
    skillMap: [
      { name: 'Design principles and theory', tier: 'foundation', prerequisites: [] },
      { name: 'Figma', tier: 'foundation', prerequisites: [] },
      { name: 'User research methods', tier: 'core', prerequisites: ['Design principles and theory'] },
      { name: 'Information architecture', tier: 'core', prerequisites: ['Design principles and theory'] },
      { name: 'Prototyping and usability testing', tier: 'core', prerequisites: ['Figma', 'User research methods'] },
      { name: 'Motion design', tier: 'differentiator', prerequisites: ['Figma'] },
      { name: 'Design systems', tier: 'differentiator', prerequisites: ['Prototyping and usability testing'] },
    ],
  },
  {
    name: 'Core Branch R&D Engineer',
    description: 'Works on research problems in core engineering disciplines (ECE, ME, Civil, Chemical).',
    skillMap: [
      { name: 'Core engineering fundamentals', tier: 'foundation', prerequisites: [] },
      { name: 'Mathematics (ODE, PDE, Linear Algebra)', tier: 'foundation', prerequisites: [] },
      { name: 'Scientific computing (MATLAB or Python)', tier: 'core', prerequisites: ['Core engineering fundamentals', 'Mathematics (ODE, PDE, Linear Algebra)'] },
      { name: 'Literature review and paper writing', tier: 'core', prerequisites: [] },
      { name: 'Simulation tools (ANSYS, COMSOL, or similar)', tier: 'core', prerequisites: ['Core engineering fundamentals'] },
      { name: 'Experimental design and data analysis', tier: 'differentiator', prerequisites: ['Scientific computing (MATLAB or Python)'] },
      { name: 'Patent writing and IP basics', tier: 'differentiator', prerequisites: ['Literature review and paper writing'] },
    ],
  },
];

// ─── Demo student ─────────────────────────────────────────────────────────────

async function seed() {
  await mongoose.connect(MONGODB_URI!);
  console.log('✅ Connected to MongoDB');

  // Upsert role profiles
  for (const rp of roleProfiles) {
    await RoleProfile.findOneAndUpdate({ name: rp.name }, rp, { upsert: true, new: true });
  }
  console.log(`✅ Seeded ${roleProfiles.length} role profiles`);

  // Demo student
  const demoEmail = 'priya@demo.trajectory.app';
  const existing = await Student.findOne({ email: demoEmail });
  if (existing) {
    console.log('ℹ️  Demo student already exists, skipping student seed.');
    await mongoose.disconnect();
    return;
  }

  const passwordHash = await bcrypt.hash('demo1234', 12);
  const student = await Student.create({
    email: demoEmail,
    passwordHash,
    name: 'Priya Sharma',
    onboardingCompleted: true,
    'priors.weeklyFreeHours': 25,
    'priors.preferredFocusLength': 25,
    'priors.peakFocusHours': [9, 10, 15, 16],
  });

  console.log(`✅ Created demo student: ${student.email} (password: demo1234)`);

  // Courses
  const courseData = [
    { name: 'Operating Systems', code: 'CS501', credits: 4, currentMarks: 52, totalMarks: 100, isBacklog: false },
    { name: 'Database Management Systems', code: 'CS502', credits: 3, currentMarks: 61, totalMarks: 100, isBacklog: false },
    { name: 'Machine Learning', code: 'CS503', credits: 4, currentMarks: 45, totalMarks: 100, isBacklog: false },
    { name: 'Engineering Mathematics IV', code: 'MA501', credits: 3, currentMarks: 70, totalMarks: 100, isBacklog: false },
    { name: 'Computer Networks', code: 'CS504', credits: 3, currentMarks: 55, totalMarks: 100, isBacklog: false },
    // Backlogs
    { name: 'Data Structures (Backlog)', code: 'CS301', credits: 4, currentMarks: 38, totalMarks: 100, isBacklog: true },
    { name: 'Theory of Computation (Backlog)', code: 'CS302', credits: 3, currentMarks: 31, totalMarks: 100, isBacklog: true },
  ];

  const courses = await Course.insertMany(
    courseData.map((c) => ({
      ...c,
      studentId: student._id,
      semester: c.isBacklog ? 3 : 5,
      topics: [
        { name: 'Processes & Threads', mastery: 0.5, syllabusCovered: true },
        { name: 'Memory Management', mastery: 0.3, syllabusCovered: false },
        { name: 'File Systems', mastery: 0.2, syllabusCovered: false },
      ],
    }))
  );
  console.log(`✅ Created ${courses.length} courses`);

  // Backlogs
  const backlogs = await Backlog.insertMany([
    {
      studentId: student._id,
      courseId: courses[5]._id,
      suppExamDate: new Date(Date.now() + 45 * 86400000),
      syllabusRemaining: ['Trees', 'Graphs', 'Hashing', 'Sorting'],
      prerequisiteChain: [],
      pastScore: 38,
      credits: 4,
      recoveryValue: 0,
      vectorBMinutes: { default: 90, minimum: 45 },
    },
    {
      studentId: student._id,
      courseId: courses[6]._id,
      suppExamDate: new Date(Date.now() + 60 * 86400000),
      syllabusRemaining: ['Regular Expressions', 'Context-Free Grammars', 'Turing Machines'],
      prerequisiteChain: ['Data Structures'],
      pastScore: 31,
      credits: 3,
      recoveryValue: 0,
      vectorBMinutes: { default: 90, minimum: 45 },
    },
  ]);
  console.log(`✅ Created ${backlogs.length} backlogs`);

  // Dream
  await Dream.create({
    studentId: student._id,
    rawText: 'I want to become an ML engineer at a top AI lab, clear my backlogs this semester, and finish with a CGPA above 8.0.',
    status: 'compiled',
    compiledAt: new Date(),
    realityCheck: {
      feasible: true,
      obstacles: [
        { description: 'Backlog subjects may clash with current course load', ifThenPlan: 'If I feel overloaded, I will reduce elective tasks before core tasks.' },
        { description: 'ML course is tough without strong math base', ifThenPlan: 'If I score below 60% on any ML quiz, I will attend office hours within 48 hours.' },
      ],
      alternativeTargets: [
        { description: 'Target CGPA 7.5 instead of 8.0', cost: 'Lower-tier ML roles initially, but still strong for most companies.' },
      ],
    },
  });

  // Upcoming exams with ladders
  const mlCourse = courses[2];
  const examDate = new Date(Date.now() + 28 * 86400000);
  const ladder = scheduleLadder({ examDate });

  const exam = await Exam.create({
    studentId: student._id,
    courseId: mlCourse._id,
    name: 'ML End Semester Exam',
    date: examDate,
    syllabusTopics: ['Linear Regression', 'Logistic Regression', 'Decision Trees', 'Neural Networks', 'Clustering'],
  });

  const ladderTests = await LadderTest.insertMany([
    { studentId: student._id, examId: exam._id, tier: 1, scheduledDate: ladder.t1, openNotes: true, topicsCovered: ['Linear Regression', 'Logistic Regression'], compressed: ladder.compressed, compressedReason: ladder.compressedReason },
    { studentId: student._id, examId: exam._id, tier: 2, scheduledDate: ladder.t2, openNotes: false, topicsCovered: ['Linear Regression', 'Logistic Regression', 'Decision Trees', 'Neural Networks', 'Clustering'], compressed: ladder.compressed },
    { studentId: student._id, examId: exam._id, tier: 3, scheduledDate: ladder.t3, openNotes: false, topicsCovered: ['Linear Regression', 'Logistic Regression', 'Decision Trees', 'Neural Networks', 'Clustering'], compressed: ladder.compressed },
  ]);

  exam.ladderTests = ladderTests.map((lt) => lt._id);
  await exam.save();
  console.log('✅ Created exam with T1/T2/T3 ladder');

  // Some tasks
  const today = new Date();
  await Task.insertMany([
    {
      studentId: student._id,
      courseId: mlCourse._id,
      title: 'Study Linear Regression derivations',
      type: 'study',
      priorityScore: 75,
      estimatedMinutes: 60,
      scheduledAt: new Date(today.setHours(10, 0, 0, 0)),
      twoMinuteLaunch: 'Open NPTEL slides to page 1 and read the first equation.',
      steps: [
        { description: 'Watch NPTEL video on least squares', completed: false },
        { description: 'Derive the normal equation', completed: false },
        { description: 'Attempt 3 problems from textbook', completed: false },
      ],
    },
    {
      studentId: student._id,
      courseId: courses[5]._id,
      backlogId: backlogs[0]._id,
      title: 'Vector B: Data Structures — Graph traversal',
      type: 'study',
      priorityScore: 82,
      estimatedMinutes: 90,
      scheduledAt: new Date(today.setHours(15, 0, 0, 0)),
      twoMinuteLaunch: 'Draw the sample graph from yesterday on paper.',
      steps: [
        { description: 'Implement BFS from scratch', completed: false },
        { description: 'Implement DFS from scratch', completed: false },
        { description: 'Trace through 2 example graphs', completed: false },
      ],
    },
  ]);
  console.log('✅ Created sample tasks');

  console.log('\n🎉 Seed complete!');
  console.log('   Demo login: priya@demo.trajectory.app / demo1234');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
