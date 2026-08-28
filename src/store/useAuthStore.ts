import { create } from 'zustand';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'dispatcher' | 'operator' | 'employee';
  mustChangePassword?: boolean;
  department?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setCredentials: (user: User, token: string) => void;
  clearPasswordChangeFlag: () => void;
  logout: () => void;
}

// Global authorization Zustand store with persistent localStorage capabilities
export const useAuthStore = create<AuthState>((set) => {
  // Safe SSR/Build check for hydration
  const safeGetItem = (key: string) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  };

  const initialToken = safeGetItem('fleet_token');
  const initialUserString = safeGetItem('fleet_user');
  let initialUser: User | null = null;

  if (initialUserString) {
    try {
      initialUser = JSON.parse(initialUserString);
    } catch {
      initialUser = null;
    }
  }

  return {
    user: initialUser,
    token: initialToken,
    isAuthenticated: !!initialToken,
    setCredentials: (user, token) => {
      try {
        localStorage.setItem('fleet_token', token);
        localStorage.setItem('fleet_user', JSON.stringify(user));
      } catch (err) {
        console.error('Failed to write credentials to storage:', err);
      }
      set({ user, token, isAuthenticated: true });
    },
    clearPasswordChangeFlag: () => {
      set(state => {
        if (!state.user) return state;
        const updated = { ...state.user, mustChangePassword: false };
        try { localStorage.setItem('fleet_user', JSON.stringify(updated)); } catch {}
        return { user: updated };
      });
    },
    logout: () => {
      try {
        localStorage.removeItem('fleet_token');
        localStorage.removeItem('fleet_user');
      } catch (err) {
        console.error('Failed to remove credentials from storage:', err);
      }
      set({ user: null, token: null, isAuthenticated: false });
    },
  };
});
