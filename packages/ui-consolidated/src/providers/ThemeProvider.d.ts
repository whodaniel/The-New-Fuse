import * as React from 'react';
type Theme = 'light' | 'dark' | 'system';
interface ThemeProviderProps {
    children: React.ReactNode;
    defaultTheme?: Theme;
    storageKey?: string;
}
interface ThemeProviderState {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}
/**
 * Theme provider component for managing light/dark mode
 *
 * @example
 * // Basic usage
 * <ThemeProvider>
 *   <App />
 * </ThemeProvider>
 *
 * // With default theme
 * <ThemeProvider defaultTheme="dark">
 *   <App />
 * </ThemeProvider>
 *
 * // With custom storage key
 * <ThemeProvider storageKey="my-app-theme">
 *   <App />
 * </ThemeProvider>
 */
export declare function ThemeProvider({ children, defaultTheme, storageKey, ...props }: ThemeProviderProps): React.JSX.Element;
/**
 * Hook for accessing the theme context
 *
 * @example
 * // Usage in a component
 * const { theme, setTheme } = useTheme();
 *
 * // Toggle between light and dark
 * const toggleTheme = () => {
 *   setTheme(theme === 'light' ? 'dark' : 'light');
 * };
 */
export declare const useTheme: () => ThemeProviderState;
/**
 * Theme toggle component for switching between light and dark mode
 *
 * @example
 * // Basic usage
 * <ThemeToggle />
 *
 * // With custom className
 * <ThemeToggle className="my-custom-class" />
 */
export declare function ThemeToggle({ className }: {
    className?: string;
}): React.JSX.Element;
export {};
//# sourceMappingURL=ThemeProvider.d.ts.map