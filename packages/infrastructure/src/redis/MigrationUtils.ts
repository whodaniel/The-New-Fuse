import { Injectable, Logger } from '@nestjs/common';
import { UnifiedRedisService } from './UnifiedRedisService';

export interface LegacyRedisService {
  get?: (key: string) => Promise<string | null>;
  set?: (key: string, value: string, ttl?: number) => Promise<void>;
  del?: (key: string) => Promise<number>;
  exists?: (key: string) => Promise<boolean>;
  publish?: (channel: string, message: string) => Promise<void>;
  subscribe?: (channel: string, callback: (message: string) => void) => Promise<void>;
  quit?: () => Promise<void>;
}

@Injectable()
export class RedisMigrationUtils {
  private readonly logger = new Logger(RedisMigrationUtils.name);

  constructor(private readonly unifiedRedisService: UnifiedRedisService) {}

  /**
   * Create a legacy-compatible wrapper for existing code
   */
  createLegacyWrapper(): LegacyRedisService {
    return {
      get: async (key: string) => {
        return await this.unifiedRedisService.get(key);
      },

      set: async (key: string, value: string, ttl?: number) => {
        await this.unifiedRedisService.set(key, value, ttl);
      },

      del: async (key: string) => {
        return await this.unifiedRedisService.del(key);
      },

      exists: async (key: string) => {
        return await this.unifiedRedisService.exists(key);
      },

      publish: async (channel: string, message: string) => {
        await this.unifiedRedisService.publish(channel, { message });
      },

      subscribe: async (channel: string, callback: (message: string) => void) => {
        await this.unifiedRedisService.subscribe(channel, (msg) => {
          if (typeof msg.message === 'string') {
            callback(msg.message);
          } else {
            callback(JSON.stringify(msg.message));
          }
        });
      },

      quit: async () => {
        // Legacy services don't control the unified service lifecycle
        this.logger.warn('quit() called on legacy wrapper - ignoring');
      },
    };
  }

  /**
   * Migrate data from old Redis instances to the unified service
   */
  async migrateData(
    legacyService: LegacyRedisService,
    keyPatterns: string[] = ['*'],
    options: {
      batchSize?: number;
      preserveTtl?: boolean;
      dryRun?: boolean;
    } = {}
  ): Promise<{ migrated: number; failed: string[] }> {
    const { batchSize = 100, preserveTtl = true, dryRun = false } = options;
    let migrated = 0;
    const failed: string[] = [];

    this.logger.log(`Starting data migration (dryRun: ${dryRun})`);

    try {
      // This is a simplified migration - in practice, you'd need to use SCAN
      // and handle the specific legacy Redis client's key enumeration
      for (const pattern of keyPatterns) {
        this.logger.log(`Processing pattern: ${pattern}`);
        
        // Note: This is pseudo-code - actual implementation would depend
        // on the legacy Redis client's API for key scanning
        const keys = await this.scanKeysFromLegacy(legacyService, pattern);
        
        for (let i = 0; i < keys.length; i += batchSize) {
          const batch = keys.slice(i, i + batchSize);
          
          for (const key of batch) {
            try {
              if (legacyService.get && legacyService.exists) {
                const exists = await legacyService.exists(key);
                if (exists) {
                  const value = await legacyService.get(key);
                  
                  if (value !== null && !dryRun) {
                    await this.unifiedRedisService.set(key, value);
                    migrated++;
                  } else if (dryRun) {
                    this.logger.log(`Would migrate key: ${key}`);
                    migrated++;
                  }
                }
              }
            } catch (error) {
              this.logger.error(`Failed to migrate key ${key}:`, error);
              failed.push(key);
            }
          }
        }
      }
    } catch (error) {
      this.logger.error('Migration failed:', error);
      throw error;
    }

    this.logger.log(`Migration completed: ${migrated} keys migrated, ${failed.length} failed`);
    return { migrated, failed };
  }

  /**
   * Validate that migration was successful
   */
  async validateMigration(
    legacyService: LegacyRedisService,
    sampleKeys: string[] = []
  ): Promise<{ valid: number; invalid: string[] }> {
    let valid = 0;
    const invalid: string[] = [];

    for (const key of sampleKeys) {
      try {
        if (legacyService.get) {
          const legacyValue = await legacyService.get(key);
          const unifiedValue = await this.unifiedRedisService.get(key);
          
          if (legacyValue === unifiedValue) {
            valid++;
          } else {
            invalid.push(key);
            this.logger.warn(`Validation failed for key ${key}: legacy=${legacyValue}, unified=${unifiedValue}`);
          }
        }
      } catch (error) {
        this.logger.error(`Validation error for key ${key}:`, error);
        invalid.push(key);
      }
    }

    return { valid, invalid };
  }

  private async scanKeysFromLegacy(
    legacyService: LegacyRedisService,
    pattern: string
  ): Promise<string[]> {
    // This is a placeholder - actual implementation would depend on
    // the legacy service's key scanning capabilities
    this.logger.warn('Key scanning from legacy service not implemented - using empty result');
    return [];
  }
}