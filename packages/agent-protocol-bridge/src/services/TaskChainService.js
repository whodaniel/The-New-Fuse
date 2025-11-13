"use strict";
/**
 * TaskChainService.ts
 *
 * Task chaining and context retention system for maintaining continuity across agent handoffs.
 * Enables Traycer-style task chaining where context is retained from previous tasks.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskChainService = void 0;
const events_1 = require("events");
const uuid_1 = require("uuid");
class TaskChainService extends events_1.EventEmitter {
    handoffService;
    chains = new Map();
    executions = new Map();
    templates = new Map();
    constructor(handoffService) {
        super();
        this.handoffService = handoffService;
        this.initializeDefaultTemplates();
    }
    /**
     * Create a new task chain
     */
    async createChain(title, description, context, options = {}) {
        const chainId = (0, uuid_1.v4)();
        const chain = {
            id: chainId,
            title,
            description,
            planId: options.planId,
            status: 'active',
            steps: [],
            context: {
                workspace: context.workspace || process.cwd(),
                files: context.files || [],
                variables: new Map(),
                sharedState: {},
                conversationHistory: [],
                artifacts: [],
                cumulativeChanges: [],
                performanceMetrics: {
                    totalExecutionTime: 0,
                    averageStepTime: 0,
                    successRate: 0,
                    agentPerformance: new Map()
                },
                ...context
            },
            metadata: {
                priority: options.priority || 'medium',
                tags: options.tags || [],
                totalSteps: 0,
                completedSteps: 0,
                failedSteps: 0,
                skippedSteps: 0
            },
            createdAt: new Date(),
            updatedAt: new Date()
        };
        // Apply template if specified
        if (options.templateId) {
            await this.applyTemplate(chain, options.templateId);
        }
        this.chains.set(chainId, chain);
        this.executions.set(chainId, {
            chainId,
            currentStepIndex: 0,
            isRunning: false,
            isPaused: false,
            executionStrategy: 'sequential'
        });
        this.emit('chainCreated', chain);
        return chain;
    }
    /**
     * Add a step to a chain
     */
    async addStep(chainId, agentId, taskType, input, options = {}) {
        const chain = this.chains.get(chainId);
        if (!chain) {
            throw new Error(`Chain not found: ${chainId});
    }

    const stepId = uuidv4();
    const stepIndex = options.insertAt !== undefined ? options.insertAt : chain.steps.length;

    const step: ChainStep = {
      id: stepId,
      chainId,
      stepIndex,
      agentId,
      taskType,
      status: 'pending',
      input,
      dependencies: options.dependencies || [],
      conditions: options.conditions,
      retryCount: 0,
      maxRetries: options.maxRetries || 3,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Insert step at specified position
    if (options.insertAt !== undefined) {
      chain.steps.splice(options.insertAt, 0, step);
      // Update indices of subsequent steps
      for (let i = options.insertAt + 1; i < chain.steps.length; i++) {
        chain.steps[i].stepIndex = i;
      }
    } else {
      chain.steps.push(step);
    }

    chain.metadata.totalSteps = chain.steps.length;
    chain.updatedAt = new Date();

    this.emit('stepAdded', { chain, step });
    return step;
  }

  /**
   * Start executing a chain
   */
  async startChain(chainId: string, executionStrategy: 'sequential' | 'parallel' | 'conditional' = 'sequential'): Promise<void> {
    const chain = this.chains.get(chainId);
    const execution = this.executions.get(chainId);

    if (!chain || !execution) {`);
            throw new Error(`Chain or execution not found: ${chainId}`);
        }
        if (execution.isRunning) {
            throw new Error(Chain, is, already, running, $, { chainId });
        }
        execution.isRunning = true;
        execution.executionStrategy = executionStrategy;
        execution.currentStepIndex = 0;
        chain.status = 'active';
        chain.context.performanceMetrics.startTime = new Date();
        chain.updatedAt = new Date();
        this.emit('chainStarted', chain);
        try {
            switch (executionStrategy) {
                case 'sequential':
                    await this.executeSequentially(chain, execution);
                    break;
                case 'parallel':
                    await this.executeInParallel(chain, execution);
                    break;
                case 'conditional':
                    await this.executeConditionally(chain, execution);
                    break;
                default:
                    `
          throw new Error(Unknown execution strategy: ${executionStrategy}`;
                    ;
            }
            // Mark chain as completed
            chain.status = 'completed';
            chain.completedAt = new Date();
            chain.context.performanceMetrics.endTime = new Date();
            this.calculateFinalMetrics(chain);
            this.emit('chainCompleted', chain);
        }
        catch (error) {
            chain.status = 'failed';
            execution.isRunning = false;
            this.emit('chainFailed', { chain, error });
            throw error;
        }
        finally {
            execution.isRunning = false;
        }
    }
    /**
     * Execute chain steps sequentially
     */
    async executeSequentially(chain, execution) {
        for (let i = 0; i < chain.steps.length; i++) {
            if (!execution.isRunning)
                break;
            while (execution.isPaused) {
                await this.delay(1000); // Wait while paused
            }
            execution.currentStepIndex = i;
            const step = chain.steps[i];
            // Check dependencies
            if (!this.areDependenciesMet(chain, step)) {
                step.status = 'skipped';
                chain.metadata.skippedSteps++;
                continue;
            }
            // Check conditions
            if (step.conditions && !this.areConditionsMet(chain, step.conditions)) {
                step.status = 'skipped';
                chain.metadata.skippedSteps++;
                continue;
            }
            await this.executeStep(chain, step);
        }
    }
    /**
     * Execute eligible steps in parallel
     */
    async executeInParallel(chain, execution) {
        const pendingSteps = chain.steps.filter(step => step.status === 'pending' &&
            this.areDependenciesMet(chain, step) &&
            (!step.conditions || this.areConditionsMet(chain, step.conditions)));
        if (pendingSteps.length === 0)
            return;
        const promises = pendingSteps.map(step => this.executeStep(chain, step));
        await Promise.allSettled(promises);
        // Check if there are more steps to execute
        const remainingSteps = chain.steps.filter(step => step.status === 'pending');
        if (remainingSteps.length > 0) {
            await this.executeInParallel(chain, execution);
        }
    }
    /**
     * Execute chain with conditional logic
     */
    async executeConditionally(chain, execution) {
        let currentIndex = 0;
        while (currentIndex < chain.steps.length && execution.isRunning) {
            const step = chain.steps[currentIndex];
            if (step.status !== 'pending') {
                currentIndex++;
                continue;
            }
            // Check dependencies and conditions
            if (!this.areDependenciesMet(chain, step)) {
                currentIndex++;
                continue;
            }
            if (step.conditions && !this.areConditionsMet(chain, step.conditions)) {
                step.status = 'skipped';
                chain.metadata.skippedSteps++;
                currentIndex++;
                continue;
            }
            execution.currentStepIndex = currentIndex;
            await this.executeStep(chain, step);
            // Dynamic step addition based on results
            await this.handleDynamicStepAddition(chain, step);
            currentIndex++;
        }
    }
    /**
     * Execute a single step
     */
    async executeStep(chain, step) {
        const startTime = Date.now();
        try {
            step.status = 'in_progress';
            step.updatedAt = new Date();
            this.emit('stepStarted', { chain, step });
            // Enhance input with chain context
            const enhancedInput = this.enhanceStepInput(chain, step);
            let result;
            if (this.handoffService) {
                // Use handoff service for execution
                if (step.taskType === 'plan_execution' && chain.planId) {
                    // This would require getting the plan from TaskPlanningService
                    // For now, we'll use a simulated approach
                    result = await this.handoffService.executePlanHandoff(step.agentId, { id: chain.planId }, // Placeholder
                    { timeout: 300000 });
                }
                else {
                    // Execute as custom task
                    result = await this.executeCustomStep(step, enhancedInput);
                }
            }
            else {
                // Fallback execution
                result = await this.executeCustomStep(step, enhancedInput);
            }
            // Process step output
            const output = {
                result: result.result,
                output: result.output || '',
                filesModified: result.filesModified,
                metadata: result.metadata || {},
                contextUpdates: this.extractContextUpdates(result)
            };
            step.output = output;
            step.status = 'completed';
            step.executionTime = Date.now() - startTime;
            step.completedAt = new Date();
            step.updatedAt = new Date();
            // Update chain context
            this.updateChainContext(chain, step, output);
            chain.metadata.completedSteps++;
            this.emit('stepCompleted', { chain, step, result });
        }
        catch (error) {
            step.status = 'failed';
            step.executionTime = Date.now() - startTime;
            step.updatedAt = new Date();
            chain.metadata.failedSteps++;
            // Retry logic
            if (step.retryCount < step.maxRetries) {
                step.retryCount++;
                step.status = 'pending';
                this.emit('stepRetry', { chain, step, error, retryCount: step.retryCount });
                await this.delay(1000 * step.retryCount); // Exponential backoff
                return await this.executeStep(chain, step);
            }
            this.emit('stepFailed', { chain, step, error });
            throw error;
        }
    }
    /**
     * Execute custom step (fallback)
     */
    async executeCustomStep(step, input) {
        // Simulate step execution
        await this.delay(1000 + Math.random() * 2000);
        return {
            handoffId: step.id,
            agentId: step.agentId,
            status: 'success',
            result: Step, $
        };
        {
            step.stepIndex;
        }
        completed, `
      output: Executed ${step.taskType} task: ${input.instructions},
      executionTime: 1500,
      timestamp: new Date()
    };
  }

  /**
   * Pause chain execution
   */
  async pauseChain(chainId: string, reason?: string): Promise<void> {
    const chain = this.chains.get(chainId);
    const execution = this.executions.get(chainId);` `
    if (!chain || !execution) {`;
        throw new Error(Chain, not, found, $, { chainId });
    }
    execution;
    isPaused = true;
    execution;
    pauseReason = reason;
    chain;
    status = 'paused';
    chain;
    updatedAt = new Date();
}
exports.TaskChainService = TaskChainService;
this.emit('chainPaused', { chain, reason });
/**
 * Resume chain execution
 */
async;
resumeChain(chainId, string);
Promise < void  > {
    const: chain = this.chains.get(chainId),
    const: execution = this.executions.get(chainId),
    if(, chain) { }
} || !execution;
{
    `
      throw new Error(Chain not found: ${chainId}`;
    ;
}
execution.isPaused = false;
execution.pauseReason = undefined;
chain.status = 'active';
chain.updatedAt = new Date();
this.emit('chainResumed', chain);
/**
 * Cancel chain execution
 */
async;
cancelChain(chainId, string, reason ?  : string);
Promise < void  > {
    const: chain = this.chains.get(chainId),
    const: execution = this.executions.get(chainId),
    if(, chain) { }
} || !execution;
{
    throw new Error(Chain, not, found, $, { chainId });
}
execution.isRunning = false;
execution.isPaused = false;
chain.status = 'cancelled';
chain.updatedAt = new Date();
this.emit('chainCancelled', { chain, reason });
areDependenciesMet(chain, TaskChain, step, ChainStep);
boolean;
{
    return step.dependencies.every(depId => {
        const depStep = chain.steps.find(s => s.id === depId);
        return depStep && depStep.status === 'completed';
    });
}
areConditionsMet(chain, TaskChain, conditions, ChainCondition[]);
boolean;
{
    return conditions.every(condition => this.evaluateCondition(chain, condition));
}
evaluateCondition(chain, TaskChain, condition, ChainCondition);
boolean;
{
    switch (condition.type) {
        case 'success_required':
            // Check if a specific step succeeded
            const step = chain.steps.find(s => s.id === condition.target);
            return step?.status === 'completed';
        case 'failure_required':
            // Check if a specific step failed
            const failedStep = chain.steps.find(s => s.id === condition.target);
            return failedStep?.status === 'failed';
        case 'output_contains':
            // Check if step output contains specific value
            const outputStep = chain.steps.find(s => s.id === condition.target);
            return outputStep?.output?.output?.includes(condition.value) || false;
        case 'file_exists':
            // Check if file exists in artifacts or workspace
            return chain.context.artifacts.some(a => a.name === condition.value) ||
                chain.context.files.includes(condition.value);
        default:
            return true;
    }
}
enhanceStepInput(chain, TaskChain, step, ChainStep);
ChainStepInput;
{
    return {
        ...step.input,
        context: {
            ...step.input.context,
            chainId: chain.id,
            stepIndex: step.stepIndex,
            sharedState: chain.context.sharedState,
            variables: Object.fromEntries(chain.context.variables),
            previousSteps: chain.steps
                .filter(s => s.stepIndex < step.stepIndex && s.status === 'completed')
                .map(s => ({ id: s.id, output: s.output }))
        }
    };
}
updateChainContext(chain, TaskChain, step, ChainStep, output, ChainStepOutput);
void {
    // Update shared state
    if(output) { }, : .contextUpdates
};
{
    Object.assign(chain.context.sharedState, output.contextUpdates);
}
// Add conversation entry
chain.context.conversationHistory.push({
    role: 'assistant',
    content: output.output,
    agentId: step.agentId,
    stepId: step.id,
    timestamp: new Date()
});
// Add artifacts
if (output.artifacts) {
    chain.context.artifacts.push(...output.artifacts);
}
// Track file changes
if (output.filesModified) {
    for (const file of output.filesModified) {
        chain.context.cumulativeChanges.push({
            stepId: step.id,
            agentId: step.agentId,
            path: file,
            operation: 'modify',
            timestamp: new Date()
        });
    }
}
// Update performance metrics
this.updatePerformanceMetrics(chain, step);
updatePerformanceMetrics(chain, TaskChain, step, ChainStep);
void {
    const: metrics = chain.context.performanceMetrics,
    const: executionTime = step.executionTime || 0,
    metrics, : .totalExecutionTime += executionTime,
    metrics, : .averageStepTime = metrics.totalExecutionTime / chain.metadata.completedSteps,
    // Update agent performance
    const: agentPerf = metrics.agentPerformance.get(step.agentId) || {
        agentId: step.agentId,
        stepsExecuted: 0,
        successfulSteps: 0,
        averageExecutionTime: 0,
        totalTime: 0
    },
    agentPerf, : .stepsExecuted++,
    if(step) { }, : .status === 'completed'
};
{
    agentPerf.successfulSteps++;
}
agentPerf.totalTime += executionTime;
agentPerf.averageExecutionTime = agentPerf.totalTime / agentPerf.stepsExecuted;
metrics.agentPerformance.set(step.agentId, agentPerf);
calculateFinalMetrics(chain, TaskChain);
void {
    const: metrics = chain.context.performanceMetrics,
    const: totalSteps = chain.metadata.totalSteps,
    const: completedSteps = chain.metadata.completedSteps,
    metrics, : .successRate = totalSteps > 0 ? completedSteps / totalSteps : 0,
    if(metrics) { }, : .startTime && metrics.endTime
};
{
    chain.metadata.actualDuration = Math.round((metrics.endTime.getTime() - metrics.startTime.getTime()) / (1000 * 60));
}
extractContextUpdates(result, AgentHandoffService_1.HandoffResult);
Record < string, any > {
    // Extract context updates from result metadata
    return: result.metadata?.contextUpdates || {}
};
async;
handleDynamicStepAddition(chain, TaskChain, completedStep, ChainStep);
Promise < void  > {
// Logic for adding steps dynamically based on results
// This could analyze the output and determine if additional steps are needed
};
initializeDefaultTemplates();
void {
    // Add common chain templates
    const: codeReviewTemplate, ChainTemplate = {
        id: 'code-review-chain',
        name: 'Code Review Chain',
        description: 'Comprehensive code review workflow',
        category: 'quality_assurance',
        steps: [
            {
                agentType: 'code_analyzer',
                taskType: 'analysis',
                instructions: 'Analyze code for quality issues',
                parameters: { depth: 'comprehensive', }
            },
            {
                agentType: 'security_scanner',
                taskType: 'analysis',
                instructions: 'Scan for security vulnerabilities',
                parameters: { scanType: 'security' },
                dependencies: [0]
            },
            {
                agentType: 'test_runner',
                taskType: 'verification',
                instructions: 'Run test suite and verify coverage',
                parameters: { coverage: true },
                dependencies: [0]
            }
        ],
        defaultContext: { priority: 'high' },
        metadata: { estimatedDuration: 30 }
    },
    this: .templates.set(codeReviewTemplate.id, codeReviewTemplate)
};
async;
applyTemplate(chain, TaskChain, templateId, string);
Promise < void  > {
    const: template = this.templates.get(templateId),
    if(, template) {
        throw new Error(Template, not, found, $, { templateId });
    }
    // Apply template context
    ,
    // Apply template context
    Object, : .assign(chain.context.sharedState, template.defaultContext),
    // Add template steps
    for(, [index, stepTemplate], of, template) { }, : .steps.entries()
};
{
    await this.addStep(chain.id, stepTemplate.agentType, stepTemplate.taskType, {
        instructions: stepTemplate.instructions,
        context: {},
        parameters: stepTemplate.parameters
    }, {
        dependencies: stepTemplate.dependencies?.map(depIndex => chain.steps[depIndex]?.id).filter(Boolean),
        conditions: stepTemplate.conditions
    });
}
delay(ms, number);
Promise < void  > {
    return: new Promise(resolve => setTimeout(resolve, ms))
};
/**
 * Public getters and utilities
 */
getChain(chainId, string);
TaskChain | undefined;
{
    return this.chains.get(chainId);
}
getChainExecution(chainId, string);
ChainExecution | undefined;
{
    return this.executions.get(chainId);
}
getAllChains();
TaskChain[];
{
    return Array.from(this.chains.values());
}
getActiveChains();
TaskChain[];
{
    return Array.from(this.chains.values()).filter(c => c.status === 'active');
}
getChainsByStatus(status, TaskChain['status']);
TaskChain[];
{
    return Array.from(this.chains.values()).filter(c => c.status === status);
}
getTemplate(templateId, string);
ChainTemplate | undefined;
{
    return this.templates.get(templateId);
}
getAllTemplates();
ChainTemplate[];
{
    return Array.from(this.templates.values());
}
async;
deleteChain(chainId, string);
Promise < void  > {} `
    const chain = this.chains.get(chainId);`;
if (!chain) {
    throw new Error(Chain, not, found, $, { chainId } ``);
}
// Cancel if running
if (chain.status === 'active') {
    await this.cancelChain(chainId, 'Chain deleted');
}
this.chains.delete(chainId);
this.executions.delete(chainId);
this.emit('chainDeleted', { chainId, chain });
//# sourceMappingURL=TaskChainService.js.map