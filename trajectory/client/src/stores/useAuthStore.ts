import { create } from 'zustand';
import type { StudentBase } from '@trajectory/shared';
import { authApi, setAccessToken, clearAccessToken } from '../api/index.js';

interface AuthState {
  student: StudentBase | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateStudent: (student: StudentBase) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  student: null,
  token: null,
  isLoading: true,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authApi.login({ email, password });
      const { accessToken, student } = res.data.data!;
      setAccessToken(accessToken);
      set({ student, token: accessToken, isLoading: false });
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Login failed. Please check your credentials.';
      set({ error: msg, isLoading: false });
      return false;
    }
  },

  register: async (email, password, name) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authApi.register({ email, password, name });
      const { accessToken, student } = res.data.data!;
      setAccessToken(accessToken);
      set({ student, token: accessToken, isLoading: false });
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Registration failed.';
      set({ error: msg, isLoading: false });
      return false;
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    } finally {
      clearAccessToken();
      set({ student: null, token: null, isLoading: false });
    }
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const refreshRes = await authApi.refresh();
      if (refreshRes.data?.data?.accessToken) {
        const token = refreshRes.data.data.accessToken;
        setAccessToken(token);
        const meRes = await authApi.me();
        set({ student: meRes.data.data, token, isLoading: false });
        return;
      }
    } catch {
      // not authenticated
    }
    clearAccessToken();
    set({ student: null, token: null, isLoading: false });
  },

  updateStudent: (student: StudentBase) => set({ student }),
  clearError: () => set({ error: null }),
}));
