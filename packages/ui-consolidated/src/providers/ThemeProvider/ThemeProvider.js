import React, { createContext, useContext, useState, useEffect } from 'react';
const ThemeContext = createContext(undefined);
export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
export const ThemeProvider = ({ children, defaultTheme = 'system', storageKey = 'ui-theme' }) => {
    const [theme, setThemeState] = useState(defaultTheme);
    const [effectiveTheme, setEffectiveTheme] = useState('light');
    useEffect(() => {
        // Load theme from localStorage
        const savedTheme = localStorage.getItem(storageKey);
        if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
            setThemeState(savedTheme);
        }
    }, [storageKey]);
    useEffect(() => {
        const updateEffectiveTheme = () => {
            if (theme === 'system') {
                const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                setEffectiveTheme(systemTheme);
            }
            else {
                setEffectiveTheme(theme);
            }
        };
        updateEffectiveTheme();
        // Listen for system theme changes
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => {
            if (theme === 'system') {
                updateEffectiveTheme();
            }
        };
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme]);
    useEffect(() => {
        // Apply theme to document
        const root = document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(effectiveTheme);
        // Update meta theme-color
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', effectiveTheme === 'dark' ? '#1a1a1a' : '#ffffff');
        }
    }, [effectiveTheme]);
    const setTheme = (newTheme) => {
        setThemeState(newTheme);
        localStorage.setItem(storageKey, newTheme);
    };
    return (<ThemeContext.Provider value={theme, effectiveTheme, setTheme}>
      <div className={`theme-${effectiveTheme}}` >
            { children }}/>
      </div>);
};
ThemeContext.Provider >
;
;
;
//# sourceMappingURL=ThemeProvider.js.map