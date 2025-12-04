import React from 'react';
interface ThemeContextType {
    currentTheme: string;
    setTheme: (theme: string) => void;
    customizeTheme: (customizations: Record<string, unknown>) => void;
}
export declare const ThemeProvider: React.React.FC<{
    children: React.ReactNode;
}>;
export declare const useTheme: () => ThemeContextType;
export {};
