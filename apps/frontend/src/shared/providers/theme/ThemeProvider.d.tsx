import React, { ReactNode } from 'react';
type Theme = 'dark' | 'light' | 'system';
interface ThemeProviderProps {
    children: ReactNode;
    defaultTheme?: Theme;
    storageKey?: string;
}
interface ThemeProviderState {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}
export declare function ThemeProvider({ children, defaultTheme, storageKey, }: ThemeProviderProps): React.JSX.Element;
export declare const useThemeContext: () => ThemeProviderState;
export {};
