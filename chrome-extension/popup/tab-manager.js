/**
 * Tab manager for The New Fuse - AI Bridge
 */
import { Logger } from '../utils/logger.js';
// Create a tab-specific logger
const tabLogger = new Logger({
    name: 'TabManager',
    level: 'info',
    saveToStorage: true
});
/**
 * Tab manager
 */
export class TabManager {
    /**
     * Create a new TabManager
     */
    constructor() {
        this.activeTab = 'chat-tab';
        this.tabChangeListeners = [];
        // Load active tab from storage
        chrome.storage.local.get(['activeTab'], (result) => {
            if (result.activeTab) {
                this.activeTab = result.activeTab;
                this.updateUI();
            }
        });
        tabLogger.info('Tab manager initialized');
    }
    /**
     * Initialize tab manager
     */
    initialize() {
        // Add event listeners to tab buttons
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                const tab = event.currentTarget.getAttribute('data-tab');
                if (tab) {
                    this.setActiveTab(tab);
                }
            });
        });
        // Update UI
        this.updateUI();
        tabLogger.info('Tab manager event listeners initialized');
    }
    /**
     * Set active tab
     * @param tab - Tab ID
     */
    setActiveTab(tab) {
        this.activeTab = tab;
        chrome.storage.local.set({ activeTab: tab });
        this.updateUI();
        this.notifyTabChangeListeners();
        tabLogger.debug(`Active tab set to ${tab}`);
    }
    /**
     * Get active tab
     * @returns Active tab ID
     */
    getActiveTab() {
        return this.activeTab;
    }
    /**
     * Update the UI based on active tab
     */
    updateUI() {
        // Update tab buttons
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            const tab = button.getAttribute('data-tab');
            button.classList.toggle('active', tab === this.activeTab);
        });
        // Update tab contents
        const tabContents = document.querySelectorAll('.tab-content');
        tabContents.forEach(content => {
            content.classList.toggle('active', content.id === this.activeTab);
        });
    }
    /**
     * Add a tab change listener
     * @param listener - Tab change listener
     */
    addTabChangeListener(listener) {
        this.tabChangeListeners.push(listener);
    }
    /**
     * Remove a tab change listener
     * @param listener - Tab change listener
     */
    removeTabChangeListener(listener) {
        this.tabChangeListeners = this.tabChangeListeners.filter(l => l !== listener);
    }
    /**
     * Notify tab change listeners
     */
    notifyTabChangeListeners() {
        this.tabChangeListeners.forEach(listener => {
            try {
                listener(this.activeTab);
            }
            catch (error) {
                tabLogger.error('Error in tab change listener', error);
            }
        });
    }
}
//# sourceMappingURL=tab-manager.js.map