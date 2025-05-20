import React, { ReactNode } from 'react';
interface ThemeProviderProps {
    children: ReactNode;
}
export declare function ThemeProvider({ children }: ThemeProviderProps): React.JSX.Element;
export declare function useTheme(): any;
export {};
