/**
 * Debug settings manager for The New Fuse - AI Bridge
 */
import { Logger } from '../utils/logger.js';
import { DebugSettings } from '../types.js';

// Create a settings-specific logger
const settingsLogger = new Logger({
  name: 'DebugSettings',
  level: 'debug',
  saveToStorage: true
});

/**
 * Default debug settings
 */
const DEFAULT_DEBUG_SETTINGS: DebugSettings = {
  debugMode: false,
  verboseLogging: false,
  logToConsole: true,
  logToStorage: true,
  maxLogSize: 1000
};

/**
 * Debug settings manager
 */
export class DebugSettingsManager {
  private settings: DebugSettings = { ...DEFAULT_DEBUG_SETTINGS };

  /**
   * Initialize settings manager
   */
  async initialize(): Promise<void> {
    await this.loadSettings();
    this.updateUI();
    
    // Add event listeners
    const saveButton = document.getElementById('save-debug-settings');
    const resetButton = document.getElementById('reset-debug-settings');
    
    if (saveButton) {
      saveButton.addEventListener('click', () => this.saveSettings());
    }
    
    if (resetButton) {
      resetButton.addEventListener('click', () => this.resetSettings());
    }
    
    settingsLogger.info('Debug settings manager initialized');
  }

  /**
   * Load settings from storage
   */
  private async loadSettings(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(['debugSettings']);
      if (result.debugSettings) {
        this.settings = { ...DEFAULT_DEBUG_SETTINGS, ...result.debugSettings };
        settingsLogger.info('Loaded debug settings', this.settings);
      }
    } catch (error) {
      settingsLogger.error('Error loading debug settings', error);
    }
  }

  /**
   * Save settings to storage
   */
  private async saveSettings(): Promise<void> {
    try {
      // Get settings from UI
      const debugMode = (document.getElementById('debug-mode') as HTMLInputElement)?.checked || false;
      const verboseLogging = (document.getElementById('verbose-logging') as HTMLInputElement)?.checked || false;
      const logToConsole = (document.getElementById('log-to-console') as HTMLInputElement)?.checked || true;
      const logToStorage = (document.getElementById('log-to-storage') as HTMLInputElement)?.checked || true;
      const maxLogSize = parseInt((document.getElementById('max-log-size') as HTMLInputElement)?.value || '1000', 10);
      
      // Update settings
      this.settings = {
        debugMode,
        verboseLogging,
        logToConsole,
        logToStorage,
        maxLogSize: isNaN(maxLogSize) ? 1000 : maxLogSize
      };
      
      // Save to storage
      await chrome.storage.local.set({ debugSettings: this.settings });
      
      settingsLogger.info('Saved debug settings', this.settings);
      alert('Debug settings saved');
    } catch (error) {
      settingsLogger.error('Error saving debug settings', error);
    }
  }

  /**
   * Reset settings to defaults
   */
  private async resetSettings(): Promise<void> {
    try {
      // Reset settings
      this.settings = { ...DEFAULT_DEBUG_SETTINGS };
      
      // Save to storage
      await chrome.storage.local.set({ debugSettings: this.settings });
      
      // Update UI
      this.updateUI();
      
      settingsLogger.info('Reset debug settings to defaults');
      alert('Debug settings reset to defaults');
    } catch (error) {
      settingsLogger.error('Error resetting debug settings', error);
    }
  }

  /**
   * Update UI with current settings
   */
  private updateUI(): void {
    // Update UI elements
    const debugMode = document.getElementById('debug-mode') as HTMLInputElement;
    const verboseLogging = document.getElementById('verbose-logging') as HTMLInputElement;
    const logToConsole = document.getElementById('log-to-console') as HTMLInputElement;
    const logToStorage = document.getElementById('log-to-storage') as HTMLInputElement;
    const maxLogSize = document.getElementById('max-log-size') as HTMLInputElement;
    
    if (debugMode) {
      debugMode.checked = this.settings.debugMode;
    }
    
    if (verboseLogging) {
      verboseLogging.checked = this.settings.verboseLogging;
    }
    
    if (logToConsole) {
      logToConsole.checked = this.settings.logToConsole;
    }
    
    if (logToStorage) {
      logToStorage.checked = this.settings.logToStorage;
    }
    
    if (maxLogSize) {
      maxLogSize.value = this.settings.maxLogSize.toString();
    }
  }

  /**
   * Get current settings
   * @returns Current debug settings
   */
  getSettings(): DebugSettings {
    return { ...this.settings };
  }
}
