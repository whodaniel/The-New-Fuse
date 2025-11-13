"use strict";
/**
 * N8N Workflow Integration Types
 *
 * Comprehensive type definitions for N8N workflow automation integration
 * with The New Fuse AI Agent framework.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.N8NErrorHandling = exports.N8NWebhookStatus = exports.N8NExecutionMode = exports.N8NExecutionStatus = exports.N8NWorkflowStatus = exports.N8NTriggerType = void 0;
var N8NTriggerType;
(function (N8NTriggerType) {
    N8NTriggerType["WEBHOOK"] = "WEBHOOK";
    N8NTriggerType["SCHEDULE"] = "SCHEDULE";
    N8NTriggerType["MANUAL"] = "MANUAL";
    N8NTriggerType["HTTP_REQUEST"] = "HTTP_REQUEST";
    N8NTriggerType["EMAIL"] = "EMAIL";
    N8NTriggerType["FILE_SYSTEM"] = "FILE_SYSTEM";
    N8NTriggerType["DATABASE"] = "DATABASE";
    N8NTriggerType["API_POLLING"] = "API_POLLING";
})(N8NTriggerType || (exports.N8NTriggerType = N8NTriggerType = {}));
var N8NWorkflowStatus;
(function (N8NWorkflowStatus) {
    N8NWorkflowStatus["DRAFT"] = "DRAFT";
    N8NWorkflowStatus["ACTIVE"] = "ACTIVE";
    N8NWorkflowStatus["PAUSED"] = "PAUSED";
    N8NWorkflowStatus["ERROR"] = "ERROR";
    N8NWorkflowStatus["DEPRECATED"] = "DEPRECATED";
})(N8NWorkflowStatus || (exports.N8NWorkflowStatus = N8NWorkflowStatus = {}));
var N8NExecutionStatus;
(function (N8NExecutionStatus) {
    N8NExecutionStatus["RUNNING"] = "RUNNING";
    N8NExecutionStatus["SUCCESS"] = "SUCCESS";
    N8NExecutionStatus["ERROR"] = "ERROR";
    N8NExecutionStatus["CANCELED"] = "CANCELED";
    N8NExecutionStatus["WAITING"] = "WAITING";
    N8NExecutionStatus["CRASHED"] = "CRASHED";
})(N8NExecutionStatus || (exports.N8NExecutionStatus = N8NExecutionStatus = {}));
var N8NExecutionMode;
(function (N8NExecutionMode) {
    N8NExecutionMode["MANUAL"] = "MANUAL";
    N8NExecutionMode["TRIGGER"] = "TRIGGER";
    N8NExecutionMode["RETRY"] = "RETRY";
    N8NExecutionMode["WEBHOOK"] = "WEBHOOK";
    N8NExecutionMode["INTERNAL"] = "INTERNAL";
})(N8NExecutionMode || (exports.N8NExecutionMode = N8NExecutionMode = {}));
var N8NWebhookStatus;
(function (N8NWebhookStatus) {
    N8NWebhookStatus["RECEIVED"] = "RECEIVED";
    N8NWebhookStatus["PROCESSING"] = "PROCESSING";
    N8NWebhookStatus["COMPLETED"] = "COMPLETED";
    N8NWebhookStatus["FAILED"] = "FAILED";
    N8NWebhookStatus["IGNORED"] = "IGNORED";
})(N8NWebhookStatus || (exports.N8NWebhookStatus = N8NWebhookStatus = {}));
var N8NErrorHandling;
(function (N8NErrorHandling) {
    N8NErrorHandling["STOP"] = "STOP";
    N8NErrorHandling["CONTINUE"] = "CONTINUE";
    N8NErrorHandling["RETRY"] = "RETRY";
    N8NErrorHandling["SKIP"] = "SKIP";
    N8NErrorHandling["NOTIFY"] = "NOTIFY";
})(N8NErrorHandling || (exports.N8NErrorHandling = N8NErrorHandling = {}));
//# sourceMappingURL=n8n-types.js.map