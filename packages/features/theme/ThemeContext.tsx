import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ThemeConfig, ThemeContextValue, ThemeColors, ThemeMode } from './types.js';
const defaultLightColors: ThemeColors = {
    primary: '#0ba5ec',
    secondary: '#805ad5',
    background: '#ffffff',
    surface: '#f9fafb',
    text: '#111827',
    textSecondary: '#4b5563',
    border: '#d1d5db',
    error: '#ef4444',
    success: '#22c55e',
    warning: '#f59e0b',
    info: '#3b82f6',
};
const defaultDarkColors: ThemeColors = {
    primary: '#0ba5ec',
    secondary: '#805ad5',
    background: '#111827',
    surface: '#1f2937',
    text: '#f9fafb',
    textSecondary: '#9ca3af',
    border: '#374151',
    error: '#ef4444',
    success: '#22c55e',
    warning: '#f59e0b',
    info: '#3b82f6',
};
const defaultTheme: ThemeConfig = {
    mode: 'system',
    colors: {
        light: defaultLightColors,
        dark: defaultDarkColors,
    },
    fontSize: 'base',
    spacing: 'normal',
    highContrast: false,
    reducedMotion: false,
};
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
function getSystemTheme(): ThemeMode {
    if (typeof window === 'undefined')
        return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
export function ThemeProvider({ children, storageKey = 'ui-theme' }: {
    children: React.ReactNode;
    storageKey?: string;
}) {
    const [theme, setThemeState] = useState<ThemeConfig>(() => {
        if (typeof window === 'undefined')
            return defaultTheme;
        const saved = localStorage.getItem(storageKey);
        if (!saved)
            return defaultTheme;
        try {
            const parsed = JSON.parse(saved);
            return { ...defaultTheme, ...parsed };
        }
        catch {
            return defaultTheme;
        }
    });
    const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(getSystemTheme());
    useEffect(() => {
        const media = window.matchMedia('(prefers-color-scheme: dark)');
        const updateSystemTheme = (e: MediaQueryListEvent) => {
            setSystemTheme(e.matches ? 'dark' : 'light');
        };
        media.addEventListener('change', updateSystemTheme);
        return () => media.removeEventListener('change', updateSystemTheme);
    }, []);
    const effectiveTheme = theme.mode === 'system' ? systemTheme : theme.mode;
    const currentColors = effectiveTheme === 'dark' ? theme.colors.dark : theme.colors.light;
    useEffect(() => {
        const root = document.documentElement;
        // Apply color scheme
        root.classList.remove('light', 'dark');
        root.classList.add(effectiveTheme);
        // Apply CSS variables
        Object.entries(currentColors).forEach(([key, value]) => {
            root.style.setProperty(`--color-${key}`, value);
        });
        // Store theme preferences
        localStorage.setItem(storageKey, JSON.stringify(theme));
    }, [theme, effectiveTheme, currentColors, storageKey]);
    const setTheme = (updates: Partial<ThemeConfig>) => {
        setThemeState(prev => ({
            ...prev,
            ...updates,
        }));
    };
    const toggleColorMode = () => {
        setTheme({
            mode: theme.mode === 'dark' ? 'light' : 'dark',
        });
    };
    const value = {
        theme,
        setTheme,
        toggleColorMode,
        currentColors,
    };
    return (<ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>);
}
export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
