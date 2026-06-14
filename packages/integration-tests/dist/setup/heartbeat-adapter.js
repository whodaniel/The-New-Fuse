"use strict";
/**
 * Heartbeat Adapter
 *
 * Bridges the HeartbeatMonitoringService to the interface expected by WorkflowEngineFactory
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HeartbeatServiceAdapter = void 0;
class HeartbeatServiceAdapter {
    constructor(heartbeatService) {
        this.heartbeatService = heartbeatService;
    }
    registerAgent(executionId, _workflowId) {
        this.heartbeatService.registerAgent(executionId);
    }
    recordActivity(executionId, type, metadata) {
        this.heartbeatService.recordActivity(executionId, type, metadata);
    }
}
exports.HeartbeatServiceAdapter = HeartbeatServiceAdapter;
//# sourceMappingURL=heartbeat-adapter.js.map