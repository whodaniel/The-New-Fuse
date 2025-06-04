import { ThemeConfig as ChakraThemeConfig } from '@chakra-ui/react';

export type ThemeColorScheme = 'light' | 'dark' | 'system';

export interface CustomColorPalette {
  primary?: string;
  secondary?: string;
  background?: string;
  text?: string;
  error?: string;
  warning?: string;
  success?: string;
}

export type CustomFonts = {
  [key: string]: string;
};

export interface ThemeConfig extends ChakraThemeConfig {
  colorScheme: ThemeColorScheme; // Renamed to avoid conflict
  fontSize: 'sm' | 'md' | 'lg';
  highContrast: boolean;
  reducedMotion: boolean;
  colors?: Partial<CustomColorPalette>; // Added custom colors
  fonts?: Partial<CustomFonts>; // Added custom fonts
}