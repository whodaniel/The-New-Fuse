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
  private activeTab: string = 'chat-tab';
  private tabChangeListeners: Function[] = [];

  /**
   * Create a new TabManager
   */
  constructor() {
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
  initialize(): void {
    // Add event listeners to tab buttons
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
      button.addEventListener('click', (event) => {
        const tab = (event.currentTarget as HTMLElement).getAttribute('data-tab');
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
  setActiveTab(tab: string): void {
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
  getActiveTab(): string {
    return this.activeTab;
  }

  /**
   * Update the UI based on active tab
   */
  private updateUI(): void {
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
  addTabChangeListener(listener: Function): void {
    this.tabChangeListeners.push(listener);
  }

  /**
   * Remove a tab change listener
   * @param listener - Tab change listener
   */
  removeTabChangeListener(listener: Function): void {
    this.tabChangeListeners = this.tabChangeListeners.filter(l => l !== listener);
  }

  /**
   * Notify tab change listeners
   */
  private notifyTabChangeListeners(): void {
    this.tabChangeListeners.forEach(listener => {
      try {
        listener(this.activeTab);
      } catch (error) {
        tabLogger.error('Error in tab change listener', error);
      }
    });
  }
}
