import { Injectable } from '@nestjs/common';
import { Logger } from '../utils/logger.js';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MonitoringService } from './MonitoringService.js';
import { ReliabilityMetricsService } from './ReliabilityMetricsService.js';

interface ProtocolIssue {
  id: string;
  type: 'version_mismatch' | 'schema_violation' | 'timeout' | 'connection' | 'security';
  description: string;
  timestamp: number;
  agents: string[];
  severity: 'low' | 'medium' | 'high';
  context: Record<string, any>;
  resolved?: boolean;
  resolution?: {
    timestamp: number;
    description: string;
    action: string;
  };
}

interface ProtocolMetrics {
  messageCount: number;
  errorCount: number;
  handshakeLatency: number[];
  negotiationSuccess: number;
  negotiationFailure: number;
  lastActivity: number;
}

@Injectable()
export class ProtocolDiagnosticsService {
  private activeIssues = new Map<string, ProtocolIssue>();
  private protocolMetrics = new Map<string, ProtocolMetrics>();
  private readonly logger = new Logger(ProtocolDiagnosticsService.name);

  constructor(
    private eventEmitter: EventEmitter2,
    private monitoringService: MonitoringService,
    private reliabilityService: ReliabilityMetricsService
  ) {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Protocol events
    this.eventEmitter.on('protocol.handshake.start', this.recordHandshakeStart.bind(this));
    this.eventEmitter.on('protocol.handshake.complete', this.recordHandshakeComplete.bind(this));
    this.eventEmitter.on('protocol.negotiation.result', this.recordNegotiationResult.bind(this));
    this.eventEmitter.on('protocol.message.error', this.handleMessageError.bind(this));
    
    // Version events
    this.eventEmitter.on('protocol.version.mismatch', this.handleVersionMismatch.bind(this));
    
    // Schema events
    this.eventEmitter.on('protocol.schema.violation', this.handleSchemaViolation.bind(this));
  }

  async diagnoseProtocolIssue(
    agentId: string,
    context: Record<string, any>
  ): Promise<ProtocolIssue[]> {
    const issues: ProtocolIssue[] = [];
    const metrics = this.protocolMetrics.get(agentId);

    if (!metrics) {
      return issues;
    }

    // Check handshake latency
    const avgHandshakeLatency = this.calculateAverageLatency(metrics.handshakeLatency);
    if (avgHandshakeLatency > 2000) { // 2 seconds threshold
      issues.push({
        id: crypto.randomUUID(),
        type: 'connection',
        description: `High handshake latency: ${avgHandshakeLatency.toFixed(2)}ms`,
        timestamp: Date.now(),
        agents: [agentId],
        severity: avgHandshakeLatency > 5000 ? 'high' : 'medium',
        context: { avgHandshakeLatency }
      });
    }

    // Check negotiation success rate
    const totalNegotiations = metrics.negotiationSuccess + metrics.negotiationFailure;
    if (totalNegotiations > 0) {
      const successRate = metrics.negotiationSuccess / totalNegotiations;
      if (successRate < 0.9) { // 90% threshold
        issues.push({
          id: crypto.randomUUID(),
          type: 'version_mismatch',
          description: `Low negotiation success rate: ${(successRate * 100).toFixed(2)}%`,
          timestamp: Date.now(),
          agents: [agentId],
          severity: successRate < 0.7 ? 'high' : 'medium',
          context: { successRate, totalNegotiations }
        });
      }
    }

    // Check error rate
    const errorRate = metrics.errorCount / metrics.messageCount;
    if (errorRate > 0.05) { // 5% threshold
      issues.push({
        id: crypto.randomUUID(),
        type: 'schema_violation',
        description: `High message error rate: ${(errorRate * 100).toFixed(2)}%`,
        timestamp: Date.now(),
        agents: [agentId],
        severity: errorRate > 0.1 ? 'high' : 'medium',
        context: { errorRate, totalMessages: metrics.messageCount }
      });
    }

    return issues;
  }

  async resolveIssue(
    issueId: string,
    resolution: {
      description: string;
      action: string;
    }
  ): Promise<void> {
    const issue = this.activeIssues.get(issueId);
    if (!issue) {
      throw new Error(`Issue ${issueId} not found`);
    }

    issue.resolved = true;
    issue.resolution = {
      timestamp: Date.now(),
      ...resolution
    };

    this.eventEmitter.emit('protocol.issue.resolved', {
      issueId,
      resolution
    });

    // Remove from active issues
    this.activeIssues.delete(issueId);
  }

  private recordHandshakeStart(data: { agentId: string }): void {
    this.initializeMetrics(data.agentId);
    const metrics = this.protocolMetrics.get(data.agentId)!;
    metrics.lastActivity = Date.now();
  }

  private recordHandshakeComplete(data: { 
    agentId: string;
    duration: number;
  }): void {
    const metrics = this.protocolMetrics.get(data.agentId);
    if (!metrics) return;

    metrics.handshakeLatency.push(data.duration);
    if (metrics.handshakeLatency.length > 100) {
      metrics.handshakeLatency.shift();
    }
    metrics.lastActivity = Date.now();
  }

  private recordNegotiationResult(data: {
    agentId: string;
    success: boolean;
  }): void {
    const metrics = this.protocolMetrics.get(data.agentId);
    if (!metrics) return;

    if (data.success) {
      metrics.negotiationSuccess++;
    } else {
      metrics.negotiationFailure++;
    }
    metrics.lastActivity = Date.now();
  }

  private handleMessageError(data: {
    agentId: string;
    error: string;
    context: Record<string, any>;
  }): void {
    const metrics = this.protocolMetrics.get(data.agentId);
    if (!metrics) return;

    metrics.errorCount++;
    metrics.lastActivity = Date.now();

    // Create issue if error rate exceeds threshold
    const errorRate = metrics.errorCount / metrics.messageCount;
    if (errorRate > 0.05) {
      const issue: ProtocolIssue = {
        id: crypto.randomUUID(),
        type: 'schema_violation',
        description: `High message error rate: ${(errorRate * 100).toFixed(2)}%`,
        timestamp: Date.now(),
        agents: [data.agentId],
        severity: errorRate > 0.1 ? 'high' : 'medium',
        context: {
          errorRate,
          totalMessages: metrics.messageCount,
          lastError: data.error,
          ...data.context
        }
      };

      this.activeIssues.set(issue.id, issue);
      this.eventEmitter.emit('protocol.issue.detected', issue);
    }
  }

  private handleVersionMismatch(data: {
    agentId: string;
    requestedVersion: string;
    supportedVersions: string[];
  }): void {
    const issue: ProtocolIssue = {
      id: crypto.randomUUID(),
      type: 'version_mismatch',
      description: `Protocol version mismatch. Agent requested ${data.requestedVersion}`,
      timestamp: Date.now(),
      agents: [data.agentId],
      severity: 'high',
      context: {
        requestedVersion: data.requestedVersion,
        supportedVersions: data.supportedVersions
      }
    };

    this.activeIssues.set(issue.id, issue);
    this.eventEmitter.emit('protocol.issue.detected', issue);
  }

  private handleSchemaViolation(data: {
    agentId: string;
    messageType: string;
    violations: string[];
  }): void {
    const issue: ProtocolIssue = {
      id: crypto.randomUUID(),
      type: 'schema_violation',
      description: `Message schema validation failed for type ${data.messageType}`,
      timestamp: Date.now(),
      agents: [data.agentId],
      severity: 'medium',
      context: {
        messageType: data.messageType,
        violations: data.violations
      }
    };

    this.activeIssues.set(issue.id, issue);
    this.eventEmitter.emit('protocol.issue.detected', issue);
  }

  private initializeMetrics(agentId: string): void {
    if (!this.protocolMetrics.has(agentId)) {
      this.protocolMetrics.set(agentId, {
        messageCount: 0,
        errorCount: 0,
        handshakeLatency: [],
        negotiationSuccess: 0,
        negotiationFailure: 0,
        lastActivity: Date.now()
      });
    }
  }

  private calculateAverageLatency(latencies: number[]): number {
    if (latencies.length === 0) return 0;
    return latencies.reduce((sum, val) => sum + val, 0) / latencies.length;
  }
}