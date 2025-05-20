import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useColorMode } from '../components/chakra-ui.js';

const defaultTheme = {
  colorMode: 'light',
  colors: {
    primary: '#3182ce',
    secondary: '#805ad5'
  },
  fonts: {
    body: 'system-ui, sans-serif',
    heading: 'system-ui, sans-serif'
  }
};

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const { colorMode, setColorMode } = useColorMode();
  const [themeConfig, setThemeConfig] = useState(defaultTheme);
  const [error, setError] = useState(null);

  // Initialize theme from local storage if available
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('userTheme');
      if (savedTheme) {
        const parsedTheme = JSON.parse(savedTheme);
        setThemeConfig(parsedTheme);
        setColorMode(parsedTheme.colorMode || 'light');
      }
    } catch (err) {
      console.error('Failed to load theme from localStorage', err);
      setError('Failed to load saved theme');
    }
  }, [setColorMode]);

  // Save theme changes to local storage
  useEffect(() => {
    try {
      localStorage.setItem('userTheme', JSON.stringify(themeConfig));
    } catch (err) {
      console.error('Failed to save theme to localStorage', err);
      setError('Failed to save theme');
    }
  }, [themeConfig]);

  const updateTheme = useCallback((updates) => {
    setThemeConfig(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  const resetTheme = useCallback(() => {
    setThemeConfig(defaultTheme);
    setColorMode('light');
  }, [setColorMode]);

  const value = {
    theme: themeConfig,
    updateTheme,
    resetTheme,
    error
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
