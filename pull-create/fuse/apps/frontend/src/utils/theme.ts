export type ThemeMode = 'dark' | 'light' | 'system';

interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  warning: string;
  success: string;
  info: string;
}

interface Theme {
  mode: ThemeMode;
  colors: ThemeColors;
}

const THEME_KEY = 'app_theme';

const defaultLightColors: ThemeColors = {
  primary: '#0066cc',
  secondary: '#666666',
  background: '#ffffff',
  surface: '#f5f5f5',
  text: '#000000',
  textSecondary: '#666666',
  border: '#e0e0e0',
  error: '#dc2626',
  warning: '#f59e0b',
  success: '#16a34a',
  info: '#0891b2',
};

const defaultDarkColors: ThemeColors = {
  primary: '#3b82f6',
  secondary: '#9ca3af',
  background: '#1f2937',
  surface: '#374151',
  text: '#ffffff',
  textSecondary: '#9ca3af',
  border: '#4b5563',
  error: '#ef4444',
  warning: '#f59e0b',
  success: '#22c55e',
  info: '#06b6d4',
};

export function getSystemTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function getStoredTheme(): Theme {
  if (typeof window === 'undefined') {
    return { mode: 'dark', colors: defaultDarkColors };
  }

  const stored = localStorage.getItem(THEME_KEY);
  if (!stored) {
    return { mode: 'system', colors: defaultDarkColors };
  }

  try {
    const theme = JSON.parse(stored);
    return {
      mode: theme.mode || 'system',
      colors: theme.mode === 'light' ? defaultLightColors : defaultDarkColors,
      ...theme,
    };
  } catch {
    return { mode: 'system', colors: defaultDarkColors };
  }
}

export function setTheme(mode: ThemeMode): void {
  const theme = {
    mode,
    colors: mode === 'light' ? defaultLightColors : defaultDarkColors,
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem(THEME_KEY, JSON.stringify(theme));
    applyTheme(theme);
  }
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  const colors = theme.colors;

  // Apply CSS variables
  Object.entries(colors).forEach(([key, value]) => {
    root.style.setProperty(`--color-${key}`, value);
  });

  // Set color scheme meta tag
  const meta = document.querySelector('meta[name="color-scheme"]');
  if (meta) {
    meta.setAttribute('content', theme.mode === 'light' ? 'light' : 'dark');
  }

  // Set class on root element
  root.classList.remove('light', 'dark');
  root.classList.add(theme.mode === 'light' ? 'light' : 'dark');
}

// Initialize theme on load
if (typeof window !== 'undefined') {
  const theme = getStoredTheme();
  const effectiveMode = theme.mode === 'system' ? getSystemTheme() : theme.mode;
  applyTheme({
    ...theme,
    colors: effectiveMode === 'light' ? defaultLightColors : defaultDarkColors,
  });

  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    const currentTheme = getStoredTheme();
    if (currentTheme.mode === 'system') {
      applyTheme({
        ...currentTheme,
        colors: e.matches ? defaultDarkColors : defaultLightColors,
      });
    }
  });
}