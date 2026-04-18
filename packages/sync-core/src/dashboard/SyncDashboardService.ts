import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { EventEmitter } from 'events';
import { UnifiedRedisService } from '@the-new-fuse/infrastructure';
import { SyncRedisConfig } from '../config/SyncRedisConfig.js';
import { SyncMetrics, SyncHealth, SyncOperation, TenantSyncContext } from '../types/index.js';

/**
 * Interface for WebSocket service integration
 */
export interface IAgentWebSocketService {
  broadcastToTenant(tenantId: string, message: any): Promise<number>;
  broadcastToAll(message: any): Promise<number>;
  sendToUser(userId: string, message: any): Promise<boolean>;
}

/**
 * Interface for monitoring service integration
 */
export interface IMonitoringService {
  recordMetric(name: string, value: number, tags?: Record<string, string>): Promise<void>;
  getSystemHealth(): Promise<any>;
  createAlert(alert: SystemAlert): Promise<void>;
}

/**
 * System alert interface
 */
export interface SystemAlert {
  id: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  component: string;
  tenantId?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

/**
 * Dashboard update event types
 */
export type DashboardUpdateType = 
  | 'sync_metrics'
  | 'sync_health'
  | 'agent_status'
  | 'task_progress'
  | 'system_alert'
  | 'file_change'
  | 'conflict_detected'
  | 'sync_operation';

/**
 * Dashboard update payload
 */
export interface DashboardUpdate {
  type: DashboardUpdateType;
  tenantId?: string;
  userId?: string;
  data: any;
  timestamp: Date;
  correlationId?: string;
}

/**
 * Real-time dashboard configuration
 */
export interface SyncDashboardConfig {
  updateIntervalMs: number;
  metricsRetentionMs: number;
  alertRetentionMs: number;
  enableMultiSession: boolean;
  enableCrossTenantupdates: boolean;
}

/**
 * SyncDashboardService provides real-time sync updates to user control panels
 * Integrates with existing AdminDashboard and AgentWebSocketService
 */
@Injectable()
export class SyncDashboardService extends EventEmitter implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SyncDashboardService.name);
  
  private readonly config: SyncDashboardConfig = {
    updateIntervalMs: 1000, // 1 second updates
    metricsRetentionMs: 24 * 60 * 60 * 1000, // 24 hours
    alertRetentionMs: 7 * 24 * 60 * 60 * 1000, // 7 days
    enableMultiSession: true,
    enableCrossTenantupdates: false
  };

  private metricsInterval?: NodeJS.Timeout;
  private healthCheckInterval?: NodeJS.Timeout;
  private isInitialized = false;

  // Cache for dashboard data
  private metricsCache = new Map<string, SyncMetrics>();
  private healthCache = new Map<string, SyncHealth>();
  private alertsCache = new Map<string, SystemAlert[]>();
  private activeOperations = new Map<string, SyncOperation[]>();

  constructor(
    private readonly redisService: UnifiedRedisService,
    private readonly redisConfig: SyncRedisConfig,
    private readonly wsService: IAgentWebSocketService,
    private readonly monitoringService: IMonitoringService
  ) {
    super();
  }

  async onModuleInit(): Promise<void> {
    await this.initialize();
    this.logger.log('SyncDashboardService initialized');
  }

  async onModuleDestroy(): Promise<void> {
    await this.cleanup();
    this.logger.log('SyncDashboardService destroyed');
  }

  /**
   * Initialize the dashboard service
   */
  private async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Subscribe to sync events from Redis
      await this.subscribeToSyncEvents();
      
      // Start periodic metrics collection
      this.startMetricsCollection();
      
      // Start health monitoring
      this.startHealthMonitoring();
      
      this.isInitialized = true;
      this.logger.log('Dashboard service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize dashboard service:', error);
      throw error;
    }
  }

  /**
   * Subscribe to sync events from Redis channels
   */
  private async subscribeToSyncEvents(): Promise<void> {
    const channels = [
      this.redisConfig.getChannelName('sync', 'operations'),
      this.redisConfig.getChannelName('sync', 'conflicts'),
      this.redisConfig.getChannelName('sync', 'health'),
      this.redisConfig.getChannelName('agent', 'status'),
      this.redisConfig.getChannelName('task', 'updates'),
      this.redisConfig.getChannelName('file', 'changes')
    ];

    for (const channel of channels) {
      await this.redisService.subscribe(channel, (message) => {
        this.handleSyncEvent(channel, message);
      });
    }

    this.logger.log(`Subscribed to ${channels.length} sync event channels`);
  }

  /**
   * Handle incoming sync events from Redis
   */
  private handleSyncEvent(channel: string, message: any): void {
    try {
      const eventData = typeof message === 'string' ? JSON.parse(message) : message;
      
      // Determine update type based on channel
      let updateType: DashboardUpdateType;
      if (channel.includes('operations')) updateType = 'sync_operation';
      else if (channel.includes('conflicts')) updateType = 'conflict_detected';
      else if (channel.includes('health')) updateType = 'sync_health';
      else if (channel.includes('agent')) updateType = 'agent_status';
      else if (channel.includes('task')) updateType = 'task_progress';
      else if (channel.includes('file')) updateType = 'file_change';
      else updateType = 'sync_metrics';

      // Create dashboard update
      const update: DashboardUpdate = {
        type: updateType,
        tenantId: eventData.tenantId,
        userId: eventData.userId,
        data: eventData,
        timestamp: new Date(),
        correlationId: eventData.correlationId
      };

      // Process and broadcast update
      this.processDashboardUpdate(update);
    } catch (error) {
      this.logger.error('Error handling sync event:', error);
    }
  }

  /**
   * Process and broadcast dashboard updates
   */
  private async processDashboardUpdate(update: DashboardUpdate): Promise<void> {
    try {
      // Update local cache
      await this.updateCache(update);
      
      // Broadcast to appropriate audiences
      await this.broadcastUpdate(update);
      
      // Record metrics
      await this.recordUpdateMetrics(update);
      
      // Emit local event for other services
      this.emit('dashboard_update', update);
    } catch (error) {
      this.logger.error('Error processing dashboard update:', error);
    }
  }

  /**
   * Update local cache with new data
   */
  private async updateCache(update: DashboardUpdate): Promise<void> {
    const cacheKey = update.tenantId || 'global';
    
    switch (update.type) {
      case 'sync_metrics':
        this.metricsCache.set(cacheKey, update.data);
        break;
        
      case 'sync_health':
        this.healthCache.set(cacheKey, update.data);
        break;
        
      case 'system_alert':
        const alerts = this.alertsCache.get(cacheKey) || [];
        alerts.unshift(update.data);
        // Keep only recent alerts
        const maxAlerts = 100;
        if (alerts.length > maxAlerts) {
          alerts.splice(maxAlerts);
        }
        this.alertsCache.set(cacheKey, alerts);
        break;
        
      case 'sync_operation':
        const operations = this.activeOperations.get(cacheKey) || [];
        operations.unshift(update.data);
        // Keep only recent operations
        const maxOperations = 50;
        if (operations.length > maxOperations) {
          operations.splice(maxOperations);
        }
        this.activeOperations.set(cacheKey, operations);
        break;
    }
  }

  /**
   * Broadcast update to appropriate WebSocket clients
   */
  private async broadcastUpdate(update: DashboardUpdate): Promise<void> {
    const message = {
      type: 'sync_dashboard_update',
      payload: update
    };

    if (update.userId) {
      // Send to specific user across all sessions
      await this.wsService.sendToUser(update.userId, message);
    } else if (update.tenantId) {
      // Send to all users in tenant
      await this.wsService.broadcastToTenant(update.tenantId, message);
    } else if (this.config.enableCrossTenantupdates) {
      // Send to all users (global updates)
      await this.wsService.broadcastToAll(message);
    }
  }

  /**
   * Record metrics for dashboard updates
   */
  private async recordUpdateMetrics(update: DashboardUpdate): Promise<void> {
    const tags = {
      type: update.type,
      tenant: update.tenantId || 'global'
    };

    await this.monitoringService.recordMetric('sync_dashboard_updates_total', 1, tags);
  }

  /**
   * Start periodic metrics collection
   */
  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(async () => {
      try {
        await this.collectAndBroadcastMetrics();
      } catch (error) {
        this.logger.error('Error collecting metrics:', error);
      }
    }, this.config.updateIntervalMs);
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.checkAndBroadcastHealth();
      } catch (error) {
        this.logger.error('Error checking health:', error);
      }
    }, this.config.updateIntervalMs * 5); // Check health every 5 seconds
  }

  /**
   * Collect and broadcast current metrics
   */
  private async collectAndBroadcastMetrics(): Promise<void> {
    // Get metrics from Redis
    const metricsKeys = await this.redisService.keys(
      this.redisConfig.getKeyPattern('metrics', '*')
    );

    for (const key of metricsKeys) {
      const metricsData = await this.redisService.hgetall(key);
      const tenantId = this.extractTenantFromKey(key);
      
      const metrics: SyncMetrics = {
        operations: {
          sync: parseInt(metricsData.sync_operations || '0'),
          conflicts: parseInt(metricsData.conflicts || '0'),
          fileChanges: parseInt(metricsData.file_changes || '0')
        },
        performance: {
          avgSyncTime: parseFloat(metricsData.avg_sync_time || '0'),
          successRate: parseFloat(metricsData.success_rate || '100'),
          throughput: parseFloat(metricsData.throughput || '0')
        },
        errors: {
          networkErrors: parseInt(metricsData.network_errors || '0'),
          conflictErrors: parseInt(metricsData.conflict_errors || '0'),
          validationErrors: parseInt(metricsData.validation_errors || '0')
        }
      };

      const update: DashboardUpdate = {
        type: 'sync_metrics',
        tenantId,
        data: metrics,
        timestamp: new Date()
      };

      await this.processDashboardUpdate(update);
    }
  }

  /**
   * Check and broadcast system health
   */
  private async checkAndBroadcastHealth(): Promise<void> {
    try {
      const systemHealth = await this.monitoringService.getSystemHealth();
      
      const health: SyncHealth = {
        status: systemHealth.overall || 'healthy',
        clockSync: {
          status: systemHealth.clockSync?.status || 'synced',
          lastSync: new Date(systemHealth.clockSync?.lastSync || Date.now()),
          drift: systemHealth.clockSync?.drift || 0
        },
        services: {
          redis: systemHealth.redis || 'healthy',
          database: systemHealth.database || 'healthy',
          fileSystem: systemHealth.fileSystem || 'healthy',
          webSocket: systemHealth.webSocket || 'healthy'
        },
        lastCheck: new Date()
      };

      const update: DashboardUpdate = {
        type: 'sync_health',
        data: health,
        timestamp: new Date()
      };

      await this.processDashboardUpdate(update);
    } catch (error) {
      this.logger.error('Error checking system health:', error);
    }
  }

  /**
   * Create and broadcast system alert
   */
  async createAlert(alert: Omit<SystemAlert, 'id' | 'timestamp'>): Promise<void> {
    const fullAlert: SystemAlert = {
      ...alert,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    // Store in monitoring system
    await this.monitoringService.createAlert(fullAlert);

    // Broadcast to dashboards
    const update: DashboardUpdate = {
      type: 'system_alert',
      tenantId: alert.tenantId,
      data: fullAlert,
      timestamp: new Date()
    };

    await this.processDashboardUpdate(update);
  }

  /**
   * Get current dashboard data for a tenant
   */
  async getDashboardData(tenantId?: string): Promise<{
    metrics: SyncMetrics | null;
    health: SyncHealth | null;
    alerts: SystemAlert[];
    operations: SyncOperation[];
  }> {
    const cacheKey = tenantId || 'global';
    
    return {
      metrics: this.metricsCache.get(cacheKey) || null,
      health: this.healthCache.get(cacheKey) || null,
      alerts: this.alertsCache.get(cacheKey) || [],
      operations: this.activeOperations.get(cacheKey) || []
    };
  }

  /**
   * Force refresh dashboard data
   */
  async refreshDashboard(tenantId?: string): Promise<void> {
    await this.collectAndBroadcastMetrics();
    await this.checkAndBroadcastHealth();
    
    this.logger.log(`Dashboard refreshed for tenant: ${tenantId || 'global'}`);
  }

  /**
   * Extract tenant ID from Redis key
   */
  private extractTenantFromKey(key: string): string | undefined {
    const parts = key.split(':');
    const tenantIndex = parts.findIndex(part => part === 'tenant');
    return tenantIndex >= 0 && tenantIndex < parts.length - 1 
      ? parts[tenantIndex + 1] 
      : undefined;
  }

  /**
   * Cleanup resources
   */
  private async cleanup(): Promise<void> {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Unsubscribe from Redis channels
    const channels = [
      this.redisConfig.getChannelName('sync', 'operations'),
      this.redisConfig.getChannelName('sync', 'conflicts'),
      this.redisConfig.getChannelName('sync', 'health'),
      this.redisConfig.getChannelName('agent', 'status'),
      this.redisConfig.getChannelName('task', 'updates'),
      this.redisConfig.getChannelName('file', 'changes')
    ];

    for (const channel of channels) {
      await this.redisService.unsubscribe(channel);
    }

    this.isInitialized = false;
  }
}