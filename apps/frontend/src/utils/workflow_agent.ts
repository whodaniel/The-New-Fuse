export {}
exports.WorkflowAgentError = exports.BaseWorkflowAgent = void 0;
class BaseWorkflowAgent {
    constructor(name, capabilities) {
        this.name = name;
        this.capabilities = [...capabilities];
    }
    async start() {
    }
    async stop() {
    }
}
exports.BaseWorkflowAgent = BaseWorkflowAgent;
class WorkflowAgentError extends Error {
    constructor(message) {
        super(message);
        this.name = 'WorkflowAgentError';
    }
}
exports.WorkflowAgentError = WorkflowAgentError;
export {};
//# sourceMappingURL=workflow_agent.js.map