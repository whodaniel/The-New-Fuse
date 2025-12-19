import { Injectable, Logger } from '@nestjs/common';
import { CorrelationIdManager } from '../utils/correlation-id';

@Injectable()
export class ServiceCommunicationMonitor {
  private readonly logger = new Logger(ServiceCommunicationMonitor.name);

  constructor(private readonly correlationIdManager: CorrelationIdManager) {}

  trackRequest(serviceName: string, methodName: string, args: any[]): void {
    const correlationId = this.correlationIdManager.getId();
    this.logger.log(`[${correlationId}] Request to ${serviceName}.${methodName}`, { args });
  }

  trackResponse(serviceName: string, methodName: string, result: any): void {
    const correlationId = this.correlationIdManager.getId();
    this.logger.log(`[${correlationId}] Response from ${serviceName}.${methodName}`, { result });
  }
}
