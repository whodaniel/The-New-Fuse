/**
 * Heartbeat Adapter
 * 
 * Bridges the HeartbeatMonitoringService to the interface expected by WorkflowEngineFactory
 */

import { HeartbeatMonitoringService } from '@the-new-fuse/relay-core';

export interface HeartbeatService {
  registerAgent(executionId: string, workflowId: string): void;
  recordActivity(executionId: string, type: string, metadata: any): void;
}

export class HeartbeatServiceAdapter implements HeartbeatService {
  private heartbeatService: HeartbeatMonitoringService;

  constructor(heartbeatService: HeartbeatMonitoringService) {
    this.heartbeatService = heartbeatService;
  }

  registerAgent(executionId: string, _workflowId: string): void {
    this.heartbeatService.registerAgent(executionId);
  }

  recordActivity(executionId: string, type: string, metadata: any): void {
    this.heartbeatService.recordActivity(executionId, type, metadata);
  }
}