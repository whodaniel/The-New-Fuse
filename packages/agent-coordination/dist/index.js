"use strict";
/**
 * Multi-Agent Coordination Framework
 *
 * Provides comprehensive tools for distributed multi-agent task execution including:
 * - Task distribution with priority queues
 * - Agent orchestration and load balancing
 * - Shared state management
 * - Coordination patterns (Map-Reduce, Pipeline, Consensus, Swarm)
 * - Real-time monitoring and metrics
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskQueue = exports.TaskAssigner = exports.ExecutionMode = exports.AgentPool = void 0;
// Legacy Redis coordinator
__exportStar(require("./redis-coordinator.js"), exports);
// Types
__exportStar(require("./types/coordination.types"), exports);
// Legacy components
__exportStar(require("./broadcast/broadcast-manager.js"), exports);
__exportStar(require("./coordination/shared-state-manager.js"), exports);
__exportStar(require("./presence/presence-tracker.js"), exports);
__exportStar(require("./queues/task-queue-manager.js"), exports);
__exportStar(require("./serializers/message-serializer.js"), exports);
// Core components
var index_js_1 = require("./core/index.js");
Object.defineProperty(exports, "AgentPool", { enumerable: true, get: function () { return index_js_1.AgentPool; } });
Object.defineProperty(exports, "ExecutionMode", { enumerable: true, get: function () { return index_js_1.ExecutionMode; } });
Object.defineProperty(exports, "TaskAssigner", { enumerable: true, get: function () { return index_js_1.TaskAssigner; } });
Object.defineProperty(exports, "TaskQueue", { enumerable: true, get: function () { return index_js_1.TaskQueue; } });
// Orchestration
__exportStar(require("./orchestration/index.js"), exports);
// State management
__exportStar(require("./state/index.js"), exports);
// Coordination patterns
__exportStar(require("./patterns/index.js"), exports);
// Monitoring
__exportStar(require("./monitoring/index.js"), exports);
//# sourceMappingURL=index.js.map