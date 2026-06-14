"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExampleAgent = void 0;
exports.createExampleAgent = createExampleAgent;
exports.demonstrateExampleAgent = demonstrateExampleAgent;
const events_1 = require("events");
// ============================================================
// EXAMPLE AGENT
// ============================================================
class ExampleAgent extends events_1.EventEmitter {
    constructor(config) {
        super();
        this.running = false;
        this.tasksProcessed = 0;
        this.config = config;
    }
    // ============================================================
    // LIFECYCLE METHODS
    // ============================================================
    /**
     * Start the agent
     *
     * @example
     * ```typescript
     * const agent = new ExampleAgent({ id: 'ex1', name: 'Example' });
     * await agent.start();
     * ```
     */
    async start() {
        console.log(`Starting ${this.config.name}...`);
        this.running = true;
        this.emit('started');
    }
    /**
     * Stop the agent
     */
    async stop() {
        console.log(`Stopping ${this.config.name}...`);
        this.running = false;
        this.emit('stopped');
    }
    /**
     * Check if running
     */
    isRunning() {
        return this.running;
    }
    // ============================================================
    // TASK PROCESSING
    // ============================================================
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
    async process(task) {
        if (!this.running) {
            throw new Error('Agent is not running');
        }
        this.emit('task:started', task);
        try {
            let output;
            switch (task.type) {
                case 'greet':
                    output = this.greet(task.input);
                    break;
                case 'calculate':
                    output = this.calculate(task.input);
                    break;
                case 'transform':
                    output = this.transform(task.input);
                    break;
                case 'custom':
                    output = await this.handleCustom(task.input);
                    break;
                default:
                    throw new Error(`Unknown task type: ${task.type}`);
            }
            this.tasksProcessed++;
            const result = {
                taskId: task.id,
                output,
                success: true,
                timestamp: new Date(),
            };
            this.emit('task:completed', result);
            return result;
        }
        catch (error) {
            const result = {
                taskId: task.id,
                output: { error: error instanceof Error ? error.message : String(error) },
                success: false,
                timestamp: new Date(),
            };
            this.emit('task:failed', result);
            return result;
        }
    }
    // ============================================================
    // TASK HANDLERS
    // ============================================================
    /**
     * Greet task handler
     */
    greet(input) {
        return `Hello, ${input.name}! I'm ${this.config.name}.`;
    }
    /**
     * Calculate task handler
     */
    calculate(input) {
        const { a, b, op } = input;
        switch (op) {
            case 'add':
                return a + b;
            case 'subtract':
                return a - b;
            case 'multiply':
                return a * b;
            case 'divide':
                if (b === 0) {
                    throw new Error('Division by zero');
                }
                return a / b;
            default:
                throw new Error(`Unknown operation: ${op}`);
        }
    }
    /**
     * Transform task handler
     */
    transform(input) {
        if (typeof input === 'string') {
            return input.toUpperCase();
        }
        if (Array.isArray(input)) {
            return input.reverse();
        }
        if (typeof input === 'object' && input !== null) {
            return { transformed: true, original: input };
        }
        return input;
    }
    /**
     * Custom task handler
     */
    async handleCustom(input) {
        // Process the custom input - no artificial delays
        // In a real implementation, this would perform actual async work:
        // - Database queries
        // - External API calls
        // - File operations
        // - Message queue publishing
        return { processed: true, input, processedAt: new Date().toISOString() };
    }
    // ============================================================
    // UTILITY METHODS
    // ============================================================
    /**
     * Get agent information
     */
    getInfo() {
        return {
            ...this.config,
            running: this.running,
            tasksProcessed: this.tasksProcessed,
        };
    }
    /**
     * Get task statistics
     */
    getStats() {
        return {
            tasksProcessed: this.tasksProcessed,
        };
    }
    /**
     * Reset statistics
     */
    resetStats() {
        this.tasksProcessed = 0;
        this.emit('stats:reset');
    }
}
exports.ExampleAgent = ExampleAgent;
// ============================================================
// FACTORY FUNCTION
// ============================================================
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
function createExampleAgent(id, name, options = {}) {
    return new ExampleAgent({
        id,
        name,
        description: options.description || 'An example agent',
        version: options.version || '1.0.0',
    });
}
// ============================================================
// USAGE EXAMPLE
// ============================================================
/**
 * Example usage demonstration
 */
async function demonstrateExampleAgent() {
    // Create agent
    const agent = createExampleAgent('demo', 'Demo Agent');
    // Set up event listeners
    agent.on('started', () => console.log('Agent started'));
    agent.on('stopped', () => console.log('Agent stopped'));
    agent.on('task:completed', (result) => console.log('Task completed:', result));
    agent.on('task:failed', (result) => console.log('Task failed:', result));
    // Start agent
    await agent.start();
    // Process tasks
    await agent.process({ id: '1', type: 'greet', input: { name: 'World' } });
    await agent.process({ id: '2', type: 'calculate', input: { a: 5, b: 3, op: 'add' } });
    await agent.process({ id: '3', type: 'transform', input: 'hello' });
    // Get stats
    console.log('Stats:', agent.getStats());
    // Stop agent
    await agent.stop();
}
exports.default = ExampleAgent;
//# sourceMappingURL=example_agent.js.map