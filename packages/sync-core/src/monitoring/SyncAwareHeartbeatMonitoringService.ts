import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventEmitter } from 'events';
import { 
  HeartbeatMonitoringService, 
  HeartbeatConfig, 
  AgentHeartbeat, 
  StagnationAlert 
} from '@the-new-fuse/relay-core';
import { MasterClockService } from '../services/MasterClockService';
import { SyncOrchestrator } from '../services/SyncOrchestrator';
import { ConflictManager } from '../services/ConflictManager';

/**
 * Sync health metrics interface
 */
export interface SyncHealthMetrics {
  syncOperationsTotal: number;
  syncOperationsSuccess: number;
  syncOperationsFailed: number;
  syncLatencyMs: number;
  conflictsDetected: number;
  conflictsResolved: number;
  fileWatcherHealth: 'healthy' | 'degraded' | 'failed';
  clockSyncHealth: 'synchronized' | 'drift_detected' | 'failed';
  lastSyncTimestamp: Date;
  syncErrorRate: number;
  avgSyncDuration: number;
}

/**
 * Sync-aware agent heartbeat with sync metrics
 */
export interface SyncAwareAgentHeartbeat extends AgentHeartbeat {
  syncMetrics: SyncHealthMetrics;
  tenantId?: string;
  syncState: 'synchronized' | 'syncing' | 'conflict' | 'error';
  lastSyncOperation?: {
    type: string;
    timestamp: Date;
    duration: number;
    success: boolean;
  };
}

/**
 * Sync-aware stagnation alert with sync context
 */
export interface SyncAwareStagnationAlert extends StagnationAlert {
  syncContext: {
    syncState: string;
    lastSyncOperation?: Date;
    pendingOperations: number;
    conflictCount: number;
    errorRate: number;
  };
  tenantId?: string;
  escalationPath: 'sync_recovery' | 'conflict_resolution' | 'manual_intervention';
}

/**
 * Sync health escalation procedure
 */
export interface SyncHealthEscalation {
  type: 'sync_failure' | 'clock_drift' | 'conflict_storm' | 'file_watcher_failure';
  severity: 'warning' | 'critical' | 'emergency';
  agentId?: string;
  tenantId?: string;
  syncMetrics: SyncHealthMetrics;
  recommendedActions: string[];
  autoRecoveryAttempted: boolean;
  escalatedAt: Date;
}

/**
 * Enhanced HeartbeatMonitoringService with sync-aware health tracking
 * Extends existing HeartbeatMonitoringService with sync health metrics and escalation procedures
 */
@Injectable()
export class SyncAwareHeartbeatMonitoringService extends EventEmitter implements OnModuleInit {
  private readonly logger = new Logger(SyncAwareHeartbeatMonitoringService.name);
  
  private heartbeatService: HeartbeatMonitoringService;
  private masterClockService: MasterClockService;
  private syncOrchestrator: SyncOrchestrator;
  private conflictManager: ConflictManager;
  
  private syncAwareHeartbeats = new Map<string, SyncAwareAgentHeartbeat>();
  private syncHealthMetrics = new Map<string, SyncHealthMetrics>();
  private escalationHistory = new Map<string, SyncHealthEscalation[]>();
  
  private healthCheckInterval?: NodeJS.Timeout;
  private metricsCollectionInterval?: NodeJS.Timeout;
  
  constructor(
    heartbeatService: HeartbeatMonitoringService,
    masterClockService: MasterClockService,
    syncOrchestrator: SyncOrchestrator,
    conflictManager: ConflictManager
  ) {
    super();
    this.heartbeatService = heartbeatService;
    this.masterClockService = masterClockService;
    this.syncOrchestrator = syncOrchestrator;
    this.conflictManager = conflictManager;
  }

  async onModuleInit(): Promise<void> {
    await this.setupHeartbeatIntegration();
    await this.setupSyncIntegration();
    this.startSyncHealthMonitoring();
    this.logger.log('SyncAwareHeartbeatMonitoringService initialized');
  }

  /**
   * Setup integration with existing HeartbeatMonitoringService
   */
  private async setupHeartbeatIntegration(): Promise<void> {
    // Listen to existing heartbeat events
    this.heartbeatService.on('heartbeat_received', (data) => {
      this.handleHeartbeatReceived(data.agentId, data.taskId);
    });

    this.heartbeatService.on('stagnation_detected', (alert: StagnationAlert) => {
      this.handleStagnationDetected(alert);
    });

    this.heartbeatService.on('agent_status_changed', (data) => {
      this.handleAgentStatusChanged(data.agentId, data.newStatus);
    });

    this.heartbeatService.on('fallback_action_executed', (data) => {
      this.handleFallbackActionExecuted(data.agentId, data.action, data.alert);
    });

    this.logger.log('Heartbeat service integration established');
  }

  /**
   * Setup integration with sync services
   */
  private async setupSyncIntegration(): Promise<void> {
    // Listen to sync orchestrator events
    this.syncOrchestrator.on('sync_operation_completed', (data) => {
      this.handleSyncOperationCompleted(data);
    });

    this.syncOrchestrator.on('sync_operation_failed', (data) => {
      this.handleSyncOperationFailed(data);
    });

    // Listen to conflict manager events
    this.conflictManager.on('conflict_detected', (data) => {
      this.handleConflictDetected(data);
    });

    this.conflictManager.on('conflict_resolved', (data) => {
      this.handleConflictResolved(data);
    });

    // Listen to master clock events
    this.masterClockService.on('clock_drift_detected', (data) => {
      this.handleClockDriftDetected(data);
    });

    this.masterClockService.on('clock_sync_failed', (data) => {
      this.handleClockSyncFailed(data);
    });

    this.logger.log('Sync services integration established');
  }

  /**
   * Start sync health monitoring
   */
  private startSyncHealthMonitoring(): void {
    // Health check every 30 seconds
    this.healthCheckInterval = setInterval(() => {
      this.performSyncHealthCheck();
    }, 30000);

    // Metrics collection every 10 seconds
    this.metricsCollectionInterval = setInterval(() => {
      this.collectSyncMetrics();
    }, 10000);

    this.logger.log('Sync health monitoring started');
  }

  /**
   * Handle heartbeat received with sync context
   */
  private async handleHeartbeatReceived(agentId: string, taskId?: string): Promise<void> {
    try {
      const existingHeartbeat = this.syncAwareHeartbeats.get(agentId);
      const syncMetrics = await this.collectAgentSyncMetrics(agentId);
      
      const syncAwareHeartbeat: SyncAwareAgentHeartbeat = {
        ...(existingHeartbeat || this.createDefaultHeartbeat(agentId)),
        lastHeartbeat: new Date(),
        lastActivity: new Date(),
        status: 'active',
        consecutiveFailures: 0,
        currentTask: taskId,
        syncMetrics,
        syncState: this.determineSyncState(syncMetrics),
        lastSyncOperation: existingHeartbeat?.lastSyncOperation
      };

      this.syncAwareHeartbeats.set(agentId, syncAwareHeartbeat);
      
      // Emit sync-aware heartbeat event
      this.emit('sync_aware_heartbeat_received', {
        agentId,
        taskId,
        syncMetrics,
        syncState: syncAwareHeartbeat.syncState
      });

      // Check for sync health issues
      await this.checkSyncHealth(agentId, syncAwareHeartbeat);
      
    } catch (error) {
      this.logger.error(`Error handling sync-aware heartbeat for agent ${agentId}:`, error);
    }
  }

  /**
   * Handle stagnation detected with sync context
   */
  private async handleStagnationDetected(alert: StagnationAlert): Promise<void> {
    try {
      const agentId = alert.agentId;
      const heartbeat = this.syncAwareHeartbeats.get(agentId);
      
      if (!heartbeat) {
        this.logger.warn(`No sync-aware heartbeat found for stagnated agent: ${agentId}`);
        return;
      }

      // Create sync-aware stagnation alert
      const syncAwareAlert: SyncAwareStagnationAlert = {
        ...alert,
        syncContext: {
          syncState: heartbeat.syncState,
          lastSyncOperation: heartbeat.lastSyncOperation?.timestamp,
          pendingOperations: await this.getPendingOperationsCount(agentId),
          conflictCount: heartbeat.syncMetrics.conflictsDetected,
          errorRate: heartbeat.syncMetrics.syncErrorRate
        },
        tenantId: heartbeat.tenantId,
        escalationPath: this.determineEscalationPath(heartbeat)
      };

      // Trigger sync-aware escalation
      await this.triggerSyncAwareEscalation(syncAwareAlert);
      
      this.emit('sync_aware_stagnation_detected', syncAwareAlert);
      
    } catch (error) {
      this.logger.error(`Error handling sync-aware stagnation for agent ${alert.agentId}:`, error);
    }
  }

  /**
   * Handle agent status change with sync implications
   */
  private async handleAgentStatusChanged(agentId: string, newStatus: string): Promise<void> {
    const heartbeat = this.syncAwareHeartbeats.get(agentId);
    if (!heartbeat) return;

    // Update sync state based on agent status
    if (newStatus === 'failed' || newStatus === 'stalled') {
      heartbeat.syncState = 'error';
      
      // Trigger sync recovery procedures
      await this.triggerSyncRecovery(agentId, heartbeat);
    }

    this.emit('sync_aware_agent_status_changed', {
      agentId,
      oldStatus: heartbeat.status,
      newStatus,
      syncState: heartbeat.syncState,
      syncMetrics: heartbeat.syncMetrics
    });
  }

  /**
   * Handle sync operation completed
   */
  private handleSyncOperationCompleted(data: any): void {
    const { agentId, operation, duration, tenantId } = data;
    
    const heartbeat = this.syncAwareHeartbeats.get(agentId);
    if (heartbeat) {
      heartbeat.lastSyncOperation = {
        type: operation.type,
        timestamp: new Date(),
        duration,
        success: true
      };
      
      // Update sync metrics
      heartbeat.syncMetrics.syncOperationsTotal++;
      heartbeat.syncMetrics.syncOperationsSuccess++;
      heartbeat.syncMetrics.syncLatencyMs = duration;
      heartbeat.syncMetrics.lastSyncTimestamp = new Date();
      heartbeat.syncMetrics.avgSyncDuration = this.calculateAvgSyncDuration(agentId, duration);
      heartbeat.syncMetrics.syncErrorRate = this.calculateSyncErrorRate(heartbeat.syncMetrics);
      
      heartbeat.syncState = 'synchronized';
    }

    this.emit('sync_operation_health_updated', { agentId, success: true, duration, tenantId });
  }

  /**
   * Handle sync operation failed
   */
  private handleSyncOperationFailed(data: any): void {
    const { agentId, operation, error, tenantId } = data;
    
    const heartbeat = this.syncAwareHeartbeats.get(agentId);
    if (heartbeat) {
      heartbeat.lastSyncOperation = {
        type: operation.type,
        timestamp: new Date(),
        duration: 0,
        success: false
      };
      
      // Update sync metrics
      heartbeat.syncMetrics.syncOperationsTotal++;
      heartbeat.syncMetrics.syncOperationsFailed++;
      heartbeat.syncMetrics.syncErrorRate = this.calculateSyncErrorRate(heartbeat.syncMetrics);
      
      heartbeat.syncState = 'error';
    }

    // Trigger escalation for sync failures
    this.triggerSyncFailureEscalation(agentId, error, tenantId);
    
    this.emit('sync_operation_health_updated', { agentId, success: false, error, tenantId });
  }

  /**
   * Handle conflict detected
   */
  private handleConflictDetected(data: any): void {
    const { agentId, conflict, tenantId } = data;
    
    const heartbeat = this.syncAwareHeartbeats.get(agentId);
    if (heartbeat) {
      heartbeat.syncMetrics.conflictsDetected++;
      heartbeat.syncState = 'conflict';
    }

    this.emit('sync_conflict_health_updated', { agentId, conflict, tenantId });
  }

  /**
   * Handle conflict resolved
   */
  private handleConflictResolved(data: any): void {
    const { agentId, conflict, tenantId } = data;
    
    const heartbeat = this.syncAwareHeartbeats.get(agentId);
    if (heartbeat) {
      heartbeat.syncMetrics.conflictsResolved++;
      
      // Update sync state if no more conflicts
      if (heartbeat.syncMetrics.conflictsDetected === heartbeat.syncMetrics.conflictsResolved) {
        heartbeat.syncState = 'synchronized';
      }
    }

    this.emit('sync_conflict_health_updated', { agentId, conflict, resolved: true, tenantId });
  }

  /**
   * Handle clock drift detected
   */
  private handleClockDriftDetected(data: any): void {
    const { instances, maxDrift } = data;
    
    // Update clock sync health for affected agents
    for (const instance of instances) {
      const heartbeat = this.syncAwareHeartbeats.get(instance.instanceId);
      if (heartbeat) {
        heartbeat.syncMetrics.clockSyncHealth = 'drift_detected';
      }
    }

    // Trigger escalation if drift is significant
    if (maxDrift > 1000) { // 1 second
      this.triggerClockDriftEscalation(instances, maxDrift);
    }

    this.emit('clock_sync_health_updated', { instances, maxDrift });
  }

  /**
   * Perform comprehensive sync health check
   */
  private async performSyncHealthCheck(): Promise<void> {
    try {
      for (const [agentId, heartbeat] of this.syncAwareHeartbeats) {
        await this.checkSyncHealth(agentId, heartbeat);
      }
      
      // Check system-wide sync health
      await this.checkSystemSyncHealth();
      
    } catch (error) {
      this.logger.error('Error performing sync health check:', error);
    }
  }

  /**
   * Check sync health for specific agent
   */
  private async checkSyncHealth(agentId: string, heartbeat: SyncAwareAgentHeartbeat): Promise<void> {
    const now = new Date();
    const metrics = heartbeat.syncMetrics;
    
    // Check sync operation health
    if (metrics.syncErrorRate > 0.1) { // 10% error rate
      await this.createSyncHealthEscalation({
        type: 'sync_failure',
        severity: metrics.syncErrorRate > 0.25 ? 'critical' : 'warning',
        agentId,
        tenantId: heartbeat.tenantId,
        syncMetrics: metrics,
        recommendedActions: [
          'Check network connectivity',
          'Verify sync service health',
          'Review recent sync operations'
        ],
        autoRecoveryAttempted: false,
        escalatedAt: now
      });
    }

    // Check sync latency
    if (metrics.syncLatencyMs > 5000) { // 5 seconds
      await this.createSyncHealthEscalation({
        type: 'sync_failure',
        severity: 'warning',
        agentId,
        tenantId: heartbeat.tenantId,
        syncMetrics: metrics,
        recommendedActions: [
          'Check system load',
          'Verify network performance',
          'Review sync operation complexity'
        ],
        autoRecoveryAttempted: false,
        escalatedAt: now
      });
    }

    // Check conflict rate
    const conflictRate = metrics.syncOperationsTotal > 0 ? 
      metrics.conflictsDetected / metrics.syncOperationsTotal : 0;
    
    if (conflictRate > 0.05) { // 5% conflict rate
      await this.createSyncHealthEscalation({
        type: 'conflict_storm',
        severity: 'warning',
        agentId,
        tenantId: heartbeat.tenantId,
        syncMetrics: metrics,
        recommendedActions: [
          'Review concurrent operations',
          'Check file system permissions',
          'Verify conflict resolution policies'
        ],
        autoRecoveryAttempted: false,
        escalatedAt: now
      });
    }
  }

  /**
   * Check system-wide sync health
   */
  private async checkSystemSyncHealth(): Promise<void> {
    const allHeartbeats = Array.from(this.syncAwareHeartbeats.values());
    
    if (allHeartbeats.length === 0) return;

    // Calculate system-wide metrics
    const totalOperations = allHeartbeats.reduce((sum, hb) => sum + hb.syncMetrics.syncOperationsTotal, 0);
    const totalErrors = allHeartbeats.reduce((sum, hb) => sum + hb.syncMetrics.syncOperationsFailed, 0);
    const systemErrorRate = totalOperations > 0 ? totalErrors / totalOperations : 0;
    
    const avgLatency = allHeartbeats.reduce((sum, hb) => sum + hb.syncMetrics.syncLatencyMs, 0) / allHeartbeats.length;
    
    // Check system health thresholds
    if (systemErrorRate > 0.15) { // 15% system error rate
      await this.createSyncHealthEscalation({
        type: 'sync_failure',
        severity: 'critical',
        syncMetrics: {
          syncOperationsTotal: totalOperations,
          syncOperationsFailed: totalErrors,
          syncErrorRate: systemErrorRate,
          syncLatencyMs: avgLatency,
          syncOperationsSuccess: totalOperations - totalErrors,
          conflictsDetected: allHeartbeats.reduce((sum, hb) => sum + hb.syncMetrics.conflictsDetected, 0),
          conflictsResolved: allHeartbeats.reduce((sum, hb) => sum + hb.syncMetrics.conflictsResolved, 0),
          fileWatcherHealth: 'healthy', // TODO: Implement file watcher health check
          clockSyncHealth: 'synchronized', // TODO: Get from master clock service
          lastSyncTimestamp: new Date(),
          avgSyncDuration: avgLatency
        },
        recommendedActions: [
          'Check system resources',
          'Review sync service configuration',
          'Investigate network issues',
          'Consider scaling sync infrastructure'
        ],
        autoRecoveryAttempted: false,
        escalatedAt: new Date()
      });
    }

    this.emit('system_sync_health_checked', {
      totalAgents: allHeartbeats.length,
      systemErrorRate,
      avgLatency,
      totalOperations
    });
  }

  /**
   * Collect sync metrics for agent
   */
  private async collectAgentSyncMetrics(agentId: string): Promise<SyncHealthMetrics> {
    // Get existing metrics or create default
    const existing = this.syncHealthMetrics.get(agentId) || this.createDefaultSyncMetrics();
    
    // TODO: Integrate with actual sync services to get real metrics
    // For now, return existing metrics
    return existing;
  }

  /**
   * Collect system sync metrics
   */
  private async collectSyncMetrics(): Promise<void> {
    try {
      // Collect metrics from all agents
      for (const agentId of this.syncAwareHeartbeats.keys()) {
        const metrics = await this.collectAgentSyncMetrics(agentId);
        this.syncHealthMetrics.set(agentId, metrics);
      }
      
      this.emit('sync_metrics_collected', {
        timestamp: new Date(),
        agentCount: this.syncAwareHeartbeats.size,
        metricsCollected: this.syncHealthMetrics.size
      });
      
    } catch (error) {
      this.logger.error('Error collecting sync metrics:', error);
    }
  }

  /**
   * Create sync health escalation
   */
  private async createSyncHealthEscalation(escalation: SyncHealthEscalation): Promise<void> {
    const key = escalation.agentId || 'system';
    
    if (!this.escalationHistory.has(key)) {
      this.escalationHistory.set(key, []);
    }
    
    const history = this.escalationHistory.get(key)!;
    history.push(escalation);
    
    // Keep only last 100 escalations
    if (history.length > 100) {
      history.splice(0, history.length - 100);
    }
    
    this.logger.warn(`Sync health escalation created: ${escalation.type} (${escalation.severity})`, {
      agentId: escalation.agentId,
      tenantId: escalation.tenantId,
      syncMetrics: escalation.syncMetrics
    });
    
    this.emit('sync_health_escalation_created', escalation);
  }

  /**
   * Trigger sync-aware escalation procedures
   */
  private async triggerSyncAwareEscalation(alert: SyncAwareStagnationAlert): Promise<void> {
    switch (alert.escalationPath) {
      case 'sync_recovery':
        await this.executeSyncRecovery(alert);
        break;
      case 'conflict_resolution':
        await this.executeConflictResolution(alert);
        break;
      case 'manual_intervention':
        await this.executeManualIntervention(alert);
        break;
    }
  }

  /**
   * Execute sync recovery procedures
   */
  private async executeSyncRecovery(alert: SyncAwareStagnationAlert): Promise<void> {
    this.logger.log(`Executing sync recovery for agent ${alert.agentId}`);
    
    // Emit recovery event for sync orchestrator
    this.emit('sync_recovery_required', {
      agentId: alert.agentId,
      tenantId: alert.tenantId,
      syncContext: alert.syncContext,
      recoveryActions: [
        'restart_sync_operations',
        'clear_sync_queue',
        'reinitialize_file_watchers'
      ]
    });
  }

  /**
   * Execute conflict resolution procedures
   */
  private async executeConflictResolution(alert: SyncAwareStagnationAlert): Promise<void> {
    this.logger.log(`Executing conflict resolution for agent ${alert.agentId}`);
    
    // Emit conflict resolution event for conflict manager
    this.emit('conflict_resolution_required', {
      agentId: alert.agentId,
      tenantId: alert.tenantId,
      syncContext: alert.syncContext,
      resolutionStrategy: 'automated_merge'
    });
  }

  /**
   * Execute manual intervention procedures
   */
  private async executeManualIntervention(alert: SyncAwareStagnationAlert): Promise<void> {
    this.logger.log(`Escalating to manual intervention for agent ${alert.agentId}`);
    
    // Create high-priority alert for human operators
    this.emit('manual_intervention_required', {
      agentId: alert.agentId,
      tenantId: alert.tenantId,
      alert,
      urgency: 'high',
      recommendedActions: [
        'Review sync logs',
        'Check system resources',
        'Verify network connectivity',
        'Consider agent restart'
      ]
    });
  }

  /**
   * Utility methods
   */
  private createDefaultHeartbeat(agentId: string): SyncAwareAgentHeartbeat {
    return {
      agentId,
      lastHeartbeat: new Date(),
      lastActivity: new Date(),
      status: 'active',
      consecutiveFailures: 0,
      syncMetrics: this.createDefaultSyncMetrics(),
      syncState: 'synchronized'
    };
  }

  private createDefaultSyncMetrics(): SyncHealthMetrics {
    return {
      syncOperationsTotal: 0,
      syncOperationsSuccess: 0,
      syncOperationsFailed: 0,
      syncLatencyMs: 0,
      conflictsDetected: 0,
      conflictsResolved: 0,
      fileWatcherHealth: 'healthy',
      clockSyncHealth: 'synchronized',
      lastSyncTimestamp: new Date(),
      syncErrorRate: 0,
      avgSyncDuration: 0
    };
  }

  private determineSyncState(metrics: SyncHealthMetrics): 'synchronized' | 'syncing' | 'conflict' | 'error' {
    if (metrics.syncErrorRate > 0.1) return 'error';
    if (metrics.conflictsDetected > metrics.conflictsResolved) return 'conflict';
    if (metrics.syncOperationsTotal > metrics.syncOperationsSuccess + metrics.syncOperationsFailed) return 'syncing';
    return 'synchronized';
  }

  private determineEscalationPath(heartbeat: SyncAwareAgentHeartbeat): 'sync_recovery' | 'conflict_resolution' | 'manual_intervention' {
    if (heartbeat.syncState === 'conflict') return 'conflict_resolution';
    if (heartbeat.syncState === 'error' && heartbeat.syncMetrics.syncErrorRate < 0.5) return 'sync_recovery';
    return 'manual_intervention';
  }

  private async getPendingOperationsCount(agentId: string): Promise<number> {
    // TODO: Integrate with sync orchestrator to get actual pending operations
    return 0;
  }

  private calculateAvgSyncDuration(agentId: string, newDuration: number): number {
    // TODO: Implement proper averaging with historical data
    return newDuration;
  }

  private calculateSyncErrorRate(metrics: SyncHealthMetrics): number {
    return metrics.syncOperationsTotal > 0 ? 
      metrics.syncOperationsFailed / metrics.syncOperationsTotal : 0;
  }

  private async triggerSyncRecovery(agentId: string, heartbeat: SyncAwareAgentHeartbeat): Promise<void> {
    this.emit('sync_recovery_triggered', {
      agentId,
      tenantId: heartbeat.tenantId,
      syncState: heartbeat.syncState,
      syncMetrics: heartbeat.syncMetrics
    });
  }

  private triggerSyncFailureEscalation(agentId: string, error: any, tenantId?: string): void {
    this.createSyncHealthEscalation({
      type: 'sync_failure',
      severity: 'critical',
      agentId,
      tenantId,
      syncMetrics: this.syncHealthMetrics.get(agentId) || this.createDefaultSyncMetrics(),
      recommendedActions: [
        'Check sync service logs',
        'Verify agent connectivity',
        'Review error details',
        'Consider agent restart'
      ],
      autoRecoveryAttempted: false,
      escalatedAt: new Date()
    });
  }

  private triggerClockDriftEscalation(instances: any[], maxDrift: number): void {
    this.createSyncHealthEscalation({
      type: 'clock_drift',
      severity: maxDrift > 5000 ? 'critical' : 'warning',
      syncMetrics: this.createDefaultSyncMetrics(),
      recommendedActions: [
        'Check NTP synchronization',
        'Verify system clock settings',
        'Review network latency',
        'Consider clock service restart'
      ],
      autoRecoveryAttempted: false,
      escalatedAt: new Date()
    });
  }

  /**
   * Public API methods
   */

  /**
   * Get sync-aware heartbeat for agent
   */
  getSyncAwareHeartbeat(agentId: string): SyncAwareAgentHeartbeat | undefined {
    return this.syncAwareHeartbeats.get(agentId);
  }

  /**
   * Get sync health metrics for agent
   */
  getSyncHealthMetrics(agentId: string): SyncHealthMetrics | undefined {
    return this.syncHealthMetrics.get(agentId);
  }

  /**
   * Get escalation history for agent or system
   */
  getEscalationHistory(agentId?: string): SyncHealthEscalation[] {
    const key = agentId || 'system';
    return this.escalationHistory.get(key) || [];
  }

  /**
   * Get unified health report
   */
  getUnifiedHealthReport(): {
    systemHealth: 'healthy' | 'degraded' | 'critical';
    agentCount: number;
    syncMetrics: {
      totalOperations: number;
      errorRate: number;
      avgLatency: number;
      conflictRate: number;
    };
    activeEscalations: number;
    lastHealthCheck: Date;
  } {
    const allHeartbeats = Array.from(this.syncAwareHeartbeats.values());
    const totalOperations = allHeartbeats.reduce((sum, hb) => sum + hb.syncMetrics.syncOperationsTotal, 0);
    const totalErrors = allHeartbeats.reduce((sum, hb) => sum + hb.syncMetrics.syncOperationsFailed, 0);
    const totalConflicts = allHeartbeats.reduce((sum, hb) => sum + hb.syncMetrics.conflictsDetected, 0);
    
    const errorRate = totalOperations > 0 ? totalErrors / totalOperations : 0;
    const conflictRate = totalOperations > 0 ? totalConflicts / totalOperations : 0;
    const avgLatency = allHeartbeats.length > 0 ? 
      allHeartbeats.reduce((sum, hb) => sum + hb.syncMetrics.syncLatencyMs, 0) / allHeartbeats.length : 0;

    let systemHealth: 'healthy' | 'degraded' | 'critical' = 'healthy';
    if (errorRate > 0.25 || avgLatency > 10000) {
      systemHealth = 'critical';
    } else if (errorRate > 0.1 || avgLatency > 5000 || conflictRate > 0.1) {
      systemHealth = 'degraded';
    }

    const activeEscalations = Array.from(this.escalationHistory.values())
      .flat()
      .filter(esc => esc.escalatedAt > new Date(Date.now() - 24 * 60 * 60 * 1000)) // Last 24 hours
      .length;

    return {
      systemHealth,
      agentCount: allHeartbeats.length,
      syncMetrics: {
        totalOperations,
        errorRate,
        avgLatency,
        conflictRate
      },
      activeEscalations,
      lastHealthCheck: new Date()
    };
  }

  /**
   * Cleanup resources
   */
  async onModuleDestroy(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    if (this.metricsCollectionInterval) {
      clearInterval(this.metricsCollectionInterval);
    }
    
    this.logger.log('SyncAwareHeartbeatMonitoringService destroyed');
  }
}