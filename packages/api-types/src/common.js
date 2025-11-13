/**
 * Common type definitions shared across the API
 * Re-exports common types from @the-new-fuse/types
 */
export class HealthCheckError extends Error {
    causes;
    constructor(message, causes) {
        super(message);
        this.causes = causes;
    }
}
// Message Types for AgentProcessor
export var MessageType;
(function (MessageType) {
    MessageType["COMMAND"] = "command";
    MessageType["TASK_ASSIGNMENT"] = "task_assignment";
    MessageType["NOTIFICATION"] = "notification";
    // Add other message types as needed
})(MessageType || (MessageType = {}));
//# sourceMappingURL=common.js.map