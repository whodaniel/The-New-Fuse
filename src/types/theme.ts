export type ColorScheme = 'light' | 'dark' | 'system';

export interface Theme {
  colorMode: ColorScheme;
  fontFamily: string;
  borderRadius: 'none' | 'sm' | 'md' | 'lg';
  rounded: boolean;
  transparent: boolean;
  primaryColor?: string;
}

export interface ThemeContextType {
  theme: Theme;
  updateTheme: (updates: Partial<Theme>) => void;
}