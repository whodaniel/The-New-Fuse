import * as fs from 'fs';
import * as path from 'path';

/**
 * Default configuration values
 */
const DEFAULT_CONFIG = {
  // Communication settings
  communication: {
    defaultProtocol: 'file', // 'file', 'redis', 'websocket'
    redis: {
      url: 'redis://localhost:6379',
      prefix: 'the-new-fuse:'
    },
    file: {
      directory: './agent-communication'
    },
    websocket: {
      url: 'ws://localhost:8080'
    }
  },
  
  // Agent settings
  agent: {
    defaultAgentId: 'copilot',
    defaultAgentName: 'GitHub Copilot',
    capabilities: ['code_generation', 'code_explanation', 'debugging'],
    heartbeatIntervalMs: 30000
  },
  
  // MCP settings
  mcp: {
    protocolVersion: 'mcp-v1',
    toolDiscoveryEnabled: true,
    maxToolExecutionTimeMs: 30000
  },
  
  // A2A settings
  a2a: {
    protocolVersion: 'a2a-v1',
    retryOptions: {
      maxRetries: 3,
      initialDelayMs: 1000,
      backoffMultiplier: 1.5
    }
  },
  
  // Logging settings
  logging: {
    level: 'info', // 'error', 'warn', 'info', 'debug'
    enableFileLogging: false,
    logDirectory: './logs',
    maxLogFileSizeMb: 10,
    maxLogFiles: 5
  },
  
  // Security settings
  security: {
    level: 'enhanced', // 'basic', 'enhanced', 'strict'
    enableMessageSigning: true,
    enableMessageEncryption: false
  }
};

/**
 * Configuration Service
 * 
 * Provides centralized access to configuration values with
 * support for environment variables, config files, and defaults.
 */
export class ConfigService {
  private config: Record<string, any>;
  private configPath: string | null;
  
  constructor(configPath?: string) {
    this.configPath = configPath || null;
    this.config = JSON.parse(JSON.stringify(DEFAULT_CONFIG)); // Deep clone
    
    this.loadConfig();
    this.applyEnvironmentOverrides();
  }
  
  /**
   * Get a configuration value
   * @param key Dot-notation path to the config value (e.g., "communication.defaultProtocol")
   * @param defaultValue Optional default value if the config value is not found
   */
  get<T>(key: string, defaultValue?: T): T {
    const parts = key.split('.');
    let current = this.config;
    
    for (const part of parts) {
      if (current[part] === undefined) {
        return defaultValue as T;
      }
      current = current[part];
    }
    
    return current as T;
  }
  
  /**
   * Set a configuration value
   * @param key Dot-notation path to the config value
   * @param value The value to set
   */
  set(key: string, value: any): void {
    const parts = key.split('.');
    let current = this.config;
    
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (current[part] === undefined) {
        current[part] = {};
      }
      current = current[part];
    }
    
    current[parts[parts.length - 1]] = value;
    
    // Optionally save to file if configPath is set
    if (this.configPath) {
      this.saveConfig();
    }
  }
  
  /**
   * Get the entire configuration object
   */
  getAll(): Record<string, any> {
    return JSON.parse(JSON.stringify(this.config)); // Return a copy to prevent modifications
  }
  
  /**
   * Reset configuration to defaults
   */
  reset(): void {
    this.config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    
    // Optionally save to file if configPath is set
    if (this.configPath) {
      this.saveConfig();
    }
  }
  
  /**
   * Load configuration from file
   */
  private loadConfig(): void {
    if (!this.configPath) {
      return;
    }
    
    try {
      if (fs.existsSync(this.configPath)) {
        const fileConfig = JSON.parse(fs.readFileSync(this.configPath, 'utf-8'));
        this.mergeConfig(this.config, fileConfig);
        console.log(`Loaded configuration from ${this.configPath}`);
      }
    } catch (error) {
      console.error(`Failed to load configuration from ${this.configPath}:`, error);
    }
  }
  
  /**
   * Save configuration to file
   */
  private saveConfig(): void {
    if (!this.configPath) {
      return;
    }
    
    try {
      // Ensure directory exists
      const dir = path.dirname(this.configPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2), 'utf-8');
      console.log(`Saved configuration to ${this.configPath}`);
    } catch (error) {
      console.error(`Failed to save configuration to ${this.configPath}:`, error);
    }
  }
  
  /**
   * Apply overrides from environment variables
   * Environment variables should be in the format:
   * THE_NEW_FUSE_COMMUNICATION_DEFAULT_PROTOCOL=redis
   */
  private applyEnvironmentOverrides(): void {
    const prefix = 'THE_NEW_FUSE_';
    
    for (const [key, value] of Object.entries(process.env)) {
      if (key.startsWith(prefix) && value !== undefined) {
        const configKey = this.envKeyToConfigKey(key.substring(prefix.length));
        this.setFromPath(configKey, value);
      }
    }
  }
  
  /**
   * Convert environment variable key to config key
   * Example: COMMUNICATION_DEFAULT_PROTOCOL -> communication.defaultProtocol
   */
  private envKeyToConfigKey(envKey: string): string {
    const parts = envKey.toLowerCase().split('_');
    
    return parts.map((part, index) => {
      // First part is always lowercase
      if (index === 0) {
        return part;
      }
      
      // Other parts are camelCase
      return part.charAt(0).toUpperCase() + part.slice(1);
    }).join('.');
  }
  
  /**
   * Set a value using a dot-notation path
   */
  private setFromPath(path: string, value: string): void {
    // Convert string value to appropriate type
    let typedValue: any = value;
    
    // Try to parse as JSON if it looks like a valid JSON
    if ((value.startsWith('{') && value.endsWith('}')) || 
        (value.startsWith('[') && value.endsWith(']'))) {
      try {
        typedValue = JSON.parse(value);
      } catch (error) {
        // If parsing fails, keep as string
      }
    } else if (value === 'true') {
      typedValue = true;
    } else if (value === 'false') {
      typedValue = false;
    } else if (!isNaN(Number(value))) {
      typedValue = Number(value);
    }
    
    this.set(path, typedValue);
  }
  
  /**
   * Recursively merge configuration objects
   */
  private mergeConfig(target: Record<string, any>, source: Record<string, any>): void {
    for (const key of Object.keys(source)) {
      if (source[key] instanceof Object && key in target && target[key] instanceof Object) {
        this.mergeConfig(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }
}

// Export singleton instance for easy use throughout the application
export const config = new ConfigService(process.env.CONFIG_PATH);