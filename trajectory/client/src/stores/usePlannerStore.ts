import { create } from 'zustand';
import type { TaskBase } from '@trajectory/shared';
import { tasksApi } from '../api/index.js';

interface PetState {
  name: string;
  level: number;
  xp: number;
  nextLevelXp: number;
  mood: 'energetic' | 'focused' | 'sleepy' | 'ecstatic';
}

interface PomodoroState {
  isRunning: boolean;
  timeLeft: number;        // seconds
  totalDuration: number;   // seconds
  mode: 'focus' | 'short_break' | 'long_break';
  completedSessions: number;
  activeTaskId: string | null;
}

interface PlannerState {
  tasks: TaskBase[];
  isLoading: boolean;
  error: string | null;
  pomodoro: PomodoroState;
  pet: PetState;

  fetchTasks: (date?: string) => Promise<void>;
  createTask: (task: Partial<TaskBase> & { marksAtStake?: number; mastery?: number; urgencyDays?: number; effortHours?: number }) => Promise<boolean>;
  completeTask: (taskId: string, actualMinutes?: number) => Promise<void>;
  releaseTask: (taskId: string) => Promise<{ gapScoreDelta?: number; gradeForecastDelta?: number } | null>;
  rescheduleTask: (taskId: string, newDate: string) => Promise<void>;
  toggleStep: (taskId: string, stepIndex: number) => Promise<void>;

  // Pomodoro actions
  startPomodoro: (taskId?: string, minutes?: number) => void;
  pausePomodoro: () => void;
  resumePomodoro: () => void;
  resetPomodoro: (minutes?: number) => void;
  tickPomodoro: () => void;
  addPetXp: (amount: number) => void;
}

export const usePlannerStore = create<PlannerState>((set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,

  pomodoro: {
    isRunning: false,
    timeLeft: 25 * 60,
    totalDuration: 25 * 60,
    mode: 'focus',
    completedSessions: 0,
    activeTaskId: null,
  },

  pet: {
    name: 'Byte',
    level: 1,
    xp: 45,
    nextLevelXp: 100,
    mood: 'focused',
  },

  fetchTasks: async (date) => {
    set({ isLoading: true, error: null });
    try {
      const res = await tasksApi.list({ date });
      set({ tasks: res.data.data || [], isLoading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Failed to load flight plan', isLoading: false });
    }
  },

  createTask: async (taskData) => {
    try {
      const res = await tasksApi.create(taskData);
      if (res.data.data) {
        set((state) => ({ tasks: [res.data.data!, ...state.tasks] }));
        return true;
      }
      return false;
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Failed to create task' });
      return false;
    }
  },

  completeTask: async (taskId, actualMinutes) => {
    try {
      const target = get().tasks.find((t) => t._id === taskId);
      const minutes = actualMinutes ?? target?.estimatedMinutes ?? 30;
      await tasksApi.update(taskId, {
        status: 'done',
        actualMinutes: minutes,
        completedAt: new Date().toISOString(),
      });
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t._id === taskId
            ? { ...t, status: 'done', actualMinutes: minutes, completedAt: new Date().toISOString() }
            : t
        ),
      }));
      get().addPetXp(25);
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Failed to complete task' });
    }
  },

  releaseTask: async (taskId) => {
    try {
      const res = await tasksApi.release(taskId);
      const releaseEffect = res.data.data?.releaseEffect;
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t._id === taskId ? { ...t, status: 'released', releaseEffect } : t
        ),
      }));
      return releaseEffect || { gapScoreDelta: 1.5, gradeForecastDelta: -0.05 };
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Failed to release task' });
      return null;
    }
  },

  rescheduleTask: async (taskId, newDate) => {
    try {
      await tasksApi.reschedule(taskId, newDate);
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t._id === taskId ? { ...t, status: 'rescheduled', scheduledAt: newDate } : t
        ),
      }));
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Failed to reschedule task' });
    }
  },

  toggleStep: async (taskId, stepIndex) => {
    const task = get().tasks.find((t) => t._id === taskId);
    if (!task) return;
    const newSteps = [...task.steps];
    newSteps[stepIndex] = {
      ...newSteps[stepIndex],
      completed: !newSteps[stepIndex].completed,
    };
    try {
      await tasksApi.update(taskId, { steps: newSteps });
      set((state) => ({
        tasks: state.tasks.map((t) => (t._id === taskId ? { ...t, steps: newSteps } : t)),
      }));
    } catch {
      // ignore
    }
  },

  // Pomodoro functions
  startPomodoro: (taskId, minutes = 25) => {
    const seconds = minutes * 60;
    set({
      pomodoro: {
        isRunning: true,
        timeLeft: seconds,
        totalDuration: seconds,
        mode: 'focus',
        completedSessions: get().pomodoro.completedSessions,
        activeTaskId: taskId || null,
      },
    });
  },

  pausePomodoro: () => {
    set((state) => ({
      pomodoro: { ...state.pomodoro, isRunning: false },
    }));
  },

  resumePomodoro: () => {
    set((state) => ({
      pomodoro: { ...state.pomodoro, isRunning: true },
    }));
  },

  resetPomodoro: (minutes = 25) => {
    const seconds = minutes * 60;
    set((state) => ({
      pomodoro: {
        ...state.pomodoro,
        isRunning: false,
        timeLeft: seconds,
        totalDuration: seconds,
      },
    }));
  },

  tickPomodoro: () => {
    const { pomodoro } = get();
    if (!pomodoro.isRunning) return;

    if (pomodoro.timeLeft <= 1) {
      // Completed session
      const isFocus = pomodoro.mode === 'focus';
      const newCompleted = isFocus ? pomodoro.completedSessions + 1 : pomodoro.completedSessions;
      const nextMode = isFocus
        ? newCompleted % 4 === 0
          ? 'long_break'
          : 'short_break'
        : 'focus';
      const nextDuration = nextMode === 'focus' ? 25 * 60 : nextMode === 'short_break' ? 5 * 60 : 15 * 60;

      if (isFocus) {
        get().addPetXp(30);
      }

      set({
        pomodoro: {
          isRunning: false,
          timeLeft: nextDuration,
          totalDuration: nextDuration,
          mode: nextMode,
          completedSessions: newCompleted,
          activeTaskId: isFocus ? pomodoro.activeTaskId : null,
        },
      });
    } else {
      set({
        pomodoro: {
          ...pomodoro,
          timeLeft: pomodoro.timeLeft - 1,
        },
      });
    }
  },

  addPetXp: (amount) => {
    set((state) => {
      let newXp = state.pet.xp + amount;
      let newLevel = state.pet.level;
      let nextLevelXp = state.pet.nextLevelXp;

      while (newXp >= nextLevelXp) {
        newXp -= nextLevelXp;
        newLevel += 1;
        nextLevelXp = Math.floor(nextLevelXp * 1.5);
      }

      return {
        pet: {
          ...state.pet,
          xp: newXp,
          level: newLevel,
          nextLevelXp,
          mood: newLevel > state.pet.level ? 'ecstatic' : 'energetic',
        },
      };
    });
  },
}));
