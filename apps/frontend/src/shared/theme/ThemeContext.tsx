import { ThemeProvider as ChakraThemeProvider } from '@chakra-ui/react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { baseTheme, darkTheme } from './themes';

interface ThemeContextType {
  currentTheme: string;
  setTheme: (theme: string) => void;
  customizeTheme: (customizations: Record<string, unknown>) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState('base');
  const [themeConfig, setThemeConfig] = useState(baseTheme);

  useEffect(() => {
    const savedTheme = localStorage.getItem('preferred-theme');
    if (savedTheme) {
      setCurrentTheme(savedTheme);
    }
  }, []);

  const setTheme = (theme: string) => {
    setCurrentTheme(theme);
    localStorage.setItem('preferred-theme', theme);
    setThemeConfig(theme === 'dark' ? darkTheme : baseTheme);
  };

  const customizeTheme = (customizations: Record<string, unknown>) => {
    setThemeConfig((prev: any) => ({
      ...prev,
      ...customizations,
    }));
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme, customizeTheme }}>
      <ChakraThemeProvider theme={themeConfig}>{children}</ChakraThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
