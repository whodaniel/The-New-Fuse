import React, { ReactNode } from 'react';
import { ThemeContextType } from '@/types/contexts';
declare const ThemeContext: React.Context<any>;
interface ThemeProviderProps {
    children: ReactNode;
}
export declare function ThemeProvider({ children }: ThemeProviderProps): React.JSX.Element;
export declare function useTheme(): ThemeContextType;
export default ThemeContext;
