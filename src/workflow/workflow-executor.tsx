import { EventEmitter } from 'events';
import { WorkflowVersion, WorkflowStep } from './workflow-manager.js';

export interface ExecutionContext {
    workflowId: string;
    stepId: string;
    inputs: Record<string, unknown>;
    state: Record<string, unknown>;
}

export interface ExecutionResult {
    success: boolean;
    outputs: Record<string, unknown>;
    error?: Error;
}

export interface ExecutionOptions {
    parallel?: boolean;
    timeout?: number;
    retryAttempts?: number;
}

export class WorkflowExecutor extends EventEmitter {
    private executors: Map<string, (context: ExecutionContext) => Promise<ExecutionResult>> = new Map();
    private runningWorkflows: Map<string, AbortController> = new Map();
    private metricsCollector: MetricsCollector;

    constructor(metricsCollector: MetricsCollector) {
        super();
        this.metricsCollector = metricsCollector;
    }

    public registerStepExecutor(
        stepType: string,
        executor: (context: ExecutionContext) => Promise<ExecutionResult>
    ): void {
        this.executors.set(stepType, executor);
    }

    public async executeWorkflow(
        workflowId: string, 
        workflow: WorkflowVersion,
        options: ExecutionOptions = {}
    ): Promise<ExecutionResult> {
        const abortController = new AbortController();
        this.runningWorkflows.set(workflowId, abortController);
        const metrics = new ExecutionMetrics(workflowId);

        try {
            const executionOrder = this.calculateExecutionOrder(workflow.steps);
            const state: Record<string, unknown> = {};

            if (options.parallel) {
                return await this.executeParallel(executionOrder, state, metrics, abortController.signal);
            }

            return await this.executeSequential(executionOrder, state, metrics, abortController.signal);
        } finally {
            metrics.complete();
            this.emit('workflowMetrics', metrics);
            this.runningWorkflows.delete(workflowId);
        }
    }

    private async executeParallel(
        steps: WorkflowStep[],
        state: Record<string, unknown>,
        metrics: ExecutionMetrics,
        signal: AbortSignal
    ): Promise<ExecutionResult> {
        const readySteps = new Set(steps.filter(step => step.dependencies.length === 0));
        const pending = new Set(steps.filter(step => step.dependencies.length > 0));
        const completed = new Set<string>();

        while (readySteps.size > 0) {
            if (signal.aborted) {
                throw new Error('Workflow execution aborted');
            }

            const executions = Array.from(readySteps).map(step => 
                this.executeStep(step, state, metrics)
            );

            const results = await Promise.all(executions);
            readySteps.clear();

            for (const [step, result] of results) {
                completed.add(step.id);
                if (!result.success) {
                    return result;
                }
            }

            // Find next ready steps
            for (const step of pending) {
                if (step.dependencies.every(dep => completed.has(dep))) {
                    readySteps.add(step);
                    pending.delete(step);
                }
            }
        }

        return { success: true, outputs: state };
    }

    private async executeSequential(
        steps: WorkflowStep[],
        state: Record<string, unknown>,
        metrics: ExecutionMetrics,
        signal: AbortSignal
    ): Promise<ExecutionResult> {
        for (const step of steps) {
            if (signal.aborted) {
                throw new Error('Workflow execution aborted');
            }

            const executor = this.executors.get(step.type);
            if (!executor) {
                throw new Error(`No executor found for step type: ${step.type}`);
            }

            const context: ExecutionContext = {
                workflowId: step.workflowId,
                stepId: step.id,
                inputs: step.config,
                state
            };

            this.emit('stepStart', context);
            const result = await executor(context);
            Object.assign(state, result.outputs);
            this.emit('stepComplete', { context, result });

            if (!result.success) {
                throw result.error || new Error(`Step ${step.id} failed`);
            }
        }

        return { success: true, outputs: state };
    }

    private async executeStep(
        step: WorkflowStep,
        state: Record<string, unknown>,
        metrics: ExecutionMetrics
    ): Promise<[WorkflowStep, ExecutionResult]> {
        const startTime = Date.now();
        try {
            const executor = this.executors.get(step.type);
            if (!executor) {
                throw new Error(`No executor found for step type: ${step.type}`);
            }

            const context: ExecutionContext = {
                workflowId: step.workflowId,
                stepId: step.id,
                inputs: step.config,
                state
            };

            this.emit('stepStart', context);
            const result = await executor(context);
            Object.assign(state, result.outputs);
            this.emit('stepComplete', { context, result });

            this.metricsCollector.record('workflow.step.duration', 
                Date.now() - startTime,
                { workflowId: context.workflowId, stepId: step.id }
            );
            
            return [step, result];
        } catch (error) {
            this.metricsCollector.record('workflow.step.error', 1,
                { workflowId: context.workflowId, stepId: step.id }
            );
            throw error;
        }
    }

    private calculateExecutionOrder(steps: WorkflowStep[]): WorkflowStep[] {
        const visited = new Set<string>();
        const order: WorkflowStep[] = [];

        const visit = (step: WorkflowStep): any => {
            if (visited.has(step.id)) return;
            step.dependencies.forEach(depId => {
                const depStep = steps.find(s => s.id === depId);
                if (depStep) visit(depStep);
            });
            visited.add(step.id);
            order.push(step);
        };

        steps.forEach(step => visit(step));
        return order;
    }
}

class ExecutionMetrics {
    private startTime: number;
    private stepMetrics: Map<string, StepMetrics> = new Map();

    constructor(public readonly workflowId: string) {
        this.startTime = Date.now();
    }

    public recordStep(stepId: string, duration: number, success: boolean): void {
        this.stepMetrics.set(stepId, { duration, success });
    }

    public complete(): void {
        this.totalDuration = Date.now() - this.startTime;
    }

    public getMetrics(): WorkflowMetrics {
        return {
            workflowId: this.workflowId,
            totalDuration: this.totalDuration,
            stepMetrics: Object.fromEntries(this.stepMetrics)
        };
    }
}
