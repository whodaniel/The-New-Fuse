import { Injectable } from '@nestjs/common';

// Mock VaultService interface for when service is not available
interface IVaultService {
  getSecret(key: string): Promise<any>;
  setSecret(key: string, value: any): Promise<void>;
  deleteSecret(key: string): Promise<boolean>;
}

export interface ConfigurationOptions {
  environment: 'development' | 'production' | 'staging';
  encryptionKey?: string;
  vaultEnabled?: boolean;
  cache?: {
    enabled: boolean;
    ttl: number;
  };
}

export interface ConfigValue {
  key: string;
  value: any;
  encrypted?: boolean;
  lastUpdated?: Date;
}

@Injectable()
export class ConfigurationManager {
  private configCache: Map<string, ConfigValue> = new Map();
  private readonly options: ConfigurationOptions;

  constructor(
    private readonly vaultService?: IVaultService,
    options: Partial<ConfigurationOptions> = {}
  ) {
    this.options = {
      environment: 'development',
      encryptionKey: process.env.CONFIG_ENCRYPTION_KEY,
      vaultEnabled: process.env.VAULT_ENABLED === 'true',
      cache: {
        enabled: true,
        ttl: 300000 // 5 minutes
      },
      ...options
    };
  }

  async get<T = any>(key: string): Promise<T | null> {
    // Check cache first
    if (this.options.cache?.enabled && this.configCache.has(key)) {
      const cached = this.configCache.get(key);
      if (cached && this.isValidCache(cached)) {
        return cached.value as T;
      }
    }

    // Try environment variables first
    const envValue = process.env[key];
    if (envValue) {
      const configValue: ConfigValue = {
        key,
        value: this.parseValue(envValue),
        lastUpdated: new Date()
      };
      this.setCacheValue(key, configValue);
      return configValue.value as T;
    }

    // Try vault if enabled
    if (this.options.vaultEnabled && this.vaultService) {
      try {
        const vaultValue = await this.vaultService.getSecret(key);
        if (vaultValue) {
          const configValue: ConfigValue = {
            key,
            value: vaultValue,
            encrypted: true,
            lastUpdated: new Date()
          };
          this.setCacheValue(key, configValue);
          return configValue.value as T;
        }
      } catch (error) {
        console.warn(`Failed to retrieve ${key} from vault:`, error);
      }
    }

    return null;
  }

  async set(key: string, value: any, encrypted: boolean = false): Promise<void> {
    const configValue: ConfigValue = {
      key,
      value,
      encrypted,
      lastUpdated: new Date()
    };

    // Store in vault if enabled and encryption requested
    if (this.options.vaultEnabled && encrypted && this.vaultService) {
      try {
        await this.vaultService.setSecret(key, value);
      } catch (error) {
        console.error(`Failed to store ${key} in vault:`, error);
        throw error;
      }
    }

    // Update cache
    this.setCacheValue(key, configValue);
  }

  async delete(key: string): Promise<boolean> {
    // Remove from cache
    this.configCache.delete(key);

    // Remove from vault if enabled
    if (this.options.vaultEnabled && this.vaultService) {
      try {
        return await this.vaultService.deleteSecret(key);
      } catch (error) {
        console.warn(`Failed to delete ${key} from vault:`, error);
        return false;
      }
    }

    return true;
  }

  async refresh(key?: string): Promise<void> {
    if (key) {
      this.configCache.delete(key);
    } else {
      this.configCache.clear();
    }
  }

  getEnvironment(): string {
    return this.options.environment;
  }

  isProduction(): boolean {
    return this.options.environment === 'production';
  }

  isDevelopment(): boolean {
    return this.options.environment === 'development';
  }

  private parseValue(value: string): any {
    // Try to parse as JSON first
    try {
      return JSON.parse(value);
    } catch {
      // Return as string if not valid JSON
      return value;
    }
  }

  private setCacheValue(key: string, value: ConfigValue): void {
    if (this.options.cache?.enabled) {
      this.configCache.set(key, value);
    }
  }

  private isValidCache(cached: ConfigValue): boolean {
    if (!this.options.cache?.enabled || !cached.lastUpdated) {
      return false;
    }
    
    const now = new Date().getTime();
    const cacheTime = cached.lastUpdated.getTime();
    const ttl = this.options.cache.ttl;
    
    return (now - cacheTime) < ttl;
  }
}