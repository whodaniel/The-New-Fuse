import type { Theme as ChakraTheme } from '@chakra-ui/react';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  success: string;
  warning: string;
  info: string;
}

export interface ThemeConfig {
  mode: ThemeMode;
  colors: {
    light: ThemeColors;
    dark: ThemeColors;
  };
  fontSize: 'sm' | 'base' | 'lg' | 'xl';
  spacing: 'compact' | 'normal' | 'relaxed';
  highContrast: boolean;
  reducedMotion: boolean;
}

export interface ThemeContextValue {
  theme: ThemeConfig;
  setTheme: (updates: Partial<ThemeConfig>) => void;
  toggleColorMode: () => void;
  currentColors: ThemeColors;
}
