import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MonitoringService } from './MonitoringService';
import { ReliabilityMetricsService } from './ReliabilityMetricsService';

export enum ProtocolIssueType {
  VERSION_MISMATCH = 'version_mismatch',
  SCHEMA_VIOLATION = 'schema_violation',
  TIMEOUT = 'timeout',
  CONNECTION = 'connection',
  SECURITY = 'security',
}

export enum SeverityLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export interface ProtocolIssue {
  type: ProtocolIssueType;
  severity: SeverityLevel;
  details: any;
}

@Injectable()
export class ProtocolDiagnosticsService {
  private readonly logger = new Logger(ProtocolDiagnosticsService.name);

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly monitoringService: MonitoringService,
    private readonly reliabilityMetricsService: ReliabilityMetricsService,
  ) {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.eventEmitter.on('protocol.handshake.complete', () => this.diagnoseHandshakeIssues());
    this.eventEmitter.on('protocol.negotiation.result', () => this.diagnoseNegotiationIssues());
    this.eventEmitter.on('protocol.schema.violation', () => this.diagnoseSchemaIssues());
  }

  private diagnoseHandshakeIssues(): void {
    const avgHandshakeLatency = this.monitoringService.getAverageHandshakeLatency();
    if (avgHandshakeLatency > 5000) {
      this.emitProtocolIssue({
        type: ProtocolIssueType.CONNECTION,
        severity: SeverityLevel.HIGH,
        details: { message: `High handshake latency detected: ${avgHandshakeLatency}ms` },
      });
    }
  }

  private diagnoseNegotiationIssues(): void {
    const successRate = this.reliabilityMetricsService.getNegotiationSuccessRate();
    if (successRate < 0.7) {
      this.emitProtocolIssue({
        type: ProtocolIssueType.VERSION_MISMATCH,
        severity: SeverityLevel.HIGH,
        details: { message: `Low negotiation success rate: ${successRate}` },
      });
    }
  }

  private diagnoseSchemaIssues(): void {
    const errorRate = this.reliabilityMetricsService.getSchemaErrorRate();
    if (errorRate > 0.1) {
      this.emitProtocolIssue({
        type: ProtocolIssueType.SCHEMA_VIOLATION,
        severity: SeverityLevel.HIGH,
        details: { message: `High schema error rate: ${errorRate}` },
      });
    }
  }

  private emitProtocolIssue(issue: ProtocolIssue): void {
    this.eventEmitter.emit('protocol.issue', issue);
    this.logger.warn('Protocol issue detected:', issue);
  }
}
