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
export declare class HeartbeatServiceAdapter implements HeartbeatService {
    private heartbeatService;
    constructor(heartbeatService: HeartbeatMonitoringService);
    registerAgent(executionId: string, _workflowId: string): void;
    recordActivity(executionId: string, type: string, metadata: any): void;
}
//# sourceMappingURL=heartbeat-adapter.d.ts.map