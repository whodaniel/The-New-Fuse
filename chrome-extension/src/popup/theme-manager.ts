/**
 * Theme manager for The New Fuse - AI Bridge
 */
import { Logger } from '../utils/logger.js';

// Create a theme-specific logger
const themeLogger = new Logger({
  name: 'ThemeManager',
  level: 'info',
  saveToStorage: true
});

/**
 * Theme mode
 */
export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Theme colors
 */
interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  success: string;
  warning: string;
  info: string;
}

/**
 * Light theme colors
 */
const lightColors: ThemeColors = {
  primary: '#4285f4',
  secondary: '#34a853',
  background: '#ffffff',
  surface: '#f8f9fa',
  text: '#202124',
  textSecondary: '#5f6368',
  border: '#dadce0',
  error: '#ea4335',
  success: '#34a853',
  warning: '#fbbc05',
  info: '#4285f4'
};

/**
 * Dark theme colors
 */
const darkColors: ThemeColors = {
  primary: '#8ab4f8',
  secondary: '#81c995',
  background: '#202124',
  surface: '#292a2d',
  text: '#e8eaed',
  textSecondary: '#9aa0a6',
  border: '#5f6368',
  error: '#f28b82',
  success: '#81c995',
  warning: '#fdd663',
  info: '#8ab4f8'
};

/**
 * Theme manager
 */
export class ThemeManager {
  private currentTheme: ThemeMode = 'system';
  private systemDarkMode: boolean = false;
  private themeChangeListeners: Function[] = [];

  /**
   * Create a new ThemeManager
   */
  constructor() {
    // Check if system is in dark mode
    this.systemDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      this.systemDarkMode = e.matches;
      if (this.currentTheme === 'system') {
        this.applyTheme();
      }
    });

    // Load theme from storage
    chrome.storage.local.get(['themeMode'], (result) => {
      if (result.themeMode) {
        this.currentTheme = result.themeMode as ThemeMode;
      }
      this.applyTheme();
    });
    
    themeLogger.info('Theme manager initialized');
  }

  /**
   * Set the theme mode
   * @param mode - Theme mode
   */
  setTheme(mode: ThemeMode): void {
    this.currentTheme = mode;
    chrome.storage.local.set({ themeMode: mode });
    this.applyTheme();
    themeLogger.info(`Theme set to ${mode}`);
  }

  /**
   * Toggle between light and dark mode
   */
  toggleTheme(): void {
    const isDark = this.isDarkMode();
    this.setTheme(isDark ? 'light' : 'dark');
    themeLogger.info(`Theme toggled to ${isDark ? 'light' : 'dark'}`);
  }

  /**
   * Get the current theme mode
   * @returns Current theme mode
   */
  getTheme(): ThemeMode {
    return this.currentTheme;
  }

  /**
   * Check if dark mode is active
   * @returns Whether dark mode is active
   */
  isDarkMode(): boolean {
    if (this.currentTheme === 'system') {
      return this.systemDarkMode;
    }
    return this.currentTheme === 'dark';
  }

  /**
   * Apply the current theme
   */
  private applyTheme(): void {
    const isDark = this.isDarkMode();
    document.documentElement.classList.toggle('dark-theme', isDark);
    
    // Update theme toggle button
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      const icon = themeToggle.querySelector('i');
      if (icon) {
        icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
      }
      themeToggle.title = isDark ? 'Switch to light mode' : 'Switch to dark mode';
    }
    
    // Apply theme colors as CSS variables
    const colors = isDark ? darkColors : lightColors;
    Object.entries(colors).forEach(([key, value]) => {
      document.documentElement.style.setProperty(`--color-${key}`, value);
    });

    // Notify listeners
    this.notifyThemeChangeListeners();
    
    themeLogger.debug(`Applied ${isDark ? 'dark' : 'light'} theme`);
  }

  /**
   * Add a theme change listener
   * @param listener - Theme change listener
   */
  addThemeChangeListener(listener: Function): void {
    this.themeChangeListeners.push(listener);
  }

  /**
   * Remove a theme change listener
   * @param listener - Theme change listener
   */
  removeThemeChangeListener(listener: Function): void {
    this.themeChangeListeners = this.themeChangeListeners.filter(l => l !== listener);
  }

  /**
   * Notify theme change listeners
   */
  private notifyThemeChangeListeners(): void {
    const isDark = this.isDarkMode();
    this.themeChangeListeners.forEach(listener => {
      try {
        listener(isDark);
      } catch (error) {
        themeLogger.error('Error in theme change listener', error);
      }
    });
  }
}
