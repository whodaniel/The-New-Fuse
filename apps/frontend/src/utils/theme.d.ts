export type ThemeMode = 'dark' | 'light' | 'system';
interface ThemeColors {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    error: string;
    warning: string;
    success: string;
    info: string;
}
interface Theme {
    mode: ThemeMode;
    colors: ThemeColors;
}
export declare function getSystemTheme(): ThemeMode;
export declare function getStoredTheme(): Theme;
export declare function setTheme(mode: ThemeMode): void;
export declare function applyTheme(theme: Theme): void;
export {};
