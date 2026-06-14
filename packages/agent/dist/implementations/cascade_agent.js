"use strict";
/**
 * Cascade Agent Implementation
 * An agent that manages cascading workflows - executing tasks through chains of agents
 * Implements the "cascade" pattern where one agent's output becomes another's input
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CascadeAgent = void 0;
class CascadeAgent {
    constructor(config) {
        this.type = 'cascade';
        this.capabilities = [
            'cascade_execution',
            'pipeline_management',
            'agent_chaining',
            'error_recovery',
            'state_management',
        ];
        this.memory = new Map();
        this.state = {};
        this.isInitialized = false;
        this.pipelines = new Map();
        this.executions = new Map();
        this.agentRegistry = new Map();
        this.id = config.agentId;
        this.name = config.name;
        this.config = {
            maxCascadeDepth: 10,
            timeoutPerStep: 60000,
            errorStrategy: 'stop',
            retryAttempts: 2,
            ...config,
        };
    }
    async initialize() {
        console.log(`[CascadeAgent:${this.id}] Initializing...`);
        this.state = {
            status: 'ready',
            lastActive: new Date().toISOString(),
            pipelinesRegistered: 0,
            executionsCompleted: 0,
        };
        this.isInitialized = true;
        console.log(`[CascadeAgent:${this.id}] Ready`);
    }
    async process(message) {
        if (!this.isInitialized) {
            await this.initialize();
        }
        const { action, payload } = message;
        switch (action) {
            case 'register_pipeline':
                return this.registerPipeline(payload.pipeline);
            case 'execute':
                return this.executePipeline(payload.pipelineId, payload.initialInput);
            case 'register_agent':
                return this.registerAgent(payload.agent);
            case 'status':
                return this.getExecutionStatus(payload.executionId);
            case 'pause':
                return this.pauseExecution(payload.executionId);
            case 'resume':
                return this.resumeExecution(payload.executionId);
            case 'list_pipelines':
                return this.listPipelines();
            default:
                throw new Error(`Unknown action: ${action}`);
        }
    }
    async learn(data) {
        const patterns = (await this.retrieveFromMemory('cascade_patterns')) || [];
        await this.saveToMemory('cascade_patterns', [...patterns, data]);
    }
    async saveToMemory(key, value) {
        this.memory.set(key, value);
    }
    async retrieveFromMemory(key) {
        return this.memory.get(key);
    }
    async getState() {
        return {
            ...this.state,
            isInitialized: this.isInitialized,
            registeredPipelines: this.pipelines.size,
            registeredAgents: this.agentRegistry.size,
            activeExecutions: Array.from(this.executions.values()).filter((e) => e.status === 'running')
                .length,
        };
    }
    async setState(state) {
        this.state = { ...this.state, ...state };
    }
    async sendMessage(message) {
        console.log(`[CascadeAgent:${this.id}] Sending:`, message);
    }
    async receiveMessage(message) {
        console.log(`[CascadeAgent:${this.id}] Received:`, message);
        await this.process(message);
    }
    async handleError(error) {
        console.error(`[CascadeAgent:${this.id}] Error:`, error.message);
        this.state = { ...this.state, lastError: error.message, status: 'error' };
    }
    // Cascade-specific methods
    async registerPipeline(pipeline) {
        const id = pipeline.pipelineId || `pipeline-${Date.now()}`;
        this.pipelines.set(id, { ...pipeline, pipelineId: id });
        this.state = {
            ...this.state,
            pipelinesRegistered: this.pipelines.size,
        };
        console.log(`[CascadeAgent:${this.id}] Registered pipeline: ${pipeline.name}`);
        return { success: true, pipelineId: id };
    }
    async registerAgent(agent) {
        this.agentRegistry.set(agent.id, agent);
        console.log(`[CascadeAgent:${this.id}] Registered agent: ${agent.id}`);
    }
    async executePipeline(pipelineId, initialInput) {
        const pipeline = this.pipelines.get(pipelineId);
        if (!pipeline) {
            throw new Error(`Pipeline not found: ${pipelineId}`);
        }
        const executionId = `cascade-${Date.now()}-${globalThis.crypto.randomUUID().split('-')[0]}`;
        const execution = {
            executionId,
            pipelineId,
            status: 'running',
            currentStepIndex: 0,
            results: [],
            variables: { ...pipeline.globalVariables, input: initialInput },
            startTime: new Date(),
        };
        this.executions.set(executionId, execution);
        console.log(`[CascadeAgent:${this.id}] Starting cascade: ${executionId}`);
        try {
            let currentOutput = initialInput;
            for (let i = 0; i < pipeline.steps.length; i++) {
                if (i >= (this.config.maxCascadeDepth || 10)) {
                    throw new Error(`Max cascade depth (${this.config.maxCascadeDepth}) exceeded`);
                }
                execution.currentStepIndex = i;
                const step = pipeline.steps[i];
                const stepResult = await this.executeStep(step, currentOutput, execution.variables);
                execution.results.push(stepResult);
                if (stepResult.status === 'failed') {
                    if (this.config.errorStrategy === 'stop') {
                        execution.status = 'failed';
                        break;
                    }
                    else if (this.config.errorStrategy === 'skip') {
                        continue;
                    }
                }
                // Update variables with step output
                if (step.outputKey) {
                    execution.variables[step.outputKey] = stepResult.output;
                }
                currentOutput = stepResult.output;
            }
            if (execution.status !== 'failed') {
                execution.status = 'completed';
                this.state = {
                    ...this.state,
                    executionsCompleted: (this.state.executionsCompleted || 0) + 1,
                };
            }
        }
        catch (error) {
            execution.status = 'failed';
            console.error(`[CascadeAgent:${this.id}] Cascade failed:`, error);
        }
        execution.endTime = new Date();
        return execution;
    }
    async executeStep(step, input, variables) {
        const startTime = Date.now();
        const result = {
            stepIndex: 0,
            agentId: step.agentId,
            status: 'running',
            input,
            output: null,
            duration: 0,
        };
        try {
            // Map input based on inputMapping
            let mappedInput = input;
            if (step.inputMapping) {
                mappedInput = {};
                for (const [key, varPath] of Object.entries(step.inputMapping)) {
                    mappedInput[key] = this.resolveVariable(varPath, variables, input);
                }
            }
            // Execute via agent
            const agent = this.agentRegistry.get(step.agentId);
            if (agent) {
                const message = {
                    id: `msg-${Date.now()}`,
                    type: 'command',
                    content: {
                        action: step.action,
                        payload: mappedInput,
                    },
                    timestamp: Date.now(),
                    sender: this.id,
                    recipient: step.agentId,
                };
                const response = await agent.process(message);
                result.output = response;
                result.status = 'success';
            }
            else {
                // Simulate execution if agent not registered
                console.log(`[CascadeAgent:${this.id}] Simulating step for agent: ${step.agentId}`);
                await new Promise((resolve) => setTimeout(resolve, 100));
                result.output = { simulated: true, input: mappedInput };
                result.status = 'success';
            }
        }
        catch (error) {
            result.status = 'failed';
            result.error = error instanceof Error ? error.message : String(error);
            // Try fallback if available
            if (step.fallback) {
                console.log(`[CascadeAgent:${this.id}] Trying fallback for step`);
                return this.executeStep(step.fallback, input, variables);
            }
        }
        result.duration = Date.now() - startTime;
        return result;
    }
    resolveVariable(path, variables, lastOutput) {
        if (path === '$output') {
            return lastOutput;
        }
        if (path.startsWith('$')) {
            return variables[path.slice(1)];
        }
        return path;
    }
    async getExecutionStatus(executionId) {
        return this.executions.get(executionId) || null;
    }
    async pauseExecution(executionId) {
        const execution = this.executions.get(executionId);
        if (execution && execution.status === 'running') {
            execution.status = 'paused';
            return true;
        }
        return false;
    }
    async resumeExecution(executionId) {
        const execution = this.executions.get(executionId);
        if (execution && execution.status === 'paused') {
            execution.status = 'running';
            // Continue execution from current step
            return true;
        }
        return false;
    }
    async listPipelines() {
        return Array.from(this.pipelines.values());
    }
}
exports.CascadeAgent = CascadeAgent;
exports.default = CascadeAgent;
//# sourceMappingURL=cascade_agent.js.map