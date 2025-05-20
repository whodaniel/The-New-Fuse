import React, { createContext, useContext, useState } from 'react';
import { useColorMode } from '@chakra-ui/react';
import type { ThemeConfig as ThemeConfigType } from '../types/theme.js';

// Re-export the ThemeConfig type
export type ThemeConfig = ThemeConfigType;

// Export the ThemeContextValue as ThemeContextType
export interface ThemeContextType {
  themeConfig: ThemeConfig;
  setThemeConfig: (config: ThemeConfig) => void;
}

const defaultThemeConfig: ThemeConfig = {
  colorScheme: 'system',
  fontSize: 'md',
  highContrast: false,
  reducedMotion: false,
  initialColorMode: 'light',
  useSystemColorMode: true,
};

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { colorMode } = useColorMode();
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(defaultThemeConfig);

  return (
    <ThemeContext.Provider
      value={{
        themeConfig: {
          ...themeConfig,
          colorScheme: colorMode as 'light' | 'dark' | 'system',
        },
        setThemeConfig,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
