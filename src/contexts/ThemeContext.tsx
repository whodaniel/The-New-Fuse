import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeConfig, validateThemeConfig } from '../utils/themeValidation';

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

function getStoredColorMode(): 'light' | 'dark' {
  try {
    const stored = localStorage.getItem('color-mode');
    return (stored === 'dark' ? 'dark' : 'light') as 'light' | 'dark';
  } catch {
    return 'light';
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeConfig>(() => validateThemeConfig(getStoredTheme()));
  const [colorMode, setColorMode] = useState<'light' | 'dark'>(getStoredColorMode);

  useEffect(() => {
    localStorage.setItem('user-theme', JSON.stringify(theme));
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('color-mode', colorMode);
    // Apply color mode to document
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(colorMode);
  }, [colorMode]);

  const updateTheme = (updates: Partial<ThemeConfig>) => {
    setTheme(prev => validateThemeConfig({ ...prev, ...updates }));
  };

  const toggleColorMode = () => {
    setColorMode(prev => prev === 'light' ? 'dark' : 'light');
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
