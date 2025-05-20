import React, { ReactNode } from 'react';
type Theme = 'light' | 'dark' | 'system';
interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}
interface ThemeProviderProps {
    children: ReactNode;
}
export declare function ThemeProvider({ children }: ThemeProviderProps): React.JSX.Element;
export declare function useTheme(): ThemeContextType;
export {};
