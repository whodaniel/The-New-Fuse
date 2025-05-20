
export {}
exports.PersistentWorkflowExecutor = void 0;
import uuid_1 from 'uuid';
import executor_1 from './executor.js';
import storage_1 from '../persistence/storage.js';
import types_1 from './types.js';
class PersistentWorkflowExecutor extends executor_1.WorkflowExecutor {
    constructor(dbPath, workflowId, options) {
        super(options);
        this.storage = new storage_1.WorkflowStorage(dbPath);
        this.workflowId = workflowId;
    }
    async initialize(): Promise<void> {
        await this.storage.initialize();
    }
    async execute(nodes, edges): Promise<void> {
        // Create a new run record
        const runId = (0, uuid_1.v4)();
        await this.storage.createRun({
            id: runId,
            workflowId: this.workflowId,
            status: 'running',
            startTime: new Date(),
            nodeStatuses: {},
            nodeOutputs: {},
            errors: {},
        });
        try {
            // Execute the workflow
            const result = await super.execute(nodes, edges);
            // Update run record with results
            await this.storage.updateRun(runId, {
                status: result.success ? 'completed' : 'failed',
                endTime: new Date(),
                nodeStatuses: Object.fromEntries(result.nodeStatuses),
                nodeOutputs: Object.fromEntries(result.outputs),
                errors: Object.fromEntries(Array.from(result.errors.entries()).map(([k, v]) => [k, v.message])),
            });
            return result;
        }
        catch (error) {
            // Update run record with error
            await this.storage.updateRun(runId, {
                status: 'failed',
                endTime: new Date(),
                errors: {
                    workflow: error.message,
                },
            });
            throw error;
        }
    }
    async getRunHistory(): Promise<void> {
        return await this.storage.getWorkflowRuns(this.workflowId);
    }
    async getRun(runId): Promise<void> {
        return await this.storage.getRun(runId);
    }
    async saveWorkflow(name, description, nodes, edges): Promise<void> {
        await this.storage.createWorkflow({
            id: this.workflowId,
            name,
            description,
            version: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
        }, { nodes, edges });
    }
    async updateWorkflow(name, description, nodes, edges): Promise<void> {
        const workflow = await this.storage.getWorkflow(this.workflowId);
        if (!workflow) {
            throw new types_1.WorkflowError('Workflow not found', this.workflowId);
        }
        await this.storage.updateWorkflow(this.workflowId, {
            name,
            description,
            version: workflow.metadata.version + 1,
            updatedAt: new Date(),
        }, nodes && edges ? { nodes, edges } : undefined);
    }
    async loadWorkflow(): Promise<void> {
        const workflow = await this.storage.getWorkflow(this.workflowId);
        if (!workflow) {
            throw new types_1.WorkflowError('Workflow not found', this.workflowId);
        }
        return {
            metadata: {
                name: workflow.metadata.name,
                description: workflow.metadata.description,
                version: workflow.metadata.version,
            },
            nodes: workflow.data.nodes,
            edges: workflow.data.edges,
        };
    }
    async setVariable(name, value): Promise<void> {
        await this.storage.setVariable(this.workflowId, name, value);
    }
    async getVariable(name): Promise<void> {
        return await this.storage.getVariable(this.workflowId, name);
    }
    async close(): Promise<void> {
        await this.storage.close();
    }
}
exports.PersistentWorkflowExecutor = PersistentWorkflowExecutor;
//# sourceMappingURL=persistent-executor.js.mapexport {};
