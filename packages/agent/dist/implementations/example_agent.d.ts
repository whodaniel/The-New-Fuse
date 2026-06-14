/**
 * Example Agent - Reference implementation
 *
 * A complete example agent implementation demonstrating:
 * - Proper agent structure
 * - Event handling
 * - Task processing
 * - Tool integration
 * - Best practices
 */
import { EventEmitter } from 'events';
export interface ExampleAgentConfig {
    id: string;
    name: string;
    description: string;
    version: string;
}
export interface ExampleTask {
    id: string;
    type: 'greet' | 'calculate' | 'transform' | 'custom';
    input: unknown;
}
export interface ExampleResult {
    taskId: string;
    output: unknown;
    success: boolean;
    timestamp: Date;
}
export declare class ExampleAgent extends EventEmitter {
    private config;
    private running;
    private tasksProcessed;
    constructor(config: ExampleAgentConfig);
    /**
     * Start the agent
     *
     * @example
     * ```typescript
     * const agent = new ExampleAgent({ id: 'ex1', name: 'Example' });
     * await agent.start();
     * ```
     */
    start(): Promise<void>;
    /**
     * Stop the agent
     */
    stop(): Promise<void>;
    /**
     * Check if running
     */
    isRunning(): boolean;
    /**
     * Process a task
     *
     * @example
     * ```typescript
     * const result = await agent.process({
     *   id: 'task-1',
     *   type: 'greet',
     *   input: { name: 'World' }
     * });
     * ```
     */
    process(task: ExampleTask): Promise<ExampleResult>;
    /**
     * Greet task handler
     */
    private greet;
    /**
     * Calculate task handler
     */
    private calculate;
    /**
     * Transform task handler
     */
    private transform;
    /**
     * Custom task handler
     */
    private handleCustom;
    /**
     * Get agent information
     */
    getInfo(): ExampleAgentConfig & {
        running: boolean;
        tasksProcessed: number;
    };
    /**
     * Get task statistics
     */
    getStats(): {
        tasksProcessed: number;
    };
    /**
     * Reset statistics
     */
    resetStats(): void;
}
/**
 * Create an example agent
 *
 * @example
 * ```typescript
 * const agent = createExampleAgent('my-agent', 'My Agent');
 * await agent.start();
 * const result = await agent.process({
 *   id: 'task-1',
 *   type: 'greet',
 *   input: { name: 'World' }
 * });
 * ```
 */
export declare function createExampleAgent(id: string, name: string, options?: Partial<ExampleAgentConfig>): ExampleAgent;
/**
 * Example usage demonstration
 */
export declare function demonstrateExampleAgent(): Promise<void>;
export default ExampleAgent;
//# sourceMappingURL=example_agent.d.ts.map