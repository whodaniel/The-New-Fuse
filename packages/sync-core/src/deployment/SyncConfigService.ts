/**
 * Sync Configuration Service
 * Integrates with existing ConfigService patterns and provides environment-based configuration
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter } from 'events';

export interface SyncConfiguration {
  // Master Clock Configuration
  masterClock: {
    enabled: boolean;
    syncInterval: number;
    driftThreshold: number;
    correctionTimeout: number;
  };

  // File Watcher Configuration
  fileWatcher: {
    enabled: boolean;
    patterns: string[];
    excludePatterns: string[];
    debounceMs: number;
    batchSize: number;
    maxWatchers: number;
  };

  // Orchestrator Configuration
  orchestrator: {
    maxConcurrentSyncs: number;
    queueSize: number;
    retryAttempts: number;
    retryDelay: number;
    timeoutMs: number;
  };

  // Performance Configuration
  performance: {
    monitoringEnabled: boolean;
    cacheSize: number;
    cacheTtl: number;
    memoryThreshold: number;
    cpuThreshold: number;
  };

  // Database Configuration
  database: {
    connectionPool: number;
    queryTimeout: number;
    retryAttempts: number;
    migrationTimeout: number;
  };

  // Redis Configuration
  redis: {
    keyspacePrefix: string;
    connectionTimeout: number;
    commandTimeout: number;
    retryAttempts: number;
    maxConnections: number;
  };

  // Security Configuration
  security: {
    tenantIsolation: boolean;
    encryptionEnabled: boolean;
    auditLogging: boolean;
    accessControlEnabled: boolean;
  };

  // Monitoring Configuration
  monitoring: {
    metricsEnabled: boolean;
    healthCheckInterval: number;
    alertingEnabled: boolean;
    dashboardEnabled: boolean;
  };
}

@Injectable()
export class SyncConfigService extends EventEmitter {
  private readonly logger = new Logger(SyncConfigService.name);
  private config: SyncConfiguration;
  private configWatcher?: NodeJS.Timeout;

  constructor() {
    super();
    this.config = this.loadConfiguration();
    this.startConfigWatcher();
  }

  /**
   * Load configuration from environment variables and defaults
   */
  private loadConfiguration(): SyncConfiguration {
    const env = process.env;

    return {
      masterClock: {
        enabled: this.parseBoolean(env.SYNC_MASTER_CLOCK_ENABLED, true),
        syncInterval: this.parseInt(env.SYNC_MASTER_CLOCK_INTERVAL, 5000),
        driftThreshold: this.parseInt(env.SYNC_DRIFT_THRESHOLD, 100),
        correctionTimeout: this.parseInt(env.SYNC_CORRECTION_TIMEOUT, 30000),
      },

      fileWatcher: {
        enabled: this.parseBoolean(env.SYNC_FILE_WATCHER_ENABLED, true),
        patterns: this.parseArray(env.SYNC_FILE_PATTERNS, [
          '**/*.json',
          '**/*.yaml',
          '**/*.yml',
          '**/*.ts',
          '**/*.js',
          '**/config/**/*',
          '**/templates/**/*',
        ]),
        excludePatterns: this.parseArray(env.SYNC_EXCLUDE_PATTERNS, [
          '**/node_modules/**',
          '**/dist/**',
          '**/build/**',
          '**/.git/**',
          '**/coverage/**',
          '**/*.log',
        ]),
        debounceMs: this.parseInt(env.SYNC_DEBOUNCE_MS, 1000),
        batchSize: this.parseInt(env.SYNC_BATCH_SIZE, 100),
        maxWatchers: this.parseInt(env.SYNC_MAX_WATCHERS, 1000),
      },

      orchestrator: {
        maxConcurrentSyncs: this.parseInt(env.SYNC_MAX_CONCURRENT, 10),
        queueSize: this.parseInt(env.SYNC_QUEUE_SIZE, 1000),
        retryAttempts: this.parseInt(env.SYNC_RETRY_ATTEMPTS, 3),
        retryDelay: this.parseInt(env.SYNC_RETRY_DELAY, 1000),
        timeoutMs: this.parseInt(env.SYNC_TIMEOUT_MS, 30000),
      },

      performance: {
        monitoringEnabled: this.parseBoolean(env.SYNC_PERFORMANCE_MONITORING, true),
        cacheSize: this.parseInt(env.SYNC_CACHE_SIZE, 1000),
        cacheTtl: this.parseInt(env.SYNC_CACHE_TTL, 300000), // 5 minutes
        memoryThreshold: this.parseFloat(env.SYNC_MEMORY_THRESHOLD, 0.8),
        cpuThreshold: this.parseFloat(env.SYNC_CPU_THRESHOLD, 0.8),
      },

      database: {
        connectionPool: this.parseInt(env.SYNC_DB_POOL_SIZE, 10),
        queryTimeout: this.parseInt(env.SYNC_DB_QUERY_TIMEOUT, 30000),
        retryAttempts: this.parseInt(env.SYNC_DB_RETRY_ATTEMPTS, 3),
        migrationTimeout: this.parseInt(env.SYNC_DB_MIGRATION_TIMEOUT, 60000),
      },

      redis: {
        keyspacePrefix: env.SYNC_REDIS_PREFIX || 'sync:',
        connectionTimeout: this.parseInt(env.SYNC_REDIS_CONNECT_TIMEOUT, 10000),
        commandTimeout: this.parseInt(env.SYNC_REDIS_COMMAND_TIMEOUT, 5000),
        retryAttempts: this.parseInt(env.SYNC_REDIS_RETRY_ATTEMPTS, 3),
        maxConnections: this.parseInt(env.SYNC_REDIS_MAX_CONNECTIONS, 10),
      },

      security: {
        tenantIsolation: this.parseBoolean(env.SYNC_TENANT_ISOLATION, true),
        encryptionEnabled: this.parseBoolean(env.SYNC_ENCRYPTION_ENABLED, true),
        auditLogging: this.parseBoolean(env.SYNC_AUDIT_LOGGING, true),
        accessControlEnabled: this.parseBoolean(env.SYNC_ACCESS_CONTROL, true),
      },

      monitoring: {
        metricsEnabled: this.parseBoolean(env.SYNC_METRICS_ENABLED, true),
        healthCheckInterval: this.parseInt(env.SYNC_HEALTH_CHECK_INTERVAL, 30000),
        alertingEnabled: this.parseBoolean(env.SYNC_ALERTING_ENABLED, true),
        dashboardEnabled: this.parseBoolean(env.SYNC_DASHBOARD_ENABLED, true),
      },
    };
  }

  /**
   * Start configuration watcher for runtime updates
   */
  private startConfigWatcher(): void {
    // Watch for configuration changes every 30 seconds
    this.configWatcher = setInterval(() => {
      const newConfig = this.loadConfiguration();

      if (this.hasConfigChanged(this.config, newConfig)) {
        this.logger.log('Configuration changed, updating...');
        const oldConfig = { ...this.config };
        this.config = newConfig;
        this.emit('config-changed', { oldConfig, newConfig });
      }
    }, 30000);
  }

  /**
   * Check if configuration has changed
   */
  private hasConfigChanged(oldConfig: SyncConfiguration, newConfig: SyncConfiguration): boolean {
    return JSON.stringify(oldConfig) !== JSON.stringify(newConfig);
  }

  /**
   * Get current configuration
   */
  getConfig(): SyncConfiguration {
    return { ...this.config };
  }

  /**
   * Get specific configuration section
   */
  getMasterClockConfig() {
    return { ...this.config.masterClock };
  }

  getFileWatcherConfig() {
    return { ...this.config.fileWatcher };
  }

  getOrchestratorConfig() {
    return { ...this.config.orchestrator };
  }

  getPerformanceConfig() {
    return { ...this.config.performance };
  }

  getDatabaseConfig() {
    return { ...this.config.database };
  }

  getRedisConfig() {
    return { ...this.config.redis };
  }

  getSecurityConfig() {
    return { ...this.config.security };
  }

  getMonitoringConfig() {
    return { ...this.config.monitoring };
  }

  /**
   * Update configuration at runtime
   */
  updateConfig(updates: Partial<SyncConfiguration>): void {
    const oldConfig = { ...this.config };
    this.config = { ...this.config, ...updates };
    this.emit('config-updated', { oldConfig, newConfig: this.config });
    this.logger.log('Configuration updated programmatically');
  }

  /**
   * Validate configuration
   */
  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate master clock config
    if (this.config.masterClock.syncInterval < 1000) {
      errors.push('Master clock sync interval must be at least 1000ms');
    }

    // Validate file watcher config
    if (this.config.fileWatcher.debounceMs < 100) {
      errors.push('File watcher debounce must be at least 100ms');
    }

    if (this.config.fileWatcher.batchSize < 1) {
      errors.push('File watcher batch size must be at least 1');
    }

    // Validate orchestrator config
    if (this.config.orchestrator.maxConcurrentSyncs < 1) {
      errors.push('Max concurrent syncs must be at least 1');
    }

    if (this.config.orchestrator.queueSize < 10) {
      errors.push('Queue size must be at least 10');
    }

    // Validate performance config
    if (
      this.config.performance.memoryThreshold > 1 ||
      this.config.performance.memoryThreshold < 0
    ) {
      errors.push('Memory threshold must be between 0 and 1');
    }

    // Validate database config
    if (this.config.database.connectionPool < 1) {
      errors.push('Database connection pool must be at least 1');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get environment-specific configuration
   */
  getEnvironmentConfig(): {
    environment: string;
    nodeEnv: string;
    logLevel: string;
    isDevelopment: boolean;
    isProduction: boolean;
    isTest: boolean;
  } {
    const nodeEnv = process.env.NODE_ENV || 'development';

    return {
      environment: process.env.ENVIRONMENT || nodeEnv,
      nodeEnv,
      logLevel: process.env.SYNC_LOG_LEVEL || 'info',
      isDevelopment: nodeEnv === 'development',
      isProduction: nodeEnv === 'production',
      isTest: nodeEnv === 'test',
    };
  }

  /**
   * Helper methods for parsing environment variables
   */
  private parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
    if (value === undefined) return defaultValue;
    return value.toLowerCase() === 'true';
  }

  private parseInt(value: string | undefined, defaultValue: number): number {
    if (value === undefined) return defaultValue;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  private parseFloat(value: string | undefined, defaultValue: number): number {
    if (value === undefined) return defaultValue;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  private parseArray(value: string | undefined, defaultValue: string[]): string[] {
    if (value === undefined) return defaultValue;
    try {
      return JSON.parse(value);
    } catch {
      return value.split(',').map((s) => s.trim());
    }
  }

  /**
   * Cleanup resources
   */
  async shutdown(): Promise<void> {
    if (this.configWatcher) {
      clearInterval(this.configWatcher);
    }
    this.removeAllListeners();
  }
}
