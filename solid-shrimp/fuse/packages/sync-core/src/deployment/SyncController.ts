/**
 * Sync Controller
 * REST API endpoints for sync system management
 */

import { Controller, Get, Post, Put, Delete, Body, Param, Query, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { SyncOrchestrator } from '../services/SyncOrchestrator';
import { ConflictManager } from '../services/ConflictManager';
import { MasterClockService } from '../services/MasterClockService';
import { EnhancedFileSystemWatcher } from '../watchers/EnhancedFileSystemWatcher';
import { SyncConfigService } from './SyncConfigService';

@ApiTags('sync')
@Controller('sync')
export class SyncController {
  private readonly logger = new Logger(SyncController.name);

  constructor(
    private readonly orchestrator: SyncOrchestrator,
    private readonly conflictManager: ConflictManager,
    private readonly masterClock: MasterClockService,
    private readonly fileWatcher: EnhancedFileSystemWatcher,
    private readonly configService: SyncConfigService
  ) {}

  @Get('status')
  @ApiOperation({ summary: 'Get sync system status' })
  @ApiResponse({ status: 200, description: 'Sync system status' })
  async getStatus() {
    try {
      const [
        orchestratorMetrics,
        clockDrift,
        watcherMetrics,
        config
      ] = await Promise.all([
        this.orchestrator.getMetrics(),
        this.masterClock.detectDrift(),
        this.fileWatcher.getMetrics(),
        this.configService.getConfig()
      ]);

      return {
        status: 'operational',
        timestamp: new Date().toISOString(),
        components: {
          orchestrator: {
            activeSyncs: orchestratorMetrics.activeSyncs,
            queueSize: orchestratorMetrics.queueSize,
            throughput: orchestratorMetrics.throughput
          },
          masterClock: {
            drift: clockDrift.maxDrift,
            instances: clockDrift.instances.length,
            requiresCorrection: clockDrift.requiresCorrection
          },
          fileWatcher: {
            watchedPaths: watcherMetrics.watchedPaths,
            eventsPerSecond: watcherMetrics.eventsPerSecond,
            errorRate: watcherMetrics.errorRate
          }
        },
        configuration: {
          masterClockEnabled: config.masterClock.enabled,
          fileWatcherEnabled: config.fileWatcher.enabled,
          tenantIsolation: config.security.tenantIsolation
        }
      };
    } catch (error) {
      this.logger.error('Failed to get sync status', error);
      throw error;
    }
  }

  @Post('operations/:tenantId')
  @ApiOperation({ summary: 'Trigger sync operation for tenant' })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID' })
  @ApiResponse({ status: 200, description: 'Sync operation started' })
  async triggerSync(
    @Param('tenantId') tenantId: string,
    @Body() syncRequest: { dataType: string; data: any }
  ) {
    try {
      const result = await this.orchestrator.syncTenantData(
        tenantId,
        syncRequest.dataType,
        syncRequest.data
      );

      return {
        success: true,
        operationId: result.operationId,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`Failed to trigger sync for tenant ${tenantId}`, error);
      throw error;
    }
  }

  @Get('operations')
  @ApiOperation({ summary: 'Get active sync operations' })
  @ApiQuery({ name: 'tenantId', required: false, description: 'Filter by tenant ID' })
  @ApiResponse({ status: 200, description: 'List of active sync operations' })
  async getActiveOperations(@Query('tenantId') tenantId?: string) {
    try {
      const operations = await this.orchestrator.getActiveOperations(tenantId);
      return {
        operations,
        count: operations.length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to get active operations', error);
      throw error;
    }
  }

  @Get('conflicts')
  @ApiOperation({ summary: 'Get sync conflicts' })
  @ApiQuery({ name: 'tenantId', required: false, description: 'Filter by tenant ID' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiResponse({ status: 200, description: 'List of sync conflicts' })
  async getConflicts(
    @Query('tenantId') tenantId?: string,
    @Query('status') status?: string
  ) {
    try {
      const conflicts = await this.conflictManager.getConflicts({
        tenantId,
        status: status as any
      });

      return {
        conflicts,
        count: conflicts.length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to get conflicts', error);
      throw error;
    }
  }

  @Post('conflicts/:conflictId/resolve')
  @ApiOperation({ summary: 'Resolve sync conflict' })
  @ApiParam({ name: 'conflictId', description: 'Conflict ID' })
  @ApiResponse({ status: 200, description: 'Conflict resolved' })
  async resolveConflict(
    @Param('conflictId') conflictId: string,
    @Body() resolution: { strategy: string; data?: any }
  ) {
    try {
      const result = await this.conflictManager.resolveConflict(conflictId, {
        strategy: resolution.strategy as any,
        resolvedData: resolution.data,
        resolvedBy: 'api-user', // In real implementation, get from auth context
        resolvedAt: new Date()
      });

      return {
        success: true,
        conflictId,
        resolution: result,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`Failed to resolve conflict ${conflictId}`, error);
      throw error;
    }
  }

  @Post('clock/sync')
  @ApiOperation({ summary: 'Force master clock synchronization' })
  @ApiResponse({ status: 200, description: 'Clock synchronization triggered' })
  async forceClockSync() {
    try {
      const drift = await this.masterClock.detectDrift();
      
      if (drift.requiresCorrection) {
        await this.masterClock.correctDrift(drift.instances.map(i => i.instanceId));
      }

      return {
        success: true,
        drift: drift.maxDrift,
        corrected: drift.requiresCorrection,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to force clock sync', error);
      throw error;
    }
  }

  @Get('clock/status')
  @ApiOperation({ summary: 'Get master clock status' })
  @ApiResponse({ status: 200, description: 'Master clock status' })
  async getClockStatus() {
    try {
      const drift = await this.masterClock.detectDrift();
      const metrics = await this.masterClock.getClockMetrics();

      return {
        drift: drift.maxDrift,
        instances: drift.instances.length,
        requiresCorrection: drift.requiresCorrection,
        metrics,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to get clock status', error);
      throw error;
    }
  }

  @Post('watcher/paths')
  @ApiOperation({ summary: 'Add paths to file watcher' })
  @ApiResponse({ status: 200, description: 'Paths added to watcher' })
  async addWatchPaths(@Body() request: { tenantId?: string; patterns: string[] }) {
    try {
      if (request.tenantId) {
        this.fileWatcher.watchTenantFiles(request.tenantId, request.patterns);
      } else {
        this.fileWatcher.watchGlobalFiles(request.patterns);
      }

      return {
        success: true,
        patterns: request.patterns,
        tenantId: request.tenantId,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to add watch paths', error);
      throw error;
    }
  }

  @Get('watcher/status')
  @ApiOperation({ summary: 'Get file watcher status' })
  @ApiResponse({ status: 200, description: 'File watcher status' })
  async getWatcherStatus() {
    try {
      const metrics = await this.fileWatcher.getMetrics();

      return {
        watchedPaths: metrics.watchedPaths,
        eventsPerSecond: metrics.eventsPerSecond,
        errorRate: metrics.errorRate,
        batchSize: metrics.batchSize,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to get watcher status', error);
      throw error;
    }
  }

  @Put('config')
  @ApiOperation({ summary: 'Update sync configuration' })
  @ApiResponse({ status: 200, description: 'Configuration updated' })
  async updateConfig(@Body() configUpdates: any) {
    try {
      this.configService.updateConfig(configUpdates);
      const newConfig = this.configService.getConfig();

      return {
        success: true,
        config: newConfig,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to update config', error);
      throw error;
    }
  }

  @Get('config')
  @ApiOperation({ summary: 'Get sync configuration' })
  @ApiResponse({ status: 200, description: 'Current sync configuration' })
  async getConfig() {
    try {
      const config = this.configService.getConfig();
      const validation = this.configService.validateConfig();

      return {
        config,
        validation,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to get config', error);
      throw error;
    }
  }
}