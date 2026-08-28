import { create } from 'zustand';

export type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const applyTheme = (theme: Theme) => {
  document.documentElement.classList.toggle('dark', theme === 'dark');
};

// Mirrors useAuthStore's manual-localStorage pattern (this codebase doesn't use
// zustand's persist middleware anywhere, so we don't introduce it here either).
export const useThemeStore = create<ThemeState>((set, get) => {
  const safeGetItem = (key: string) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  };

  const stored = safeGetItem('fleet_theme');
  const initialTheme: Theme = stored === 'dark' ? 'dark' : 'light';

  return {
    theme: initialTheme,
    setTheme: (theme) => {
      try {
        localStorage.setItem('fleet_theme', theme);
      } catch (err) {
        console.error('Failed to write theme preference to storage:', err);
      }
      applyTheme(theme);
      set({ theme });
    },
    toggleTheme: () => {
      const next: Theme = get().theme === 'dark' ? 'light' : 'dark';
      get().setTheme(next);
    },
  };
});
