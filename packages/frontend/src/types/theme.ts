import { ThemeConfig as ChakraThemeConfig } from '@chakra-ui/react';

export type ColorScheme = 'light' | 'dark' | 'system';

export interface ThemeConfig extends ChakraThemeConfig {
  colorScheme: ColorScheme;
  fontSize: 'sm' | 'md' | 'lg';
  highContrast: boolean;
  reducedMotion: boolean;
}