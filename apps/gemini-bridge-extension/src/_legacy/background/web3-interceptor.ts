/**
 * Web3 URL Interceptor
 * Automatically intercepts and resolves Web3 URLs before navigation
 */

import { Logger } from '../utils/logger.js';
import {
  DEFAULT_WEB3_CONFIG,
  getWeb3Protocol,
  isWeb3Url,
  resolveWeb3Url,
  validateWeb3Url,
  type Web3Config,
} from '../utils/web3-url-resolver.js';

export class Web3Interceptor {
  private logger: Logger;
  private config: Web3Config;
  private enabled: boolean = true;

  constructor(logger?: Logger) {
    this.logger =
      logger ||
      new Logger({
        name: 'Web3Interceptor',
        level: 'info',
      });
    this.config = DEFAULT_WEB3_CONFIG;
    this.loadConfig();
  }

  /**
   * Load Web3 configuration from Chrome storage
   */
  private async loadConfig(): Promise<void> {
    try {
      const result = await chrome.storage.sync.get(['web3Config', 'web3Enabled']);

      if (result.web3Config) {
        this.config = { ...DEFAULT_WEB3_CONFIG, ...result.web3Config };
      }

      if (typeof result.web3Enabled === 'boolean') {
        this.enabled = result.web3Enabled;
      }

      this.logger.info('Web3 configuration loaded', { config: this.config, enabled: this.enabled });
    } catch (error) {
      this.logger.error('Failed to load Web3 configuration', error);
    }
  }

  /**
   * Save Web3 configuration to Chrome storage
   */
  async saveConfig(config: Partial<Web3Config>): Promise<void> {
    try {
      this.config = { ...this.config, ...config };
      await chrome.storage.sync.set({ web3Config: this.config });
      this.logger.info('Web3 configuration saved', this.config);
    } catch (error) {
      this.logger.error('Failed to save Web3 configuration', error);
      throw error;
    }
  }

  /**
   * Enable or disable Web3 URL resolution
   */
  async setEnabled(enabled: boolean): Promise<void> {
    try {
      this.enabled = enabled;
      await chrome.storage.sync.set({ web3Enabled: enabled });
      this.logger.info(`Web3 URL resolution ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      this.logger.error('Failed to set Web3 enabled state', error);
      throw error;
    }
  }

  /**
   * Check if Web3 resolution is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get current Web3 configuration
   */
  getConfig(): Web3Config {
    return { ...this.config };
  }

  /**
   * Intercept and potentially resolve a URL
   *
   * @param url - The URL to potentially intercept
   * @returns Object with resolved URL and metadata
   */
  interceptUrl(url: string): {
    url: string;
    wasWeb3: boolean;
    protocol?: string;
    originalUrl?: string;
    error?: string;
  } {
    // If Web3 is disabled, return original URL
    if (!this.enabled) {
      return { url, wasWeb3: false };
    }

    // Check if it's a Web3 URL
    if (!isWeb3Url(url)) {
      return { url, wasWeb3: false };
    }

    // Validate the Web3 URL
    const validation = validateWeb3Url(url);
    if (!validation.valid) {
      this.logger.warn(`Invalid Web3 URL: ${url}`, validation.error);
      return {
        url,
        wasWeb3: true,
        error: validation.error,
      };
    }

    const protocol = getWeb3Protocol(url);
    const resolvedUrl = resolveWeb3Url(url, this.config);

    this.logger.info(`Resolved Web3 URL: ${url} -> ${resolvedUrl}`, {
      protocol,
      originalUrl: url,
    });

    return {
      url: resolvedUrl,
      wasWeb3: true,
      protocol: protocol || undefined,
      originalUrl: url,
    };
  }

  /**
   * Show notification about Web3 URL resolution
   */
  async showNotification(
    originalUrl: string,
    resolvedUrl: string,
    protocol: string
  ): Promise<void> {
    try {
      await chrome.notifications.create({
        type: 'basic',
        iconUrl: chrome.runtime.getURL('icons/icon128.png'),
        title: `Web3 URL Resolved (${protocol.toUpperCase()})`,
        message: `Navigating to: ${resolvedUrl}`,
        priority: 1,
      });
    } catch (error) {
      this.logger.error('Failed to show notification', error);
    }
  }
}

// Create singleton instance
export const web3Interceptor = new Web3Interceptor();
