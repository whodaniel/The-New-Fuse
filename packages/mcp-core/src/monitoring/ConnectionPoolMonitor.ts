/**
 * Connection Pool Monitoring System
 */

import { IConnectionPoolMonitor } from '../interfaces/IMonitoring';
import { ConnectionPoolMetrics } from '../types/monitoring';
import { Logger } from '../utils/Logger';

export interface ConnectionPoolMonitorConfig {
  /** Metrics retention period (ms) */
  retentionPeriod: number;
}

interface ConnectionEvent {
  type: 'created' | 'destroyed' | 'acquired' | 'released';
  timestamp: Date;
  connectionId?: string;
  waitTime?: number;
  lifetime?: number;
}

/**
 * Connection pool monitor implementation
 */
export class ConnectionPoolMonitor implements IConnectionPoolMonitor {
  private readonly config: ConnectionPoolMonitorConfig;
  private readonly logger: Logger;
  private readonly eventHistory: ConnectionEvent[] = [];
  private readonly metricsHistory: Array<{ metrics: ConnectionPoolMetrics; timestamp: Date }> = [];

  // Current state
  private poolSize = 0;
  private activeConnections = 0;
  private idleConnections = 0;
  private pendingRequests = 0;
  private totalCreated = 0;
  private totalDestroyed = 0;
  private totalLifetime = 0;
  private connectionLifetimes: number[] = [];

  constructor(config: ConnectionPoolMonitorConfig, logger?: Logger) {
    this.config = config;
    this.logger = logger || new Logger('ConnectionPoolMonitor');
    
    // Start periodic cleanup and metrics collection
    setInterval(() => this.cleanup(), 60000); // Every minute
  }

  /**
   * Record connection creation
   */
  recordConnectionCreated(): void {
    const event: ConnectionEvent = {
      type: 'created',
      timestamp: new Date(),
      connectionId: this.generateConnectionId()
    };

    this.eventHistory.push(event);
    this.totalCreated++;
    this.poolSize++;
    this.idleConnections++;

    this.logger.debug(`Connection created: ${event.connectionId}`);
  }

  /**
   * Record connection destruction
   */
  recordConnectionDestroyed(lifetime: number): void {
    const event: ConnectionEvent = {
      type: 'destroyed',
      timestamp: new Date(),
      lifetime
    };

    this.eventHistory.push(event);
    this.totalDestroyed++;
    this.poolSize = Math.max(0, this.poolSize - 1);
    this.idleConnections = Math.max(0, this.idleConnections - 1);
    
    // Track lifetime
    this.connectionLifetimes.push(lifetime);
    this.totalLifetime += lifetime;
    
    // Limit lifetime history
    if (this.connectionLifetimes.length > 1000) {
      this.connectionLifetimes.shift();
    }

    this.logger.debug(`Connection destroyed`, { lifetime });
  }

  /**
   * Record connection acquisition
   */
  recordConnectionAcquired(waitTime: number): void {
    const event: ConnectionEvent = {
      type: 'acquired',
      timestamp: new Date(),
      waitTime
    };

    this.eventHistory.push(event);
    this.activeConnections++;
    this.idleConnections = Math.max(0, this.idleConnections - 1);
    this.pendingRequests = Math.max(0, this.pendingRequests - 1);

    this.logger.debug(`Connection acquired`, { waitTime });
  }

  /**
   * Record connection release
   */
  recordConnectionReleased(): void {
    const event: ConnectionEvent = {
      type: 'released',
      timestamp: new Date()
    };

    this.eventHistory.push(event);
    this.activeConnections = Math.max(0, this.activeConnections - 1);
    this.idleConnections++;

    this.logger.debug(`Connection released`);
  }

  /**
   * Record pending request
   */
  recordPendingRequest(): void {
    this.pendingRequests++;
  }

  /**
   * Get pool metrics
   */
  getPoolMetrics(): ConnectionPoolMetrics {
    const avgConnectionLifetime = this.connectionLifetimes.length > 0 ?
      this.connectionLifetimes.reduce((sum, lifetime) => sum + lifetime, 0) / this.connectionLifetimes.length : 0;

    return {
      poolSize: this.poolSize,
      activeConnections: this.activeConnections,
      idleConnections: this.idleConnections,
      pendingRequests: this.pendingRequests,
      createdConnections: this.totalCreated,
      destroyedConnections: this.totalDestroyed,
      avgConnectionLifetime
    };
  }

  /**
   * Get pool statistics
   */
  getPoolStatistics(hours: number): ConnectionPoolMetrics[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.metricsHistory
      .filter(entry => entry.timestamp >= cutoff)
      .map(entry => entry.metrics);
  }

  /**
   * Get connection pool analysis
   */
  getPoolAnalysis(hours: number = 1): {
    utilizationRate: number;
    averageWaitTime: number;
    peakConnections: number;
    connectionTurnover: number;
    efficiency: number;
    recommendations: string[];
  } {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    const recentEvents = this.eventHistory.filter(event => event.timestamp >= cutoff);
    const recentMetrics = this.getPoolStatistics(hours);

    // Calculate utilization rate
    const utilizationRate = this.poolSize > 0 ? this.activeConnections / this.poolSize : 0;

    // Calculate average wait time
    const acquisitionEvents = recentEvents.filter(e => e.type === 'acquired' && e.waitTime !== undefined);
    const averageWaitTime = acquisitionEvents.length > 0 ?
      acquisitionEvents.reduce((sum, e) => sum + (e.waitTime || 0), 0) / acquisitionEvents.length : 0;

    // Calculate peak connections
    const peakConnections = recentMetrics.length > 0 ?
      Math.max(...recentMetrics.map(m => m.activeConnections)) : this.activeConnections;

    // Calculate connection turnover
    const createdEvents = recentEvents.filter(e => e.type === 'created').length;
    const destroyedEvents = recentEvents.filter(e => e.type === 'destroyed').length;
    const connectionTurnover = Math.max(createdEvents, destroyedEvents);

    // Calculate efficiency score
    let efficiency = 100;
    if (averageWaitTime > 100) efficiency -= 20; // High wait time
    if (utilizationRate < 0.3) efficiency -= 15; // Low utilization
    if (utilizationRate > 0.9) efficiency -= 10; // Over-utilization
    if (this.pendingRequests > this.poolSize * 0.5) efficiency -= 25; // Too many pending

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (utilizationRate > 0.8) {
      recommendations.push('Consider increasing pool size - high utilization detected');
    }
    
    if (utilizationRate < 0.3 && this.poolSize > 5) {
      recommendations.push('Consider reducing pool size - low utilization detected');
    }
    
    if (averageWaitTime > 100) {
      recommendations.push('High average wait time - consider increasing pool size or optimizing connection creation');
    }
    
    if (connectionTurnover > this.poolSize * 2) {
      recommendations.push('High connection turnover - review connection lifetime settings');
    }
    
    if (this.pendingRequests > this.poolSize) {
      recommendations.push('Many pending requests - pool may be undersized for current load');
    }

    return {
      utilizationRate,
      averageWaitTime,
      peakConnections,
      connectionTurnover,
      efficiency,
      recommendations
    };
  }

  /**
   * Generate pool report
   */
  generatePoolReport(hours: number = 24): string {
    const metrics = this.getPoolMetrics();
    const analysis = this.getPoolAnalysis(hours);
    
    const report = [
      `# Connection Pool Report`,
      '',
      `## Current Pool Status`,
      `- **Pool Size**: ${metrics.poolSize}`,
      `- **Active Connections**: ${metrics.activeConnections}`,
      `- **Idle Connections**: ${metrics.idleConnections}`,
      `- **Pending Requests**: ${metrics.pendingRequests}`,
      `- **Total Created**: ${metrics.createdConnections}`,
      `- **Total Destroyed**: ${metrics.destroyedConnections}`,
      `- **Average Connection Lifetime**: ${(metrics.avgConnectionLifetime / 1000).toFixed(2)}s`,
      '',
      `## Performance Analysis (Last ${hours}h)`,
      `- **Utilization Rate**: ${(analysis.utilizationRate * 100).toFixed(2)}%`,
      `- **Average Wait Time**: ${analysis.averageWaitTime.toFixed(2)}ms`,
      `- **Peak Connections**: ${analysis.peakConnections}`,
      `- **Connection Turnover**: ${analysis.connectionTurnover}`,
      `- **Efficiency Score**: ${analysis.efficiency.toFixed(2)}%`,
      ''
    ];

    if (analysis.recommendations.length > 0) {
      report.push(`## Recommendations`);
      analysis.recommendations.forEach(rec => {
        report.push(`- ${rec}`);
      });
      report.push('');
    }

    // Add connection lifecycle analysis
    const recentEvents = this.eventHistory.filter(
      event => event.timestamp >= new Date(Date.now() - hours * 60 * 60 * 1000)
    );

    const eventCounts = {
      created: recentEvents.filter(e => e.type === 'created').length,
      destroyed: recentEvents.filter(e => e.type === 'destroyed').length,
      acquired: recentEvents.filter(e => e.type === 'acquired').length,
      released: recentEvents.filter(e => e.type === 'released').length
    };

    report.push(`## Connection Events (Last ${hours}h)`);
    report.push(`- **Created**: ${eventCounts.created}`);
    report.push(`- **Destroyed**: ${eventCounts.destroyed}`);
    report.push(`- **Acquired**: ${eventCounts.acquired}`);
    report.push(`- **Released**: ${eventCounts.released}`);

    return report.join('\n');
  }

  /**
   * Clean up old records and collect metrics
   */
  private cleanup(): void {
    const cutoff = new Date(Date.now() - this.config.retentionPeriod);
    
    // Clean up event history
    const initialLength = this.eventHistory.length;
    this.eventHistory.splice(0, this.eventHistory.findIndex(
      event => event.timestamp >= cutoff
    ));

    // Clean up metrics history
    const initialMetricsLength = this.metricsHistory.length;
    this.metricsHistory.splice(0, this.metricsHistory.findIndex(
      entry => entry.timestamp >= cutoff
    ));

    const cleanedRecords = 
      (initialLength - this.eventHistory.length) +
      (initialMetricsLength - this.metricsHistory.length);

    if (cleanedRecords > 0) {
      this.logger.debug(`Cleaned up ${cleanedRecords} old connection pool records`);
    }

    // Store current metrics in history
    this.metricsHistory.push({
      metrics: this.getPoolMetrics(),
      timestamp: new Date()
    });
  }

  /**
   * Generate connection ID
   */
  private generateConnectionId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}