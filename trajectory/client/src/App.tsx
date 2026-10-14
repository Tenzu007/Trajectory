import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/useAuthStore.js';
import { AppLayout } from './components/layout/AppLayout.js';
import { AuthPage } from './pages/AuthPage.js';
import { Onboarding } from './pages/Onboarding.js';
import { Dashboard } from './pages/Dashboard.js';
import { Planner } from './pages/Planner.js';
import { Courses } from './pages/Courses.js';
import { ExamLadder } from './pages/ExamLadder.js';
import { DreamCompiler } from './pages/DreamCompiler.js';
import { WeeklyCalibration } from './pages/WeeklyCalibration.js';
import { BacklogRecovery } from './pages/BacklogRecovery.js';
import { LearningTools } from './pages/LearningTools.js';
import { SkillRunway } from './pages/SkillRunway.js';
import { StudyRoom } from './pages/StudyRoom.js';
import { TrajectoryCone } from './pages/TrajectoryCone.js';
import { MentorView } from './pages/MentorView.js';
import { FlightReport } from './pages/FlightReport.js';

interface ProtectedProps {
  children: React.ReactElement;
}

const ProtectedRoute: React.FC<ProtectedProps> = ({ children }) => {
  const { student, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--color-bg-base)',
          color: 'var(--color-text-secondary)',
          gap: '16px',
        }}
      >
        <div style={{ fontSize: '2.5rem', animation: 'pulse 1.5s infinite' }}>◈</div>
        <div style={{ fontSize: '0.875rem' }}>Aligning Trajectory Flight Plan...</div>
      </div>
    );
  }

  if (!student) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export const App: React.FC = () => {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        
        {/* Public Share Link for Mentors and Parents */}
        <Route
          path="/shared/:studentId"
          element={
            <div style={{ minHeight: '100vh', background: 'var(--color-bg-base)', padding: '32px' }}>
              <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <MentorView />
              </div>
            </div>
          }
        />

        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="planner" element={<Planner />} />
          <Route path="courses" element={<Courses />} />
          <Route path="exams" element={<ExamLadder />} />
          <Route path="backlogs" element={<BacklogRecovery />} />
          <Route path="learning" element={<LearningTools />} />
          <Route path="skills" element={<SkillRunway />} />
          <Route path="study-room" element={<StudyRoom />} />
          <Route path="cone" element={<TrajectoryCone />} />
          <Route path="mentor" element={<MentorView />} />
          <Route path="dream" element={<DreamCompiler />} />
          <Route path="calibration" element={<WeeklyCalibration />} />
          <Route path="report" element={<FlightReport />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
