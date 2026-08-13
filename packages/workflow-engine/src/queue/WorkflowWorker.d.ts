// @ts-nocheck
import { Logger } from '@the-new-fuse/relay-core';
import { UnifiedWorkflowEngine } from '../engine/WorkflowEngine.js';
import { WorkflowQueue } from './WorkflowQueue.js';
export declare class WorkflowWorker {
    private worker;
    private logger;
    private engine;
    private queue;
    constructor(logger: Logger, connection: any, engine: UnifiedWorkflowEngine, queue: WorkflowQueue);
    private processJob;
    private processStartWorkflow;
    private processExecuteNode;
    close(): Promise<void>;
}
//# sourceMappingURL=WorkflowWorker.d.ts.map