/**
 * Workflow Execution Service - Real-time workflow execution monitoring
 */
import { WorkflowExecution } from './WorkflowService';
export interface ExecutionUpdate {
    type: 'status' | 'log' | 'node' | 'complete' | 'error';
    executionId: string;
    data: any;
    timestamp: Date;
}
export interface ExecutionSubscription {
    executionId: string;
    callback: (update: ExecutionUpdate) => void;
    cleanup: () => void;
}
declare class WorkflowExecutionService {
    private subscriptions;
    private websockets;
    subscribeToExecution(executionId: string, callback: (update: ExecutionUpdate) => void): () => void;
    private createWebSocketConnection;
    private notifySubscribers;
    private unsubscribe;
    getExecutionStatus(executionId: string): Promise<WorkflowExecution>;
    pauseExecution(executionId: string): Promise<void>;
    resumeExecution(executionId: string): Promise<void>;
    cancelExecution(executionId: string): Promise<void>;
    cleanup(): void;
}
export declare const workflowExecutionService: WorkflowExecutionService;
export default WorkflowExecutionService;
