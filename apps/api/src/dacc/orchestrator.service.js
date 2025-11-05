var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var DACCOrchestratorService_1;
var _a, _b, _c, _d;
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../modules/prisma/prisma.service';
import { AgentFactory } from '../agents/agent.factory';
import { DACCStreamingService } from './streaming.service';
import { DACCDataResolverService } from './data-resolver.service';
import { DACCStatus, validateWorkflowDefinition, validateWorkflowReferences } from '@the-new-fuse/types';
let DACCOrchestratorService = DACCOrchestratorService_1 = class DACCOrchestratorService {
    configService;
    prismaService;
    agentFactory;
    streamingService;
    dataResolverService;
    logger = new Logger(DACCOrchestratorService_1.name);
    activeExecutions = new Map();
    orchestratorConfig;
    constructor(configService, prismaService, agentFactory, streamingService, dataResolverService) {
        this.configService = configService;
        this.prismaService = prismaService;
        this.agentFactory = agentFactory;
        this.streamingService = streamingService;
        this.dataResolverService = dataResolverService;
        this.orchestratorConfig = {
            max_concurrent_workflows: this.configService.get('DACC_MAX_CONCURRENT_WORKFLOWS', 10),
            step_timeout_ms: this.configService.get('DACC_STEP_TIMEOUT_MS', 60000),
            enable_state_persistence: this.configService.get('DACC_ENABLE_STATE_PERSISTENCE', true),
            stream_events: this.configService.get('DACC_STREAM_EVENTS', true),
            redis_channel_prefix: this.configService.get('DACC_REDIS_CHANNEL_PREFIX', 'dacc:')
        };
    }
    /**
     * Start workflow execution
     */
    async executeWorkflow(workflowDefinition, input = {}, sessionId) {
        // Validate workflow definition
        const validation = validateWorkflowDefinition(workflowDefinition);
        if (!validation.isValid) {
            throw new Error(`Invalid workflow definition: ${validation.errors.join(', ')}`);
        }
        const referenceValidation = validateWorkflowReferences(workflowDefinition);
        if (!referenceValidation.isValid) {
            throw new Error(`Workflow reference errors: ${referenceValidation.errors.join(', ')}`);
        }
        // Check concurrent workflow limit
        if (this.activeExecutions.size >= this.orchestratorConfig.max_concurrent_workflows) {
            throw new Error('Maximum concurrent workflows limit reached');
        }
        const executionId = this.generateExecutionId();
        const executionState = {
            workflow_id: executionId,
            current_step: workflowDefinition.start_step,
            step_data: { input },
            global_context: { input, session_id: sessionId },
            status: DACCStatus.RUNNING,
            started_at: new Date().toISOString()
        };
        this.activeExecutions.set(executionId, executionState);
        this.logger.log(`Starting workflow execution: ${executionId} for workflow: ${workflowDefinition.workflow_name}`);
        // Create workflow execution record in database
        if (this.orchestratorConfig.enable_state_persistence) {
            await this.createWorkflowExecutionRecord(workflowDefinition, executionState, input);
        }
        // Stream initial event
        await this.streamingService.publishWorkflowUpdate(executionId, workflowDefinition.start_step, { status: DACCStatus.RUNNING, step: workflowDefinition.start_step });
        // Execute workflow asynchronously
        this.executeWorkflowSteps(workflowDefinition, executionId).catch(error => {
            this.logger.error(`Workflow execution failed: ${executionId}`, error);
            this.handleWorkflowError(executionId, error);
        });
        return executionId;
    }
    /**
     * Execute workflow steps
     */
    async executeWorkflowSteps(workflowDefinition, executionId) {
        const executionState = this.activeExecutions.get(executionId);
        if (!executionState) {
            throw new Error(`Execution state not found: ${executionId}`);
        }
        let currentStepName = executionState.current_step;
        const stepMap = new Map(workflowDefinition.steps.map(step => [step.step_name, step]));
        while (currentStepName && executionState.status === DACCStatus.RUNNING) {
            const step = stepMap.get(currentStepName);
            if (!step) {
                throw new Error(`Step not found: ${currentStepName}`);
            }
            this.logger.debug(`Executing step: ${currentStepName} in workflow: ${executionId}`);
            try {
                // Execute the step
                const stepResult = await this.executeStep(step, executionState, workflowDefinition);
                // Update execution state
                executionState.step_data[currentStepName] = stepResult;
                executionState.current_step = currentStepName;
                // Persist state if enabled
                if (this.orchestratorConfig.enable_state_persistence) {
                    await this.persistExecutionState(executionId, executionState);
                }
                // Stream step completion event
                await this.streamingService.publishWorkflowUpdate(executionId, currentStepName, { step_completed: currentStepName, result: stepResult });
                // Determine next step
                currentStepName = await this.determineNextStep(step, stepResult, executionState);
            }
            catch (error) {
                this.logger.error(`Step execution failed: ${currentStepName}`, error);
                executionState.status = DACCStatus.FAILED;
                executionState.error = error.message;
                break;
            }
        }
        // Complete workflow execution
        await this.completeWorkflowExecution(executionId, executionState);
    }
    /**
     * Execute individual workflow step
     */
    async executeStep(step, executionState, workflowDefinition) {
        // Get or create agent instance
        const agent = await this.getOrCreateAgent(step.agent_name);
        // Prepare step input
        const stepInput = this.prepareStepInput(step, executionState);
        // Stream thought event
        await this.streamingService.publishThought(executionState.workflow_id, step.step_name, `Executing step: ${step.step_name} with agent: ${step.agent_name}`);
        // POML Integration: Process POML templates if agent supports them
        let pomExecutionContext;
        if (agent.daccDefinition.poml_template && agent.daccDefinition.enable_poml_rendering) {
            this.logger.debug(`Processing POML template for agent: ${agent.daccDefinition.agent_name}`);
            try {
                // Resolve POML data components
                const resolvedTemplate = await this.dataResolverService.resolvePOMLTemplate(agent.daccDefinition.poml_template);
                // Create POML execution context
                pomExecutionContext = {
                    template_data: stepInput,
                    resolved_components: resolvedTemplate.hint_metadata?.data_resolutions || {},
                    validation_hints: agent.daccDefinition.hint_validation_enabled ?
                        this.extractValidationHints(agent.daccDefinition) : [],
                    rendering_metadata: {
                        template_name: resolvedTemplate.template_name,
                        resolved_at: new Date().toISOString(),
                        step_name: step.step_name,
                        workflow_id: executionState.workflow_id
                    }
                };
                // Stream POML processing event
                await this.streamingService.publishWorkflowUpdate(executionState.workflow_id, step.step_name, {
                    poml_template_processed: resolvedTemplate.template_name,
                    data_components_resolved: Object.keys(pomExecutionContext.resolved_components).length
                });
            }
            catch (error) {
                this.logger.error(`POML template processing failed for ${step.step_name}: ${error.message}`);
                // Continue with execution without POML context (fallback to legacy mode)
            }
        }
        // Execute agent with POML context if available
        const startTime = Date.now();
        const result = await Promise.race([
            agent.execute(stepInput, pomExecutionContext),
            this.createTimeoutPromise(this.orchestratorConfig.step_timeout_ms)
        ]);
        const executionTime = Date.now() - startTime;
        // Process tool calls if any
        const toolResults = [];
        if (result.tool_calls) {
            for (const toolCall of result.tool_calls) {
                const toolResult = await this.executeToolCall(toolCall, executionState.workflow_id, step.step_name);
                toolResults.push(toolResult);
            }
        }
        return {
            agent_name: step.agent_name,
            step_name: step.step_name,
            success: result.success,
            output: result.output,
            parsed_output: result.output,
            tool_calls: result.tool_calls || [],
            tool_results: toolResults,
            error: result.error,
            execution_time_ms: executionTime
        };
    }
    /**
     * Execute tool call
     */
    async executeToolCall(toolCall, executionId, stepName) {
        const startTime = Date.now();
        await this.streamingService.publishToolCall(executionId, stepName, toolCall.tool_name, toolCall);
        try {
            // This would be routed to appropriate tool execution controllers
            const result = await this.routeToolCall(toolCall);
            const executionTime = Date.now() - startTime;
            await this.streamingService.publishToolOutput(executionId, stepName, toolCall.tool_name, result);
            return {
                tool_name: toolCall.tool_name,
                success: true,
                output: result,
                execution_time_ms: executionTime
            };
        }
        catch (error) {
            const executionTime = Date.now() - startTime;
            await this.streamingService.publishToolOutput(executionId, stepName, toolCall.tool_name, { error: error.message });
            return {
                tool_name: toolCall.tool_name,
                success: false,
                error: error.message,
                execution_time_ms: executionTime
            };
        }
    }
    /**
     * Route tool call to appropriate executor
     */
    async routeToolCall(toolCall) {
        // This would route to specialized tool execution controllers
        // For now, return a mock result
        return {
            tool_type: toolCall.tool_name,
            result: `Mock result for tool: ${toolCall.tool_name}`,
            executed_at: new Date().toISOString()
        };
    }
    /**
     * Get or create agent instance
     */
    async getOrCreateAgent(agentName) {
        // Try to get existing agent
        let agent = this.agentFactory.getDACCAgent(agentName);
        if (!agent) {
            // Load agent definition from database
            const agentDefinition = await this.loadAgentDefinition(agentName);
            if (!agentDefinition) {
                throw new Error(`Agent definition not found: ${agentName}`);
            }
            agent = await this.agentFactory.createDACCAgent(agentDefinition);
        }
        return agent;
    }
    /**
     * Load agent definition from database
     */
    async loadAgentDefinition(agentName) {
        const entity = await this.prismaService.registeredEntity.findFirst({
            where: {
                name: agentName,
                type: 'AGENT',
                status: 'ACTIVE'
            }
        });
        return entity?.config || null;
    }
    /**
     * Prepare step input based on input mapping
     */
    prepareStepInput(step, executionState) {
        if (!step.input_mapping) {
            return executionState.step_data.input || executionState.global_context.input;
        }
        const input = {};
        for (const [key, sourcePath] of Object.entries(step.input_mapping)) {
            // Simple dot notation resolution
            input[key] = this.resolveValue(sourcePath, executionState);
        }
        return input;
    }
    /**
     * Resolve value from execution state using dot notation
     */
    resolveValue(path, executionState) {
        const parts = path.split('.');
        let value = executionState;
        for (const part of parts) {
            if (value && typeof value === 'object') {
                value = value[part];
            }
            else {
                return undefined;
            }
        }
        return value;
    }
    /**
     * Determine next step based on conditions
     */
    async determineNextStep(currentStep, stepResult, executionState) {
        // Check conditional next steps first
        if (currentStep.next_steps && currentStep.next_steps.length > 0) {
            for (const conditionalStep of currentStep.next_steps) {
                if (await this.evaluateCondition(conditionalStep.condition, stepResult, executionState)) {
                    return conditionalStep.next_step_name;
                }
            }
        }
        // Fall back to default next step
        return currentStep.default_next_step || null;
    }
    /**
     * Evaluate step condition
     */
    async evaluateCondition(condition, stepResult, executionState) {
        // This would implement a condition evaluation engine
        // For now, return a simple check
        if (condition === 'success') {
            return stepResult.success;
        }
        if (condition === 'failure') {
            return !stepResult.success;
        }
        // Default to false for unknown conditions
        return false;
    }
    /**
     * Create workflow execution record in database
     */
    async createWorkflowExecutionRecord(workflowDefinition, executionState, input) {
        try {
            // First ensure workflow exists or create it
            let workflow = await this.prismaService.workflow.findFirst({
                where: { name: workflowDefinition.workflow_name }
            });
            if (!workflow) {
                workflow = await this.prismaService.workflow.create({
                    data: {
                        name: workflowDefinition.workflow_name,
                        description: workflowDefinition.description,
                        definition: workflowDefinition,
                        status: 'ACTIVE'
                    }
                });
            }
            // Create execution record
            await this.prismaService.workflowExecution.create({
                data: {
                    id: executionState.workflow_id,
                    workflowId: workflow.id,
                    status: 'RUNNING',
                    input: input,
                    state: executionState,
                    startedAt: new Date(executionState.started_at)
                }
            });
        }
        catch (error) {
            this.logger.warn(`Failed to create workflow execution record: ${error.message}`);
        }
    }
    /**
     * Persist execution state to database
     */
    async persistExecutionState(executionId, executionState) {
        try {
            await this.prismaService.workflowExecution.update({
                where: { id: executionId },
                data: {
                    state: executionState,
                    status: executionState.status === DACCStatus.COMPLETED ? 'COMPLETED' :
                        executionState.status === DACCStatus.FAILED ? 'FAILED' : 'RUNNING'
                }
            });
        }
        catch (error) {
            this.logger.warn(`Failed to persist execution state: ${error.message}`);
        }
    }
    /**
     * Complete workflow execution
     */
    async completeWorkflowExecution(executionId, executionState) {
        if (executionState.status === DACCStatus.RUNNING) {
            executionState.status = DACCStatus.COMPLETED;
        }
        executionState.completed_at = new Date().toISOString();
        // Stream final event
        await this.streamingService.publishFinalOutput(executionId, 'workflow_completion', {
            status: executionState.status,
            output: executionState.step_data,
            execution_time: Date.now() - new Date(executionState.started_at).getTime()
        });
        // Persist final state
        if (this.orchestratorConfig.enable_state_persistence) {
            await this.persistExecutionState(executionId, executionState);
            // Update completion timestamp
            await this.prismaService.workflowExecution.update({
                where: { id: executionId },
                data: {
                    completedAt: new Date(),
                    output: executionState.step_data
                }
            });
        }
        // Clean up active execution
        this.activeExecutions.delete(executionId);
        this.logger.log(`Workflow execution completed: ${executionId} with status: ${executionState.status}`);
    }
    /**
     * Handle workflow error
     */
    async handleWorkflowError(executionId, error) {
        const executionState = this.activeExecutions.get(executionId);
        if (executionState) {
            executionState.status = DACCStatus.FAILED;
            executionState.error = error.message;
            executionState.completed_at = new Date().toISOString();
            await this.completeWorkflowExecution(executionId, executionState);
        }
    }
    /**
     * Create timeout promise
     */
    createTimeoutPromise(timeoutMs) {
        return new Promise((_, reject) => {
            setTimeout(() => reject(new Error(`Step execution timeout after ${timeoutMs}ms`)), timeoutMs);
        });
    }
    /**
     * Generate unique execution ID
     */
    generateExecutionId() {
        return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Get execution status
     */
    async getExecutionStatus(executionId) {
        const activeState = this.activeExecutions.get(executionId);
        if (activeState) {
            return { ...activeState };
        }
        // Check database for completed executions
        if (this.orchestratorConfig.enable_state_persistence) {
            const execution = await this.prismaService.workflowExecution.findUnique({
                where: { id: executionId }
            });
            return execution?.state;
        }
        return null;
    }
    /**
     * Cancel workflow execution
     */
    async cancelExecution(executionId) {
        const executionState = this.activeExecutions.get(executionId);
        if (!executionState) {
            return false;
        }
        executionState.status = DACCStatus.CANCELLED;
        executionState.completed_at = new Date().toISOString();
        await this.completeWorkflowExecution(executionId, executionState);
        return true;
    }
    /**
     * Extract validation hints from DACC agent definition for POML processing
     */
    extractValidationHints(agentDefinition) {
        const hints = [];
        // Extract hints from output schema
        if (agentDefinition.output_schema_code) {
            hints.push(`Expected output schema: ${agentDefinition.output_schema_code}`);
        }
        // Extract hints from POML template metadata
        if (agentDefinition.poml_template?.validation_schema) {
            hints.push(`POML validation schema: ${agentDefinition.poml_template.validation_schema}`);
        }
        // Extract hints from data components
        if (agentDefinition.data_components) {
            agentDefinition.data_components.forEach((component) => {
                if (component.validation_hints) {
                    hints.push(...component.validation_hints);
                }
            });
        }
        // Add general POML validation hints
        if (agentDefinition.hint_validation_enabled) {
            hints.push('Use structured POML format with proper semantic tags');
            hints.push('Ensure output matches the defined schema structure');
            hints.push('Validate data types and format requirements');
        }
        return hints;
    }
    /**
     * Get orchestrator configuration
     */
    getOrchestratorConfig() {
        return { ...this.orchestratorConfig };
    }
};
DACCOrchestratorService = DACCOrchestratorService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ConfigService, typeof (_a = typeof PrismaService !== "undefined" && PrismaService) === "function" ? _a : Object, typeof (_b = typeof AgentFactory !== "undefined" && AgentFactory) === "function" ? _b : Object, typeof (_c = typeof DACCStreamingService !== "undefined" && DACCStreamingService) === "function" ? _c : Object, typeof (_d = typeof DACCDataResolverService !== "undefined" && DACCDataResolverService) === "function" ? _d : Object])
], DACCOrchestratorService);
export { DACCOrchestratorService };
//# sourceMappingURL=orchestrator.service.js.map