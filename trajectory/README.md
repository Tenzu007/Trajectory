# Trajectory 🚀

> Turn your academic and career dream into a measurable flight plan, track execution in real time, and calibrate weekly.

Built specifically for college students navigating credit rules, attendance minimums (such as the 75% attendance rule), backlog clearance, and campus placement prep.

---

## ⚡ The Core Loop

$$\text{DREAM} \longrightarrow \text{PLAN} \longrightarrow \text{ACT} \longrightarrow \text{REFLECT}$$

1. **DREAM (Compiler + Reality Check)**: State your ambitious dream in messy natural language. The compiler translates it into measurable flight targets (CGPA target, backlog clear milestones, skill runway) and runs a pre-mortem with If-Then contingency plans.
2. **PLAN (Deterministic Priority Scheduling)**: Pure constraint scheduler prioritizes tasks by urgency, marks-at-stake, and current mastery. Every task has a **2-Minute Launch Action** designed to break initial procrastination inertia.
3. **ACT (Focus Engine + Study Pet)**: Integrated Pomodoro timer (25m Focus / 5m Short Break / 15m Long Break). Tasks and focus intervals award XP to your study pet (`Byte`), tracking consistency.
4. **REFLECT (Weekly Calibration)**: Entropy audit comparing planned vs actual study hours per subject. Flags "Method Problems" when high hours do not generate score gains.

---

## 🛠️ Tech Stack & Architecture

- **Client (`/client`)**: React 18, TypeScript, Vite, Vanilla CSS design system (tokens in `:root`, glassmorphism, responsive navigation), Zustand state management, Axios typed API client.
- **Server (`/server`)**: Node.js, Express, TypeScript, Mongoose ODM, JWT with httpOnly cookie rotation, Zod request validation, Helmet, Rate Limiter.
- **Shared Pure Modules (`/shared`)**: Deterministic, 100% side-effect-free calculation engine (bunk headroom, grade needed, gap score, ladder scheduler, task scheduler, monte carlo simulation).
- **ML Service (`/ml-service`)**: Python FastAPI heuristic engine for duration and risk prediction (isolated internal microservice).

---

## 🚀 Quickstart from Clean Clone

### 1. Prerequisites
- **Node.js** >= 18.x
- **npm** >= 9.x
- **MongoDB** (Local `mongod` or MongoDB Atlas URI)

### 2. Install Dependencies
From the repository root:
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env` in `server/.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/trajectory
JWT_ACCESS_SECRET=your_32_character_long_access_secret_key_here!
JWT_REFRESH_SECRET=your_32_character_long_refresh_secret_key_here!
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
LLM_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_or_placeholder
CORS_ORIGIN=http://localhost:5173
COOKIE_SECURE=false
COOKIE_SAME_SITE=strict
```

### 4. Seed Database (Demo Student + Role Profiles)
Loads 5 industry role profiles and a realistic demo student (`Priya Sharma`, 5th semester, 2 backlogs, 5 current subjects):
```bash
npm run seed --workspace=server
```

Demo Credentials:
- **Email**: `priya.sharma@example.edu`
- **Password**: `Password123!`

### 5. Start Development Servers
Start both backend API (`http://localhost:5000`) and frontend client (`http://localhost:5173`):
```bash
npm run dev
```

---

## 🧪 Test Suite

Every workspace is fully tested:

```bash
# Run all tests across the monorepo (58+ tests)
npm test

# Run shared pure calculation tests (Vitest)
npm run test:shared

# Run server API integration tests with in-memory MongoDB (Jest + Supertest)
npm run test:server

# Run client component tests (Vitest + React Testing Library)
npm run test:client
```

---

## 📦 Phase 1 Deliverables Summary

- [x] Monorepo structure (`/client`, `/server`, `/shared`, `/ml-service`)
- [x] All 22 Mongoose data models defined
- [x] Auth flow with access token & httpOnly refresh cookie rotation + cross-student security guards
- [x] Shared pure calculation suite:
  - Bunk Headroom calculator (75% threshold)
  - Grade Needed calculator
  - Gap Score calculation (0-100)
  - Exam Ladder 3-tier auto-scheduler (T1 Foundation, T2 Speed, T3 Mock)
  - Deterministic priority task scheduler
- [x] API routes (`/api/v1/auth`, `/courses`, `/exams`, `/tasks`, `/dreams`, `/reflections`, `/students`)
- [x] Full React client:
  - Dynamic Dashboard with Gap Score & Physics Metaphors
  - Flight Plan with Pomodoro Timer, 2-Minute Launch step, and Study Pet leveling
  - Courses list with real-time Bunk Headroom alerts & Attendance logging
  - Exam Ladder & Error Autopsy diagnostic (Concept Gaps, Careless Mistakes, Time Pressure)
  - Dream Compiler with Reality Check & Pre-Mortem protocol
  - Weekly Calibration with Entropy Audit & Method Problem diagnosis
  - Onboarding flow with configurable grading scales & attendance rules
- [x] Seed script with 5 industry role profiles + demo student

---

## 🛡️ Phase 2 Deliverables Summary

- [x] **Backlog Recovery Protocol**:
  - Dynamic Recovery Value ranking ($RV = \frac{\text{Credits}}{\text{Effort}} \times \text{Multiplier}$)
  - Dedicated daily **Vector B** protected study time blocks (default 90m, minimum 45m)
  - Root Cause Diagnostic Wizard (*Foundations*, *Technique*, *Attendance*, *Time Clash*) with tailored prescriptions
  - **Support Map**: Contact management and pre-composed culturally respectful message templates for Professors, TAs, and Seniors
- [x] **Deep Learning Suite**:
  - Spaced Repetition Active Recall Deck with 6-grade FSRS scheduling
  - AI Flashcard Generator from syllabus topics and lecture notes
  - **Feynman Technique Simulator**: Automated clarity evaluation, jargon detection, and simplification analogies
- [x] **Skill Runway**:
  - 5 Industry role profiles (ML Engineer, Data Analyst, Web Dev, Systems Engineer, Cloud Architect) with 3-tier visual skill trees (*Foundation* → *Core* → *Differentiator*)
  - Proof-of-Work submission and URL verification
- [x] **Silent Co-Working Study Deck (Socket.IO)**:
  - Ephemeral study rooms with real-time peer presence and synchronized study countdown timers
- [x] **70 Passing Automated Tests** across all workspaces

---

## 📐 Phase 3 Deliverables Summary

- [x] **Trajectory Cone (Monte Carlo CGPA Fan Chart)**:
  - 10,000-run stochastic simulation projecting p10 (pessimistic), p50 (median), and p90 (optimistic) graduation CGPA boundaries.
  - Interactive What-If intervention engine modeling the impact of clearing backlogs, scoring top grades, or attendance recovery.
- [x] **Machine Learning Inference Adapters**:
  - Personalized task duration multipliers based on subject category and historical speed.
  - Procrastination and abandonment risk scoring with actionable nudge selector.
  - Dynamic topic mastery recalibration using exponential decay and spaced review intervals.
- [x] **Mentor & Parent Privacy Hub**:
  - Granular, student-controlled field permissions (`cgpa_target`, `attendance_status`, `flight_plan_progress`).
  - Read-only public preview link (`/shared/:studentId`) accessible to advisors and parents with zero student credentials.
- [x] **GDPR Compliance & Account Lifecycle**:
  - Complete JSON telemetry export (`GET /api/v1/students/:id/export`).
  - Single-action account deletion with full database cascading across all 22 collections.
- [x] **PWA Offline Flight Plan Caching**:
  - Service Worker network-first caching for daily flight plans with offline JSON fallback.

---

## 🏛️ Phase 4 Deliverables Summary

- [x] **Multi-University Framework Presets**:
  - VTU (Visvesvaraya Technological University) — 75% attendance threshold, 40 pass mark, 10% medical condonation, max 4 backlogs for vertical progression.
  - Anna University — 75% attendance threshold, 50 pass mark, Re-Appearance (RA) grade policy.
  - IIT / NIT / BITS — 75% attendance threshold, 35 relative passing mark, automatic Debarred (DX) rule.
  - Mumbai University & SPPU — 75% attendance threshold, 40 pass mark, 10-point CBCS grading.
  - Autonomous UGC — Fully customizable grading scales & fast-track remediation.
- [x] **Interactive Physics Propulsion Dashboard Engine**:
  - Kinetic Energy ($E_k = \frac{1}{2} m v^2$ Joules) circular arc speedometer gauge.
  - Linear Momentum ($p = m \cdot v$) velocity vector meter.
  - Aerodynamic Friction Drag ($\mu$) coefficient gauge factoring backlog mass and attendance deficits.
  - Momentum Entropy ($\Delta S$) balance drift meter with qualitative stability ratings.
  - Flight Status Indicator (`OPTIMAL_CLIMB` 🚀, `STEADY_CRUISE` ✈️, `HIGH_DRAG_WARNING` ⚠️, `STALL_RISK` 🛑).
- [x] **Printable / PDF Flight Telemetry Report (`/report`)**:
  - Official university audit document with verified timestamp and student briefing.
  - Course performance table with real-time Bunk Headroom margins.
  - Tiered Exam Ladder readiness and upcoming 7-day 2-Minute Launches.
  - Formal student and faculty advisor sign-off blocks formatted for clean A4 printing via `@media print`.
- [x] **PWA Web Push Notification Dispatcher**:
  - Push event handling and 2-Minute Launch procrastination nudge scheduler.

---

## 🚢 Phase 5 Deliverables Summary (Production Hardening)

- [x] **Multi-Stage Docker Containerization**:
  - `server/Dockerfile`: Lean Node.js alpine image with production dependencies and `/health` probes.
  - `client/Dockerfile`: Multi-stage build with Nginx Alpine, gzip compression, SPA routing fallback, and reverse proxy for API and WebSockets.
  - `docker-compose.yml`: Single-command deployment orchestrating MongoDB 7.0, Express API, and Nginx client on an internal bridge network.
  - `.dockerignore`: Ensuring minimal image footprints and clean dependency trees.
- [x] **Cloud LLM Ingestion & Graceful Fallback**:
  - Automated Course Syllabus Ingestion (`POST /api/v1/flashcards/ingest-syllabus`) extracting modules and generating active recall retrieval cards.
  - Robust multi-provider LLM adapter supporting Google Gemini 2.0 Flash, OpenAI GPT-4o, Ollama, and zero-key deterministic mock fallback.
- [x] **Full Production Build Validation**:
  - `npm run build` cleanly compiling `@trajectory/shared`, `@trajectory/server`, and `@trajectory/client` with zero TypeScript errors.
- [x] **100 Passing Automated Tests Milestone**:
  - 45 pure calculation tests (`@trajectory/shared`)
  - 47 integration tests (`@trajectory/server`)
  - 8 React component tests (`@trajectory/client`)

---

## 🐳 Running in Production with Docker Compose

To launch the complete production stack (Database, API, and Web App):

```bash
cd trajectory
docker compose up --build -d
```

- **Web Application**: `http://localhost`
- **API Health**: `http://localhost/health`
- **MongoDB**: `localhost:27017`


