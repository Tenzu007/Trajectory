import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api/v1',
  withCredentials: true,  // send httpOnly cookies
  headers: { 'Content-Type': 'application/json' },
});

// ─── Token management ──────────────────────────────────────────────────────

let accessToken: string | null = null;

export function setAccessToken(token: string) {
  accessToken = token;
}

export function clearAccessToken() {
  accessToken = null;
}

// Attach access token to every request
api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Auto-refresh on 401
let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token!);
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Never attempt to refresh auth routes
    const isAuthEndpoint =
      originalRequest?.url?.includes('/auth/refresh') ||
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/register');

    if (error.response?.status === 401 && !originalRequest?._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await api.post<{ data: { accessToken: string }; error: null }>('/auth/refresh');
        const newToken = res.data.data.accessToken;
        setAccessToken(newToken);
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAccessToken();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// ─── Typed API functions ──────────────────────────────────────────────────

import type {
  StudentBase,
  CourseBase,
  DreamBase,
  TaskBase,
  ApiResponse,
  UniversityPreset,
  FlightReportData,
} from '@trajectory/shared';

export const authApi = {
  register: (data: { email: string; password: string; name: string }) =>
    api.post<ApiResponse<{ accessToken: string; student: StudentBase }>>('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post<ApiResponse<{ accessToken: string; student: StudentBase }>>('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get<ApiResponse<StudentBase>>('/auth/me'),
  refresh: () => api.post<ApiResponse<{ accessToken: string }>>('/auth/refresh'),
};

export const coursesApi = {
  list: () => api.get<ApiResponse<CourseBase[]>>('/courses'),
  create: (data: Partial<CourseBase>) => api.post<ApiResponse<CourseBase>>('/courses', data),
  get: (id: string) => api.get<ApiResponse<CourseBase>>(`/courses/${id}`),
  update: (id: string, data: Partial<CourseBase>) => api.patch<ApiResponse<CourseBase>>(`/courses/${id}`, data),
  delete: (id: string) => api.delete(`/courses/${id}`),
  attendanceSummary: (id: string, remaining?: number) =>
    api.get(`/courses/${id}/attendance-summary${remaining ? `?remaining=${remaining}` : ''}`),
  logAttendance: (id: string, data: { date: string; status: string; classType: string }) =>
    api.post(`/courses/${id}/attendance`, data),
};

export const dreamsApi = {
  list: () => api.get<ApiResponse<DreamBase[]>>('/dreams'),
  create: (rawText: string) => api.post<ApiResponse<DreamBase>>('/dreams', { rawText }),
  compile: (id: string) => api.post(`/dreams/${id}/compile`),
  confirm: (id: string, targets: unknown[]) => api.patch(`/dreams/${id}`, { targets }),
  realityCheck: (id: string) => api.get(`/dreams/${id}/reality-check`),
  premortem: (id: string, data: { scenario: string; obstacles: string[] }) =>
    api.post(`/dreams/${id}/premortem`, data),
};

export const tasksApi = {
  list: (params?: { date?: string; status?: string }) => api.get<ApiResponse<TaskBase[]>>('/tasks', { params }),
  create: (data: Partial<TaskBase> & { marksAtStake?: number; mastery?: number; urgencyDays?: number; effortHours?: number }) =>
    api.post<ApiResponse<TaskBase>>('/tasks', data),
  update: (id: string, data: Partial<TaskBase>) => api.patch<ApiResponse<TaskBase>>(`/tasks/${id}`, data),
  release: (id: string) => api.post(`/tasks/${id}/release`),
  reschedule: (id: string, newScheduledAt: string) => api.post(`/tasks/${id}/reschedule`, { newScheduledAt }),
  dailyPlan: (date?: string) => api.get(`/planner/daily${date ? `?date=${date}` : ''}`),
  heatmap: () => api.get('/planner/heatmap'),
};

export const examsApi = {
  list: () => api.get('/exams'),
  create: (data: { courseId: string; name: string; date: string; syllabusTopics: string[] }) =>
    api.post('/exams', data),
  get: (id: string) => api.get(`/exams/${id}`),
  submitAttempt: (testId: string, data: unknown) => api.post(`/exams/ladder/${testId}/attempt`, data),
  getAutopsy: (testId: string) => api.get(`/exams/ladder/${testId}/autopsy`),
};

export const reflectionsApi = {
  create: (data: unknown) => api.post('/reflections', data),
  list: (week?: string) => api.get(`/reflections${week ? `?week=${week}` : ''}`),
};

export const healthApi = {
  checkin: (data: { date: string; sleepHours: number; exercised: boolean; mood: 1|2|3|4|5 }) =>
    api.post('/health-checkins', data),
  list: () => api.get('/health-checkins'),
};

export const calcApi = {
  bunk: (data: { attended: number; held: number; remaining: number; threshold?: number }) =>
    api.post('/students/calc/bunk', data),
  gapScore: (data: { cgpaGap: number; backlogCount: number; attendanceRisk: number; skillGap: number }) =>
    api.post('/students/calc/gap-score', data),
};

export const backlogsApi = {
  list: () => api.get('/backlogs'),
  create: (data: unknown) => api.post('/backlogs', data),
  get: (id: string) => api.get(`/backlogs/${id}`),
  update: (id: string, data: unknown) => api.patch(`/backlogs/${id}`, data),
  rootCause: (id: string, data: { rootCause: string; notes?: string }) =>
    api.post(`/backlogs/${id}/root-cause`, data),
  supportMap: (id: string) => api.get(`/backlogs/${id}/support-map`),
  addSupport: (id: string, data: unknown) => api.post(`/backlogs/${id}/support-map`, data),
  toggleSupport: (entryId: string, data: { contacted: boolean }) =>
    api.patch(`/backlogs/support-map/${entryId}`, data),
};

export const flashcardsApi = {
  list: (params?: { courseId?: string; skillId?: string }) =>
    api.get('/flashcards', { params }),
  create: (data: { front: string; back: string; courseId?: string; skillId?: string }) =>
    api.post('/flashcards', data),
  delete: (id: string) => api.delete(`/flashcards/${id}`),
  generate: (data: { topic: string; notes?: string; courseId?: string; skillId?: string }) =>
    api.post('/flashcards/generate', data),
  due: () => api.get('/review/due'),
  review: (data: { flashcardId: string; rating: number }) => api.post('/review', data),
  feynman: (data: { concept: string; explanation: string }) =>
    api.post('/feynman/evaluate', data),
  ingestSyllabus: (data: { courseId: string; syllabusText: string }) =>
    api.post('/flashcards/ingest-syllabus', data),
};

export const skillsApi = {
  listRoles: () => api.get('/role-profiles'),
  list: () => api.get('/skills'),
  create: (data: unknown) => api.post('/skills', data),
  update: (id: string, data: unknown) => api.patch(`/skills/${id}`, data),
  delete: (id: string) => api.delete(`/skills/${id}`),
  importRole: (roleProfileId: string) => api.post(`/skills/import-role/${roleProfileId}`),
};

export const forecastsApi = {
  generate: () => api.post('/forecasts/generate'),
  latest: () => api.get('/forecasts/latest'),
};

export const mentorApi = {
  updateSharedFields: (studentId: string, data: { sharedFields: string[]; mentorEmail?: string; parentEmail?: string }) =>
    api.patch(`/students/${studentId}/shared-fields`, data),
  getSharedView: (studentId: string) => api.get(`/students/shared-view/${studentId}`),
  exportData: (studentId: string) => api.get(`/students/${studentId}/export`),
  deleteAccount: (studentId: string) => api.delete(`/students/${studentId}`),
};

export const universityPresetsApi = {
  list: () => api.get<ApiResponse<UniversityPreset[]>>('/students/university-presets'),
  applyPreset: (studentId: string, presetId: string) =>
    api.patch<ApiResponse<StudentBase>>(`/students/${studentId}/university-preset`, { presetId }),
};

export const flightReportApi = {
  getReport: (studentId: string) =>
    api.get<ApiResponse<FlightReportData>>(`/students/${studentId}/flight-report`),
};



