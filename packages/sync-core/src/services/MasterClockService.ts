import { EventEmitter } from 'events';
import { ClockSyncData } from '../types/index.js';

// Type definitions for external services (to avoid direct imports in implementation)
export interface IRedisService {
  subscribe(channel: string, callback: (message: any) => void): Promise<void>;
  unsubscribe(channel: string): Promise<void>;
  publish(channel: string, message: string): Promise<number>;
  hset(key: string, field: string, value: string): Promise<void>;
}

export interface IHeartbeatMonitoringService {
  on(event: string, callback: (...args: any[]) => void): void;
  emit(event: string, ...args: any[]): boolean;
}

export interface IMetricsService {
  collectMetric(...args: any[]): Promise<any>;
  getMetrics(): Promise<any>;
}

export interface MasterClockConfig {
  syncIntervalMs: number;
  driftThresholdMs: number;
  maxDriftMs: number;
  correctionIntervalMs: number;
  instanceId: string;
  redisChannels: {
    clockSync: string;
    driftAlert: string;
    correction: string;
  };
}

export interface ClockDriftReport {
  instances: Array<{
    instanceId: string;
    drift: number;
    lastSync: Date;
  }>;
  maxDrift: number;
  requiresCorrection: boolean;
  timestamp: Date;
}

export interface ClockMetrics {
  syncOperations: number;
  driftCorrections: number;
  avgDrift: number;
  maxDrift: number;
  instanceCount: number;
  lastSyncTime: Date;
  healthStatus: 'healthy' | 'drift' | 'critical';
}

/**
 * MasterClockService provides centralized time synchronization across all system components
 * Integrates with existing Redis pub/sub infrastructure and HeartbeatMonitoringService
 */
export class MasterClockService extends EventEmitter {
  private config: MasterClockConfig;
  private redisService: IRedisService;
  private heartbeatService: IHeartbeatMonitoringService;
  private metricsService: IMetricsService;
  
  private syncInterval?: NodeJS.Timeout;
  private correctionInterval?: NodeJS.Timeout;
  private instanceClocks: Map<string, ClockSyncData> = new Map();
  private masterTime: Date = new Date();
  private isInitialized: boolean = false;
  
  private metrics: ClockMetrics = {
    syncOperations: 0,
    driftCorrections: 0,
    avgDrift: 0,
    maxDrift: 0,
    instanceCount: 0,
    lastSyncTime: new Date(),
    healthStatus: 'healthy'
  };

  constructor(
    config: MasterClockConfig,
    redisService: IRedisService,
    heartbeatService: IHeartbeatMonitoringService,
    metricsService: IMetricsService
  ) {
    super();
    this.config = config;
    this.redisService = redisService;
    this.heartbeatService = heartbeatService;
    this.metricsService = metricsService;
  }

  /**
   * Initialize the master clock service with existing infrastructure integration
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      throw new Error('MasterClockService is already initialized');
    }

    try {
      // Set up Redis pub/sub subscriptions for clock synchronization
      await this.setupRedisSubscriptions();
      
      // Integrate with existing HeartbeatMonitoringService
      this.setupHeartbeatIntegration();
      
      // Start periodic sync operations
      this.startSyncOperations();
      
      // Register this instance as the master clock
      await this.registerMasterClock();
      
      this.isInitialized = true;
      this.emit('initialized');
      
      console.log(`MasterClockService initialized with instance ID: ${this.config.instanceId}`);
    } catch (error) {
      console.error('Failed to initialize MasterClockService:', error);
      throw error;
    }
  }

  /**
   * Shutdown the master clock service
   */
  async shutdown(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    // Clear intervals
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = undefined;
    }
    
    if (this.correctionInterval) {
      clearInterval(this.correctionInterval);
      this.correctionInterval = undefined;
    }

    // Unsubscribe from Redis channels
    await this.redisService.unsubscribe(this.config.redisChannels.clockSync);
    await this.redisService.unsubscribe(this.config.redisChannels.driftAlert);
    await this.redisService.unsubscribe(this.config.redisChannels.correction);

    this.isInitialized = false;
    this.emit('shutdown');
    
    console.log('MasterClockService shutdown completed');
  }

  /**
   * Get synchronized timestamp with microsecond precision
   */
  async now(): Promise<Date> {
    // Update master time with high precision
    this.masterTime = new Date();
    
    // Broadcast time sync to all instances
    await this.broadcastTimeSync();
    
    return new Date(this.masterTime);
  }

  /**
   * Synchronize time with a specific instance
   */
  async syncTime(instanceId: string): Promise<void> {
    const syncData: ClockSyncData = {
      instanceId: this.config.instanceId,
      timestamp: new Date(),
      drift: 0,
      lastSync: new Date()
    };

    // Send sync command to specific instance
    await this.redisService.publish(
      `${this.config.redisChannels.clockSync}:${instanceId}`,
      JSON.stringify(syncData)
    );

    this.metrics.syncOperations++;
    this.emit('time_synced', { instanceId, timestamp: syncData.timestamp });
  }

  /**
   * Detect clock drift across all instances
   */
  async detectDrift(): Promise<ClockDriftReport> {
    const now = new Date();
    const instances: ClockDriftReport['instances'] = [];
    let maxDrift = 0;

    for (const [instanceId, clockData] of this.instanceClocks.entries()) {
      const drift = Math.abs(now.getTime() - clockData.timestamp.getTime());
      instances.push({
        instanceId,
        drift,
        lastSync: clockData.lastSync
      });
      
      maxDrift = Math.max(maxDrift, drift);
    }

    const requiresCorrection = maxDrift > this.config.driftThresholdMs;
    
    const report: ClockDriftReport = {
      instances,
      maxDrift,
      requiresCorrection,
      timestamp: now
    };

    // Update metrics
    this.metrics.maxDrift = Math.max(this.metrics.maxDrift, maxDrift);
    this.metrics.avgDrift = instances.length > 0 
      ? instances.reduce((sum, inst) => sum + inst.drift, 0) / instances.length 
      : 0;
    this.metrics.instanceCount = instances.length;
    this.updateHealthStatus(maxDrift);

    this.emit('clock_drift_detected', report);
    return report;
  }

  /**
   * Correct clock drift for specified instances
   */
  async correctDrift(instanceIds: string[]): Promise<void> {
    const correctionTime = new Date();
    
    for (const instanceId of instanceIds) {
      const correctionData = {
        masterTime: correctionTime,
        instanceId: this.config.instanceId,
        correctionType: 'drift_correction',
        timestamp: correctionTime
      };

      await this.redisService.publish(
        `${this.config.redisChannels.correction}:${instanceId}`,
        JSON.stringify(correctionData)
      );
    }

    this.metrics.driftCorrections += instanceIds.length;
    this.emit('drift_corrected', { instanceIds, correctionTime });
    
    console.log(`Clock drift corrected for ${instanceIds.length} instances`);
  }

  /**
   * Get current clock metrics
   */
  getClockMetrics(): ClockMetrics {
    return { ...this.metrics };
  }

  /**
   * Set up Redis pub/sub subscriptions for clock synchronization
   */
  private async setupRedisSubscriptions(): Promise<void> {
    // Subscribe to clock sync requests
    await this.redisService.subscribe(
      this.config.redisChannels.clockSync,
      (message) => this.handleClockSyncMessage(message)
    );

    // Subscribe to drift alerts
    await this.redisService.subscribe(
      this.config.redisChannels.driftAlert,
      (message) => this.handleDriftAlert(message)
    );

    // Subscribe to correction acknowledgments
    await this.redisService.subscribe(
      this.config.redisChannels.correction,
      (message) => this.handleCorrectionAck(message)
    );

    console.log('Redis subscriptions established for clock synchronization');
  }

  /**
   * Integrate with existing HeartbeatMonitoringService
   */
  private setupHeartbeatIntegration(): void {
    // Listen for heartbeat events to track instance health
    this.heartbeatService.on('heartbeat_received', (data) => {
      this.updateInstanceClock(data.agentId, new Date());
    });

    // Listen for agent status changes
    this.heartbeatService.on('agent_status_changed', (data) => {
      if (data.newStatus === 'failed') {
        this.removeInstanceClock(data.agentId);
      }
    });

    // Provide clock metrics to heartbeat monitoring
    this.heartbeatService.on('monitoring_started', () => {
      this.emit('clock_metrics_available', this.getClockMetrics());
    });

    console.log('HeartbeatMonitoringService integration established');
  }

  /**
   * Start periodic synchronization operations
   */
  private startSyncOperations(): void {
    // Regular time synchronization broadcast
    this.syncInterval = setInterval(async () => {
      await this.broadcastTimeSync();
    }, this.config.syncIntervalMs);

    // Periodic drift detection and correction
    this.correctionInterval = setInterval(async () => {
      const driftReport = await this.detectDrift();
      
      if (driftReport.requiresCorrection) {
        const driftedInstances = driftReport.instances
          .filter(inst => inst.drift > this.config.driftThresholdMs)
          .map(inst => inst.instanceId);
        
        if (driftedInstances.length > 0) {
          await this.correctDrift(driftedInstances);
        }
      }
    }, this.config.correctionIntervalMs);

    console.log('Periodic sync operations started');
  }

  /**
   * Register this instance as the master clock
   */
  private async registerMasterClock(): Promise<void> {
    const registrationData = {
      instanceId: this.config.instanceId,
      role: 'master_clock',
      startTime: new Date(),
      config: {
        syncInterval: this.config.syncIntervalMs,
        driftThreshold: this.config.driftThresholdMs
      }
    };

    await this.redisService.hset(
      'sync:master_clock:registry',
      this.config.instanceId,
      JSON.stringify(registrationData)
    );

    console.log('Master clock registered in Redis');
  }

  /**
   * Broadcast time synchronization to all instances
   */
  private async broadcastTimeSync(): Promise<void> {
    const syncData: ClockSyncData = {
      instanceId: this.config.instanceId,
      timestamp: new Date(),
      drift: 0,
      lastSync: new Date()
    };

    await this.redisService.publish(
      this.config.redisChannels.clockSync,
      JSON.stringify(syncData)
    );

    this.metrics.syncOperations++;
    this.metrics.lastSyncTime = syncData.timestamp;
  }

  /**
   * Handle incoming clock sync messages
   */
  private handleClockSyncMessage(message: any): void {
    try {
      const syncData: ClockSyncData = JSON.parse(message.message);
      
      // Don't process our own messages
      if (syncData.instanceId === this.config.instanceId) {
        return;
      }

      // Ensure timestamp is a Date object
      const timestamp = typeof syncData.timestamp === 'string' 
        ? new Date(syncData.timestamp) 
        : syncData.timestamp;

      this.updateInstanceClock(syncData.instanceId, timestamp);
      this.emit('instance_sync_received', syncData);
    } catch (error) {
      console.error('Error handling clock sync message:', error);
    }
  }

  /**
   * Handle drift alert messages
   */
  private handleDriftAlert(message: any): void {
    try {
      const alertData = JSON.parse(message.message);
      this.emit('drift_alert_received', alertData);
      
      // Trigger immediate drift correction if needed
      if (alertData.severity === 'critical') {
        this.correctDrift([alertData.instanceId]);
      }
    } catch (error) {
      console.error('Error handling drift alert:', error);
    }
  }

  /**
   * Handle correction acknowledgment messages
   */
  private handleCorrectionAck(message: any): void {
    try {
      const ackData = JSON.parse(message.message);
      this.emit('correction_acknowledged', ackData);
    } catch (error) {
      console.error('Error handling correction acknowledgment:', error);
    }
  }

  /**
   * Update instance clock data
   */
  private updateInstanceClock(instanceId: string, timestamp: Date): void {
    // Ensure timestamp is a valid Date object
    const validTimestamp = timestamp instanceof Date ? timestamp : new Date(timestamp);
    
    const clockData: ClockSyncData = {
      instanceId,
      timestamp: validTimestamp,
      drift: Math.abs(Date.now() - validTimestamp.getTime()),
      lastSync: new Date()
    };

    this.instanceClocks.set(instanceId, clockData);
  }

  /**
   * Remove instance clock data
   */
  private removeInstanceClock(instanceId: string): void {
    this.instanceClocks.delete(instanceId);
    this.emit('instance_removed', instanceId);
  }

  /**
   * Update health status based on drift metrics
   */
  private updateHealthStatus(maxDrift: number): void {
    let newStatus: ClockMetrics['healthStatus'];
    
    if (maxDrift > this.config.maxDriftMs) {
      newStatus = 'critical';
    } else if (maxDrift > this.config.driftThresholdMs) {
      newStatus = 'drift';
    } else {
      newStatus = 'healthy';
    }

    if (this.metrics.healthStatus !== newStatus) {
      const oldStatus = this.metrics.healthStatus;
      this.metrics.healthStatus = newStatus;
      this.emit('health_status_changed', { oldStatus, newStatus, maxDrift });
    }
  }

  /**
   * Get instance count for monitoring
   */
  getInstanceCount(): number {
    return this.instanceClocks.size;
  }

  /**
   * Get all tracked instances
   */
  getTrackedInstances(): ClockSyncData[] {
    return Array.from(this.instanceClocks.values());
  }

  /**
   * Force immediate synchronization of all instances
   */
  async forceSync(): Promise<void> {
    await this.broadcastTimeSync();
    
    // Wait a moment for responses
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const driftReport = await this.detectDrift();
    this.emit('force_sync_completed', driftReport);
  }
}