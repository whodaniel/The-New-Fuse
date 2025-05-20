import { z } from 'zod';

export const ColorScheme = z.enum(['light', 'dark', 'system']);
export type ColorScheme = z.infer<typeof ColorScheme>;

export const ColorTokens = z.object({
  primary: z.string(),
  secondary: z.string(),
  background: z.string(),
  text: z.string(),
  error: z.string(),
  warning: z.string(),
  success: z.string()
});

export type ColorTokens = z.infer<typeof ColorTokens>;

export const FontConfig = z.object({
  body: z.string(),
  heading: z.string(),
  mono: z.string()
});

export const ThemeConfig = z.object({
  colorScheme: ColorScheme,
  fontSize: z.enum(['sm', 'md', 'lg']),
  reducedMotion: z.boolean(),
  highContrast: z.boolean(),
  colors: ColorTokens,
  fonts: FontConfig,
  cssVarPrefix: z.string().optional(),
  initialColorMode: ColorScheme.optional(),
  useSystemColorMode: z.boolean().optional(),
  disableTransitionOnChange: z.boolean().optional()
});

export type ThemeConfig = z.infer<typeof ThemeConfig>;
export type FontConfig = z.infer<typeof FontConfig>;

export function validateThemeConfig(config: unknown): ThemeConfig {
  return ThemeConfig.parse(config);
}

export function validateColors(config: ThemeConfig): boolean {
  if (!config.colors) return false;

  return Object.entries(config.colors).every(([_, color]) =>
    typeof color === 'string' && color.match(/^#[0-9A-F]{6}$/i)
  );
}

export function validateFonts(config: ThemeConfig): boolean {
  if (!config.fonts) return false;

  return ['body', 'heading', 'mono'].every(key =>
    typeof config.fonts[key as keyof FontConfig] === 'string'
  );
}

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
  colorMode: 'light' | 'dark' | 'system';
  colors: {
    light: ThemeColors;
    dark: ThemeColors;
  };
  fontSize: 'sm' | 'md' | 'lg' | 'xl';
  spacing: 'compact' | 'normal' | 'relaxed';
  highContrast: boolean;
  reducedMotion: boolean;
}

export const defaultTheme: ThemeConfig = {
  colorMode: 'system',
  colors: {
    light: {
      primary: '#3182ce',
      secondary: '#805ad5',
      background: '#ffffff',
      surface: '#f7fafc',
      text: '#1a202c',
      textSecondary: '#4a5568',
      border: '#e2e8f0',
      error: '#e53e3e',
      success: '#38a169',
      warning: '#d69e2e',
      info: '#3182ce',
    },
    dark: {
      primary: '#63b3ed',
      secondary: '#b794f4',
      background: '#1a202c',
      surface: '#2d3748',
      text: '#f7fafc',
      textSecondary: '#a0aec0',
      border: '#4a5568',
      error: '#fc8181',
      success: '#68d391',
      warning: '#f6ad55',
      info: '#63b3ed',
    },
  },
  fontSize: 'md',
  spacing: 'normal',
  highContrast: false,
  reducedMotion: false,
};

export function validateThemeConfig(config: Partial<ThemeConfig>): ThemeConfig {
  return {
    ...defaultTheme,
    ...config,
    colors: {
      light: { ...defaultTheme.colors.light, ...(config.colors?.light || {}) },
      dark: { ...defaultTheme.colors.dark, ...(config.colors?.dark || {}) },
    },
  };
}