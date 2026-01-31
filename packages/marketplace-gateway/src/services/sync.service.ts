/**
 * Marketplace Sync Service
 *
 * Synchronizes assets between MCP-DRS and the TNF marketplace database.
 * Runs periodically to keep the unified marketplace up-to-date.
 */

import { Injectable, Logger } from '@nestjs/common';
import { MarketplaceAsset } from '../types/unified-asset';
import { MCPDRSClient, mcpDrsClient } from './mcp-drs-client';

interface SyncResult {
  source: string;
  synced: number;
  created: number;
  updated: number;
  errors: number;
  duration: number;
}

interface SyncOptions {
  fullSync?: boolean;
  since?: Date;
  batchSize?: number;
}

@Injectable()
export class MarketplaceSyncService {
  private readonly logger = new Logger(MarketplaceSyncService.name);
  private lastSyncTime: Date | null = null;
  private isSyncing = false;

  constructor(private readonly mcpClient: MCPDRSClient = mcpDrsClient) {}

  /**
   * Sync MCP servers from MCP-DRS to local database
   */
  async syncMCPServers(options: SyncOptions = {}): Promise<SyncResult> {
    if (this.isSyncing) {
      this.logger.warn('Sync already in progress, skipping...');
      return {
        source: 'mcp-drs',
        synced: 0,
        created: 0,
        updated: 0,
        errors: 0,
        duration: 0,
      };
    }

    this.isSyncing = true;
    const startTime = Date.now();
    const result: SyncResult = {
      source: 'mcp-drs',
      synced: 0,
      created: 0,
      updated: 0,
      errors: 0,
      duration: 0,
    };

    try {
      // Determine sync window
      const since = options.fullSync ? undefined : options.since || this.lastSyncTime || undefined;

      this.logger.log(
        `Starting MCP-DRS sync${since ? ` since ${since.toISOString()}` : ' (full sync)'}`
      );

      // Fetch servers from MCP-DRS
      const servers = await this.mcpClient.getRecentlyUpdatedServers(since);
      this.logger.log(`Fetched ${servers.length} servers from MCP-DRS`);

      // Process in batches
      const batchSize = options.batchSize || 50;
      for (let i = 0; i < servers.length; i += batchSize) {
        const batch = servers.slice(i, i + batchSize);
        const batchResults = await this.processBatch(batch);

        result.synced += batchResults.synced;
        result.created += batchResults.created;
        result.updated += batchResults.updated;
        result.errors += batchResults.errors;
      }

      this.lastSyncTime = new Date();
      this.logger.log(
        `Sync completed: ${result.synced} synced, ${result.created} created, ${result.updated} updated, ${result.errors} errors`
      );
    } catch (error) {
      this.logger.error(`Sync failed: ${error}`);
      result.errors++;
    } finally {
      this.isSyncing = false;
      result.duration = Date.now() - startTime;
    }

    return result;
  }

  /**
   * Process a batch of servers
   */
  private async processBatch(servers: any[]): Promise<{
    synced: number;
    created: number;
    updated: number;
    errors: number;
  }> {
    const result = { synced: 0, created: 0, updated: 0, errors: 0 };

    for (const server of servers) {
      try {
        const asset = this.mcpClient.mapToMarketplaceAsset(server);
        const upsertResult = await this.upsertAsset(asset);

        result.synced++;
        if (upsertResult.created) {
          result.created++;
        } else {
          result.updated++;
        }
      } catch (error) {
        this.logger.error(`Failed to process server ${server.name}: ${error}`);
        result.errors++;
      }
    }

    return result;
  }

  /**
   * Upsert an asset to the local database
   * TODO: Implement with actual database operations
   */
  private async upsertAsset(asset: MarketplaceAsset): Promise<{ created: boolean }> {
    // TODO: Implement actual database upsert
    // For now, just log the operation
    this.logger.debug(`Upserting asset: ${asset.id} (${asset.name})`);

    // Example implementation with Drizzle:
    // const existing = await db.query.marketplaceAssets.findFirst({
    //   where: eq(marketplaceAssets.externalId, asset.externalId),
    // });
    //
    // if (existing) {
    //   await db.update(marketplaceAssets)
    //     .set({ ...asset, updatedAt: new Date() })
    //     .where(eq(marketplaceAssets.id, existing.id));
    //   return { created: false };
    // } else {
    //   await db.insert(marketplaceAssets).values(asset);
    //   return { created: true };
    // }

    return { created: true };
  }

  /**
   * Get sync status
   */
  getSyncStatus(): {
    isSyncing: boolean;
    lastSyncTime: Date | null;
  } {
    return {
      isSyncing: this.isSyncing,
      lastSyncTime: this.lastSyncTime,
    };
  }

  /**
   * Schedule periodic sync (call this on app startup)
   */
  startPeriodicSync(intervalMinutes = 15): NodeJS.Timeout {
    this.logger.log(`Starting periodic sync every ${intervalMinutes} minutes`);

    // Initial sync
    this.syncMCPServers({ fullSync: true });

    // Schedule periodic syncs
    return setInterval(
      () => {
        this.syncMCPServers();
      },
      intervalMinutes * 60 * 1000
    );
  }
}

// Export singleton
export const marketplaceSyncService = new MarketplaceSyncService();
