/**
 * Health Monitor Implementation
 *
 * Monitors the health of registered MCP services through periodic health checks
 * and provides health status reporting and automatic cleanup capabilities.
 */

import { EventEmitter } from 'events';
import { HealthCheckConfig, ServiceHealth } from '../types';
import { ServiceStatus } from '../types/common';
import { MCPErrorClass, MCPErrorCode } from '../types/error';

/**
 * Service health tracking information
 */
interface ServiceHealthTracker {
  serviceId: string;
  endpoint: string;
  health: ServiceHealth;
  consecutiveFailures: number;
  consecutiveSuccesses: number;
  lastCheckTime: Date;
  checkInterval?: NodeJS.Timeout;
}

/**
 * Health Monitor class for monitoring MCP service health
 */
export class HealthMonitor extends EventEmitter {
  private config: HealthCheckConfig;
  private services: Map<string, ServiceHealthTracker> = new Map();
  private globalInterval?: NodeJS.Timeout;
  private isStarted: boolean = false;

  constructor(config: HealthCheckConfig) {
    super();
    this.config = config;
  }

  /**
   * Start the health monitor
   */
  async start(): Promise<void> {
    if (this.isStarted || !this.config.enabled) {
      return;
    }

    // Start global health check interval
    this.globalInterval = setInterval(() => {
      this.performHealthChecks().catch((error) => {
        console.error('Health check cycle failed:', error);
      });
    }, this.config.interval * 1000);

    this.isStarted = true;
    console.log('Health monitor started');
  }

  /**
   * Stop the health monitor
   */
  async stop(): Promise<void> {
    if (!this.isStarted) {
      return;
    }

    // Clear global interval
    if (this.globalInterval) {
      clearInterval(this.globalInterval);
      this.globalInterval = undefined;
    }

    // Clear individual service intervals
    for (const tracker of this.services.values()) {
      if (tracker.checkInterval) {
        clearInterval(tracker.checkInterval);
      }
    }

    // Clear services
    this.services.clear();

    this.isStarted = false;
    console.log('Health monitor stopped');
  }

  /**
   * Add a service to health monitoring
   */
  async addService(serviceId: string, endpoint: string): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    if (this.services.has(serviceId)) {
      throw new MCPErrorClass(
        MCPErrorCode.INVALID_PARAMS,
        `Service ${serviceId} is already being monitored`
      );
    }

    const now = new Date();
    const initialHealth: ServiceHealth = {
      serviceId,
      status: ServiceStatus.ONLINE,
      uptime: 0,
      responseTime: 0,
      errorRate: 0,
      lastCheck: now,
      score: 1.0,
      details: {},
    };

    const tracker: ServiceHealthTracker = {
      serviceId,
      endpoint,
      health: initialHealth,
      consecutiveFailures: 0,
      consecutiveSuccesses: 0,
      lastCheckTime: now,
    };

    this.services.set(serviceId, tracker);

    // Perform initial health check
    if (this.isStarted) {
      await this.checkServiceHealth(serviceId);
    }

    console.log(`Added service to health monitoring: ${serviceId}`);
  }

  /**
   * Remove a service from health monitoring
   */
  async removeService(serviceId: string): Promise<void> {
    const tracker = this.services.get(serviceId);
    if (!tracker) {
      return;
    }

    // Clear individual interval if exists
    if (tracker.checkInterval) {
      clearInterval(tracker.checkInterval);
    }

    this.services.delete(serviceId);
    console.log(`Removed service from health monitoring: ${serviceId}`);
  }

  /**
   * Get health status of a specific service
   */
  async getServiceHealth(serviceId: string): Promise<ServiceHealth | null> {
    const tracker = this.services.get(serviceId);
    if (!tracker) {
      return null;
    }

    return { ...tracker.health };
  }

  /**
   * Get health status of all monitored services
   */
  async getAllServiceHealth(): Promise<ServiceHealth[]> {
    return Array.from(this.services.values()).map((tracker) => ({ ...tracker.health }));
  }

  /**
   * Force a health check for a specific service
   */
  async checkServiceHealth(serviceId: string): Promise<ServiceHealth> {
    const tracker = this.services.get(serviceId);
    if (!tracker) {
      throw new MCPErrorClass(
        MCPErrorCode.RESOURCE_NOT_FOUND,
        `Service not found in health monitor: ${serviceId}`
      );
    }

    const startTime = Date.now();
    let status = ServiceStatus.ONLINE;
    let responseTime = 0;
    let details: Record<string, any> = {};

    try {
      // Perform health check (simplified HTTP ping)
      const healthCheckResult = await this.performHealthCheck(tracker.endpoint);
      responseTime = Date.now() - startTime;

      if (healthCheckResult.success) {
        tracker.consecutiveFailures = 0;
        tracker.consecutiveSuccesses++;
        status = ServiceStatus.ONLINE;
        details = healthCheckResult.details || {};
      } else {
        tracker.consecutiveSuccesses = 0;
        tracker.consecutiveFailures++;
        status =
          tracker.consecutiveFailures >= this.config.failureThreshold
            ? ServiceStatus.OFFLINE
            : ServiceStatus.DEGRADED;
        details = { error: healthCheckResult.error };
      }
    } catch (error) {
      responseTime = Date.now() - startTime;
      tracker.consecutiveSuccesses = 0;
      tracker.consecutiveFailures++;
      status =
        tracker.consecutiveFailures >= this.config.failureThreshold
          ? ServiceStatus.OFFLINE
          : ServiceStatus.DEGRADED;
      details = { error: error instanceof Error ? error.message : 'Unknown error' };
    }

    // Calculate health score
    const healthScore = this.calculateHealthScore(tracker, responseTime, status);

    // Calculate uptime (simplified)
    const now = new Date();
    const timeSinceLastCheck = now.getTime() - tracker.lastCheckTime.getTime();
    const uptime =
      status === ServiceStatus.ONLINE
        ? tracker.health.uptime + timeSinceLastCheck
        : tracker.health.uptime;

    // Calculate error rate (simplified)
    const totalChecks = tracker.consecutiveFailures + tracker.consecutiveSuccesses;
    const errorRate = totalChecks > 0 ? tracker.consecutiveFailures / totalChecks : 0;

    // Update health information
    const previousStatus = tracker.health.status;
    tracker.health = {
      serviceId,
      status,
      uptime,
      responseTime,
      errorRate,
      lastCheck: now,
      score: healthScore,
      details,
    };
    tracker.lastCheckTime = now;

    // Emit health change event if status changed
    if (previousStatus !== status) {
      this.emit('serviceHealthChanged', serviceId, { ...tracker.health });
      console.log(`Service health changed: ${serviceId} ${previousStatus} -> ${status}`);
    }

    return { ...tracker.health };
  }

  /**
   * Get health monitor statistics
   */
  getStatistics() {
    const services = Array.from(this.services.values());
    const statusCounts = services.reduce(
      (acc, tracker) => {
        acc[tracker.health.status] = (acc[tracker.health.status] || 0) + 1;
        return acc;
      },
      {} as Record<ServiceStatus, number>
    );

    const averageResponseTime =
      services.length > 0
        ? services.reduce((sum, tracker) => sum + tracker.health.responseTime, 0) / services.length
        : 0;

    const averageHealthScore =
      services.length > 0
        ? services.reduce((sum, tracker) => sum + tracker.health.score, 0) / services.length
        : 0;

    return {
      totalServices: services.length,
      statusCounts,
      averageResponseTime,
      averageHealthScore,
      healthyServices: statusCounts[ServiceStatus.ONLINE] || 0,
      unhealthyServices:
        (statusCounts[ServiceStatus.OFFLINE] || 0) + (statusCounts[ServiceStatus.DEGRADED] || 0),
    };
  }

  /**
   * Perform health checks for all monitored services
   */
  private async performHealthChecks(): Promise<void> {
    const promises = Array.from(this.services.keys()).map((serviceId) =>
      this.checkServiceHealth(serviceId).catch((error) => {
        console.error(`Health check failed for service ${serviceId}:`, error);
      })
    );

    await Promise.all(promises);
  }

  /**
   * Perform actual health check against service endpoint
   */
  private async performHealthCheck(
    endpoint: string
  ): Promise<{ success: boolean; error?: string; details?: any }> {
    try {
      // For now, we'll implement a simple HTTP-based health check
      // In a real implementation, this would use the MCP protocol

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      try {
        // Try to parse the endpoint as URL
        const url = new URL(endpoint);

        // For HTTP/HTTPS endpoints, perform HTTP health check
        if (url.protocol === 'http:' || url.protocol === 'https:') {
          const response = await fetch(`${endpoint}/health`, {
            method: 'GET',
            signal: controller.signal,
            headers: {
              'Content-Type': 'application/json',
            },
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            const data = await response.json().catch(() => ({}));
            return { success: true, details: data };
          } else {
            return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
          }
        } else {
          // For other protocols (WebSocket, etc.), assume healthy for now
          // In a real implementation, this would perform protocol-specific checks
          clearTimeout(timeoutId);
          return { success: true, details: { protocol: url.protocol } };
        }
      } catch (error) {
        clearTimeout(timeoutId);

        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            return { success: false, error: 'Health check timeout' };
          }
          return { success: false, error: error.message };
        }
        return { success: false, error: 'Unknown error during health check' };
      }
    } catch (error) {
      // If endpoint is not a valid URL, assume it's a different protocol
      // For now, we'll consider it healthy
      return { success: true, details: { note: 'Non-HTTP endpoint assumed healthy' } };
    }
  }

  /**
   * Calculate health score based on various factors
   */
  private calculateHealthScore(
    tracker: ServiceHealthTracker,
    responseTime: number,
    status: ServiceStatus
  ): number {
    let score = 1.0;

    // Reduce score based on status
    switch (status) {
      case ServiceStatus.OFFLINE:
        score = 0.0;
        break;
      case ServiceStatus.DEGRADED:
        score = 0.5;
        break;
      case ServiceStatus.MAINTENANCE:
        score = 0.3;
        break;
      case ServiceStatus.ONLINE:
        // Keep full score, but may be reduced by other factors
        break;
    }

    // Reduce score based on response time (if service is online)
    if (status === ServiceStatus.ONLINE && responseTime > 0) {
      const responseTimePenalty = Math.min(responseTime / 10000, 0.5); // Max 50% penalty for 10s+ response
      score = Math.max(score - responseTimePenalty, 0.1);
    }

    // Reduce score based on consecutive failures
    if (tracker.consecutiveFailures > 0) {
      const failurePenalty = Math.min(tracker.consecutiveFailures * 0.1, 0.8); // Max 80% penalty
      score = Math.max(score - failurePenalty, 0.0);
    }

    // Boost score based on consecutive successes (up to original score)
    if (tracker.consecutiveSuccesses > this.config.recoveryThreshold) {
      const successBoost = Math.min(
        (tracker.consecutiveSuccesses - this.config.recoveryThreshold) * 0.05,
        0.2
      );
      score = Math.min(score + successBoost, 1.0);
    }

    return Math.round(score * 100) / 100; // Round to 2 decimal places
  }
}
