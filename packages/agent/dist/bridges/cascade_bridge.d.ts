/**
 * Cascade Bridge - Multi-Agent Workflow Orchestration Bridge
 *
 * Enables cascading workflows where the output of one agent becomes
 * the input of the next, supporting sequential, parallel, and pipeline modes.
 *
 * CONNECTS TO:
 * - UniversalBridge: For message transport
 * - CascadeService: For step execution (packages/core)
 * - EventEmitter: For workflow events
 */
import { BaseBridge, MessageType, Priority } from './index.js';
import type { UniversalMessage } from './universal_bridge.js';
export interface CascadeStepDef {
    id: string;
    name: string;
    agentId: string;
    input: unknown;
    dependsOn?: string[];
    timeout?: number;
    retries?: number;
    optional?: boolean;
}
export interface CascadeWorkflow {
    id: string;
    name: string;
    mode: 'sequential' | 'parallel' | 'pipeline' | 'waterfall';
    steps: CascadeStepDef[];
    metadata?: Record<string, unknown>;
    createdAt: Date;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
}
export interface CascadeStepResult {
    stepId: string;
    agentId: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
    input: unknown;
    output?: unknown;
    error?: string;
    startedAt?: Date;
    completedAt?: Date;
    durationMs?: number;
}
export interface CascadeWorkflowResult {
    workflowId: string;
    status: 'completed' | 'failed' | 'cancelled';
    stepResults: CascadeStepResult[];
    finalOutput: unknown;
    startedAt: Date;
    completedAt: Date;
    totalDurationMs: number;
}
/**
 * Cascade Bridge - Orchestrates multi-agent cascading workflows
 */
export declare class CascadeBridge extends BaseBridge {
    private workflows;
    private stepResults;
    private pendingSteps;
    private messageHandler?;
    constructor(bridgeName?: string);
    /**
     * Connect the cascade bridge
     */
    connect(): Promise<void>;
    /**
     * Disconnect the cascade bridge
     */
    disconnect(): Promise<void>;
    /**
     * Send a message (required by BaseBridge)
     */
    sendMessage(message: Record<string, unknown>, messageType?: MessageType, priority?: Priority): Promise<void>;
    /**
     * Create a new cascade workflow
     */
    createWorkflow(name: string, mode: CascadeWorkflow['mode'], steps: Omit<CascadeStepDef, 'id'>[]): CascadeWorkflow;
    /**
     * Execute a cascade workflow
     */
    executeWorkflow(workflowId: string, initialInput: unknown, onStepComplete?: (result: CascadeStepResult) => void): Promise<CascadeWorkflowResult>;
    /**
     * Execute steps sequentially (one after another)
     */
    private executeSequential;
    /**
     * Execute steps in parallel (all at once)
     */
    private executeParallel;
    /**
     * Execute as a pipeline (output → next input, with dependencies)
     */
    private executePipeline;
    /**
     * Execute as waterfall (each output merges into shared context)
     */
    private executeWaterfall;
    /**
     * Execute a single step
     */
    private executeStep;
    /**
     * Wait for agent response (simulated - needs bridge integration)
     */
    private waitForAgentResponse;
    /**
     * Submit a response from an agent
     */
    submitAgentResponse(stepId: string, output: unknown, error?: string): void;
    /**
     * Cancel a workflow
     */
    cancelWorkflow(workflowId: string): void;
    /**
     * Get workflow status
     */
    getWorkflow(workflowId: string): CascadeWorkflow | undefined;
    /**
     * Get step results for a workflow
     */
    getStepResults(workflowId: string): CascadeStepResult[];
    /**
     * Register a message handler for bridge integration
     */
    onMessage(handler: (message: UniversalMessage) => void): void;
    /**
     * Get bridge statistics
     */
    getStats(): {
        workflowCount: number;
        pendingSteps: number;
        workflowsByStatus: Record<string, number>;
    };
}
export default CascadeBridge;
//# sourceMappingURL=cascade_bridge.d.ts.map