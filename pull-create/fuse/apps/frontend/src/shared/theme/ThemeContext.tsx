import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  currentTheme: string;
  setTheme: (theme: string) => void;
  customizeTheme: (customizations: Record<string, unknown>) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState('base');

  useEffect(() => {
    const savedTheme = localStorage.getItem('preferred-theme');
    if (savedTheme) {
      setCurrentTheme(savedTheme);
      // Apply theme to document
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  const setTheme = (theme: string) => {
    setCurrentTheme(theme);
    localStorage.setItem('preferred-theme', theme);

    // Apply theme to document
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const customizeTheme = (customizations: Record<string, unknown>) => {
    // Apply custom CSS variables
    Object.entries(customizations).forEach(([key, value]) => {
      document.documentElement.style.setProperty(`--${key}`, String(value));
    });
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme, customizeTheme }}>
      {children}
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
