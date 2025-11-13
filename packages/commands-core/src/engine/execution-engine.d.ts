import { EventEmitter } from 'eventemitter3';
import { ICommand, ICommandContext, ICommandResult, ICommandBusConfig } from '../interfaces';
import { CommandRegistry } from '../registry';
/**
 * Event-driven command execution engine
 */
export declare class ExecutionEngine extends EventEmitter {
    private registry;
    private middleware;
    private interceptors;
    private config;
    private stats;
    constructor(registry: CommandRegistry, config?: Partial<ICommandBusConfig>);
    /**
     * Execute a command through the full pipeline
     */
    execute<TData, TResult>(command: ICommand<TData, TResult>, context?: Partial<ICommandContext>): Promise<ICommandResult<TResult>>;
    /**
     * Execute command through the middleware pipeline
     */
    private executeThroughPipeline;
    /**
     * Execute the command with interceptors
     */
    private executeCommand;
    /**
     * Run interceptors for a specific phase
     */
    private runInterceptors;
}
//# sourceMappingURL=execution-engine.d.ts.map