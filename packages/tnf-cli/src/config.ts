/**
 * Configuration Management for TNF CLI
 *
 * Supports profiles, environment variables, config files,
 * and validation using Zod schemas.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { CLIConfig, CLIConfigSchema } from './types.js';

const CONFIG_DIR = join(homedir(), '.tnf');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');
const PROFILES_DIR = join(CONFIG_DIR, 'profiles');

// Default configuration
export const DEFAULT_CONFIG: CLIConfig = {
  agent: {
    name: 'tnf-agent',
    role: 'participant',
    platform: 'vscode',
    capabilities: ['general'],
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    tls: {
      enabled: process.env.REDIS_TLS === 'true',
      ca: process.env.REDIS_TLS_CA,
      cert: process.env.REDIS_TLS_CERT,
      key: process.env.REDIS_TLS_KEY,
    },
    keyPrefix: 'tnf:',
  },
  auth: {
    type: (process.env.TNF_AUTH_TYPE as any) || 'none',
    apiKey: process.env.TNF_API_KEY,
    jwtSecret: process.env.TNF_JWT_SECRET,
  },
  logging: {
    level: (process.env.TNF_LOG_LEVEL as any) || 'info',
    format: (process.env.TNF_LOG_FORMAT as any) || 'pretty',
    output: (process.env.TNF_LOG_OUTPUT as any) || 'console',
    filePath: process.env.TNF_LOG_FILE || join(CONFIG_DIR, 'logs', 'tnf-cli.log'),
    includeTraceId: process.env.TNF_LOG_TRACE !== 'false',
  },
  reliability: {
    messageTimeoutMs: parseInt(process.env.TNF_MESSAGE_TIMEOUT || '30000'),
    maxRetries: parseInt(process.env.TNF_MAX_RETRIES || '3'),
    retryDelayMs: parseInt(process.env.TNF_RETRY_DELAY || '1000'),
    enableAcks: process.env.TNF_ENABLE_ACKS !== 'false',
    deadLetterQueue: process.env.TNF_DLQ_ENABLED === 'true',
  },
  heartbeat: {
    intervalMs: parseInt(process.env.TNF_HEARTBEAT_INTERVAL || '30000'),
    timeoutMs: parseInt(process.env.TNF_HEARTBEAT_TIMEOUT || '120000'),
    maxRetries: parseInt(process.env.TNF_HEARTBEAT_MAX_RETRIES || '3'),
  },
};

export class ConfigManager {
  private config: CLIConfig;
  private currentProfile: string = 'default';

  constructor() {
    this.ensureConfigDir();
    this.config = this.loadConfig();
  }

  private ensureConfigDir(): void {
    if (!existsSync(CONFIG_DIR)) {
      mkdirSync(CONFIG_DIR, { recursive: true });
    }
    if (!existsSync(PROFILES_DIR)) {
      mkdirSync(PROFILES_DIR, { recursive: true });
    }
  }

  private loadConfig(): CLIConfig {
    // Load from file if exists
    if (existsSync(CONFIG_FILE)) {
      try {
        const fileContent = readFileSync(CONFIG_FILE, 'utf-8');
        const fileConfig = JSON.parse(fileContent);
        return this.mergeConfig(DEFAULT_CONFIG, fileConfig);
      } catch (error) {
        console.warn('Failed to load config file, using defaults:', error);
      }
    }

    // Check for profile-specific config
    const profile = process.env.TNF_PROFILE || 'default';
    const profilePath = join(PROFILES_DIR, `${profile}.json`);

    if (existsSync(profilePath)) {
      try {
        const profileContent = readFileSync(profilePath, 'utf-8');
        const profileConfig = JSON.parse(profileContent);
        this.currentProfile = profile;
        return this.mergeConfig(DEFAULT_CONFIG, profileConfig);
      } catch (error) {
        console.warn(`Failed to load profile ${profile}, using defaults:`, error);
      }
    }

    return DEFAULT_CONFIG;
  }

  private mergeConfig(base: CLIConfig, override: Partial<CLIConfig>): CLIConfig {
    return {
      ...base,
      ...override,
      agent: { ...base.agent, ...override.agent },
      redis: { ...base.redis, ...override.redis },
      auth: { ...base.auth, ...override.auth },
      logging: { ...base.logging, ...override.logging },
      reliability: { ...base.reliability, ...override.reliability },
      heartbeat: { ...base.heartbeat, ...override.heartbeat },
    };
  }

  getConfig(): CLIConfig {
    return { ...this.config };
  }

  get<K extends keyof CLIConfig>(key: K): CLIConfig[K] {
    return this.config[key];
  }

  set<K extends keyof CLIConfig>(key: K, value: CLIConfig[K]): void {
    this.config[key] = value;
    this.saveConfig();
  }

  update(updates: Partial<CLIConfig>): void {
    this.config = this.mergeConfig(this.config, updates);
    this.saveConfig();
  }

  validate(): { valid: boolean; errors?: string[] } {
    try {
      CLIConfigSchema.parse(this.config);
      return { valid: true };
    } catch (error: any) {
      if (error.errors) {
        return {
          valid: false,
          errors: error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`),
        };
      }
      return { valid: false, errors: [error.message] };
    }
  }

  saveConfig(): void {
    const result = this.validate();
    if (!result.valid) {
      throw new Error(`Invalid config: ${result.errors?.join(', ')}`);
    }

    try {
      writeFileSync(CONFIG_FILE, JSON.stringify(this.config, null, 2));
    } catch (error) {
      throw new Error(`Failed to save config: ${error}`);
    }
  }

  // Profile management
  createProfile(name: string, config: Partial<CLIConfig>): void {
    const profilePath = join(PROFILES_DIR, `${name}.json`);
    const fullConfig = this.mergeConfig(DEFAULT_CONFIG, config);

    try {
      writeFileSync(profilePath, JSON.stringify(fullConfig, null, 2));
    } catch (error) {
      throw new Error(`Failed to create profile ${name}: ${error}`);
    }
  }

  loadProfile(name: string): void {
    const profilePath = join(PROFILES_DIR, `${name}.json`);

    if (!existsSync(profilePath)) {
      throw new Error(`Profile ${name} not found`);
    }

    try {
      const content = readFileSync(profilePath, 'utf-8');
      const profileConfig = JSON.parse(content);
      this.config = this.mergeConfig(DEFAULT_CONFIG, profileConfig);
      this.currentProfile = name;
    } catch (error) {
      throw new Error(`Failed to load profile ${name}: ${error}`);
    }
  }

  deleteProfile(name: string): void {
    if (name === 'default') {
      throw new Error('Cannot delete default profile');
    }

    const profilePath = join(PROFILES_DIR, `${name}.json`);

    if (!existsSync(profilePath)) {
      throw new Error(`Profile ${name} not found`);
    }

    try {
      unlinkSync(profilePath);
    } catch (error) {
      throw new Error(`Failed to delete profile ${name}: ${error}`);
    }
  }

  listProfiles(): string[] {
    try {
      const files = readdirSync(PROFILES_DIR);
      return files
        .filter((f: string) => f.endsWith('.json'))
        .map((f: string) => f.replace('.json', ''));
    } catch {
      return [];
    }
  }

  getCurrentProfile(): string {
    return this.currentProfile;
  }

  // Environment detection
  detectEnvironment(): { isDev: boolean; isCI: boolean; isDocker: boolean } {
    return {
      isDev: process.env.NODE_ENV === 'development' || !process.env.NODE_ENV,
      isCI: !!process.env.CI,
      isDocker: existsSync('/.dockerenv') || process.env.DOCKER_CONTAINER === 'true',
    };
  }

  // Export/Import
  exportConfig(): string {
    return JSON.stringify(this.config, null, 2);
  }

  importConfig(jsonString: string): void {
    try {
      const imported = JSON.parse(jsonString);
      this.config = this.mergeConfig(DEFAULT_CONFIG, imported);
      this.saveConfig();
    } catch (error) {
      throw new Error(`Failed to import config: ${error}`);
    }
  }
}

// Singleton instance
let configManager: ConfigManager | null = null;

export function getConfigManager(): ConfigManager {
  if (!configManager) {
    configManager = new ConfigManager();
  }
  return configManager;
}

export function resetConfigManager(): void {
  configManager = null;
}

// Helper to get config from environment with defaults
export function getEnvConfig(): CLIConfig {
  return DEFAULT_CONFIG;
}
