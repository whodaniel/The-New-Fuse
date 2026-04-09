import { Worker, Job } from 'bullmq';
import { Logger } from '@the-new-fuse/relay-core';
import { UnifiedWorkflowEngine } from '../engine/WorkflowEngine';
import { WorkflowQueue, WORKFLOW_QUEUE_NAME, WorkflowJobType, StartWorkflowJobData, ExecuteNodeJobData } from './WorkflowQueue';
import { WorkflowNodeType, ExecutionContext } from '../types/WorkflowTypes';
import { telemetry } from '../telemetry/TelemetryService';
import { context, trace } from '@opentelemetry/api';

export class WorkflowWorker {
  private worker: Worker;
  private logger: Logger;
  private engine: UnifiedWorkflowEngine;
  private queue: WorkflowQueue;

  constructor(
    logger: Logger,
    connection: any,
    engine: UnifiedWorkflowEngine,
    queue: WorkflowQueue
  ) {
    this.logger = logger;
    this.engine = engine;
    this.queue = queue;

    this.worker = new Worker(WORKFLOW_QUEUE_NAME, async (job: Job) => {
      const extractedContext = telemetry.extractContext(job.data);

      return context.with(extractedContext, async () => {
        return telemetry.startActiveSpan(`processJob:${job.name}`, async (span) => {
            span.setAttribute('jobId', job.id || 'unknown');
            try {
                await this.processJob(job);
            } catch (error: any) {
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

  private async processJob(job: Job) {
    switch (job.name) {
      case WorkflowJobType.START_WORKFLOW:
        await this.processStartWorkflow(job.data as StartWorkflowJobData);
        break;
      case WorkflowJobType.EXECUTE_NODE:
        await this.processExecuteNode(job.data as ExecuteNodeJobData);
        break;
      default:
        this.logger.warn(`Unknown job type: ${job.name}`);
    }
  }

  private async processStartWorkflow(data: StartWorkflowJobData) {
    const { executionId, workflowId } = data;
    this.logger.info(`Processing START_WORKFLOW for execution ${executionId}`);

    const execution = await this.engine.getExecutionStatus(executionId);
    if (!execution) {
      throw new Error(`Execution ${executionId} not found`);
    }

    const workflow = await this.engine.loadWorkflow(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const startNode = workflow.definition.nodes.find((n) => n.type === WorkflowNodeType.START);
    if (!startNode) {
      throw new Error('Workflow has no start node');
    }

    await this.queue.addExecuteNodeJob({
      executionId,
      workflowId,
      nodeId: startNode.id,
      context: execution.context,
    });
  }

  private async processExecuteNode(data: ExecuteNodeJobData) {
    const { executionId, nodeId, context } = data;
    this.logger.debug(`Processing EXECUTE_NODE ${nodeId} for execution ${executionId}`);

    const workflow = await this.engine.loadWorkflow(data.workflowId);
    if (!workflow) throw new Error("Workflow not found");

    const node = workflow.definition.nodes.find((n) => n.id === nodeId);
    if (!node) throw new Error(`Node ${nodeId} not found`);

    if (!context) throw new Error("Context is missing");

    // Execute the node
    const result = await this.engine.executeNode(node, context);

    // Update context with result
    // Ideally this should merge properly based on node output config
    const updatedContext: ExecutionContext = {
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
        nodeId: nextNode.id,
        context: updatedContext,
      });
    }

    if (node.type === WorkflowNodeType.END) {
        this.logger.info(`Workflow ${executionId} reached end via node ${nodeId}`);
        const execution = await this.engine.getExecutionStatus(executionId);
        if (execution) {
            execution.status = 'COMPLETED' as any; // WorkflowExecutionStatus.COMPLETED
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
