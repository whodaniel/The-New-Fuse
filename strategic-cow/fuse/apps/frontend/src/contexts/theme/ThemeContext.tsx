import { createContext, ReactNode, useContext, useState } from 'react';

interface ThemeState {
  mode: 'light' | 'dark' | 'system';
  primaryColor: string;
  secondaryColor: string;
}

interface ThemeContextType {
  theme: ThemeState;
  setTheme: (theme: ThemeState) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const defaultTheme: ThemeState = {
  mode: 'system',
  primaryColor: '#0070f3',
  secondaryColor: '#00b4d8',
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeState>(defaultTheme);
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

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export default ThemeContext;
