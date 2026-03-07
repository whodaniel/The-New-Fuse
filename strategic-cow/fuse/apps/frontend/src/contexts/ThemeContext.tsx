import { createContext, ReactNode, useContext, useState } from 'react';

// Define the theme context types
interface Theme {
  mode: 'light' | 'dark' | 'system';
  primaryColor: string;
  secondaryColor: string;
}

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleMode: () => void;
}

// Create the context with proper typing
const ThemeContext = createContext<ThemeContextType | null>(null);

// Default theme values
const defaultTheme: Theme = {
  mode: 'system',
  primaryColor: '#0070f3',
  secondaryColor: '#00b4d8',
};

// Theme Provider component with proper TypeScript typing
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);

  const toggleMode = (): void => {
    setTheme((prev) => ({
      ...prev,
      mode: prev.mode === 'light' ? 'dark' : 'light',
    }));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Custom hook for using theme context with proper error handling
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
