import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { Student } from '../../db/models/Student.js';
import { validate } from '../../middleware/validate.js';
import { requireAuth, AuthPayload } from '../../middleware/auth.js';
import { env } from '../../config/env.js';

const router = Router();

const BCRYPT_ROUNDS = 12;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function signAccessToken(payload: AuthPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

function signRefreshToken(payload: AuthPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

function setRefreshCookie(res: Response, token: string): void {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAME_SITE,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/api/v1/auth/refresh',
  });
}

// ─── Register ─────────────────────────────────────────────────────────────────

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1).max(100),
});

router.post('/register', validate(RegisterSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, name } = req.body as z.infer<typeof RegisterSchema>;

    const existing = await Student.findOne({ email });
    if (existing) {
      res.status(409).json({ data: null, error: 'Email already registered.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const student = await Student.create({ email, passwordHash, name });

    const payload: AuthPayload = { studentId: student._id.toString(), email: student.email };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    // Store hashed refresh token
    student.refreshTokenHash = await bcrypt.hash(refreshToken, BCRYPT_ROUNDS);
    await student.save();

    setRefreshCookie(res, refreshToken);

    res.status(201).json({
      data: { accessToken, student },
      error: null,
    });
  } catch (err) {
    next(err);
  }
});

// ─── Login ────────────────────────────────────────────────────────────────────

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post('/login', validate(LoginSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body as z.infer<typeof LoginSchema>;

    const student = await Student.findOne({ email }).select('+passwordHash');
    if (!student) {
      res.status(401).json({ data: null, error: 'Invalid credentials.' });
      return;
    }

    const valid = await bcrypt.compare(password, student.passwordHash);
    if (!valid) {
      res.status(401).json({ data: null, error: 'Invalid credentials.' });
      return;
    }

    const payload: AuthPayload = { studentId: student._id.toString(), email: student.email };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    student.refreshTokenHash = await bcrypt.hash(refreshToken, BCRYPT_ROUNDS);
    await student.save();

    setRefreshCookie(res, refreshToken);

    // Return student without password hash (guaranteed by toJSON transform)
    const studentObj = student.toJSON();

    res.json({ data: { accessToken, student: studentObj }, error: null });
  } catch (err) {
    next(err);
  }
});

// ─── Refresh ──────────────────────────────────────────────────────────────────

router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.refreshToken as string | undefined;
    if (!token) {
      res.status(401).json({ data: null, error: 'No refresh token.' });
      return;
    }

    let payload: AuthPayload;
    try {
      payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as AuthPayload;
    } catch {
      res.status(401).json({ data: null, error: 'Invalid or expired refresh token.' });
      return;
    }

    const student = await Student.findById(payload.studentId).select('+refreshTokenHash');
    if (!student || !student.refreshTokenHash) {
      res.status(401).json({ data: null, error: 'Session invalidated.' });
      return;
    }

    const matches = await bcrypt.compare(token, student.refreshTokenHash);
    if (!matches) {
      // Possible token reuse — invalidate
      student.refreshTokenHash = undefined;
      await student.save();
      res.status(401).json({ data: null, error: 'Refresh token reuse detected. Please log in again.' });
      return;
    }

    // Rotate tokens
    const newPayload: AuthPayload = { studentId: student._id.toString(), email: student.email };
    const newAccessToken = signAccessToken(newPayload);
    const newRefreshToken = signRefreshToken(newPayload);

    student.refreshTokenHash = await bcrypt.hash(newRefreshToken, BCRYPT_ROUNDS);
    await student.save();

    setRefreshCookie(res, newRefreshToken);

    res.json({ data: { accessToken: newAccessToken }, error: null });
  } catch (err) {
    next(err);
  }
});

// ─── Logout ───────────────────────────────────────────────────────────────────

router.post('/logout', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await Student.findByIdAndUpdate(req.user!.studentId, { $unset: { refreshTokenHash: 1 } });
    res.clearCookie('refreshToken', { path: '/api/v1/auth/refresh' });
    res.json({ data: { message: 'Logged out.' }, error: null });
  } catch (err) {
    next(err);
  }
});

// ─── Me ───────────────────────────────────────────────────────────────────────

router.get('/me', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const student = await Student.findById(req.user!.studentId);
    if (!student) {
      res.status(404).json({ data: null, error: 'Student not found.' });
      return;
    }
    res.json({ data: student, error: null });
  } catch (err) {
    next(err);
  }
});

export default router;
