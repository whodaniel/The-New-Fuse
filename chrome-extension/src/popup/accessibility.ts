/**
 * Accessibility utilities for The New Fuse - AI Bridge
 */
import { Logger } from '../utils/logger.js';

// Create an accessibility-specific logger
const accessibilityLogger = new Logger({
  name: 'Accessibility',
  level: 'info',
  saveToStorage: true
});

/**
 * Accessibility settings
 */
export interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  keyboardNavigation: boolean;
  screenReader: boolean;
}

/**
 * Default accessibility settings
 */
const DEFAULT_SETTINGS: AccessibilitySettings = {
  highContrast: false,
  largeText: false,
  reducedMotion: false,
  keyboardNavigation: true,
  screenReader: false
};

/**
 * Accessibility manager
 */
export class AccessibilityManager {
  private settings: AccessibilitySettings;
  private changeListeners: Function[] = [];

  /**
   * Create a new AccessibilityManager
   */
  constructor() {
    this.settings = { ...DEFAULT_SETTINGS };
    this.loadSettings();
    this.detectSystemPreferences();
    
    // Listen for system preference changes
    this.setupSystemPreferenceListeners();
    
    accessibilityLogger.info('Accessibility manager initialized');
  }

  /**
   * Load settings from storage
   */
  private async loadSettings(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(['accessibilitySettings']);
      if (result.accessibilitySettings) {
        this.settings = { ...DEFAULT_SETTINGS, ...result.accessibilitySettings };
        this.applySettings();
        accessibilityLogger.info('Loaded accessibility settings', this.settings);
      }
    } catch (error) {
      accessibilityLogger.error('Error loading accessibility settings', error);
    }
  }

  /**
   * Save settings to storage
   */
  private async saveSettings(): Promise<void> {
    try {
      await chrome.storage.local.set({ accessibilitySettings: this.settings });
      accessibilityLogger.info('Saved accessibility settings', this.settings);
    } catch (error) {
      accessibilityLogger.error('Error saving accessibility settings', error);
    }
  }

  /**
   * Detect system preferences
   */
  private detectSystemPreferences(): void {
    // Check for reduced motion preference
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion && !this.settings.reducedMotion) {
      this.settings.reducedMotion = true;
      this.saveSettings();
    }
    
    // Check for high contrast preference
    const highContrast = window.matchMedia('(forced-colors: active)').matches;
    if (highContrast && !this.settings.highContrast) {
      this.settings.highContrast = true;
      this.saveSettings();
    }
    
    this.applySettings();
  }

  /**
   * Set up system preference listeners
   */
  private setupSystemPreferenceListeners(): void {
    // Listen for reduced motion preference changes
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
      this.settings.reducedMotion = e.matches;
      this.saveSettings();
      this.applySettings();
    });
    
    // Listen for high contrast preference changes
    window.matchMedia('(forced-colors: active)').addEventListener('change', (e) => {
      this.settings.highContrast = e.matches;
      this.saveSettings();
      this.applySettings();
    });
  }

  /**
   * Apply accessibility settings
   */
  private applySettings(): void {
    // Apply high contrast
    document.documentElement.classList.toggle('high-contrast', this.settings.highContrast);
    
    // Apply large text
    document.documentElement.classList.toggle('large-text', this.settings.largeText);
    
    // Apply reduced motion
    document.documentElement.classList.toggle('reduced-motion', this.settings.reducedMotion);
    
    // Apply keyboard navigation
    document.documentElement.classList.toggle('keyboard-navigation', this.settings.keyboardNavigation);
    
    // Apply screen reader optimizations
    document.documentElement.classList.toggle('screen-reader', this.settings.screenReader);
    
    // Notify listeners
    this.notifyChangeListeners();
    
    accessibilityLogger.info('Applied accessibility settings', this.settings);
  }

  /**
   * Update settings
   * @param settings - New settings
   */
  updateSettings(settings: Partial<AccessibilitySettings>): void {
    this.settings = { ...this.settings, ...settings };
    this.saveSettings();
    this.applySettings();
  }

  /**
   * Get current settings
   * @returns Current accessibility settings
   */
  getSettings(): AccessibilitySettings {
    return { ...this.settings };
  }

  /**
   * Add a change listener
   * @param listener - Change listener
   */
  addChangeListener(listener: Function): void {
    this.changeListeners.push(listener);
  }

  /**
   * Remove a change listener
   * @param listener - Change listener
   */
  removeChangeListener(listener: Function): void {
    this.changeListeners = this.changeListeners.filter(l => l !== listener);
  }

  /**
   * Notify change listeners
   */
  private notifyChangeListeners(): void {
    this.changeListeners.forEach(listener => {
      try {
        listener(this.settings);
      } catch (error) {
        accessibilityLogger.error('Error in accessibility change listener', error);
      }
    });
  }

  /**
   * Set up keyboard navigation
   */
  setupKeyboardNavigation(): void {
    if (!this.settings.keyboardNavigation) return;
    
    // Add focus visible class to focused elements
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        document.documentElement.classList.add('focus-visible');
      }
    });
    
    // Remove focus visible class when mouse is used
    document.addEventListener('mousedown', () => {
      document.documentElement.classList.remove('focus-visible');
    });
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Alt+1 to Alt+9 for tab switching
      if (e.altKey && e.key >= '1' && e.key <= '9') {
        const tabIndex = parseInt(e.key) - 1;
        const tabs = document.querySelectorAll('.tab-button');
        if (tabs[tabIndex]) {
          (tabs[tabIndex] as HTMLElement).click();
          e.preventDefault();
        }
      }
      
      // Alt+S for settings
      if (e.altKey && e.key === 's') {
        const settingsButton = document.getElementById('settings-button');
        if (settingsButton) {
          settingsButton.click();
          e.preventDefault();
        }
      }
      
      // Alt+T for theme toggle
      if (e.altKey && e.key === 't') {
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
          themeToggle.click();
          e.preventDefault();
        }
      }
      
      // Alt+C for connect/disconnect
      if (e.altKey && e.key === 'c') {
        const connectButton = document.getElementById('connect-button');
        if (connectButton) {
          connectButton.click();
          e.preventDefault();
        }
      }
    });
    
    accessibilityLogger.info('Keyboard navigation set up');
  }

  /**
   * Add ARIA attributes to elements
   */
  addAriaAttributes(): void {
    // Add ARIA attributes to tabs
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach((button, index) => {
      const tabId = `tab-${index}`;
      const panelId = `panel-${index}`;
      
      button.setAttribute('role', 'tab');
      button.setAttribute('id', tabId);
      button.setAttribute('aria-controls', panelId);
      button.setAttribute('aria-selected', button.classList.contains('active') ? 'true' : 'false');
      
      if (tabContents[index]) {
        tabContents[index].setAttribute('role', 'tabpanel');
        tabContents[index].setAttribute('id', panelId);
        tabContents[index].setAttribute('aria-labelledby', tabId);
      }
    });
    
    // Add ARIA attributes to connection status
    const connectionStatus = document.querySelector('.connection-status');
    if (connectionStatus) {
      connectionStatus.setAttribute('role', 'status');
      connectionStatus.setAttribute('aria-live', 'polite');
    }
    
    // Add ARIA attributes to notifications
    const notifications = document.querySelectorAll('.notification');
    notifications.forEach(notification => {
      notification.setAttribute('role', 'alert');
      notification.setAttribute('aria-live', 'assertive');
    });
    
    accessibilityLogger.info('ARIA attributes added');
  }
}
