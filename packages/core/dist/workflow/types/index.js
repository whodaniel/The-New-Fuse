/**
 * Workflow Types Index
 * Re-exports all workflow types
 */
export * from '../types/index.js';
// Workflow-specific error class
export class WorkflowError extends Error {
    constructor(message, code, workflowId, stepId, details) {
        super(message);
        this.code = code;
        this.workflowId = workflowId;
        this.stepId = stepId;
        this.details = details;
        this.name = 'WorkflowError';
    }
}
//# sourceMappingURL=index.js.map