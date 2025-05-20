import { Script, createContext } from 'vm';
import { EventEmitter } from 'events';

export interface SandboxOptions {
  timeout?: number;
  memoryLimit?: number;
  allowedModules?: string[];
  context?: Record<string, any>;
}

export interface ExecutionResult {
  success: boolean;
  output: string[];
  error?: Error;
  result?: any;
  memoryUsage?: number;
  executionTime?: number;
}

export class CodeSandbox extends EventEmitter {
  private options: Required<SandboxOptions>;
  private context: any;

  constructor(options: SandboxOptions = {}) {
    super();
    this.options = {
      timeout: options.timeout || 5000,
      memoryLimit: options.memoryLimit || 50 * 1024 * 1024, // 50MB
      allowedModules: options.allowedModules || [],
      context: options.context || {},
    };
    this.initializeContext();
  }

  private initializeContext(): void {
    // Create a secure context with limited capabilities
    const context = createContext({
      console: {
        log: (...args: any[]) => this.emit('output', 'log', ...args),
        error: (...args: any[]) => this.emit('output', 'error', ...args),
        warn: (...args: any[]) => this.emit('output', 'warn', ...args),
      },
      setTimeout: (cb: Function, ms: number) => {
        if (ms > this.options.timeout) {
          throw new Error('setTimeout duration exceeds sandbox timeout');
        }
        return setTimeout(cb, ms);
      },
      clearTimeout,
      Buffer: {
        from: Buffer.from,
        isBuffer: Buffer.isBuffer,
      },
      ...this.options.context,
    });

    // Add allowed modules to context
    this.options.allowedModules.forEach(moduleName => {
      try {
        context[moduleName] = require(moduleName);
      } catch (error) {
        console.warn(`Failed to load module ${moduleName}:`, error);
      }
    });

    this.context = context;
  }

  async execute(code: string): Promise<ExecutionResult> {
    const output: string[] = [];
    const startTime = Date.now();
    let error: Error | undefined;
    let result: any;

    // Collect console output
    this.on('output', (type: string, ...args: any[]) => {
      output.push(`[${type}] ${args.join(' ')}`);
    });

    try {
      // Wrap code in memory limit check
      const wrappedCode = `
        const startMem = process.memoryUsage().heapUsed;
        ${code}
        const endMem = process.memoryUsage().heapUsed;
        if (endMem - startMem > ${this.options.memoryLimit}) {
          throw new Error('Memory limit exceeded');
        }
      `;

      // Create and run script with timeout
      const script = new Script(wrappedCode);
      result = await Promise.race([
        script.runInContext(this.context, {
          timeout: this.options.timeout,
          displayErrors: true,
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Execution timeout')), this.options.timeout)
        ),
      ]);
    } catch (e) {
      error = e as Error;
    }

    const executionTime = Date.now() - startTime;
    const memoryUsage = process.memoryUsage().heapUsed;

    return {
      success: !error,
      output,
      error,
      result,
      memoryUsage,
      executionTime,
    };
  }

  /**
   * Reset the sandbox context
   */
  reset(): void {
    this.removeAllListeners();
    this.initializeContext();
  }
}