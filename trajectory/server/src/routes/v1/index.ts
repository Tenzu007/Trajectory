import { Router } from 'express';
import authRoutes from './auth.js';
import studentRoutes from './students.js';
import courseRoutes from './courses.js';
import examRoutes from './exams.js';
import dreamRoutes from './dreams.js';
import taskRoutes from './tasks.js';
import reflectionRoutes from './reflections.js';
import backlogRoutes from './backlogs.js';
import flashcardRoutes from './flashcards.js';
import skillRoutes from './skills.js';
import forecastRoutes from './forecasts.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/students', studentRoutes);
router.use('/courses', courseRoutes);
router.use('/exams', examRoutes);
router.use('/dreams', dreamRoutes);
router.use('/backlogs', backlogRoutes);
router.use('/forecasts', forecastRoutes);
router.use('/', flashcardRoutes);      // /flashcards, /review, /feynman
router.use('/', skillRoutes);          // /skills, /role-profiles
router.use('/', taskRoutes);           // /tasks, /planner, /focus
router.use('/', reflectionRoutes);     // /reflections, /health-checkins

export default router;
