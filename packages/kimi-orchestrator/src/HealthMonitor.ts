/**
 * Health Monitor for KIMI Orchestrator
 *
 * Monitors the health of the agent fleet, detects failures,
 * and handles automatic recovery of agents.
 */

import { EventEmitter } from 'events';

import { HEALTH_THRESHOLDS, ORCHESTRATOR_EVENTS } from './constants';
import { sleep } from './utils';

import type { AgentPool } from './AgentPool';
import type { AgentHealth, KimiAgent, KimiOrchestratorConfig } from './types';

/**
 * Health check result for an agent
 */
interface HealthCheckResult {
  agentId: string;
  healthy: boolean;
  responseTimeMs: number;
  error?: string;
}

/**
 * Health Monitor class for monitoring agent fleet health
 */
export class HealthMonitor extends EventEmitter {
  private agentPool: AgentPool;
  private config: Pick<
    KimiOrchestratorConfig,
    'heartbeatIntervalMs' | 'agentTimeoutMs' | 'enableAutoRecovery'
  >;
  private healthChecks: Map<string, AgentHealth> = new Map();
  private monitoringInterval?: NodeJS.Timeout;
  private recoveryAttempts: Map<string, number> = new Map();
  private isRunning = false;

  constructor(
    agentPool: AgentPool,
    config: Pick<
      KimiOrchestratorConfig,
      'heartbeatIntervalMs' | 'agentTimeoutMs' | 'enableAutoRecovery'
    >
  ) {
    super();
    this.agentPool = agentPool;
    this.config = config;
  }

  /**
   * Start health monitoring
   */
  start(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.emit('monitoring:started');

    // Perform initial health check
    this.performHealthCheck();

    // Set up periodic health checks
    this.monitoringInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.config.heartbeatIntervalMs);
  }

  /**
   * Stop health monitoring
   */
  stop(): void {
    this.isRunning = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    this.emit('monitoring:stopped');
  }

  /**
   * Perform health check on all agents
   */
  private async performHealthCheck(): Promise<void> {
    const agents = this.agentPool.getAllAgents();
    const checkPromises = agents.map((agent) => this.checkAgentHealth(agent));

    const results = await Promise.allSettled(checkPromises);

    for (let i = 0; i < agents.length; i++) {
      const agent = agents[i];
      const result = results[i];

      if (result.status === 'fulfilled') {
        await this.processHealthCheckResult(agent, result.value);
      } else {
        // Health check failed to execute
        await this.handleHealthCheckFailure(agent, result.reason as Error);
      }
    }

    this.emit(ORCHESTRATOR_EVENTS.POOL_STATS, { stats: this.agentPool.getStats() });
  }

  /**
   * Check health of a single agent
   */
  private async checkAgentHealth(agent: KimiAgent): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      // Check if agent has timed out (no heartbeat received)
      const lastSeen = new Date(agent.lastSeen).getTime();
      const now = Date.now();
      const timeSinceLastSeen = now - lastSeen;

      if (timeSinceLastSeen > this.config.agentTimeoutMs) {
        return {
          agentId: agent.id,
          healthy: false,
          responseTimeMs: timeSinceLastSeen,
          error: `Agent timed out - last seen ${timeSinceLastSeen}ms ago`,
        };
      }

      // Calculate response time
      const responseTimeMs = Date.now() - startTime;

      // Check if response time is acceptable
      if (responseTimeMs > HEALTH_THRESHOLDS.maxResponseTimeMs) {
        return {
          agentId: agent.id,
          healthy: false,
          responseTimeMs,
          error: `Response time ${responseTimeMs}ms exceeds threshold`,
        };
      }

      return {
        agentId: agent.id,
        healthy: true,
        responseTimeMs,
      };
    } catch (error) {
      return {
        agentId: agent.id,
        healthy: false,
        responseTimeMs: Date.now() - startTime,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Process health check result
   */
  private async processHealthCheckResult(
    agent: KimiAgent,
    result: HealthCheckResult
  ): Promise<void> {
    const previousHealth = this.healthChecks.get(agent.id);
    const healthStatus = this.determineHealthStatus(agent, result);

    // Update health record
    const health: AgentHealth = {
      agentId: agent.id,
      status: result.healthy ? 'healthy' : healthStatus,
      lastHeartbeat: new Date().toISOString(),
      responseTimeMs: result.responseTimeMs,
      activeTasks: agent.runningTasks,
      queueDepth: agent.currentTask ? 1 : 0,
      errorRate: this.calculateErrorRate(agent.id),
    };

    this.healthChecks.set(agent.id, health);

    // Update agent health in pool
    if (result.healthy) {
      this.agentPool.updateAgentHealth(agent.id, 'healthy');
      this.recoveryAttempts.delete(agent.id);
    } else {
      this.agentPool.updateAgentHealth(
        agent.id,
        healthStatus === 'healthy' ? 'degraded' : 'unhealthy'
      );

      // Handle failure
      await this.handleAgentFailure(agent, result);
    }

    // Emit health change event if status changed
    if (previousHealth?.status !== health.status) {
      this.emit(ORCHESTRATOR_EVENTS.AGENT_HEALTH_CHANGED, {
        agentId: agent.id,
        health,
      });
    }
  }

  /**
   * Determine health status based on check result
   */
  private determineHealthStatus(
    agent: KimiAgent,
    result: HealthCheckResult
  ): AgentHealth['status'] {
    if (result.healthy) {
      return 'healthy';
    }

    // Check if agent is recoverable
    const failures = this.recoveryAttempts.get(agent.id) || 0;
    if (failures >= HEALTH_THRESHOLDS.maxConsecutiveFailures) {
      return 'offline';
    }

    // Check response time degradation
    if (result.responseTimeMs > HEALTH_THRESHOLDS.maxResponseTimeMs * 2) {
      return 'unhealthy';
    }

    return 'degraded';
  }

  /**
   * Handle health check execution failure
   */
  private async handleHealthCheckFailure(agent: KimiAgent, error: Error): Promise<void> {
    const failures = (this.recoveryAttempts.get(agent.id) || 0) + 1;
    this.recoveryAttempts.set(agent.id, failures);

    const health: AgentHealth = {
      agentId: agent.id,
      status: failures >= HEALTH_THRESHOLDS.maxConsecutiveFailures ? 'offline' : 'unhealthy',
      lastHeartbeat: agent.lastSeen,
      responseTimeMs: -1,
      activeTasks: agent.runningTasks,
      queueDepth: agent.currentTask ? 1 : 0,
      errorRate: this.calculateErrorRate(agent.id),
    };

    this.healthChecks.set(agent.id, health);
    this.agentPool.updateAgentHealth(
      agent.id,
      health.status === 'offline' ? 'unhealthy' : health.status
    );

    await this.handleAgentFailure(agent, {
      agentId: agent.id,
      healthy: false,
      responseTimeMs: -1,
      error: error.message,
    });
  }

  /**
   * Handle agent failure
   */
  private async handleAgentFailure(agent: KimiAgent, result: HealthCheckResult): Promise<void> {
    const failures = (this.recoveryAttempts.get(agent.id) || 0) + 1;
    this.recoveryAttempts.set(agent.id, failures);

    this.emit(ORCHESTRATOR_EVENTS.AGENT_FAILED, {
      agentId: agent.id,
      error: new Error(result.error || 'Health check failed'),
    });

    // Attempt recovery if enabled
    if (this.config.enableAutoRecovery) {
      if (failures <= HEALTH_THRESHOLDS.maxConsecutiveFailures) {
        await this.attemptRecovery(agent);
      } else {
        // Mark agent as permanently failed
        await this.handlePermanentFailure(agent);
      }
    }
  }

  /**
   * Attempt to recover a failed agent
   */
  private async attemptRecovery(agent: KimiAgent): Promise<void> {
    this.emit('agent:recovery-attempt', { agentId: agent.id });

    try {
      // Wait before attempting recovery
      await sleep(5000 * (this.recoveryAttempts.get(agent.id) || 1));

      // Check if agent has recovered
      const result = await this.checkAgentHealth(agent);

      if (result.healthy) {
        // Recovery successful
        this.recoveryAttempts.delete(agent.id);
        this.agentPool.updateAgentHealth(agent.id, 'healthy');
        this.emit(ORCHESTRATOR_EVENTS.AGENT_RECOVERED, { agentId: agent.id });
      } else {
        // Recovery failed
        this.emit('agent:recovery-failed', {
          agentId: agent.id,
          attempts: this.recoveryAttempts.get(agent.id),
        });
      }
    } catch (error) {
      this.emit('agent:recovery-error', {
        agentId: agent.id,
        error,
      });
    }
  }

  /**
   * Handle permanent agent failure
   */
  private async handlePermanentFailure(agent: KimiAgent): Promise<void> {
    this.emit(ORCHESTRATOR_EVENTS.ERROR, {
      error: new Error(`Agent ${agent.id} has permanently failed`),
      context: { agentId: agent.id, attempts: this.recoveryAttempts.get(agent.id) },
    });

    // Unregister the failed agent
    await this.agentPool.unregisterAgent(agent.id);

    // Clear recovery attempts
    this.recoveryAttempts.delete(agent.id);
    this.healthChecks.delete(agent.id);
  }

  /**
   * Calculate error rate for an agent
   */
  private calculateErrorRate(agentId: string): number {
    const health = this.healthChecks.get(agentId);
    if (!health) {
      return 0;
    }

    // Simple error rate based on recent failures
    const failures = this.recoveryAttempts.get(agentId) || 0;
    return Math.min(failures / HEALTH_THRESHOLDS.maxConsecutiveFailures, 1);
  }

  /**
   * Get health status for an agent
   */
  getAgentHealth(agentId: string): AgentHealth | undefined {
    return this.healthChecks.get(agentId);
  }

  /**
   * Get health status for all agents
   */
  getAllHealth(): AgentHealth[] {
    return Array.from(this.healthChecks.values());
  }

  /**
   * Record a heartbeat from an agent
   */
  recordHeartbeat(agentId: string): void {
    const agent = this.agentPool.getAgent(agentId);
    if (agent) {
      agent.lastSeen = new Date().toISOString();
      agent.lastHealthCheck = new Date().toISOString();

      // Clear recovery attempts on successful heartbeat
      if (this.recoveryAttempts.has(agentId)) {
        this.recoveryAttempts.delete(agentId);
        this.agentPool.updateAgentHealth(agentId, 'healthy');
      }
    }
  }

  /**
   * Check if monitoring is running
   */
  isMonitoring(): boolean {
    return this.isRunning;
  }

  /**
   * Get recovery attempt count for an agent
   */
  getRecoveryAttempts(agentId: string): number {
    return this.recoveryAttempts.get(agentId) || 0;
  }

  /**
   * Force a health check
   */
  async forceHealthCheck(): Promise<void> {
    await this.performHealthCheck();
  }

  /**
   * Get summary of fleet health
   */
  getHealthSummary(): {
    total: number;
    healthy: number;
    degraded: number;
    unhealthy: number;
    offline: number;
  } {
    const healths = this.getAllHealth();
    return {
      total: healths.length,
      healthy: healths.filter((h) => h.status === 'healthy').length,
      degraded: healths.filter((h) => h.status === 'degraded').length,
      unhealthy: healths.filter((h) => h.status === 'unhealthy').length,
      offline: healths.filter((h) => h.status === 'offline').length,
    };
  }
}
