"use strict";
/**
 * Server-Sent Events (SSE) Integration Types
 *
 * Comprehensive type definitions for real-time server-sent events
 * integration with The New Fuse AI Agent framework.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SseEventType = exports.SsePriority = void 0;
var SsePriority;
(function (SsePriority) {
    SsePriority["LOW"] = "LOW";
    SsePriority["MEDIUM"] = "MEDIUM";
    SsePriority["HIGH"] = "HIGH";
    SsePriority["URGENT"] = "URGENT";
})(SsePriority || (exports.SsePriority = SsePriority = {}));
var SseEventType;
(function (SseEventType) {
    // Agent events
    SseEventType["AGENT_STATUS_CHANGED"] = "agent.status.changed";
    SseEventType["AGENT_TASK_COMPLETED"] = "agent.task.completed";
    SseEventType["AGENT_ERROR_OCCURRED"] = "agent.error.occurred";
    SseEventType["AGENT_MESSAGE_RECEIVED"] = "agent.message.received";
    // Workflow events
    SseEventType["WORKFLOW_STARTED"] = "workflow.started";
    SseEventType["WORKFLOW_COMPLETED"] = "workflow.completed";
    SseEventType["WORKFLOW_FAILED"] = "workflow.failed";
    SseEventType["WORKFLOW_STEP_COMPLETED"] = "workflow.step.completed";
    // System events
    SseEventType["SYSTEM_MAINTENANCE"] = "system.maintenance";
    SseEventType["SYSTEM_UPGRADE"] = "system.upgrade";
    SseEventType["SYSTEM_ALERT"] = "system.alert";
    // User events
    SseEventType["USER_NOTIFICATION"] = "user.notification";
    SseEventType["USER_SESSION_EXPIRED"] = "user.session.expired";
    // Integration events
    SseEventType["WEBHOOK_DELIVERED"] = "webhook.delivered";
    SseEventType["N8N_WORKFLOW_TRIGGERED"] = "n8n.workflow.triggered";
    // Custom events
    SseEventType["CUSTOM"] = "custom";
})(SseEventType || (exports.SseEventType = SseEventType = {}));
//# sourceMappingURL=sse-types.js.map