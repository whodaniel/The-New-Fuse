import * as vscode from 'vscode';
import { getLogger } from './logging.js';

/**
 * Configuration service for The New Fuse extension
 * Provides a centralized way to access extension settings
 */
export class ConfigurationService {
  static #instance;
  #logger;
  #configSection = 'thefuse';

  constructor() {
    this.#logger = getLogger();
  }

  /**
   * Get the singleton instance of the configuration service
   */
  static getInstance() {
    if (!ConfigurationService.#instance) {
      ConfigurationService.#instance = new ConfigurationService();
    }
    return ConfigurationService.#instance;
  }

  /**
   * Get a setting value from VS Code configuration
   * @template T The expected type of the setting
   * @param {string} key The setting key
   * @param {T} defaultValue The default value to return if the setting is not found
   * @returns {T} The setting value or the default value
   */
  getSetting(key, defaultValue) {
    try {
      const config = vscode.workspace.getConfiguration(this.#configSection);
      const value = config.get(key);
      
      if (value === undefined) {
        return defaultValue;
      }
      
      return value;
    } catch (error) {
      this.#logger.error(`Error getting setting ${key}:`, error);
      return defaultValue;
    }
  }

  /**
   * Update a setting value in VS Code configuration
   * @template T The type of the setting value
   * @param {string} key The setting key
   * @param {T} value The new value
   * @param {boolean} global Whether to update the setting globally or for the workspace
   * @returns {Promise<void>}
   */
  async updateSetting(key, value, global = false) {
    try {
      const config = vscode.workspace.getConfiguration(this.#configSection);
      const target = global ? vscode.ConfigurationTarget.Global : vscode.ConfigurationTarget.Workspace;
      
      await config.update(key, value, target);
      this.#logger.debug(`Updated setting ${key} to ${JSON.stringify(value)}`);
    } catch (error) {
      this.#logger.error(`Error updating setting ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get all settings for the extension
   * @returns {Record<string, any>} All settings
   */
  getAllSettings() {
    try {
      const config = vscode.workspace.getConfiguration(this.#configSection);
      const settings = {};
      
      // Get all keys and values
      for (const key of Object.keys(config)) {
        if (typeof key === 'string' && !key.startsWith('_')) {
          settings[key] = config.get(key);
        }
      }
      
      return settings;
    } catch (error) {
      this.#logger.error('Error getting all settings:', error);
      return {};
    }
  }
}
