import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { connectDB } from './db/connect.js';
import v1Router from './routes/v1/index.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';

const app = express();

// ─── Security ─────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Parsing ──────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Rate limiting ────────────────────────────────────────────────────────────
app.use('/api', apiLimiter);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── API routes ───────────────────────────────────────────────────────────────
app.use('/api/v1', v1Router);

import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { initStudyRoomSockets } from './sockets/studyRoom.js';

// ─── 404 + Error handler ──────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

const httpServer = http.createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: env.CORS_ORIGIN,
    credentials: true,
  },
});

initStudyRoomSockets(io);

// ─── Start server (when not in test) ─────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  connectDB().then(() => {
    const port = Number(env.PORT);
    httpServer.listen(port, () => {
      console.log(`🚀 Trajectory API & Socket.IO running on http://localhost:${port}`);
    });
  });
}

export { app, httpServer, io };
