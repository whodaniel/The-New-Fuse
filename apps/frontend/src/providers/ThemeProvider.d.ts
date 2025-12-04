import React, { ReactNode } from "react";
import { Theme } from "@/theme/types";
interface ThemeContextType {
    currentTheme: 'light' | 'dark';
    theme: Theme;
    setTheme: (theme: 'light' | 'dark') => void;
    customizeTheme: (customizations: Partial<Theme>) => void;
}
interface ThemeProviderProps {
    children: ReactNode;
    defaultTheme?: 'light' | 'dark';
}
export declare const ThemeProvider: React.FC<ThemeProviderProps>;
export declare const useTheme: () => ThemeContextType;
export {};
