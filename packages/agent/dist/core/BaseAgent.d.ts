import { EventEmitter } from 'events';
import { BaseBridge, MessageType, Priority } from '../bridges.js';
import { ContextManager } from '../context/manager.js';
import { ErrorRecovery, ErrorCategory, ErrorSeverity } from '../error/recovery.js';
import { MetricsRegistry, PerformanceMonitor } from '../monitoring/metrics.js';
import { AgentState, AgentConfig, Task } from '../interfaces/agent.interface';
import { UnifiedRedisService } from '@the-new-fuse/infrastructure';
export declare abstract class BaseAgent extends EventEmitter {
    protected config: AgentConfig;
    protected bridge?: BaseBridge;
    protected contextManager: ContextManager;
    protected metrics: MetricsRegistry;
    protected monitor: PerformanceMonitor;
    protected errorRecovery: ErrorRecovery;
    protected state: AgentState;
    protected tasks: Map<string, Task>;
    protected context: Map<string, any>;
    protected shouldRun: boolean;
    protected taskProcessor?: Promise<void>;
    constructor(config: AgentConfig, bridge?: BaseBridge, redisService?: UnifiedRedisService);
    abstract processMessage(message: Record<string, unknown>): Promise<void>;
    abstract executeTask(task: Task): Promise<Record<string, unknown>>;
    protected sendMessage(message: Record<string, unknown>, messageType: MessageType, priority?: Priority): Promise<void>;
    protected handleError(error: Error, category: ErrorCategory, severity: ErrorSeverity): Promise<void>;
    protected start(): Promise<void>;
    protected stop(): Promise<void>;
    protected terminate(): Promise<void>;
    protected processNextTask(): Promise<void>;
}
//# sourceMappingURL=BaseAgent.d.ts.map