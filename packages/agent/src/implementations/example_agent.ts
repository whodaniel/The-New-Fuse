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

// ============================================================
// EXAMPLE TYPES
// ============================================================

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

// ============================================================
// EXAMPLE AGENT
// ============================================================

export class ExampleAgent extends EventEmitter {
  private config: ExampleAgentConfig;
  private running = false;
  private tasksProcessed = 0;

  constructor(config: ExampleAgentConfig) {
    super();
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
  async start(): Promise<void> {
    console.log(`Starting ${this.config.name}...`);
    this.running = true;
    this.emit('started');
  }

  /**
   * Stop the agent
   */
  async stop(): Promise<void> {
    console.log(`Stopping ${this.config.name}...`);
    this.running = false;
    this.emit('stopped');
  }

  /**
   * Check if running
   */
  isRunning(): boolean {
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
  async process(task: ExampleTask): Promise<ExampleResult> {
    if (!this.running) {
      throw new Error('Agent is not running');
    }

    this.emit('task:started', task);

    try {
      let output: unknown;

      switch (task.type) {
        case 'greet':
          output = this.greet(task.input as { name: string });
          break;
        case 'calculate':
          output = this.calculate(task.input as { a: number; b: number; op: string });
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

      const result: ExampleResult = {
        taskId: task.id,
        output,
        success: true,
        timestamp: new Date(),
      };

      this.emit('task:completed', result);
      return result;
    } catch (error) {
      const result: ExampleResult = {
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
  private greet(input: { name: string }): string {
    return `Hello, ${input.name}! I'm ${this.config.name}.`;
  }

  /**
   * Calculate task handler
   */
  private calculate(input: { a: number; b: number; op: string }): number {
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
  private transform(input: unknown): unknown {
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
  private async handleCustom(input: unknown): Promise<unknown> {
    // Simulate async processing
    await new Promise((resolve) => setTimeout(resolve, 100));
    return { processed: true, input };
  }

  // ============================================================
  // UTILITY METHODS
  // ============================================================

  /**
   * Get agent information
   */
  getInfo(): ExampleAgentConfig & { running: boolean; tasksProcessed: number } {
    return {
      ...this.config,
      running: this.running,
      tasksProcessed: this.tasksProcessed,
    };
  }

  /**
   * Get task statistics
   */
  getStats(): { tasksProcessed: number } {
    return {
      tasksProcessed: this.tasksProcessed,
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.tasksProcessed = 0;
    this.emit('stats:reset');
  }
}

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
export function createExampleAgent(
  id: string,
  name: string,
  options: Partial<ExampleAgentConfig> = {}
): ExampleAgent {
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
export async function demonstrateExampleAgent(): Promise<void> {
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

export default ExampleAgent;
