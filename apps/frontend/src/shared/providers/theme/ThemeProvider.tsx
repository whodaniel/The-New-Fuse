import React, { createContext, useContext } from 'react';
import { useTheme } from '@features/theme/ThemeContext';
const ThemeContext = createContext(undefined);
export function ThemeProvider({ children, defaultTheme = 'system', storageKey = 'ui-theme', }): any {
    const [theme, setTheme] = useTheme(storageKey);
    const value = {
        theme: theme,
        setTheme,
    };
    return (<ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>);
}
export const useThemeContext = (): any => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useThemeContext must be used within a ThemeProvider');
    }
    return context;
};
//# sourceMappingURL=ThemeProvider.js.map