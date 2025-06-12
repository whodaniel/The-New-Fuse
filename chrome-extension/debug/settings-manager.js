/**
 * Debug settings manager for The New Fuse - AI Bridge
 */
import { Logger } from '../utils/logger.js';
// Create a settings-specific logger
const settingsLogger = new Logger({
    name: 'DebugSettings',
    level: 'debug',
    saveToStorage: true
});
/**
 * Default debug settings
 */
const DEFAULT_DEBUG_SETTINGS = {
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
    constructor() {
        this.settings = { ...DEFAULT_DEBUG_SETTINGS };
    }
    /**
     * Initialize settings manager
     */
    async initialize() {
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
    async loadSettings() {
        try {
            const result = await chrome.storage.local.get(['debugSettings']);
            if (result.debugSettings) {
                this.settings = { ...DEFAULT_DEBUG_SETTINGS, ...result.debugSettings };
                settingsLogger.info('Loaded debug settings', this.settings);
            }
        }
        catch (error) {
            settingsLogger.error('Error loading debug settings', error);
        }
    }
    /**
     * Save settings to storage
     */
    async saveSettings() {
        try {
            // Get settings from UI
            const debugMode = document.getElementById('debug-mode')?.checked || false;
            const verboseLogging = document.getElementById('verbose-logging')?.checked || false;
            const logToConsole = document.getElementById('log-to-console')?.checked || true;
            const logToStorage = document.getElementById('log-to-storage')?.checked || true;
            const maxLogSize = parseInt(document.getElementById('max-log-size')?.value || '1000', 10);
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
        }
        catch (error) {
            settingsLogger.error('Error saving debug settings', error);
        }
    }
    /**
     * Reset settings to defaults
     */
    async resetSettings() {
        try {
            // Reset settings
            this.settings = { ...DEFAULT_DEBUG_SETTINGS };
            // Save to storage
            await chrome.storage.local.set({ debugSettings: this.settings });
            // Update UI
            this.updateUI();
            settingsLogger.info('Reset debug settings to defaults');
            alert('Debug settings reset to defaults');
        }
        catch (error) {
            settingsLogger.error('Error resetting debug settings', error);
        }
    }
    /**
     * Update UI with current settings
     */
    updateUI() {
        // Update UI elements
        const debugMode = document.getElementById('debug-mode');
        const verboseLogging = document.getElementById('verbose-logging');
        const logToConsole = document.getElementById('log-to-console');
        const logToStorage = document.getElementById('log-to-storage');
        const maxLogSize = document.getElementById('max-log-size');
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
    getSettings() {
        return { ...this.settings };
    }
}
//# sourceMappingURL=settings-manager.js.map