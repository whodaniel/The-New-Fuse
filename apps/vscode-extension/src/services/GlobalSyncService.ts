import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';
import { LLMProviderType } from '../core/types';
import { log } from '../utils/logger';

/**
 * Service to synchronize VS Code extension settings with the global
 * The New Fuse configuration (~/.tnf/providers.json)
 */
export class GlobalSyncService {
  private static instance: GlobalSyncService;
  private tnfPath: string;

  private constructor() {
    this.tnfPath = path.join(os.homedir(), '.tnf');
  }

  static getInstance(): GlobalSyncService {
    if (!GlobalSyncService.instance) {
      GlobalSyncService.instance = new GlobalSyncService();
    }
    return GlobalSyncService.instance;
  }

  /**
   * Load the global provider configuration if it exists
   */
  async loadGlobalConfig(): Promise<any | null> {
    const configPath = path.join(this.tnfPath, 'providers.json');

    if (!fs.existsSync(configPath)) {
      log.info('Global Fuse configuration not found at ~/.tnf/providers.json');
      return null;
    }

    try {
      const data = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      log.error('Failed to parse global Fuse configuration', error);
      return null;
    }
  }

  /**
   * Synchronize global configuration into VS Code secrets and settings
   */
  async sync(): Promise<void> {
    const globalConfig = await this.loadGlobalConfig();
    if (!globalConfig) return;

    log.info('Synchronizing global Fuse configuration to VS Code');

    // 1. Sync Auth Profiles (API Keys)
    if (globalConfig.authProfiles) {
      const configManager = (await import('../core/config')).ConfigManager.getInstance();
      for (const profile of globalConfig.authProfiles) {
        if (profile.credential && profile.credential.type === 'api_key' && profile.credential.key) {
          await configManager.setApiKey(
            profile.providerId as LLMProviderType,
            profile.credential.key
          );
          log.debug(`Synced API key for provider: ${profile.providerId}`);
        }
      }
    }

    // 2. Sync Global Config (Primary Model / Fallbacks)
    if (globalConfig.config) {
      const configManager = (await import('../core/config')).ConfigManager.getInstance();
      const { primaryModelId, fallbackModelIds } = globalConfig.config;

      if (primaryModelId) {
        const [provider, model] = primaryModelId.split('/');
        if (provider && model) {
          // We can update default provider/model if user prefers
          log.debug(`Global primary model discovered: ${model} on ${provider}`);
        }
      }
    }

    vscode.window.showInformationMessage('The New Fuse: Global configuration synchronized.');
  }
}
