"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WORKFLOW_EXECUTOR_PROVIDER = exports.WORKFLOW_ENGINE_PROVIDER = exports.WorkflowExecutorStub = exports.WorkflowEngineStub = void 0;
const common_1 = require("@nestjs/common");
/**
 * Stub implementation of WorkflowEngine
 * TODO: Replace with actual implementation when workflow engine is ready
 */
class WorkflowEngineStub {
    constructor() {
        this.logger = new common_1.Logger(WorkflowEngineStub.name);
    }
    fail(feature) {
        throw new common_1.NotImplementedException(`${feature} is not implemented in this deployment.`);
    }
    async createWorkflow(definition) {
        this.logger.warn('WorkflowEngine.createWorkflow is not implemented');
        this.fail('Workflow engine createWorkflow');
    }
    async getWorkflow(id) {
        this.logger.warn(`WorkflowEngine.getWorkflow(${id}) is not implemented`);
        this.fail('Workflow engine getWorkflow');
    }
    async updateWorkflow(id, data) {
        this.logger.warn(`WorkflowEngine.updateWorkflow(${id}) is not implemented`);
        this.fail('Workflow engine updateWorkflow');
    }
    async deleteWorkflow(id) {
        this.logger.warn(`WorkflowEngine.deleteWorkflow(${id}) is not implemented`);
        this.fail('Workflow engine deleteWorkflow');
    }
}
exports.WorkflowEngineStub = WorkflowEngineStub;
/**
 * Stub implementation of WorkflowExecutor
 * TODO: Replace with actual implementation when workflow executor is ready
 */
class WorkflowExecutorStub {
    constructor() {
        this.logger = new common_1.Logger(WorkflowExecutorStub.name);
    }
    fail(feature) {
        throw new common_1.NotImplementedException(`${feature} is not implemented in this deployment.`);
    }
    async execute(workflow, input) {
        this.logger.warn('WorkflowExecutor.execute is not implemented');
        this.fail('Workflow executor execute');
    }
    async cancel(executionId) {
        this.logger.warn(`WorkflowExecutor.cancel(${executionId}) is not implemented`);
        this.fail('Workflow executor cancel');
    }
    async pause(executionId) {
        this.logger.warn(`WorkflowExecutor.pause(${executionId}) is not implemented`);
        this.fail('Workflow executor pause');
    }
    async resume(executionId) {
        this.logger.warn(`WorkflowExecutor.resume(${executionId}) is not implemented`);
        this.fail('Workflow executor resume');
    }
}
exports.WorkflowExecutorStub = WorkflowExecutorStub;
/**
 * Providers for stub implementations
 * Use these in modules until real implementations are ready
 */
exports.WORKFLOW_ENGINE_PROVIDER = {
    provide: 'WorkflowEngine',
    useClass: WorkflowEngineStub,
};
exports.WORKFLOW_EXECUTOR_PROVIDER = {
    provide: 'WorkflowExecutor',
    useClass: WorkflowExecutorStub,
};
//# sourceMappingURL=workflow-stubs.provider.js.map