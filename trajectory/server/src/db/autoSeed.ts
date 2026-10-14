import bcrypt from 'bcryptjs';
import { Student } from './models/Student.js';
import { RoleProfile } from './models/RoleProfile.js';
import { Course } from './models/Course.js';
import { Exam } from './models/Exam.js';
import { LadderTest } from './models/LadderTest.js';
import { Task } from './models/Task.js';
import { Backlog } from './models/Backlog.js';
import { Dream } from './models/Dream.js';
import { scheduleLadder } from '@trajectory/shared';

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
];

export async function autoSeedIfEmpty(): Promise<void> {
  const studentCount = await Student.countDocuments();
  if (studentCount > 0) return;

  console.log('🌱 Seeding initial demo student and role profiles...');

  for (const rp of roleProfiles) {
    await RoleProfile.findOneAndUpdate({ name: rp.name }, rp, { upsert: true, new: true });
  }

  const demoEmail = 'priya@demo.trajectory.app';
  const passwordHash = await bcrypt.hash('demo1234', 10);
  const student = await Student.create({
    email: demoEmail,
    passwordHash,
    name: 'Priya Sharma',
    onboardingCompleted: true,
    'priors.weeklyFreeHours': 25,
    'priors.preferredFocusLength': 25,
    'priors.peakFocusHours': [9, 10, 15, 16],
    sharedFields: ['cgpa_target', 'flight_plan_progress', 'attendance_status'],
  });

  const courses = await Course.insertMany([
    { studentId: student._id, name: 'Operating Systems', code: 'CS501', semester: 5, credits: 4, currentMarks: 52, totalMarks: 100, isBacklog: false },
    { studentId: student._id, name: 'Database Management Systems', code: 'CS502', semester: 5, credits: 3, currentMarks: 61, totalMarks: 100, isBacklog: false },
    { studentId: student._id, name: 'Machine Learning', code: 'CS503', semester: 5, credits: 4, currentMarks: 45, totalMarks: 100, isBacklog: false },
    { studentId: student._id, name: 'Engineering Mathematics IV', code: 'MA501', semester: 5, credits: 3, currentMarks: 70, totalMarks: 100, isBacklog: false },
    { studentId: student._id, name: 'Computer Networks', code: 'CS504', semester: 5, credits: 3, currentMarks: 55, totalMarks: 100, isBacklog: false },
    { studentId: student._id, name: 'Data Structures & Algorithms', code: 'CS301', semester: 3, credits: 4, currentMarks: 32, totalMarks: 100, isBacklog: true },
  ]);

  const examDate = new Date();
  examDate.setDate(examDate.getDate() + 35);
  const exam = await Exam.create({
    studentId: student._id,
    courseId: courses[2]._id,
    name: 'ML Midterm Exam',
    date: examDate,
    syllabusTopics: ['Linear Regression', 'Logistic Regression', 'Decision Trees', 'SVM', 'Ensembles'],
    confidenceLevel: 'medium',
  });

  const ladderDates = scheduleLadder({ examDate });
  await LadderTest.insertMany([
    {
      studentId: student._id,
      examId: exam._id,
      tier: 1,
      scheduledDate: ladderDates.t1,
      openNotes: true,
      topicsCovered: ['Linear Regression', 'Logistic Regression'],
    },
    {
      studentId: student._id,
      examId: exam._id,
      tier: 2,
      scheduledDate: ladderDates.t2,
      openNotes: false,
      topicsCovered: ['Decision Trees', 'SVM'],
    },
    {
      studentId: student._id,
      examId: exam._id,
      tier: 3,
      scheduledDate: ladderDates.t3,
      openNotes: false,
      topicsCovered: ['Linear Regression', 'Logistic Regression', 'Decision Trees', 'SVM', 'Ensembles'],
    },
  ]);

  const suppDate = new Date();
  suppDate.setDate(suppDate.getDate() + 45);
  const backlog = await Backlog.create({
    studentId: student._id,
    courseId: courses[5]._id,
    suppExamDate: suppDate,
    credits: 4,
    pastScore: 32,
    rootCause: 'technique',
    recoveryValue: 0.82,
    syllabusRemaining: ['Trees and BSTs', 'Graphs — BFS/DFS', 'Dynamic Programming Basics'],
    prerequisiteChain: ['Arrays and Pointers (CS201)'],
  });

  const today = new Date();
  await Task.insertMany([
    {
      studentId: student._id,
      courseId: courses[2]._id,
      title: 'Review Logistic Regression Cost Function',
      type: 'study',
      priorityScore: 78,
      estimatedMinutes: 45,
      scheduledAt: new Date(today.setHours(9, 30, 0, 0)),
      twoMinuteLaunch: 'Open textbook chapter 4 and re-read the log loss formula.',
      status: 'pending',
    },
    {
      studentId: student._id,
      courseId: courses[5]._id,
      backlogId: backlog._id,
      title: 'Vector B: Practice Graph Traversals (BFS & DFS)',
      type: 'practice',
      priorityScore: 84,
      estimatedMinutes: 60,
      scheduledAt: new Date(today.setHours(14, 0, 0, 0)),
      twoMinuteLaunch: 'Open IDE and create GraphNode class definition.',
      status: 'pending',
    },
  ]);

  await Dream.create({
    studentId: student._id,
    rawText: 'I want to crack a top ML Engineer role at Google or Microsoft with an 8.5+ CGPA and clear all my backlogs.',
    compiledRole: 'ML Engineer',
    targetCompanyType: 'Top Tech Product (FAANG/Tier 1)',
    requiredSkills: ['Python', 'Deep learning', 'Distributed training', 'Algorithms'],
    cgpaExpectation: 8.5,
    backlogsAllowed: 0,
    readinessScore: 58,
  });

  console.log('✅ Demo data auto-seeded: login with priya@demo.trajectory.app / demo1234');
}
