import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ReliabilityMetricsService {
  private readonly logger = new Logger(ReliabilityMetricsService.name);
  private negotiationAttempts = 0;
  private negotiationSuccesses = 0;
  private schemaErrors = 0;

  constructor(private readonly eventEmitter: EventEmitter2) {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.eventEmitter.on('protocol.negotiation.attempt', () => this.negotiationAttempts++);
    this.eventEmitter.on('protocol.negotiation.success', () => this.negotiationSuccesses++);
    this.eventEmitter.on('protocol.schema.error', () => this.schemaErrors++);
  }

  getNegotiationSuccessRate(): number {
    if (this.negotiationAttempts === 0) {
      return 1;
    }
    return this.negotiationSuccesses / this.negotiationAttempts;
  }

  getSchemaErrorRate(): number {
    // Assuming a total number of messages for calculating the rate
    const totalMessages = 1000; // Placeholder
    return this.schemaErrors / totalMessages;
  }
}
