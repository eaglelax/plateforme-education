import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const applyTheme = (theme) => {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme);
  }
};

const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: 'light',
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
      toggleTheme: () => {
        const next = get().theme === 'light' ? 'dark' : 'light';
        applyTheme(next);
        set({ theme: next });
      },
      init: () => {
        applyTheme(get().theme);
      },
    }),
    {
      name: 'anka-theme',
      onRehydrateStorage: () => (state) => {
        if (state?.theme) applyTheme(state.theme);
      },
    }
  )
);

export default useThemeStore;
