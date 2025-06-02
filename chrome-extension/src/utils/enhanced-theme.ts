/**
 * Enhanced Theme Configuration for The New Fuse Chrome Extension
 * Includes the purple/blue gradient color scheme from the original interface
 */

export interface ThemeColors {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

// Purple/Blue gradient theme based on the original interface
export const purpleBlueTheme: ThemeColors = {
  primary: '#7C3AED',        // Purple primary
  primaryDark: '#5B21B6',    // Darker purple
  primaryLight: '#A855F7',   // Lighter purple
  secondary: '#3B82F6',      // Blue secondary
  accent: '#EC4899',         // Pink accent
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', // Purple-blue gradient
  surface: 'rgba(255, 255, 255, 0.95)', // Semi-transparent white
  text: '#1F2937',           // Dark gray text
  textSecondary: '#6B7280',  // Medium gray text
  border: 'rgba(124, 58, 237, 0.2)', // Purple border with transparency
  success: '#10B981',        // Green
  warning: '#F59E0B',        // Orange
  error: '#EF4444',          // Red
  info: '#3B82F6'            // Blue
};

// Dark theme variant
export const darkPurpleBlueTheme: ThemeColors = {
  primary: '#A855F7',        // Lighter purple for dark mode
  primaryDark: '#7C3AED',    // Purple
  primaryLight: '#C084FC',   // Very light purple
  secondary: '#60A5FA',      // Light blue
  accent: '#F472B6',         // Light pink
  background: 'linear-gradient(135deg, #1e3a8a 0%, #312e81 100%)', // Dark blue gradient
  surface: 'rgba(17, 24, 39, 0.95)', // Dark surface
  text: '#F9FAFB',           // Light text
  textSecondary: '#D1D5DB',  // Medium light text
  border: 'rgba(168, 85, 247, 0.3)', // Purple border with transparency
  success: '#34D399',        // Light green
  warning: '#FBBF24',        // Light orange
  error: '#F87171',          // Light red
  info: '#60A5FA'            // Light blue
};

// Generate CSS custom properties
export function generateThemeCSS(theme: ThemeColors, isDark: boolean = false): string {
  return `
    :root {
      --tnf-primary: ${theme.primary};
      --tnf-primary-dark: ${theme.primaryDark};
      --tnf-primary-light: ${theme.primaryLight};
      --tnf-secondary: ${theme.secondary};
      --tnf-accent: ${theme.accent};
      --tnf-background: ${theme.background};
      --tnf-surface: ${theme.surface};
      --tnf-text: ${theme.text};
      --tnf-text-secondary: ${theme.textSecondary};
      --tnf-border: ${theme.border};
      --tnf-success: ${theme.success};
      --tnf-warning: ${theme.warning};
      --tnf-error: ${theme.error};
      --tnf-info: ${theme.info};
      
      /* Additional derived colors */
      --tnf-primary-alpha-10: ${theme.primary}1A;
      --tnf-primary-alpha-20: ${theme.primary}33;
      --tnf-primary-alpha-50: ${theme.primary}80;
      
      /* Gradient backgrounds */
      --tnf-gradient-primary: linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%);
      --tnf-gradient-accent: linear-gradient(135deg, ${theme.accent} 0%, ${theme.primary} 100%);
      
      /* Box shadows */
      --tnf-shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
      --tnf-shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      --tnf-shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      --tnf-shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      
      /* Purple/Blue specific shadows */
      --tnf-shadow-purple: 0 10px 15px -3px rgba(124, 58, 237, 0.2), 0 4px 6px -2px rgba(124, 58, 237, 0.1);
      --tnf-shadow-blue: 0 10px 15px -3px rgba(59, 130, 246, 0.2), 0 4px 6px -2px rgba(59, 130, 246, 0.1);
    }
  `;
}

// Material-UI theme configuration
export function createMaterialUITheme(colors: ThemeColors, isDark: boolean = false) {
  return {
    palette: {
      mode: isDark ? 'dark' : 'light',
      primary: {
        main: colors.primary,
        dark: colors.primaryDark,
        light: colors.primaryLight,
        contrastText: '#ffffff'
      },
      secondary: {
        main: colors.secondary,
        contrastText: '#ffffff'
      },
      background: {
        default: isDark ? '#111827' : '#f9fafb',
        paper: colors.surface
      },
      text: {
        primary: colors.text,
        secondary: colors.textSecondary
      },
      success: {
        main: colors.success
      },
      warning: {
        main: colors.warning
      },
      error: {
        main: colors.error
      },
      info: {
        main: colors.info
      }
    },
    shape: {
      borderRadius: 12
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 600,
            backgroundImage: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
            '&:hover': {
              backgroundImage: `linear-gradient(135deg, ${colors.primaryDark} 0%, ${colors.primary} 100%)`,
              transform: 'translateY(-1px)',
              boxShadow: '0 10px 15px -3px rgba(124, 58, 237, 0.2)'
            }
          }
        }
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backdropFilter: 'blur(10px)',
            border: `1px solid ${colors.border}`,
            '&.floating-panel': {
              background: colors.surface,
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }
          }
        }
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            '&:hover': {
              backgroundColor: `${colors.primary}20`,
              transform: 'scale(1.05)'
            }
          }
        }
      }
    }
  };
}

// Apply theme to page
export function applyThemeToPage(theme: ThemeColors, isDark: boolean = false): void {
  // Remove existing theme styles
  const existingStyle = document.getElementById('tnf-theme-styles');
  if (existingStyle) {
    existingStyle.remove();
  }

  // Create and inject new theme styles
  const styleElement = document.createElement('style');
  styleElement.id = 'tnf-theme-styles';
  styleElement.textContent = generateThemeCSS(theme, isDark);
  document.head.appendChild(styleElement);
}

// Theme manager class
export class ThemeManager {
  private currentTheme: ThemeColors = purpleBlueTheme;
  private isDark: boolean = false;

  constructor() {
    this.detectSystemTheme();
    this.loadSavedTheme();
    this.applyTheme();
  }

  private detectSystemTheme(): void {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      this.isDark = true;
      this.currentTheme = darkPurpleBlueTheme;
    }
  }

  private async loadSavedTheme(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(['themePreference', 'isDarkMode']);
      if (result.isDarkMode !== undefined) {
        this.isDark = result.isDarkMode;
        this.currentTheme = this.isDark ? darkPurpleBlueTheme : purpleBlueTheme;
      }
    } catch (error) {
      console.warn('Failed to load theme preference:', error);
    }
  }

  public toggleTheme(): void {
    this.isDark = !this.isDark;
    this.currentTheme = this.isDark ? darkPurpleBlueTheme : purpleBlueTheme;
    this.applyTheme();
    this.saveTheme();
  }

  public setTheme(colors: ThemeColors, isDark: boolean = false): void {
    this.currentTheme = colors;
    this.isDark = isDark;
    this.applyTheme();
    this.saveTheme();
  }

  public applyTheme(): void {
    applyThemeToPage(this.currentTheme, this.isDark);
  }

  private async saveTheme(): Promise<void> {
    try {
      await chrome.storage.local.set({
        'themePreference': 'purpleBlue',
        'isDarkMode': this.isDark
      });
    } catch (error) {
      console.warn('Failed to save theme preference:', error);
    }
  }

  public getCurrentTheme(): ThemeColors {
    return this.currentTheme;
  }

  public isDarkMode(): boolean {
    return this.isDark;
  }

  public getMaterialUITheme() {
    return createMaterialUITheme(this.currentTheme, this.isDark);
  }
}

// Export default theme manager instance
export const themeManager = new ThemeManager();
