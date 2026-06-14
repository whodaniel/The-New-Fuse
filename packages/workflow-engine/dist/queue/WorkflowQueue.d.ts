import { Queue, Job } from 'bullmq';
import { Logger } from '@the-new-fuse/relay-core';
import { ExecutionContext } from '../types/WorkflowTypes.js';
export declare const WORKFLOW_QUEUE_NAME = "tnf:workflow:queue";
export declare enum WorkflowJobType {
    START_WORKFLOW = "start_workflow",
    EXECUTE_NODE = "execute_node",
    FINALIZE_WORKFLOW = "finalize_workflow"
}
export interface WorkflowJobData {
    telemetryContext?: any;
}
export interface StartWorkflowJobData extends WorkflowJobData {
    executionId: string;
    workflowId: string;
    taskId?: string;
}
export interface ExecuteNodeJobData extends WorkflowJobData {
    executionId: string;
    workflowId: string;
    nodeId: string;
    taskId?: string;
    context?: ExecutionContext;
}
export interface FinalizeWorkflowJobData {
    executionId: string;
    status: 'COMPLETED' | 'FAILED' | 'CANCELLED';
    result?: any;
    error?: any;
}
export declare class WorkflowQueue {
    private queue;
    private logger;
    constructor(logger: Logger, connection: any);
    addStartWorkflowJob(data: StartWorkflowJobData): Promise<Job<any, any, string>>;
    addExecuteNodeJob(data: ExecuteNodeJobData): Promise<Job<any, any, string>>;
    addFinalizeWorkflowJob(data: FinalizeWorkflowJobData): Promise<Job<any, any, string>>;
    close(): Promise<void>;
    getQueue(): Queue;
}
//# sourceMappingURL=WorkflowQueue.d.ts.map