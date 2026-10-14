import { create } from 'zustand';
import type { CourseBase } from '@trajectory/shared';
import { coursesApi } from '../api/index.js';

interface AttendanceSummary {
  attended: number;
  totalHeld: number;
  remainingClasses: number;
  currentPercentage: number;
  threshold: number;
  bunkHeadroom: number;
  status: 'safe' | 'warning' | 'critical';
  projectedAtCurrentRate: number;
}

interface CoursesState {
  courses: CourseBase[];
  summaries: Record<string, AttendanceSummary>;
  isLoading: boolean;
  error: string | null;
  fetchCourses: () => Promise<void>;
  createCourse: (data: Partial<CourseBase>) => Promise<boolean>;
  deleteCourse: (id: string) => Promise<boolean>;
  logAttendance: (courseId: string, status: 'present' | 'absent' | 'cancelled', classType?: string) => Promise<boolean>;
  fetchAttendanceSummary: (courseId: string, remaining?: number) => Promise<void>;
}

export const useCoursesStore = create<CoursesState>((set, get) => ({
  courses: [],
  summaries: {},
  isLoading: false,
  error: null,

  fetchCourses: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await coursesApi.list();
      const courses = res.data.data || [];
      set({ courses, isLoading: false });
      // Fetch summaries for each course
      for (const course of courses) {
        get().fetchAttendanceSummary(course._id);
      }
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Failed to fetch courses', isLoading: false });
    }
  },

  createCourse: async (data) => {
    try {
      const res = await coursesApi.create(data);
      if (res.data.data) {
        set((state) => ({ courses: [...state.courses, res.data.data!] }));
        get().fetchAttendanceSummary(res.data.data._id);
        return true;
      }
      return false;
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Failed to create course' });
      return false;
    }
  },

  deleteCourse: async (id) => {
    try {
      await coursesApi.delete(id);
      set((state) => ({
        courses: state.courses.filter((c) => c._id !== id),
        summaries: Object.fromEntries(Object.entries(state.summaries).filter(([k]) => k !== id)),
      }));
      return true;
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Failed to delete course' });
      return false;
    }
  },

  logAttendance: async (courseId, status, classType = 'lecture') => {
    try {
      await coursesApi.logAttendance(courseId, {
        date: new Date().toISOString(),
        status,
        classType,
      });
      await get().fetchAttendanceSummary(courseId);
      return true;
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Failed to log attendance' });
      return false;
    }
  },

  fetchAttendanceSummary: async (courseId, remaining = 15) => {
    try {
      const res = await coursesApi.attendanceSummary(courseId, remaining);
      if (res.data.data) {
        set((state) => ({
          summaries: { ...state.summaries, [courseId]: res.data.data },
        }));
      }
    } catch {
      // ignore
    }
  },
}));
