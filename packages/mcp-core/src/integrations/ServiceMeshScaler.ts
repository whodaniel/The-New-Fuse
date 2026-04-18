/**
 * Service Mesh Scaler
 * 
 * Provides automatic scaling capabilities for MCP services in a service mesh
 * based on metrics, load, and custom scaling policies.
 */

import { EventEmitter } from 'events';
import {
  ServiceMeshProvider,
  ServiceMeshMetrics,
  ServiceScalingConfig,
  ScalingEvent,
  ScalingPolicy,
  ServiceMeshIntegrationResult
} from './MCPServiceMesh.js';
import { MCPErrorClass as MCPError, MCPErrorCode } from '../types/error.js';

/**
 * Scaler configuration
 */
export interface ServiceMeshScalerConfig {
  /** Scaling evaluation interval in seconds */
  evaluationInterval: number;
  /** Default scaling configuration */
  defaultScalingConfig: Partial<ServiceScalingConfig>;
  /** Enable predictive scaling */
  enablePredictiveScaling: boolean;
  /** Scaling decision history retention in seconds */
  historyRetention: number;
  /** Maximum scaling operations per service per hour */
  maxScalingOpsPerHour: number;
  /** Enable scaling notifications */
  enableNotifications: boolean;
}

/**
 * Scaling decision
 */
export interface ScalingDecision {
  /** Service ID */
  serviceId: string;
  /** Decision type */
  type: 'scale_up' | 'scale_down' | 'no_action';
  /** Current instances */
  currentInstances: number;
  /** Recommended instances */
  recommendedInstances: number;
  /** Reason for scaling decision */
  reason: string;
  /** Metrics that influenced the decision */
  influencingMetrics: Array<{
    name: string;
    value: number;
    threshold: number;
    weight: number;
  }>;
  /** Confidence score (0-1) */
  confidence: number;
  /** Decision timestamp */
  timestamp: Date;
}

/**
 * Scaling history entry
 */
export interface ScalingHistoryEntry {
  /** Service ID */
  serviceId: string;
  /** Scaling event (undefined for no-action decisions) */
  event?: ScalingEvent;
  /** Decision that led to this scaling */
  decision: ScalingDecision;
  /** Scaling result */
  result: 'success' | 'failed' | 'cancelled';
  /** Error message if failed */
  error?: string;
  /** Duration of scaling operation in milliseconds */
  duration: number;
}

/**
 * Service scaling state
 */
export interface ServiceScalingState {
  /** Service ID */
  serviceId: string;
  /** Scaling configuration */
  config: ServiceScalingConfig;
  /** Current scaling status */
  status: {
    currentInstances: number;
    desiredInstances: number;
    lastScalingEvent?: ScalingEvent;
    isScaling: boolean;
    cooldownUntil?: Date;
  };
  /** Scaling history */
  history: ScalingHistoryEntry[];
  /** Scaling operations count in current hour */
  operationsThisHour: number;
  /** Last evaluation timestamp */
  lastEvaluation: Date;
  /** Metrics history for predictive scaling */
  metricsHistory: ServiceMeshMetrics[];
}

/**
 * Scaling statistics
 */
export interface ScalingStatistics {
  /** Total services under scaling management */
  totalServices: number;
  /** Services currently scaling */
  servicesScaling: number;
  /** Services in cooldown */
  servicesInCooldown: number;
  /** Total scaling operations performed */
  totalScalingOperations: number;
  /** Successful scaling operations */
  successfulOperations: number;
  /** Failed scaling operations */
  failedOperations: number;
  /** Average scaling decision confidence */
  averageConfidence: number;
  /** Most common scaling reasons */
  commonScalingReasons: Array<{ reason: string; count: number }>;
  /** Last statistics update */
  lastUpdate: Date;
}

/**
 * Service Mesh Scaler implementation
 */
export class ServiceMeshScaler extends EventEmitter {
  private provider: ServiceMeshProvider;
  private config: ServiceMeshScalerConfig;
  private scalingStates: Map<string, ServiceScalingState> = new Map();
  private evaluationInterval?: NodeJS.Timeout;
  private isRunning = false;
  private statistics: ScalingStatistics;

  constructor(provider: ServiceMeshProvider, config: ServiceMeshScalerConfig) {
    super();
    this.provider = provider;
    this.config = config;
    this.statistics = this.initializeStatistics();
  }

  /**
   * Initialize scaling statistics
   */
  private initializeStatistics(): ScalingStatistics {
    return {
      totalServices: 0,
      servicesScaling: 0,
      servicesInCooldown: 0,
      totalScalingOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      averageConfidence: 0,
      commonScalingReasons: [],
      lastUpdate: new Date()
    };
  }

  /**
   * Start automatic scaling
   */
  async startScaling(): Promise<ServiceMeshIntegrationResult> {
    try {
      if (this.isRunning) {
        return {
          success: false,
          message: 'Scaling is already running'
        };
      }

      // Start scaling evaluation
      this.evaluationInterval = setInterval(
        () => this.evaluateScaling(),
        this.config.evaluationInterval * 1000
      );

      this.isRunning = true;
      this.emit('scaling-started');

      return {
        success: true,
        message: 'Service mesh scaling started successfully',
        metadata: {
          evaluationInterval: this.config.evaluationInterval,
          startTime: new Date().toISOString()
        }
      };

    } catch (error) {
      return {
        success: false,
        message: 'Failed to start service mesh scaling',
        error: {
          code: 'SCALING_START_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error
        }
      };
    }
  }

  /**
   * Stop automatic scaling
   */
  async stopScaling(): Promise<ServiceMeshIntegrationResult> {
    try {
      if (!this.isRunning) {
        return {
          success: false,
          message: 'Scaling is not running'
        };
      }

      // Clear evaluation interval
      if (this.evaluationInterval) {
        clearInterval(this.evaluationInterval);
        this.evaluationInterval = undefined;
      }

      this.isRunning = false;
      this.emit('scaling-stopped');

      return {
        success: true,
        message: 'Service mesh scaling stopped successfully',
        metadata: {
          stopTime: new Date().toISOString()
        }
      };

    } catch (error) {
      return {
        success: false,
        message: 'Failed to stop service mesh scaling',
        error: {
          code: 'SCALING_STOP_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error
        }
      };
    }
  }

  /**
   * Add service to scaling management
   */
  async addService(serviceId: string, scalingConfig?: ServiceScalingConfig): Promise<ServiceMeshIntegrationResult> {
    try {
      if (this.scalingStates.has(serviceId)) {
        return {
          success: false,
          message: `Service ${serviceId} is already under scaling management`
        };
      }

      // Use provided config or default
      const config: ServiceScalingConfig = {
        ...this.config.defaultScalingConfig,
        ...scalingConfig,
        minInstances: scalingConfig?.minInstances ?? this.config.defaultScalingConfig.minInstances ?? 1,
        maxInstances: scalingConfig?.maxInstances ?? this.config.defaultScalingConfig.maxInstances ?? 10,
        scaleUpCooldown: scalingConfig?.scaleUpCooldown ?? this.config.defaultScalingConfig.scaleUpCooldown ?? 300,
        scaleDownCooldown: scalingConfig?.scaleDownCooldown ?? this.config.defaultScalingConfig.scaleDownCooldown ?? 600
      };

      // Configure scaling with provider
      await this.provider.configureScaling(serviceId, config);

      // Get current scaling status
      const scalingStatus = await this.provider.getScalingStatus(serviceId);

      // Create scaling state
      const scalingState: ServiceScalingState = {
        serviceId,
        config,
        status: {
          currentInstances: scalingStatus.currentInstances,
          desiredInstances: scalingStatus.desiredInstances,
          isScaling: false
        },
        history: [],
        operationsThisHour: 0,
        lastEvaluation: new Date(),
        metricsHistory: []
      };

      this.scalingStates.set(serviceId, scalingState);
      this.updateStatistics();
      this.emit('service-added', serviceId);

      return {
        success: true,
        message: `Service ${serviceId} added to scaling management`,
        metadata: {
          serviceId,
          minInstances: config.minInstances,
          maxInstances: config.maxInstances
        }
      };

    } catch (error) {
      return {
        success: false,
        message: `Failed to add service ${serviceId} to scaling management`,
        error: {
          code: 'SERVICE_ADD_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error
        }
      };
    }
  }

  /**
   * Remove service from scaling management
   */
  async removeService(serviceId: string): Promise<ServiceMeshIntegrationResult> {
    try {
      if (!this.scalingStates.has(serviceId)) {
        return {
          success: false,
          message: `Service ${serviceId} is not under scaling management`
        };
      }

      this.scalingStates.delete(serviceId);
      this.updateStatistics();
      this.emit('service-removed', serviceId);

      return {
        success: true,
        message: `Service ${serviceId} removed from scaling management`,
        metadata: {
          serviceId,
          removedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      return {
        success: false,
        message: `Failed to remove service ${serviceId} from scaling management`,
        error: {
          code: 'SERVICE_REMOVE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error
        }
      };
    }
  }

  /**
   * Get service scaling state
   */
  getServiceScalingState(serviceId: string): ServiceScalingState | undefined {
    return this.scalingStates.get(serviceId);
  }

  /**
   * Get all managed services
   */
  getManagedServices(): string[] {
    return Array.from(this.scalingStates.keys());
  }

  /**
   * Get scaling statistics
   */
  getStatistics(): ScalingStatistics {
    this.updateStatistics();
    return { ...this.statistics };
  }

  /**
   * Get scaling history for a service
   */
  getScalingHistory(serviceId: string, limit?: number): ScalingHistoryEntry[] {
    const scalingState = this.scalingStates.get(serviceId);
    if (!scalingState) return [];

    const history = [...scalingState.history].sort(
      (a, b) => {
        const aTime = a.event?.timestamp.getTime() || 0;
        const bTime = b.event?.timestamp.getTime() || 0;
        return bTime - aTime;
      }
    );

    return limit ? history.slice(0, limit) : history;
  }

  /**
   * Manually trigger scaling evaluation for a service
   */
  async evaluateService(serviceId: string): Promise<ScalingDecision> {
    const scalingState = this.scalingStates.get(serviceId);
    if (!scalingState) {
      throw new MCPError(
        MCPErrorCode.RESOURCE_NOT_FOUND,
        `Service ${serviceId} is not under scaling management`
      );
    }

    return await this.evaluateServiceScaling(scalingState);
  }

  /**
   * Manually scale a service
   */
  async scaleService(serviceId: string, targetInstances: number, reason: string): Promise<ServiceMeshIntegrationResult> {
    try {
      const scalingState = this.scalingStates.get(serviceId);
      if (!scalingState) {
        throw new MCPError(
          MCPErrorCode.RESOURCE_NOT_FOUND,
          `Service ${serviceId} is not under scaling management`
        );
      }

      // Validate target instances
      if (targetInstances < scalingState.config.minInstances || 
          targetInstances > scalingState.config.maxInstances) {
        throw new MCPError(
          MCPErrorCode.INVALID_PARAMS,
          `Target instances ${targetInstances} is outside allowed range [${scalingState.config.minInstances}, ${scalingState.config.maxInstances}]`
        );
      }

      // Check if already at target
      if (scalingState.status.currentInstances === targetInstances) {
        return {
          success: true,
          message: `Service ${serviceId} is already at ${targetInstances} instances`
        };
      }

      // Create scaling decision
      const decision: ScalingDecision = {
        serviceId,
        type: targetInstances > scalingState.status.currentInstances ? 'scale_up' : 'scale_down',
        currentInstances: scalingState.status.currentInstances,
        recommendedInstances: targetInstances,
        reason: `Manual scaling: ${reason}`,
        influencingMetrics: [],
        confidence: 1.0,
        timestamp: new Date()
      };

      // Execute scaling
      const result = await this.executeScaling(scalingState, decision);

      return {
        success: result.result === 'success',
        message: result.result === 'success' 
          ? `Service ${serviceId} successfully scaled to ${targetInstances} instances`
          : `Failed to scale service ${serviceId}: ${result.error}`,
        metadata: {
          serviceId,
          previousInstances: decision.currentInstances,
          newInstances: targetInstances,
          scalingType: decision.type,
          duration: result.duration
        }
      };

    } catch (error) {
      return {
        success: false,
        message: `Failed to scale service ${serviceId}`,
        error: {
          code: error instanceof MCPError ? error.code.toString() : 'SCALING_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error
        }
      };
    }
  }

  /**
   * Evaluate scaling for all managed services
   */
  private async evaluateScaling(): Promise<void> {
    const evaluationPromises = Array.from(this.scalingStates.values()).map(
      scalingState => this.evaluateAndExecuteScaling(scalingState)
    );

    await Promise.allSettled(evaluationPromises);
    this.updateStatistics();
  }

  /**
   * Evaluate and execute scaling for a service
   */
  private async evaluateAndExecuteScaling(scalingState: ServiceScalingState): Promise<void> {
    try {
      // Skip if in cooldown
      if (this.isInCooldown(scalingState)) {
        return;
      }

      // Skip if already scaling
      if (scalingState.status.isScaling) {
        return;
      }

      // Skip if exceeded operations limit
      if (scalingState.operationsThisHour >= this.config.maxScalingOpsPerHour) {
        return;
      }

      // Evaluate scaling decision
      const decision = await this.evaluateServiceScaling(scalingState);

      // Execute scaling if needed
      if (decision.type !== 'no_action') {
        await this.executeScaling(scalingState, decision);
      }

      scalingState.lastEvaluation = new Date();

    } catch (error) {
      this.emit('scaling-evaluation-failed', scalingState.serviceId, error);
    }
  }

  /**
   * Evaluate scaling decision for a service
   */
  private async evaluateServiceScaling(scalingState: ServiceScalingState): Promise<ScalingDecision> {
    // Get current metrics
    const metrics = await this.provider.getServiceMetrics(scalingState.serviceId);
    
    // Add to metrics history
    scalingState.metricsHistory.push(metrics);
    
    // Trim history
    const retentionCutoff = Date.now() - (this.config.historyRetention * 1000);
    scalingState.metricsHistory = scalingState.metricsHistory.filter(
      m => m.timestamp.getTime() > retentionCutoff
    );

    // Get current scaling status
    const scalingStatus = await this.provider.getScalingStatus(scalingState.serviceId);
    scalingState.status.currentInstances = scalingStatus.currentInstances;
    scalingState.status.desiredInstances = scalingStatus.desiredInstances;

    // Evaluate scaling policies
    const policyResults = scalingState.config.policies?.map((policy: any) => 
      this.evaluateScalingPolicy(policy, metrics, scalingState)
    ) || [];

    // Calculate scaling recommendation
    const scaleUpVotes = policyResults.filter((r: any) => r.recommendation === 'scale_up').length;
    const scaleDownVotes = policyResults.filter((r: any) => r.recommendation === 'scale_down').length;
    const noActionVotes = policyResults.filter((r: any) => r.recommendation === 'no_action').length;

    let decision: ScalingDecision;

    if (scaleUpVotes > scaleDownVotes && scaleUpVotes > noActionVotes) {
      // Scale up
      const targetInstances = Math.min(
        scalingState.status.currentInstances + 1,
        scalingState.config.maxInstances
      );
      
      decision = {
        serviceId: scalingState.serviceId,
        type: 'scale_up',
        currentInstances: scalingState.status.currentInstances,
        recommendedInstances: targetInstances,
        reason: this.buildScalingReason(policyResults.filter((r: any) => r.recommendation === 'scale_up')),
        influencingMetrics: policyResults
          .filter(r => r.recommendation === 'scale_up')
          .map(r => r.metric),
        confidence: scaleUpVotes / policyResults.length,
        timestamp: new Date()
      };
    } else if (scaleDownVotes > scaleUpVotes && scaleDownVotes > noActionVotes) {
      // Scale down
      const targetInstances = Math.max(
        scalingState.status.currentInstances - 1,
        scalingState.config.minInstances
      );
      
      decision = {
        serviceId: scalingState.serviceId,
        type: 'scale_down',
        currentInstances: scalingState.status.currentInstances,
        recommendedInstances: targetInstances,
        reason: this.buildScalingReason(policyResults.filter((r: any) => r.recommendation === 'scale_down')),
        influencingMetrics: policyResults
          .filter(r => r.recommendation === 'scale_down')
          .map(r => r.metric),
        confidence: scaleDownVotes / policyResults.length,
        timestamp: new Date()
      };
    } else {
      // No action
      decision = {
        serviceId: scalingState.serviceId,
        type: 'no_action',
        currentInstances: scalingState.status.currentInstances,
        recommendedInstances: scalingState.status.currentInstances,
        reason: 'No scaling action needed based on current metrics',
        influencingMetrics: [],
        confidence: noActionVotes / policyResults.length,
        timestamp: new Date()
      };
    }

    this.emit('scaling-decision', scalingState.serviceId, decision);
    return decision;
  }

  /**
   * Evaluate a scaling policy
   */
  private evaluateScalingPolicy(
    policy: ScalingPolicy, 
    metrics: ServiceMeshMetrics, 
    scalingState: ServiceScalingState
  ): { recommendation: 'scale_up' | 'scale_down' | 'no_action'; metric: any } {
    let metricValue: number;

    // Get metric value based on policy type
    switch (policy.metric) {
      case 'cpu':
        metricValue = metrics.resources.cpu;
        break;
      case 'memory':
        metricValue = metrics.resources.memory;
        break;
      case 'rps':
        metricValue = metrics.requests.rps;
        break;
      case 'connections':
        metricValue = metrics.connections.active;
        break;
      case 'custom':
        // For custom metrics, we'd need to implement custom metric evaluation
        metricValue = 0;
        break;
      default:
        metricValue = 0;
    }

    const metric = {
      name: policy.metric,
      value: metricValue,
      threshold: policy.targetValue,
      weight: 1.0
    };

    // Determine recommendation
    if (metricValue > policy.scaleUpThreshold) {
      return { recommendation: 'scale_up', metric };
    } else if (metricValue < policy.scaleDownThreshold) {
      return { recommendation: 'scale_down', metric };
    } else {
      return { recommendation: 'no_action', metric };
    }
  }

  /**
   * Execute scaling decision
   */
  private async executeScaling(scalingState: ServiceScalingState, decision: ScalingDecision): Promise<ScalingHistoryEntry> {
    const startTime = Date.now();
    scalingState.status.isScaling = true;

    try {
      // Create scaling event only for actual scaling actions
      let scalingEvent: ScalingEvent | undefined;
      if (decision.type !== 'no_action') {
        scalingEvent = {
          timestamp: new Date(),
          type: decision.type as 'scale_up' | 'scale_down',
          previousInstances: decision.currentInstances,
          newInstances: decision.recommendedInstances,
          reason: decision.reason,
          triggerMetric: decision.influencingMetrics[0]
        };
      }

      // Update desired instances (this would trigger actual scaling in the service mesh)
      scalingState.status.desiredInstances = decision.recommendedInstances;

      // In a real implementation, we would wait for the scaling to complete
      // For now, we'll simulate it
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update current instances
      scalingState.status.currentInstances = decision.recommendedInstances;
      scalingState.status.lastScalingEvent = scalingEvent;
      scalingState.status.isScaling = false;

      // Set cooldown
      const cooldownDuration = decision.type === 'scale_up' 
        ? scalingState.config.scaleUpCooldown 
        : scalingState.config.scaleDownCooldown;
      scalingState.status.cooldownUntil = new Date(Date.now() + cooldownDuration * 1000);

      // Update operations count
      scalingState.operationsThisHour++;

      // Create history entry
      const historyEntry: ScalingHistoryEntry = {
        serviceId: scalingState.serviceId,
        event: scalingEvent,
        decision,
        result: 'success',
        duration: Date.now() - startTime
      };

      scalingState.history.push(historyEntry);
      this.statistics.totalScalingOperations++;
      this.statistics.successfulOperations++;

      if (scalingEvent) {
        this.emit('scaling-completed', scalingState.serviceId, scalingEvent);
      }
      return historyEntry;

    } catch (error) {
      scalingState.status.isScaling = false;

      const historyEntry: ScalingHistoryEntry = {
        serviceId: scalingState.serviceId,
        event: decision.type !== 'no_action' ? {
          timestamp: new Date(),
          type: decision.type as 'scale_up' | 'scale_down',
          previousInstances: decision.currentInstances,
          newInstances: decision.recommendedInstances,
          reason: decision.reason
        } : undefined,
        decision,
        result: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      };

      scalingState.history.push(historyEntry);
      this.statistics.totalScalingOperations++;
      this.statistics.failedOperations++;

      this.emit('scaling-failed', scalingState.serviceId, error);
      return historyEntry;
    }
  }

  /**
   * Check if service is in cooldown
   */
  private isInCooldown(scalingState: ServiceScalingState): boolean {
    return scalingState.status.cooldownUntil ? 
      scalingState.status.cooldownUntil > new Date() : 
      false;
  }

  /**
   * Build scaling reason from policy results
   */
  private buildScalingReason(policyResults: Array<{ recommendation: string; metric: any }>): string {
    const reasons = policyResults.map(r => 
      `${r.metric.name}: ${r.metric.value} (threshold: ${r.metric.threshold})`
    );
    return reasons.join(', ');
  }

  /**
   * Update scaling statistics
   */
  private updateStatistics(): void {
    this.statistics.totalServices = this.scalingStates.size;
    this.statistics.servicesScaling = Array.from(this.scalingStates.values())
      .filter(state => state.status.isScaling).length;
    this.statistics.servicesInCooldown = Array.from(this.scalingStates.values())
      .filter(state => this.isInCooldown(state)).length;

    // Calculate average confidence
    const allDecisions = Array.from(this.scalingStates.values())
      .flatMap(state => state.history.map(h => h.decision));
    
    if (allDecisions.length > 0) {
      this.statistics.averageConfidence = allDecisions
        .reduce((sum, decision) => sum + decision.confidence, 0) / allDecisions.length;
    }

    // Calculate common scaling reasons
    const reasonCounts = new Map<string, number>();
    allDecisions.forEach(decision => {
      const count = reasonCounts.get(decision.reason) || 0;
      reasonCounts.set(decision.reason, count + 1);
    });

    this.statistics.commonScalingReasons = Array.from(reasonCounts.entries())
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    this.statistics.lastUpdate = new Date();
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    await this.stopScaling();
    this.scalingStates.clear();
    this.removeAllListeners();
  }
}