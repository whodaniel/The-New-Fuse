import { ExtensionSettings, OptimizationSettings, FeatureConfig, StorageData } from '../types';
import { Logger } from './logger';

/**
 * Advanced settings manager for Chrome Extension
 * Handles all configuration, feature toggles, and optimization settings
 */
export class SettingsManager {
  private static instance: SettingsManager;
  private logger: Logger;
  private settings: ExtensionSettings;
  private listeners: Map<string, Function[]> = new Map();

  static getInstance(): SettingsManager {
    if (!SettingsManager.instance) {
      SettingsManager.instance = new SettingsManager();
    }
    return SettingsManager.instance;
  }

  private constructor() {
    this.logger = new Logger({ name: 'SettingsManager', saveToStorage: true });
    this.settings = this.getDefaultSettings();
    this.initialize();
  }

  private getDefaultSettings(): ExtensionSettings {
    return {
      darkMode: false,
      notifications: true,
      autoConnect: true,
      debugMode: false,
      telemetry: true,
      optimization: {
        autoDetectChatElements: true,
        enablePerformanceMonitoring: true,
        adaptiveWebSocketRetry: true,
        intelligentCaching: true,
        prioritizeActiveTabs: true,
        batchDOMOperations: true,
        limitBackgroundProcessing: false,
        compressionLevel: 'medium'
      },
      features: {
        'ai-detection': {
          id: 'ai-detection',
          name: 'AI Element Detection',
          description: 'Automatically detect chat interface elements using AI',
          enabled: true,
          category: 'ai',
          impact: 'medium',
          settings: {
            confidence: 0.8,
            scanInterval: 5000,
            deepScan: true
          }
        },
        'chat-integration': {
          id: 'chat-integration',
          name: 'Multi-Platform Chat Integration',
          description: 'Integrate with multiple chat platforms',
          enabled: true,
          category: 'ai',
          impact: 'high',
          dependencies: ['ai-detection']
        },
        'performance-monitoring': {
          id: 'performance-monitoring',
          name: 'Performance Monitoring',
          description: 'Monitor extension and page performance',
          enabled: true,
          category: 'performance',
          impact: 'low'
        },
        'websocket-enhancement': {
          id: 'websocket-enhancement',
          name: 'Enhanced WebSocket Management',
          description: 'Advanced WebSocket connection management',
          enabled: true,
          category: 'connectivity',
          impact: 'medium'
        },
        'auto-optimization': {
          id: 'auto-optimization',
          name: 'Auto Performance Optimization',
          description: 'Automatically optimize performance based on usage',
          enabled: false,
          category: 'performance',
          impact: 'high',
          dependencies: ['performance-monitoring']
        }
      }
    };
  }

  private async initialize() {
    try {
      await this.loadSettings();
      this.logger.info('Settings manager initialized');
    } catch (error) {
      this.logger.error('Failed to initialize settings manager', error);
    }
  }

  async loadSettings(): Promise<void> {
    try {
      const result = await chrome.storage.sync.get(['extensionSettings']);
      if (result.extensionSettings) {
        this.settings = this.mergeSettings(this.settings, result.extensionSettings);
        this.logger.info('Settings loaded from storage');
      }
    } catch (error) {
      this.logger.error('Failed to load settings', error);
      // Fall back to local storage
      try {
        const localResult = await chrome.storage.local.get(['extensionSettings']);
        if (localResult.extensionSettings) {
          this.settings = this.mergeSettings(this.settings, localResult.extensionSettings);
          this.logger.info('Settings loaded from local storage');
        }
      } catch (localError) {
        this.logger.error('Failed to load from local storage', localError);
      }
    }
  }

  async saveSettings(): Promise<void> {
    try {
      await chrome.storage.sync.set({ extensionSettings: this.settings });
      this.logger.info('Settings saved to sync storage');
      
      // Also save to local storage as backup
      await chrome.storage.local.set({ extensionSettings: this.settings });
      
      this.notifyListeners('settings-changed', this.settings);
    } catch (error) {
      this.logger.error('Failed to save settings', error);
      // Try local storage only
      try {
        await chrome.storage.local.set({ extensionSettings: this.settings });
        this.logger.info('Settings saved to local storage only');
      } catch (localError) {
        this.logger.error('Failed to save to local storage', localError);
      }
    }
  }

  private mergeSettings(defaults: ExtensionSettings, stored: Partial<ExtensionSettings>): ExtensionSettings {
    return {
      ...defaults,
      ...stored,
      optimization: {
        ...defaults.optimization,
        ...(stored.optimization || {})
      },
      features: {
        ...defaults.features,
        ...(stored.features || {})
      }
    };
  }

  // Feature management
  async toggleFeature(featureId: string, enabled?: boolean): Promise<boolean> {
    const feature = this.settings.features[featureId];
    if (!feature) {
      this.logger.warn(`Feature ${featureId} not found`);
      return false;
    }

    const newState = enabled !== undefined ? enabled : !feature.enabled;
    
    // Check dependencies
    if (newState && feature.dependencies) {
      for (const dep of feature.dependencies) {
        if (!this.settings.features[dep]?.enabled) {
          this.logger.warn(`Cannot enable ${featureId}: dependency ${dep} is disabled`);
          return false;
        }
      }
    }

    // Check dependents before disabling
    if (!newState) {
      const dependents = this.getDependentFeatures(featureId);
      for (const dependent of dependents) {
        if (this.settings.features[dependent]?.enabled) {
          this.logger.warn(`Cannot disable ${featureId}: ${dependent} depends on it`);
          return false;
        }
      }
    }

    this.settings.features[featureId].enabled = newState;
    await this.saveSettings();
    
    this.logger.info(`Feature ${featureId} ${newState ? 'enabled' : 'disabled'}`);
    this.notifyListeners('feature-toggled', { featureId, enabled: newState });
    
    return true;
  }

  private getDependentFeatures(featureId: string): string[] {
    return Object.keys(this.settings.features).filter(id => 
      this.settings.features[id].dependencies?.includes(featureId)
    );
  }

  isFeatureEnabled(featureId: string): boolean {
    return this.settings.features[featureId]?.enabled || false;
  }

  getFeature(featureId: string): FeatureConfig | undefined {
    return this.settings.features[featureId];
  }

  getAllFeatures(): Record<string, FeatureConfig> {
    return { ...this.settings.features };
  }

  getFeaturesByCategory(category: FeatureConfig['category']): FeatureConfig[] {
    return Object.values(this.settings.features).filter(feature => feature.category === category);
  }

  // Optimization settings
  async updateOptimizationSettings(updates: Partial<OptimizationSettings>): Promise<void> {
    this.settings.optimization = {
      ...this.settings.optimization,
      ...updates
    };
    await this.saveSettings();
    this.logger.info('Optimization settings updated', updates);
  }

  getOptimizationSettings(): OptimizationSettings {
    return { ...this.settings.optimization };
  }

  // General settings
  async updateSettings(updates: Partial<ExtensionSettings>): Promise<void> {
    // Handle nested objects properly
    const newSettings = { ...this.settings };
    
    Object.keys(updates).forEach(key => {
      if (key === 'optimization' && updates.optimization) {
        newSettings.optimization = {
          ...newSettings.optimization,
          ...updates.optimization
        };
      } else if (key === 'features' && updates.features) {
        newSettings.features = {
          ...newSettings.features,
          ...updates.features
        };
      } else {
        (newSettings as any)[key] = (updates as any)[key];
      }
    });

    this.settings = newSettings;
    await this.saveSettings();
    this.logger.info('Settings updated', Object.keys(updates));
  }

  getSettings(): ExtensionSettings {
    return { ...this.settings };
  }

  // Event listeners
  addEventListener(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  removeEventListener(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private notifyListeners(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          this.logger.error(`Error in event listener for ${event}`, error);
        }
      });
    }
  }

  // Import/Export
  async exportSettings(): Promise<string> {
    const exportData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      settings: this.settings
    };
    return JSON.stringify(exportData, null, 2);
  }

  async importSettings(jsonData: string): Promise<boolean> {
    try {
      const importData = JSON.parse(jsonData);
      if (importData.settings) {
        await this.updateSettings(importData.settings);
        this.logger.info('Settings imported successfully');
        return true;
      }
      return false;
    } catch (error) {
      this.logger.error('Failed to import settings', error);
      return false;
    }
  }

  // Reset to defaults
  async resetToDefaults(): Promise<void> {
    this.settings = this.getDefaultSettings();
    await this.saveSettings();
    this.logger.info('Settings reset to defaults');
  }

  // Performance optimization recommendations
  getOptimizationRecommendations(): Array<{
    type: 'feature' | 'setting';
    target: string;
    action: 'enable' | 'disable' | 'change';
    reason: string;
    impact: 'low' | 'medium' | 'high';
  }> {
    const recommendations = [];

    // Example recommendations based on current settings
    if (!this.settings.optimization.intelligentCaching) {
      recommendations.push({
        type: 'setting',
        target: 'intelligentCaching',
        action: 'enable',
        reason: 'Reduces memory usage and improves response times',
        impact: 'medium'
      });
    }

    if (this.settings.features['auto-optimization']?.enabled === false) {
      recommendations.push({
        type: 'feature',
        target: 'auto-optimization',
        action: 'enable',
        reason: 'Automatically optimizes performance based on usage patterns',
        impact: 'high'
      });
    }

    return recommendations;
  }
}

// Export singleton instance
export const settingsManager = SettingsManager.getInstance();
