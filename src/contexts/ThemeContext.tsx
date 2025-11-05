import React, { createContext, useState, useEffect, useContext } from 'react';

interface ThemeContextType {
  colorMode: 'light' | 'dark';
  toggleColorMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [colorMode, setColorMode] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const savedColorMode = localStorage.getItem('color-mode');
    if (savedColorMode === 'light' || savedColorMode === 'dark') {
      setColorMode(savedColorMode);
    }
  }, []);

  useEffect(() => {
    document.documentElement.className = colorMode;
    localStorage.setItem('color-mode', colorMode);
  }, [colorMode]);

  const toggleColorMode = () => {
    setColorMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ colorMode, toggleColorMode }}>
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
