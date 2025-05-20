import React, { createContext, useState, useContext } from 'react';
const ThemeContext = createContext(null);
const defaultTheme = {
    mode: 'system',
    primaryColor: '#0070f3',
    secondaryColor: '#00b4d8',
};
export function ThemeProvider({ children }): any {
    const [theme, setTheme] = useState(defaultTheme);
    const toggleMode = (): any => {
        setTheme((prev) => (Object.assign(Object.assign({}, prev), { mode: prev.mode === 'light' ? 'dark' : 'light' })));
    };
    return (<ThemeContext.Provider value={{ theme, setTheme, toggleMode }}>
      {children}
    </ThemeContext.Provider>);
}
export function useTheme(): any {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
// Re-export the theme context from the core package
export { ThemeProvider, useTheme } from '@features/theme/ThemeContext';
//# sourceMappingURL=ThemeContext.js.map