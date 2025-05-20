import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  ChakraProvider,
  useColorMode as useChakraColorMode,
} from '@chakra-ui/react';
import { ThemeConfig, validateThemeConfig, defaultTheme } from '../utils/themeValidation';

interface ThemeContextType {
  theme: ThemeConfig;
  updateTheme: (updates: Partial<ThemeConfig>) => void;
  colorMode: 'light' | 'dark';
  toggleColorMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getStoredTheme(): Partial<ThemeConfig> {
  try {
    const stored = localStorage.getItem('user-theme');
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Failed to parse stored theme:', error);
    return {};
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeConfig>(() => validateThemeConfig(getStoredTheme()));
  const { colorMode, toggleColorMode } = useChakraColorMode();

  useEffect(() => {
    localStorage.setItem('user-theme', JSON.stringify(theme));
  }, [theme]);

  const updateTheme = (updates: Partial<ThemeConfig>) => {
    setTheme(prev => validateThemeConfig({ ...prev, ...updates }));
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        updateTheme,
        colorMode,
        toggleColorMode,
      }}
    >
      <ChakraProvider theme={theme}>
        {children}
      </ChakraProvider>
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