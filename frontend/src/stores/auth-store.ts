import { create } from 'zustand';
import { ApiError, authApi, type SessionUser } from '@/lib/api';

type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

interface AuthState {
  user: SessionUser | null;
  status: AuthStatus;
  hydrate: () => Promise<void>;
  setUser: (user: SessionUser) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (input: { name: string; email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  status: 'loading',

  hydrate: async () => {
    try {
      const user = await authApi.me();
      set({ user, status: 'authenticated' });
    } catch (error) {
      const status = error instanceof ApiError && error.status === 0 ? 'loading' : 'anonymous';
      set({ user: null, status: status === 'loading' ? 'anonymous' : 'anonymous' });
    }
  },

  login: async (email, password) => {
    const user = await authApi.login({ email, password });
    set({ user, status: 'authenticated' });
  },

  setUser: (user) => set({ user, status: 'authenticated' }),

  register: async (input) => {
    await authApi.register(input);
  },

  logout: async () => {
    try {
      await authApi.logout();
    } finally {
      set({ user: null, status: 'anonymous' });
    }
  },
}));
