import React, { ReactNode, createContext, useContext, useState, useEffect } from "react";
import { Theme } from "@/theme/types";
import { defaultTheme, darkTheme } from "@/theme/defaultTheme";

interface ThemeContextType {
  currentTheme: 'light' | 'dark';
  theme: Theme;
  setTheme: (theme: 'light' | 'dark') => void;
  customizeTheme: (customizations: Partial<Theme>) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: 'light' | 'dark';
}

  children,
  defaultTheme: initialTheme = 'dark'
}) => {
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>(initialTheme);
  const [customTheme, setCustomTheme] = useState<Partial<Theme>>({});

  const theme = {
    ...(currentTheme === 'light' ? defaultTheme : darkTheme),
    ...customTheme,
  };

  const setTheme = (theme: 'light' | 'dark') => {
    setCurrentTheme(theme);
  };

  const customizeTheme = (customizations: Partial<Theme>) => {
    setCustomTheme(prev => ({ ...prev, ...customizations }));
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      setCurrentTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', currentTheme);
    document.documentElement.className = currentTheme;
  }, [currentTheme]);

  return (
    <ThemeContext.Provider value={{
      currentTheme,
      theme,
      setTheme,
      customizeTheme,
    }}>
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
