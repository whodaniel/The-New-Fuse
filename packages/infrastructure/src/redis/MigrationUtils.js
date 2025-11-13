var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var RedisMigrationUtils_1;
import { Injectable, Logger } from '@nestjs/common';
import { UnifiedRedisService } from './UnifiedRedisService';
let RedisMigrationUtils = RedisMigrationUtils_1 = class RedisMigrationUtils {
    unifiedRedisService;
    logger = new Logger(RedisMigrationUtils_1.name);
    constructor(unifiedRedisService) {
        this.unifiedRedisService = unifiedRedisService;
    }
    /**
     * Create a legacy-compatible wrapper for existing code
     */
    createLegacyWrapper() {
        return {
            get: async (key) => {
                return await this.unifiedRedisService.get(key);
            },
            set: async (key, value, ttl) => {
                await this.unifiedRedisService.set(key, value, ttl);
            },
            del: async (key) => {
                return await this.unifiedRedisService.del(key);
            },
            exists: async (key) => {
                return await this.unifiedRedisService.exists(key);
            },
            publish: async (channel, message) => {
                await this.unifiedRedisService.publish(channel, { message });
            },
            subscribe: async (channel, callback) => {
                await this.unifiedRedisService.subscribe(channel, (msg) => {
                    if (typeof msg.message === 'string') {
                        callback(msg.message);
                    }
                    else {
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
    async migrateData(legacyService, keyPatterns = ['*'], options = {}) {
        const { batchSize = 100, preserveTtl = true, dryRun = false } = options;
        let migrated = 0;
        const failed = [];
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
                                    }
                                    else if (dryRun) {
                                        this.logger.log(`Would migrate key: ${key}`);
                                        migrated++;
                                    }
                                }
                            }
                        }
                        catch (error) {
                            this.logger.error(`Failed to migrate key ${key}:`, error);
                            failed.push(key);
                        }
                    }
                }
            }
        }
        catch (error) {
            this.logger.error('Migration failed:', error);
            throw error;
        }
        this.logger.log(`Migration completed: ${migrated} keys migrated, ${failed.length} failed`);
        return { migrated, failed };
    }
    /**
     * Validate that migration was successful
     */
    async validateMigration(legacyService, sampleKeys = []) {
        let valid = 0;
        const invalid = [];
        for (const key of sampleKeys) {
            try {
                if (legacyService.get) {
                    const legacyValue = await legacyService.get(key);
                    const unifiedValue = await this.unifiedRedisService.get(key);
                    if (legacyValue === unifiedValue) {
                        valid++;
                    }
                    else {
                        invalid.push(key);
                        this.logger.warn(`Validation failed for key ${key}: legacy=${legacyValue}, unified=${unifiedValue}`);
                    }
                }
            }
            catch (error) {
                this.logger.error(`Validation error for key ${key}:`, error);
                invalid.push(key);
            }
        }
        return { valid, invalid };
    }
    async scanKeysFromLegacy(legacyService, pattern) {
        // This is a placeholder - actual implementation would depend on
        // the legacy service's key scanning capabilities
        this.logger.warn('Key scanning from legacy service not implemented - using empty result');
        return [];
    }
};
RedisMigrationUtils = RedisMigrationUtils_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [UnifiedRedisService])
], RedisMigrationUtils);
export { RedisMigrationUtils };
//# sourceMappingURL=MigrationUtils.js.map