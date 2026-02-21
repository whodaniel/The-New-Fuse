import { Queue, QueueOptions, Job } from 'bullmq';
import { Logger } from '@the-new-fuse/relay-core';
import { WorkflowNode, ExecutionContext } from '../types/WorkflowTypes';
import { telemetry } from '../telemetry/TelemetryService';

export const WORKFLOW_QUEUE_NAME = 'tnf:workflow:queue';

export enum WorkflowJobType {
  START_WORKFLOW = 'start_workflow',
  EXECUTE_NODE = 'execute_node',
  FINALIZE_WORKFLOW = 'finalize_workflow',
}

export interface WorkflowJobData {
    telemetryContext?: any;
}

export interface StartWorkflowJobData extends WorkflowJobData {
  executionId: string;
  workflowId: string;
}

export interface ExecuteNodeJobData extends WorkflowJobData {
  executionId: string;
  workflowId: string;
  nodeId: string;
  // We pass minimal context needed to resume execution
  // Full context should be fetched from storage or passed if small enough
  context?: ExecutionContext;
}

export interface FinalizeWorkflowJobData {
  executionId: string;
  status: 'COMPLETED' | 'FAILED' | 'CANCELLED';
  result?: any;
  error?: any;
}

export class WorkflowQueue {
  private queue: Queue;
  private logger: Logger;

  constructor(logger: Logger, connection: any) { // connection is Redis connection options
    this.logger = logger;
    this.queue = new Queue(WORKFLOW_QUEUE_NAME, {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: false, // Keep failed jobs for inspection
      },
    });
  }

  async addStartWorkflowJob(data: StartWorkflowJobData) {
    this.logger.info(`Adding START_WORKFLOW job for execution ${data.executionId}`);
    telemetry.injectContext(data); // Inject trace context
    return this.queue.add(WorkflowJobType.START_WORKFLOW, data);
  }

  async addExecuteNodeJob(data: ExecuteNodeJobData) {
    this.logger.debug(`Adding EXECUTE_NODE job for node ${data.nodeId} in execution ${data.executionId}`);
    telemetry.injectContext(data); // Inject trace context
    return this.queue.add(WorkflowJobType.EXECUTE_NODE, data);
  }

  async addFinalizeWorkflowJob(data: FinalizeWorkflowJobData) {
    this.logger.info(`Adding FINALIZE_WORKFLOW job for execution ${data.executionId}`);
    // data is union type in addFinalizeWorkflowJob signature in my mind but simpler here
    // wait, FinalizeWorkflowJobData doesn't extend WorkflowJobData in my previous definition?
    // I should cast or update interface above.
    const jobData = { ...data, telemetryContext: {} };
    telemetry.injectContext(jobData);
    return this.queue.add(WorkflowJobType.FINALIZE_WORKFLOW, jobData);
  }

  async close() {
    await this.queue.close();
  }

  getQueue(): Queue {
    return this.queue;
  }
}
