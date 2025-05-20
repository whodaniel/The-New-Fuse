export type ColorMode = 'light' | 'dark' | 'system';
export type FontSize = 'sm' | 'md' | 'lg';
export type Spacing = 'compact' | 'comfortable' | 'spacious';
export interface ColorScheme {
    primary: string;
    secondary: string;
    accent: string;
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
export interface ThemeConfig {
    mode: ColorMode;
    fontSize: FontSize;
    spacing: Spacing;
    colors: {
        light: ColorScheme;
        dark: ColorScheme;
    };
    borderRadius: string;
    transition: string;
}
export interface ThemeContextType {
    theme: ThemeConfig;
    currentColors: ColorScheme;
    setTheme: (config: Partial<ThemeConfig>) => void;
    toggleColorMode: () => void;
}
