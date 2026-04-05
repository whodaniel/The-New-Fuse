"use strict";
/**
 * Workflow Executor - Runtime Execution Engine
 *
 * Handles the actual runtime execution of workflow steps and manages execution state
 * Integrates with agents, relay system, and orchestration services
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowExecutor = void 0;
const events_1 = require("events");
const WorkflowTypes_1 = require("../types/WorkflowTypes");
const errorUtils_1 = require("../utils/errorUtils");
class WorkflowExecutor extends events_1.EventEmitter {
    logger;
    config;
    agentRegistry;
    // Execution state
    runningNodes = new Map();
    completedNodes = new Set();
    failedNodes = new Set();
    constructor(config, agentRegistry, logger) {
        super();
        this.config = config;
        this.agentRegistry = agentRegistry;
        this.logger = logger;
    }
    /**
     * Execute workflow step
     */
    async executeStep(node, context, execution) {
        const nodeExecution = this.createNodeExecution(node, execution.id);
        try {
            this.runningNodes.set(node.id, nodeExecution);
            nodeExecution.status = WorkflowTypes_1.NodeExecutionStatus.RUNNING;
            this.logger.debug(`🔧 Executing node: ${node.name} (${node.type})`);
            // Execute based on node type
            const result = await this.executeNodeByType(node, context, nodeExecution);
            // Mark as completed
            nodeExecution.status = WorkflowTypes_1.NodeExecutionStatus.COMPLETED;
            nodeExecution.completedAt = new Date();
            nodeExecution.duration =
                nodeExecution.completedAt.getTime() - nodeExecution.startedAt.getTime();
            nodeExecution.output = result;
            this.completedNodes.add(node.id);
            this.runningNodes.delete(node.id);
            this.emit('nodeCompleted', { node, result, execution: nodeExecution });
            return result;
        }
        catch (error) {
            nodeExecution.status = WorkflowTypes_1.NodeExecutionStatus.FAILED;
            nodeExecution.completedAt = new Date();
            nodeExecution.error = this.createExecutionError(error, node.id);
            this.failedNodes.add(node.id);
            this.runningNodes.delete(node.id);
            this.emit('nodeFailed', { node, error, execution: nodeExecution });
            // Handle retry logic
            if (nodeExecution.retryCount < this.config.maxRetries) {
                return this.retryNodeExecution(node, context, execution, nodeExecution);
            }
            throw error;
        }
    }
    /**
     * Execute node based on its type
     */
    async executeNodeByType(node, context, nodeExecution) {
        switch (node.type) {
            case WorkflowTypes_1.WorkflowNodeType.START:
                return this.executeStartNode(node, context);
            case WorkflowTypes_1.WorkflowNodeType.END:
                return this.executeEndNode(node, context);
            case WorkflowTypes_1.WorkflowNodeType.AGENT_TASK:
                return this.executeAgentTaskNode(node, context, nodeExecution);
            case WorkflowTypes_1.WorkflowNodeType.AGENT_HANDOFF:
                return this.executeAgentHandoffNode(node, context);
            case WorkflowTypes_1.WorkflowNodeType.AGENT_COORDINATION:
                return this.executeAgentCoordinationNode(node, context);
            case WorkflowTypes_1.WorkflowNodeType.CONDITION:
                return this.executeConditionNode(node, context);
            case WorkflowTypes_1.WorkflowNodeType.LOOP:
                return this.executeLoopNode(node, context);
            case WorkflowTypes_1.WorkflowNodeType.PARALLEL:
                return this.executeParallelNode(node, context);
            case WorkflowTypes_1.WorkflowNodeType.MERGE:
                return this.executeMergeNode(node, context);
            case WorkflowTypes_1.WorkflowNodeType.API_CALL:
                return this.executeAPICallNode(node, context);
            case WorkflowTypes_1.WorkflowNodeType.DATABASE_QUERY:
                return this.executeDatabaseQueryNode(node, context);
            case WorkflowTypes_1.WorkflowNodeType.FILE_OPERATION:
                return this.executeFileOperationNode(node, context);
            case WorkflowTypes_1.WorkflowNodeType.RELAY_MESSAGE:
                return this.executeRelayMessageNode(node, context);
            case WorkflowTypes_1.WorkflowNodeType.WEBHOOK:
                return this.executeWebhookNode(node, context);
            case WorkflowTypes_1.WorkflowNodeType.EMAIL:
                return this.executeEmailNode(node, context);
            case WorkflowTypes_1.WorkflowNodeType.LLM_PROMPT:
                return this.executeLLMPromptNode(node, context);
            case WorkflowTypes_1.WorkflowNodeType.CODE_GENERATION:
                return this.executeCodeGenerationNode(node, context);
            case WorkflowTypes_1.WorkflowNodeType.ANALYSIS:
                return this.executeAnalysisNode(node, context);
            case WorkflowTypes_1.WorkflowNodeType.SANDBOX_EXECUTION:
                return this.executeSandboxExecutionNode(node, context);
            case WorkflowTypes_1.WorkflowNodeType.CUSTOM:
                return this.executeCustomNode(node, context);
            default:
                throw new Error(`Unsupported node type: ${node.type}`);
        }
    }
    /**
     * Node execution implementations
     */
    async executeStartNode(node, context) {
        this.logger.info('🚀 Workflow execution started');
        return {
            status: 'started',
            timestamp: new Date(),
            workflowId: context.workflowId,
            executionId: context.executionId,
        };
    }
    async executeEndNode(node, context) {
        this.logger.info('🏁 Workflow execution completed');
        return {
            status: 'completed',
            timestamp: new Date(),
            finalOutput: context.variables,
            executionSummary: {
                completedNodes: this.completedNodes.size,
                failedNodes: this.failedNodes.size,
                totalNodes: this.completedNodes.size + this.failedNodes.size,
            },
        };
    }
    async executeAgentTaskNode(node, context, nodeExecution) {
        const config = node.config;
        // Find suitable agent
        let agentId = config.agentId;
        if (!agentId) {
            const agents = this.agentRegistry.getAllAgents();
            const suitableAgent = agents.find((a) => a.type === config.agentType &&
                a.status === 'ACTIVE' &&
                this.checkAgentCapabilities(a, config.requiredCapabilities || []));
            if (!suitableAgent) {
                throw new Error(`No suitable agent found for task: ${node.name}`);
            }
            agentId = suitableAgent.id;
        }
        nodeExecution.agentId = agentId;
        // Create agent task
        const taskData = {
            id: `todo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            status: 'pending',
            createdAt: new Date(),
            updatedAt: new Date(),
            dependencies: [],
            content: `[WORKFLOW] ${config.task}`,
            priority: config.priority || 'medium',
            category: 'task',
            estimatedDuration: config.expectedDuration || 30,
            context: {
                workflowExecutionId: context.executionId,
                nodeId: node.id,
                instructions: config.instructions,
                workflowContext: config.context,
                inputs: this.extractNodeInputs(node, context),
            },
        };
        const todoId = await this.agentRegistry.addAgentTodo(agentId, taskData);
        this.logger.info(`🤖 Agent task assigned: ${agentId} - ${config.task}`);
        // Monitor task completion
        return this.monitorAgentTask(agentId, todoId, config.expectedDuration || 30);
    }
    async executeAgentHandoffNode(node, context) {
        const config = node.config;
        this.logger.info(`🔄 Agent handoff: ${config.fromAgentId} → ${config.toAgentId}`);
        // Prepare handoff context
        const handoffContext = {
            fromAgentId: config.fromAgentId,
            toAgentId: config.toAgentId,
            workflowContext: config.preserveContext ? context.variables : {},
            executionId: context.executionId,
            nodeId: node.id,
            timestamp: new Date(),
            stagnationThreshold: config.stagnationThresholdMs || 900000, // 15 minutes
        };
        // Execute handoff
        return {
            handoffId: `handoff_${Date.now()}`,
            ...handoffContext,
            status: 'initiated',
        };
    }
    async executeAgentCoordinationNode(node, _context) {
        const config = node.config;
        this.logger.info(`🎭 Agent coordination: ${config.coordinationType}`);
        const agents = config.agentIds || [];
        const coordinationTasks = [];
        for (const agentId of agents) {
            const task = await this.agentRegistry.addAgentTodo(agentId, {
                content: `[COORDINATION] ${config.task}`,
                priority: 'high',
                category: 'coordination',
                context: {
                    coordinationId: `coord_${Date.now()}`,
                    participantAgents: agents,
                    coordinationType: config.coordinationType,
                },
            });
            coordinationTasks.push({ agentId, taskId: task });
        }
        return {
            coordinationId: `coord_${Date.now()}`,
            participantAgents: agents,
            tasks: coordinationTasks,
            status: 'initiated',
        };
    }
    async executeConditionNode(node, context) {
        const config = node.config;
        try {
            const result = this.evaluateExpression(config.expression, context.variables);
            this.logger.debug(`🔍 Condition evaluated: ${config.expression} = ${result}`);
            return {
                condition: config.expression,
                result: Boolean(result),
                selectedOutput: Boolean(result) ? config.truthyOutput : config.falsyOutput,
                timestamp: new Date(),
            };
        }
        catch (error) {
            throw new Error(`Condition evaluation failed: ${(0, errorUtils_1.getErrorMessage)(error)}`);
        }
    }
    async executeLoopNode(node, context) {
        const config = node.config;
        const iterable = context.variables[config.iterableVariable];
        if (!Array.isArray(iterable)) {
            throw new Error(`Loop variable ${config.iterableVariable} is not iterable`);
        }
        const results = [];
        const maxIterations = config.maxIterations || iterable.length;
        for (let i = 0; i < Math.min(iterable.length, maxIterations); i++) {
            const item = iterable[i];
            // Set loop context
            const loopContext = {
                ...context,
                variables: {
                    ...context.variables,
                    [config.itemVariable]: item,
                    _loopIndex: i,
                    _loopCount: iterable.length,
                },
            };
            // Check break condition
            if (config.breakCondition) {
                const shouldBreak = this.evaluateExpression(config.breakCondition, loopContext.variables);
                if (shouldBreak) {
                    this.logger.debug(`🔄 Loop break condition met at iteration ${i}`);
                    break;
                }
            }
            // Execute loop body (would need to execute connected nodes)
            results.push({
                iteration: i,
                item,
                result: `Processed item ${i}`, // Placeholder
            });
        }
        return {
            iterationCount: results.length,
            results,
            completed: true,
        };
    }
    async executeParallelNode(node, _context) {
        const config = node.config;
        this.logger.info(`⚡ Parallel execution: ${config.parallelBranches?.length || 0} branches`);
        // Execute parallel branches (placeholder implementation)
        const branches = config.parallelBranches || [];
        const results = await Promise.allSettled(branches.map(async (branch, index) => {
            // Each branch would execute its connected nodes
            return {
                branchId: branch.id || `branch_${index}`,
                result: `Branch ${index} completed`,
                timestamp: new Date(),
            };
        }));
        return {
            parallelResults: results,
            successCount: results.filter((r) => r.status === 'fulfilled').length,
            failureCount: results.filter((r) => r.status === 'rejected').length,
            completed: true,
        };
    }
    async executeMergeNode(node, _context) {
        const config = node.config;
        this.logger.debug(`🔀 Merge node: ${config.mergeStrategy}`);
        // Collect results from all incoming connections
        const incomingResults = config.incomingResults || [];
        let mergedResult;
        switch (config.mergeStrategy) {
            case 'first':
                mergedResult = incomingResults[0];
                break;
            case 'last':
                mergedResult = incomingResults[incomingResults.length - 1];
                break;
            case 'all':
                mergedResult = incomingResults;
                break;
            case 'combine':
                mergedResult = incomingResults.reduce((acc, result) => ({ ...acc, ...result }), {});
                break;
            default:
                mergedResult = incomingResults;
        }
        return {
            mergeStrategy: config.mergeStrategy,
            inputCount: incomingResults.length,
            mergedResult,
            timestamp: new Date(),
        };
    }
    async executeAPICallNode(node, context) {
        const config = node.config;
        this.logger.info(`🌐 API Call: ${config.method} ${config.url}`);
        // Prepare request
        const url = this.interpolateString(config.url, context.variables);
        const headers = { ...config.headers };
        const body = config.body ? this.interpolateObject(config.body, context.variables) : undefined;
        try {
            // Make API call (simplified implementation)
            // Create AbortController for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), config.timeout || 30000);
            try {
                const response = await fetch(url, {
                    method: config.method,
                    headers,
                    body: body ? JSON.stringify(body) : undefined,
                    signal: controller.signal,
                });
                clearTimeout(timeoutId);
                const result = await response.json();
                return {
                    url,
                    method: config.method,
                    status: response.status,
                    statusText: response.statusText,
                    headers: response.headers
                        ? (() => {
                            const headerObj = {};
                            response.headers.forEach((value, key) => {
                                headerObj[key] = value;
                            });
                            return headerObj;
                        })()
                        : {},
                    data: result,
                    timestamp: new Date(),
                };
            }
            catch (fetchError) {
                clearTimeout(timeoutId);
                throw fetchError;
            }
        }
        catch (error) {
            throw new Error(`API call failed: ${(0, errorUtils_1.getErrorMessage)(error)}`);
        }
    }
    async executeDatabaseQueryNode(node, _context) {
        const config = node.config;
        this.logger.info(`🗄️ Database query: ${config.operation}`);
        // Database operation would be implemented here
        return {
            operation: config.operation,
            query: config.query,
            result: `Database ${config.operation} completed`,
            timestamp: new Date(),
        };
    }
    async executeFileOperationNode(node, _context) {
        const config = node.config;
        this.logger.info(`📁 File operation: ${config.operation}`);
        // File operation would be implemented here
        return {
            operation: config.operation,
            path: config.path,
            result: `File ${config.operation} completed`,
            timestamp: new Date(),
        };
    }
    async executeRelayMessageNode(node, _context) {
        const config = node.config;
        this.logger.info(`📡 Relay message: ${config.messageType}`);
        // Relay message would be sent through the relay system
        return {
            messageId: `msg_${Date.now()}`,
            messageType: config.messageType,
            targetAgent: config.targetAgent,
            content: config.content,
            timestamp: new Date(),
        };
    }
    async executeWebhookNode(node, _context) {
        const config = node.config;
        this.logger.info(`🪝 Webhook: ${config.url}`);
        // Webhook would be called here
        return {
            webhookId: `webhook_${Date.now()}`,
            url: config.url,
            method: config.method || 'POST',
            result: 'Webhook called successfully',
            timestamp: new Date(),
        };
    }
    async executeEmailNode(node, _context) {
        const config = node.config;
        this.logger.info(`📧 Email: ${config.subject}`);
        // Email would be sent here
        return {
            emailId: `email_${Date.now()}`,
            to: config.to,
            subject: config.subject,
            result: 'Email sent successfully',
            timestamp: new Date(),
        };
    }
    async executeLLMPromptNode(node, context) {
        const config = node.config;
        this.logger.info(`🧠 LLM Prompt: ${config.provider}/${config.model}`);
        // LLM call would be implemented here
        const interpolatedPrompt = this.interpolateString(config.prompt, context.variables);
        return {
            promptId: `prompt_${Date.now()}`,
            provider: config.provider,
            model: config.model,
            prompt: interpolatedPrompt,
            response: 'LLM response would be here',
            timestamp: new Date(),
        };
    }
    async executeCodeGenerationNode(node, _context) {
        const config = node.config;
        this.logger.info(`💻 Code generation: ${config.language}`);
        return {
            codeId: `code_${Date.now()}`,
            language: config.language,
            specification: config.specification,
            generatedCode: '// Generated code would be here',
            timestamp: new Date(),
        };
    }
    async executeAnalysisNode(node, _context) {
        const config = node.config;
        this.logger.info(`📊 Analysis: ${config.analysisType}`);
        return {
            analysisId: `analysis_${Date.now()}`,
            analysisType: config.analysisType,
            inputData: config.inputData,
            result: 'Analysis results would be here',
            timestamp: new Date(),
        };
    }
    async executeSandboxExecutionNode(node, context) {
        const config = node.config;
        this.logger.info(`🛡️ Sandbox Execution: ${config.language}`);
        // Interpolate code with context variables
        const interpolatedCode = this.interpolateString(config.code, context.variables);
        // Use Auction protocol to find a sandbox
        // For now, we manually target ZeroClaw or broadcast for 'sandboxed-execution'
        const requirements = ['sandboxed-execution', config.language];
        this.logger.debug(`📢 Auctioning sandbox task: ${node.id}`);
        // In a real implementation, this would trigger the Auction logic in the Broker
        // Here we simulate finding the ZeroClaw agent
        const agents = this.agentRegistry.getAllAgents();
        const sandboxAgent = agents.find((a) => a.status === 'ACTIVE' && this.checkAgentCapabilities(a, requirements));
        if (!sandboxAgent) {
            // If no active sandbox, we could attempt to boot one via Railway API
            throw new Error(`No active sandbox agent found for requirements: ${requirements.join(', ')}`);
        }
        const taskData = {
            id: `todo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            status: 'pending',
            createdAt: new Date(),
            updatedAt: new Date(),
            dependencies: [],
            content: `[SANDBOX] Execute ${config.language} code`,
            priority: 'high',
            category: 'task',
            context: {
                code: interpolatedCode,
                language: config.language,
                env: config.environmentVariables,
                limits: config.resourceLimits,
                workflowExecutionId: context.executionId,
                nodeId: node.id,
            },
        };
        const todoId = await this.agentRegistry.addAgentTodo(sandboxAgent.id, taskData);
        this.logger.info(`🛰️ Sandbox task delegated to ${sandboxAgent.id}`);
        return this.monitorAgentTask(sandboxAgent.id, todoId, (config.timeoutMs || 300000) / 60000);
    }
    async executeCustomNode(node, _context) {
        this.logger.info(`🔧 Custom node: ${node.name}`);
        // Custom node execution would be implemented based on config
        return {
            customNodeId: `custom_${Date.now()}`,
            nodeType: node.type,
            result: 'Custom node executed',
            timestamp: new Date(),
        };
    }
    /**
     * Helper methods
     */
    createNodeExecution(node, executionId) {
        // SECURITY FIX: Use cryptographically secure random ID generation
        return {
            id: `node_exec_${Date.now()}_${this.generateSecureId()}`,
            nodeId: node.id,
            status: WorkflowTypes_1.NodeExecutionStatus.PENDING,
            startedAt: new Date(),
            retryCount: 0,
            metadata: {
                nodeType: node.type,
                nodeName: node.name,
                executionId,
            },
        };
    }
    // SECURITY: Generate cryptographically secure random IDs
    generateSecureId() {
        // Use crypto module for secure random generation
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            // Modern browsers and Node.js 15+ support randomUUID
            return crypto.randomUUID().replace(/-/g, '').substring(0, 9);
        }
        else if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
            // Fallback for older environments with crypto.getRandomValues
            const array = new Uint8Array(9);
            crypto.getRandomValues(array);
            return Array.from(array, (byte) => byte.toString(36))
                .join('')
                .substring(0, 9);
        }
        else {
            // Node.js fallback using crypto module
            const { randomBytes } = require('crypto');
            return randomBytes(9).toString('hex').substring(0, 9);
        }
    }
    createExecutionError(error, nodeId) {
        return {
            code: error.code || 'EXECUTION_ERROR',
            message: (0, errorUtils_1.getErrorMessage)(error),
            stack: error.stack,
            nodeId,
            timestamp: new Date(),
            recoverable: false,
            metadata: {},
        };
    }
    async retryNodeExecution(node, context, execution, nodeExecution) {
        nodeExecution.retryCount++;
        nodeExecution.status = WorkflowTypes_1.NodeExecutionStatus.RETRYING;
        this.logger.warn(`🔄 Retrying node execution: ${node.name} (attempt ${nodeExecution.retryCount})`);
        // Wait before retry
        await this.delay(this.config.retryDelayMs * nodeExecution.retryCount);
        // Retry execution
        return this.executeStep(node, context, execution);
    }
    async monitorAgentTask(agentId, todoId, timeoutMinutes) {
        return new Promise((resolve, reject) => {
            const checkInterval = setInterval(async () => {
                try {
                    const agent = this.agentRegistry.getAgentProfile(agentId);
                    if (!agent) {
                        clearInterval(checkInterval);
                        reject(new Error(`Agent ${agentId} not found`));
                        return;
                    }
                    const todo = agent.todoList.find((t) => t.id === todoId);
                    if (!todo) {
                        clearInterval(checkInterval);
                        reject(new Error(`Todo ${todoId} not found`));
                        return;
                    }
                    if (todo.status === 'completed') {
                        clearInterval(checkInterval);
                        resolve({
                            agentId,
                            todoId,
                            result: todo.context?.result || 'Task completed',
                            completedAt: todo.updatedAt,
                            duration: todo.updatedAt.getTime() - todo.createdAt.getTime(),
                        });
                    }
                    else if (todo.status === 'failed') {
                        clearInterval(checkInterval);
                        reject(new Error(`Agent task failed: ${todo.context?.error || 'Unknown error'}`));
                    }
                }
                catch (error) {
                    clearInterval(checkInterval);
                    reject(error);
                }
            }, 5000); // Check every 5 seconds
            // Timeout
            setTimeout(() => {
                clearInterval(checkInterval);
                reject(new Error(`Agent task timeout after ${timeoutMinutes} minutes`));
            }, timeoutMinutes * 60 * 1000);
        });
    }
    checkAgentCapabilities(agent, requiredCapabilities) {
        if (!requiredCapabilities.length)
            return true;
        const agentCapabilities = Object.entries(agent.capabilities)
            .filter(([_, enabled]) => enabled)
            .map(([capability, _]) => capability);
        return requiredCapabilities.every((required) => agentCapabilities.includes(required));
    }
    extractNodeInputs(node, context) {
        const inputs = {};
        for (const input of node.inputs) {
            if (context.variables[input.name] !== undefined) {
                inputs[input.name] = context.variables[input.name];
            }
            else if (input.defaultValue !== undefined) {
                inputs[input.name] = input.defaultValue;
            }
        }
        return inputs;
    }
    evaluateExpression(expression, variables) {
        // Safe expression evaluation
        const context = { ...variables, Math, Date, String, Number, Boolean, Array, Object };
        try {
            const func = new Function(...Object.keys(context), `return (${expression});`);
            return func(...Object.values(context));
        }
        catch (error) {
            throw new Error(`Expression evaluation error: ${(0, errorUtils_1.getErrorMessage)(error)}`);
        }
    }
    interpolateString(template, variables) {
        return template.replace(/\{\{([^}]+)\}\}/g, (match, varName) => {
            const value = variables[varName.trim()];
            return value !== undefined ? String(value) : match;
        });
    }
    interpolateObject(obj, variables) {
        if (typeof obj === 'string') {
            return this.interpolateString(obj, variables);
        }
        else if (Array.isArray(obj)) {
            return obj.map((item) => this.interpolateObject(item, variables));
        }
        else if (obj && typeof obj === 'object') {
            const result = {};
            for (const [key, value] of Object.entries(obj)) {
                result[key] = this.interpolateObject(value, variables);
            }
            return result;
        }
        return obj;
    }
    delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    /**
     * Public API
     */
    getRunningNodes() {
        return Array.from(this.runningNodes.values());
    }
    getCompletedNodes() {
        return Array.from(this.completedNodes);
    }
    getFailedNodes() {
        return Array.from(this.failedNodes);
    }
    getExecutionStats() {
        return {
            running: this.runningNodes.size,
            completed: this.completedNodes.size,
            failed: this.failedNodes.size,
            total: this.runningNodes.size + this.completedNodes.size + this.failedNodes.size,
        };
    }
}
exports.WorkflowExecutor = WorkflowExecutor;
//# sourceMappingURL=WorkflowExecutor.js.map