import { Process, Processor, OnQueueActive, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { QueueName } from '../constants/queue-names.js';
import { DataSyncJobData } from '../interfaces/job-data.interface.js';
import { DatabaseService } from '@the-new-fuse/database';
import { CacheService } from '../../cache/cache.service.js';
import axios from 'axios';
import { sql } from 'drizzle-orm';

/**
 * Data synchronization job processor
 * Handles data sync tasks between different systems
 */
@Processor(QueueName.DATA_SYNC)
export class DataSyncProcessor {
  private readonly logger = new Logger(DataSyncProcessor.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Process data synchronization job
   */
  @Process('sync-data')
  async handleSyncData(job: Job<DataSyncJobData>) {
    this.logger.log(
      `Processing sync-data job ${job.id} from ${job.data.source} to ${job.data.destination}`,
    );

    try {
      const { source, destination, syncType, entityType, filters } = job.data;

      await job.progress(5);

      // Validate source and destination
      this.validateSyncConfig(source, destination);

      await job.progress(10);

      // Fetch data from source
      const data = await this.fetchDataFromSource(source, entityType, filters, syncType);

      await job.progress(40);

      // Transform data if needed
      const transformedData = await this.transformData(data, source, destination);

      await job.progress(60);

      // Sync to destination
      const syncResult = await this.syncToDestination(destination, transformedData, syncType, job.data);

      await job.progress(90);

      // Verify sync
      const verification = await this.verifySyncIntegrity(syncResult);

      await job.progress(100);

      const result = {
        source,
        destination,
        syncType,
        recordsSynced: syncResult.recordCount,
        verified: verification.success,
        syncedAt: new Date().toISOString(),
      };

      this.logger.log(
        `Data sync completed. ${result.recordsSynced} records synced from ${source} to ${destination}`,
      );

      return result;
    } catch (error) {
      this.logger.error(`Data sync failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Process incremental sync job
   */
  @Process('incremental-sync')
  async handleIncrementalSync(job: Job<DataSyncJobData & { lastSyncTime: string }>) {
    this.logger.log(`Processing incremental-sync job ${job.id}`);

    try {
      const { source, destination, lastSyncTime } = job.data;

      // Fetch only records modified since last sync
      const filters = {
        modifiedAfter: lastSyncTime,
      };

      const data = await this.fetchDataFromSource(source, job.data.entityType, filters, 'incremental');

      await job.progress(50);

      const transformedData = await this.transformData(data, source, destination);
      const syncResult = await this.syncToDestination(destination, transformedData, 'incremental', job.data);

      await job.progress(100);

      return {
        source,
        destination,
        syncType: 'incremental',
        recordsSynced: syncResult.recordCount,
        lastSyncTime: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Incremental sync failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Validate sync configuration
   */
  private validateSyncConfig(source: string, destination: string) {
    const validSources = ['database', 'api', 's3', 'redis', 'external'];
    const validDestinations = ['database', 'api', 's3', 'redis', 'cache'];

    if (!validSources.includes(source)) {
      throw new Error(`Invalid source: ${source}`);
    }

    if (!validDestinations.includes(destination)) {
      throw new Error(`Invalid destination: ${destination}`);
    }

    this.logger.debug(`Sync config validated: ${source} -> ${destination}`);
  }

  /**
   * Fetch data from source
   */
  private async fetchDataFromSource(
    source: string,
    entityType?: string,
    filters?: Record<string, any>,
    syncType?: string,
  ) {
    this.logger.debug(`Fetching data from ${source} for entity ${entityType}`);

    switch (source) {
      case 'database':
        return this.fetchFromDatabase(entityType, filters);
      case 'redis':
        return this.fetchFromRedis(entityType, filters); // Using entityType as key pattern if needed
      case 'api':
      case 'external':
        return this.fetchFromApi(filters);
      case 's3':
        throw new Error('S3 source not yet implemented');
      default:
        throw new Error(`Unsupported source: ${source}`);
    }
  }

  /**
   * Fetch data from Database
   */
  private async fetchFromDatabase(entityType: string, filters: Record<string, any>) {
    if (!entityType) throw new Error('Entity type is required for database source');

    const limit = filters?.limit || 100;
    const offset = filters?.offset || 0;

    // Use specific repository if available or fall back to raw query/error
    // Drizzle repositories don't share a common interface easily allowing dynamic access by string without a map
    // We will use a simple mapping
    let records = [];

    // Simple mapping based on known repositories in DatabaseService
    // Note: DatabaseService has getters like .users, .agents, etc.
    const repo = (this.databaseService as any)[entityType];

    if (repo && typeof repo.findAll === 'function') {
      records = await repo.findAll(limit, offset);
    } else {
      // Try raw query if safe? No, too risky for generic input.
      // But we can support a few known types.
      this.logger.warn(`No specific repository found for ${entityType}, trying dynamic access or failing.`);
      throw new Error(`Entity type ${entityType} not supported for database fetch`);
    }

    return {
      records,
      count: records.length,
    };
  }

  /**
   * Fetch data from Redis
   */
  private async fetchFromRedis(keyPattern: string, filters: Record<string, any>) {
    // If entityType is provided, treat it as key or key pattern
    if (!keyPattern) throw new Error('Entity type (key pattern) required for Redis source');

    // Basic implementation: fetch single key
    // In a real scenario, this should likely scan for keys matching a pattern,
    // but CacheService currently exposes simple get/set.
    // We try to get as string (JSON) or hash if filters specify.

    const records = [];
    const type = filters?.type || 'string';

    if (type === 'hash') {
      // If keyPattern is the hash key, and we want all fields?
      // CacheService doesn't have hgetall.
      // We'll stick to simple get for now to be safe.
      this.logger.warn('Redis hash fetch not fully supported via CacheService abstraction');
    }

    try {
      const value = await this.cacheService.get(keyPattern);
      if (value) {
        records.push(value);
      }
    } catch (e) {
      this.logger.warn(`Failed to fetch from redis key ${keyPattern}: ${e.message}`);
    }

    return {
      records,
      count: records.length,
    };
  }

  /**
   * Fetch data from API
   */
  private async fetchFromApi(filters: Record<string, any>) {
    const url = filters?.url;
    if (!url) throw new Error('URL required in filters for API source');

    const response = await axios.get(url, { params: filters?.params });
    const data = response.data;

    // Normalize data
    const records = Array.isArray(data) ? data : [data];
    return {
      records,
      count: records.length,
    };
  }

  /**
   * Transform data for destination
   */
  private async transformData(data: any, source: string, destination: string) {
    this.logger.debug(`Transforming data from ${source} format to ${destination} format`);

    // Identity transform for now, but could include schema mapping
    return data;
  }

  /**
   * Sync data to destination
   */
  private async syncToDestination(destination: string, data: any, syncType: string, jobData?: DataSyncJobData) {
    this.logger.debug(`Syncing ${data.count} records to ${destination}`);
    const records = data.records || [];

    switch (destination) {
      case 'database':
        return this.syncToDatabase(records, jobData?.entityType);
      case 'redis':
      case 'cache':
        return this.syncToRedis(records, jobData?.entityType, jobData?.filters); // filters might contain key config
      case 'api':
        return this.syncToApi(records, jobData?.filters);
      case 's3':
        throw new Error('S3 destination not yet implemented');
      default:
        throw new Error(`Unsupported destination: ${destination}`);
    }
  }

  private async syncToDatabase(records: any[], entityType: string) {
     if (!entityType) throw new Error('Entity type required for database destination');

     const repo = (this.databaseService as any)[entityType];
     if (!repo) throw new Error(`Repository for ${entityType} not found`);

     let successCount = 0;
     for (const record of records) {
        // Assume create or update based on ID presence?
        // Or just use create. Repos usually have create/update.
        // This is generic, so we might try upsert if available, or just create and ignore conflicts?
        // For simplicity in this generic processor, let's try create.
        try {
            // Check if record exists if ID is present
            if (record.id && typeof repo.findById === 'function') {
                const exists = await repo.findById(record.id);
                if (exists && typeof repo.update === 'function') {
                     await repo.update(record.id, record);
                } else if (typeof repo.create === 'function') {
                     await repo.create(record);
                }
            } else if (typeof repo.create === 'function') {
                await repo.create(record);
            }
            successCount++;
        } catch (e) {
            this.logger.error(`Failed to sync record to database: ${e.message}`);
        }
     }

     return {
        recordCount: successCount,
        success: successCount > 0 || records.length === 0,
     };
  }

  private async syncToRedis(records: any[], entityType: string, filters: any) {
    // If entityType is used as key prefix
    let successCount = 0;
    const ttl = filters?.ttl;

    for (const record of records) {
        const key = filters?.key || (record.id ? `${entityType}:${record.id}` : entityType);
        if (key) {
            await this.cacheService.set(key, record, ttl);
            successCount++;
        }
    }

    return {
        recordCount: successCount,
        success: true
    };
  }

  private async syncToApi(records: any[], filters: any) {
    const url = filters?.url;
    if (!url) throw new Error('URL required for API destination');

    // Batch or individual?
    // Let's do batch if records > 1
    try {
        await axios.post(url, records);
        return {
            recordCount: records.length,
            success: true
        };
    } catch (e) {
        this.logger.error(`Failed to sync to API: ${e.message}`);
        throw e;
    }
  }

  /**
   * Verify sync integrity
   */
  private async verifySyncIntegrity(syncResult: any) {
    this.logger.debug('Verifying sync integrity');

    // Basic verification: check if success is true
    return {
      success: syncResult.success,
      checksum: 'verified',
    };
  }

  /**
   * Event handler for active jobs
   */
  @OnQueueActive()
  onActive(job: Job) {
    this.logger.debug(`Processing data sync job ${job.id} of type ${job.name}`);
  }

  /**
   * Event handler for completed jobs
   */
  @OnQueueCompleted()
  onCompleted(job: Job, result: any) {
    this.logger.log(
      `Data sync job ${job.id} completed. Records synced: ${result.recordsSynced}`,
    );
  }

  /**
   * Event handler for failed jobs
   */
  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(
      `Data sync job ${job.id} failed after ${job.attemptsMade} attempts. Error: ${error.message}`,
      error.stack,
    );
  }

  /**
   * Helper method to sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
