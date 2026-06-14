"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowWorker = void 0;
const bullmq_1 = require("bullmq");
const WorkflowQueue_js_1 = require("./WorkflowQueue.js");
const WorkflowTypes_js_1 = require("../types/WorkflowTypes.js");
const TelemetryService_js_1 = require("../telemetry/TelemetryService.js");
const api_1 = require("@opentelemetry/api");
class WorkflowWorker {
    constructor(logger, connection, engine, queue) {
        this.logger = logger;
        this.engine = engine;
        this.queue = queue;
        this.worker = new bullmq_1.Worker(WorkflowQueue_js_1.WORKFLOW_QUEUE_NAME, async (job) => {
            const extractedContext = TelemetryService_js_1.telemetry.extractContext(job.data);
            return api_1.context.with(extractedContext, async () => {
                return TelemetryService_js_1.telemetry.startActiveSpan(`processJob:${job.name}`, async (span) => {
                    span.setAttribute('jobId', job.id || 'unknown');
                    try {
                        await this.processJob(job);
                    }
                    catch (error) {
                        this.logger.error(`Job ${job.id} failed: ${error.message}`);
                        span.recordException(error);
                        throw error;
                    }
                });
            });
        }, {
            connection,
            concurrency: 5,
        });
        this.worker.on('completed', (job) => {
            this.logger.debug(`Job ${job.id} completed`);
        });
        this.worker.on('failed', (job, err) => {
            this.logger.error(`Job ${job?.id} failed with ${err.message}`);
        });
    }
    async processJob(job) {
        switch (job.name) {
            case WorkflowQueue_js_1.WorkflowJobType.START_WORKFLOW:
                await this.processStartWorkflow(job.data);
                break;
            case WorkflowQueue_js_1.WorkflowJobType.EXECUTE_NODE:
                await this.processExecuteNode(job.data);
                break;
            default:
                this.logger.warn(`Unknown job type: ${job.name}`);
        }
    }
    async processStartWorkflow(data) {
        const { executionId, workflowId, taskId } = data;
        const logTaskId = taskId || executionId;
        const persist = Boolean(taskId);
        this.logger.info(`Processing START_WORKFLOW for execution ${executionId}`);
        TelemetryService_js_1.telemetry.emitTaskExecutionLog({
            taskId: logTaskId,
            message: `START_WORKFLOW received for workflow ${workflowId}`,
            source: 'workflow-worker',
            actor: 'workflow-worker',
            stage: 'start_workflow',
            persist,
        });
        const execution = await this.engine.getExecutionStatus(executionId);
        if (!execution) {
            throw new Error(`Execution ${executionId} not found`);
        }
        const workflow = await this.engine.loadWorkflow(workflowId);
        if (!workflow) {
            throw new Error(`Workflow ${workflowId} not found`);
        }
        const startNode = workflow.definition.nodes.find((n) => n.type === WorkflowTypes_js_1.WorkflowNodeType.START);
        if (!startNode) {
            throw new Error('Workflow has no start node');
        }
        await this.queue.addExecuteNodeJob({
            executionId,
            workflowId,
            taskId,
            nodeId: startNode.id,
            context: execution.context,
        });
    }
    async processExecuteNode(data) {
        const { executionId, nodeId, context, taskId } = data;
        const logTaskId = taskId || executionId;
        const persist = Boolean(taskId);
        this.logger.debug(`Processing EXECUTE_NODE ${nodeId} for execution ${executionId}`);
        TelemetryService_js_1.telemetry.emitTaskExecutionLog({
            taskId: logTaskId,
            message: `Executing node ${nodeId}`,
            source: 'workflow-worker',
            actor: 'workflow-worker',
            stage: 'execute_node',
            persist,
        });
        const workflow = await this.engine.loadWorkflow(data.workflowId);
        if (!workflow)
            throw new Error("Workflow not found");
        const node = workflow.definition.nodes.find((n) => n.id === nodeId);
        if (!node)
            throw new Error(`Node ${nodeId} not found`);
        if (!context)
            throw new Error("Context is missing");
        // Execute the node
        const result = await this.engine.executeNode(node, context);
        TelemetryService_js_1.telemetry.emitTaskExecutionLog({
            taskId: logTaskId,
            message: `Node ${nodeId} executed successfully`,
            source: 'workflow-worker',
            actor: 'workflow-worker',
            stage: 'execute_node',
            persist,
            metadata: { nodeType: node.type },
        });
        // Update context with result
        // Ideally this should merge properly based on node output config
        const updatedContext = {
            ...context,
            variables: { ...context.variables, ...result?.output }, // Simplified merging
            // Update execution status, etc.
        };
        // Persist state
        await this.engine.updateExecutionState(executionId, updatedContext);
        // Find next nodes
        const nextNodes = this.engine.findNextNodes(node, workflow, updatedContext);
        for (const nextNode of nextNodes) {
            await this.queue.addExecuteNodeJob({
                executionId,
                workflowId: data.workflowId,
                taskId,
                nodeId: nextNode.id,
                context: updatedContext,
            });
        }
        if (node.type === WorkflowTypes_js_1.WorkflowNodeType.END) {
            this.logger.info(`Workflow ${executionId} reached end via node ${nodeId}`);
            TelemetryService_js_1.telemetry.emitTaskExecutionLog({
                taskId: logTaskId,
                message: `Workflow reached END node ${nodeId}`,
                source: 'workflow-worker',
                actor: 'workflow-worker',
                stage: 'finalize',
                persist,
            });
            const execution = await this.engine.getExecutionStatus(executionId);
            if (execution) {
                execution.status = 'COMPLETED'; // WorkflowExecutionStatus.COMPLETED
                execution.completedAt = new Date();
                execution.output = updatedContext.variables;
                await this.engine.finalizeExecution(execution);
            }
        }
    }
    async close() {
        await this.worker.close();
    }
}
exports.WorkflowWorker = WorkflowWorker;
//# sourceMappingURL=WorkflowWorker.js.map