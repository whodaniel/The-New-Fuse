"use strict";
/**
 * AgentHandoffService.ts
 *
 * Enhanced agent handoff system with plan context for seamless task delegation.
 * Supports Traycer-style handoff to Claude Code, Cursor, Gemini, Codex, etc.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentHandoffService = void 0;
const events_1 = require("events");
const uuid_1 = require("uuid");
class AgentHandoffService extends events_1.EventEmitter {
    availableAgents;
    executionService;
    handoffRequests = new Map();
    activeChains = new Map();
    agentCapabilities = new Map();
    agentPerformance = new Map();
    constructor(availableAgents, executionService // Reference to AgentHub or similar
    ) {
        super();
        this.availableAgents = availableAgents;
        this.executionService = executionService;
        this.initializeAgentCapabilities();
    }
    /**
     * Execute a plan handoff to a specific agent
     */
    async executePlanHandoff(agentId, plan, options = {}) {
        const handoffId = (0, uuid_1.v4)();
        const context = {
            workspace: plan.context.workspace,
            files: plan.context.files,
            planState: plan,
            conversationHistory: this.generatePlanConversationHistory(plan)
        };
        const payload = {
            taskType: 'plan_execution',
            instructions: this.generatePlanInstructions(plan),
            planContent: this.serializePlanForHandoff(plan)
        };
        const request = {
            id: handoffId,
            toAgent: agentId,
            planId: plan.id,
            context,
            payload,
            options: {
                timeout: 300000, // 5 minutes default
                preserveContext: true,
                waitForCompletion: true,
                priority: 'medium',
                ...options
            },
            status: 'pending',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.handoffRequests.set(handoffId, request);
        try {
            return await this.executeHandoff(request);
        }
        catch (error) {
            request.status = 'failed';
            request.updatedAt = new Date();
            throw error;
        }
    }
    /**
     * Execute a step handoff to a specific agent
     */
    async executeStepHandoff(agentId, plan, step, options = {}) {
        const handoffId = (0, uuid_1.v4)();
        const context = {
            workspace: plan.context.workspace,
            files: step.fileChanges?.map(fc => fc.path) || plan.context.files,
            planState: plan,
            stepContext: step,
            conversationHistory: this.generateStepConversationHistory(plan, step)
        };
        const payload = {
            taskType: 'step_execution',
            instructions: this.generateStepInstructions(step),
            stepInstructions: step.description,
            planContent: this.serializePlanForHandoff(plan)
        };
        const request = {
            id: handoffId,
            toAgent: agentId,
            planId: plan.id,
            stepId: step.id,
            context,
            payload,
            options: {
                timeout: 180000, // 3 minutes default for steps
                preserveContext: true,
                waitForCompletion: true,
                priority: step.priority === 'critical' ? 'critical' : 'medium',
                ...options
            },
            status: 'pending',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.handoffRequests.set(handoffId, request);
        try {
            return await this.executeHandoff(request);
        }
        catch (error) {
            request.status = 'failed';
            request.updatedAt = new Date();
            throw error;
        }
    }
    /**
     * Execute verification handoff
     */
    async executeVerificationHandoff(agentId, plan, verificationCriteria, options = {}) {
        const handoffId = (0, uuid_1.v4)();
        const context = {
            workspace: plan.context.workspace,
            files: plan.context.files,
            planState: plan
        };
        const payload = {
            taskType: 'verification',
            instructions: 'Please verify the implementation according to the specified criteria',
            verificationCriteria,
            planContent: this.serializePlanForHandoff(plan)
        };
        const request = {
            id: handoffId,
            toAgent: agentId,
            planId: plan.id,
            context,
            payload,
            options: {
                timeout: 120000, // 2 minutes for verification
                preserveContext: true,
                waitForCompletion: true,
                priority: 'high',
                ...options
            },
            status: 'pending',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.handoffRequests.set(handoffId, request);
        try {
            return await this.executeHandoff(request);
        }
        catch (error) {
            request.status = 'failed';
            request.updatedAt = new Date();
            throw error;
        }
    }
    /**
     * Find the best agent for a task based on capabilities and context
     */
    async findBestAgent(taskType, requiredCapabilities, context, excludeAgents) {
        const candidates = [];
        for (const [agentId, agent] of this.availableAgents) {
            if (excludeAgents?.includes(agentId) || !agent.enabled) {
                continue;
            }
            const match = this.calculateCapabilityMatch(agentId, requiredCapabilities, taskType);
            if (match.score > 0) {
                candidates.push(match);
            }
        }
        if (candidates.length === 0) {
            return null;
        }
        // Sort by score (descending) and return the best match
        candidates.sort((a, b) => b.score - a.score);
        return candidates[0];
    }
    /**
     * Execute handoff with strategy (direct, fallback, parallel, etc.)
     */
    async executeWithStrategy(strategy, plan, step, options = {}) {
        switch (strategy.type) {
            case 'direct':
                if (!strategy.primaryAgent) {
                    throw new Error('Primary agent required for direct strategy');
                }
                return step
                    ? await this.executeStepHandoff(strategy.primaryAgent, plan, step, options)
                    : await this.executePlanHandoff(strategy.primaryAgent, plan, options);
            case 'fallback_chain':
                return await this.executeFallbackChain(strategy, plan, step, options);
            case 'parallel':
                return await this.executeParallelHandoff(strategy, plan, step, options);
            case 'best_match':
                return await this.executeBestMatchHandoff(strategy, plan, step, options);
            case 'load_balanced':
                return await this.executeLoadBalancedHandoff(strategy, plan, step, options);
            default:
                throw new Error(`Unknown handoff strategy: ${strategy.type});
    }
  }

  /**
   * Start a task chain across multiple agents
   */
  async startTaskChain(
    chainId: string,
    plan: TaskPlan,
    agentSequence: string[],
    options: HandoffOptions = {}
  ): Promise<ChainContext> {
    const chainContext: ChainContext = {
      chainId,
      previousSteps: [],
      accumulatedContext: {},
      nextSteps: agentSequence.slice(1)
    };

    this.activeChains.set(chainId, chainContext);

    // Execute first step
    if (agentSequence.length > 0) {
      const firstAgent = agentSequence[0];
      const result = await this.executePlanHandoff(firstAgent, plan, {
        ...options,
        metadata: { ...options.metadata, chainId, chainStep: 0 }
      });

      chainContext.previousSteps.push(result);
      chainContext.accumulatedContext[firstAgent] = result;
    }

    this.emit('chainStarted', chainContext);
    return chainContext;
  }

  /**
   * Continue a task chain to the next agent
   */
  async continueTaskChain(
    chainId: string,
    plan: TaskPlan,
    options: HandoffOptions = {}
  ): Promise<HandoffResult | null> {
    const chainContext = this.activeChains.get(chainId);
    if (!chainContext || !chainContext.nextSteps || chainContext.nextSteps.length === 0) {
      return null;
    }

    const nextAgent = chainContext.nextSteps.shift()!;
    const stepIndex = chainContext.previousSteps.length;

    // Enhance context with previous results
    const enhancedContext = {
      ...options,
      metadata: {
        ...options.metadata,
        chainId,
        chainStep: stepIndex,
        previousResults: chainContext.previousSteps,
        accumulatedContext: chainContext.accumulatedContext
      }
    };

    const result = await this.executePlanHandoff(nextAgent, plan, enhancedContext);

    chainContext.previousSteps.push(result);
    chainContext.accumulatedContext[nextAgent] = result;

    this.emit('chainContinued', { chainContext, result });

    // Check if chain is complete
    if (chainContext.nextSteps.length === 0) {
      this.emit('chainCompleted', chainContext);
    }

    return result;
  }

  /**
   * Execute the actual handoff
   */
  private async executeHandoff(request: HandoffRequest): Promise<HandoffResult> {
    request.status = 'in_progress';
    request.updatedAt = new Date();

    this.emit('handoffStarted', request);

    const startTime = Date.now();

    try {
      let result: any;

      // Route to appropriate execution method based on agent type
      const agent = this.availableAgents.get(request.toAgent);
      if (!agent) {`);
                throw new Error(`Agent not found: ${request.toAgent}`);
        }
        if (this.executionService) {
            // Use existing execution service (AgentHub)
            result = await this.executeViaExecutionService(request, agent);
        }
        else {
            // Fallback to direct execution
            result = await this.executeDirectHandoff(request, agent);
        }
        const executionTime = Date.now() - startTime;
        const handoffResult = {
            handoffId: request.id,
            agentId: request.toAgent,
            status: 'success',
            result,
            output: typeof result === 'string' ? result : JSON.stringify(result),
            executionTime,
            timestamp: new Date()
        };
        request.status = 'completed';
        request.completedAt = new Date();
        request.updatedAt = new Date();
        this.updateAgentPerformance(request.toAgent, executionTime, true);
        this.emit('handoffCompleted', { request, result: handoffResult });
        return handoffResult;
    }
    catch(error) {
        const executionTime = Date.now() - startTime;
        const handoffResult = {
            handoffId: request.id,
            agentId: request.toAgent,
            status: 'error',
            error: error instanceof Error ? error.message : String(error),
            executionTime,
            timestamp: new Date()
        };
        request.status = 'failed';
        request.updatedAt = new Date();
        this.updateAgentPerformance(request.toAgent, executionTime, false);
        this.emit('handoffFailed', { request, result: handoffResult, error });
        throw error;
    }
}
exports.AgentHandoffService = AgentHandoffService;
async;
executeViaExecutionService(request, HandoffRequest, agent, AgentHub_1.AgentConfiguration);
Promise < any > {
    const: prompt = this.buildPromptFromHandoff(request),
    if(request) { }, : .payload.taskType === 'plan_execution'
};
{
    return await this.executionService.executePlanInAgent(request.toAgent, request.planId || 'default-plan', undefined // Let the service handle prompt template
    );
}
if (request.payload.taskType === 'step_execution') {
    return await this.executionService.executeTask(request.toAgent, prompt, {
        context: request.context,
        timeout: request.options.timeout
    });
}
else {
    return await this.executionService.executeTask(request.toAgent, prompt, {
        context: request.context,
        timeout: request.options.timeout
    });
}
async;
executeDirectHandoff(request, HandoffRequest, agent, AgentHub_1.AgentConfiguration);
Promise < any > {
    // This would implement direct communication with the agent
    // For now, return a placeholder response
    return: Handoff, executed, to, $
};
{
    agent.displayName || agent.name;
}
$;
{
    request.payload.instructions;
}
;
buildPromptFromHandoff(request, HandoffRequest);
string;
{
    let prompt = request.payload.instructions;
    if (request.payload.planContent) {
        prompt += '\n\nPlan Context:\n' + request.payload.planContent;
    }
    if (request.payload.stepInstructions) {
        prompt += '\n\nStep Instructions:\n' + request.payload.stepInstructions;
    }
    if (request.payload.verificationCriteria) {
        prompt += '\n\nVerification Criteria:\n' + request.payload.verificationCriteria.join('\n- ');
    }
    if (request.context.conversationHistory) {
        prompt += '\n\nConversation History:\n' +
            request.context.conversationHistory `
          .map(entry => ${entry.role}`;
        $;
        {
            entry.content;
        }
        join('\n');
    }
    return prompt;
}
async;
executeFallbackChain(strategy, HandoffStrategy, plan, TaskPlanningService_1.TaskPlan, step ?  : TaskPlanningService_1.PlanStep, options, HandoffOptions = {});
Promise < HandoffResult > {
    const: agents = [strategy.primaryAgent, ...(strategy.fallbackAgents || [])].filter(Boolean),
    let, lastError: Error | null, null: ,
    for(, agentId, of, agents) {
        try {
            return step
                ? await this.executeStepHandoff(agentId, plan, step, options)
                : await this.executePlanHandoff(agentId, plan, options);
            `
      } catch (error) {`;
            lastError = error;
            console.warn(Handoff, failed);
            for (agent; $; { agentId } `, trying next agent:, error);
      }
    }

    throw lastError || new Error('All agents in fallback chain failed');
  }

  private async executeParallelHandoff(
    strategy: HandoffStrategy,
    plan: TaskPlan,
    step?: PlanStep,
    options: HandoffOptions = {}
  ): Promise<HandoffResult> {
    const agents = [strategy.primaryAgent, ...(strategy.fallbackAgents || [])].filter(Boolean);

    const promises = agents.map(agentId =>
      step
        ? this.executeStepHandoff(agentId!, plan, step, options)
        : this.executePlanHandoff(agentId!, plan, options)
    );

    // Return the first successful result
    return await Promise.race(promises);
  }

  private async executeBestMatchHandoff(
    strategy: HandoffStrategy,
    plan: TaskPlan,
    step?: PlanStep,
    options: HandoffOptions = {}
  ): Promise<HandoffResult> {
    const requiredCapabilities = step?.type ? [step.type] : ['general'];
    const bestMatch = await this.findBestAgent(
      step?.type || 'plan_execution',
      requiredCapabilities,
      { workspace: plan.context.workspace, files: plan.context.files, planState: plan }
    );

    if (!bestMatch) {
      throw new Error('No suitable agent found for task');
    }

    return step
      ? await this.executeStepHandoff(bestMatch.agentId, plan, step, options)
      : await this.executePlanHandoff(bestMatch.agentId, plan, options);
  }

  private async executeLoadBalancedHandoff(
    strategy: HandoffStrategy,
    plan: TaskPlan,
    step?: PlanStep,
    options: HandoffOptions = {}
  ): Promise<HandoffResult> {
    // Simple load balancing based on current handoff count
    const availableAgents = Array.from(this.availableAgents.keys())
      .filter(agentId => this.availableAgents.get(agentId)?.enabled);

    const leastBusyAgent = this.findLeastBusyAgent(availableAgents);

    return step
      ? await this.executeStepHandoff(leastBusyAgent, plan, step, options)
      : await this.executePlanHandoff(leastBusyAgent, plan, options);
  }

  /**
   * Utility methods
   */
  private initializeAgentCapabilities(): void {
    for (const [agentId, agent] of this.availableAgents) {
      const capabilities = agent.capabilities.map(cap => cap.name.toLowerCase());
      this.agentCapabilities.set(agentId, capabilities);
    }
  }

  private calculateCapabilityMatch(
    agentId: string,
    requiredCapabilities: string[],
    taskType: string
  ): AgentCapabilityMatch {
    const agentCaps = this.agentCapabilities.get(agentId) || [];
    const matchedCaps = requiredCapabilities.filter(req =>
      agentCaps.some(cap => cap.includes(req.toLowerCase()) || req.toLowerCase().includes(cap))
    );

    const missingCaps = requiredCapabilities.filter(req => !matchedCaps.includes(req));

    let score = matchedCaps.length / requiredCapabilities.length;

    // Boost score for general capabilities
    if (agentCaps.includes('general') || agentCaps.includes('ai')) {
      score += 0.1;
    }

    // Performance bonus
    const performance = this.agentPerformance.get(agentId);
    if (performance && performance.successRate > 0.8) {
      score += 0.1;
    }

    return {
      agentId,
      score: Math.min(1, score),
      matchedCapabilities: matchedCaps,
      missingCapabilities: missingCaps,
      reasons: [Matched ${matchedCaps.length}/${requiredCapabilities.length} capabilities`)
                ;
        }
        finally { }
        ;
    },
    findLeastBusyAgent(agentIds) {
        // Count active handoffs per agent
        const handoffCounts = new Map();
        for (const agentId of agentIds) {
            handoffCounts.set(agentId, 0);
        }
        for (const request of this.handoffRequests.values()) {
            if (request.status === 'in_progress') {
                const count = handoffCounts.get(request.toAgent) || 0;
                handoffCounts.set(request.toAgent, count + 1);
            }
        }
        // Find agent with minimum handoffs
        let leastBusy = agentIds[0];
        let minCount = handoffCounts.get(leastBusy) || 0;
        for (const agentId of agentIds) {
            const count = handoffCounts.get(agentId) || 0;
            if (count < minCount) {
                leastBusy = agentId;
                minCount = count;
            }
        }
        return leastBusy;
    },
    updateAgentPerformance(agentId, executionTime, success) {
        const current = this.agentPerformance.get(agentId) || {
            totalExecutions: 0,
            successfulExecutions: 0,
            averageExecutionTime: 0,
            successRate: 0
        };
        current.totalExecutions++;
        if (success) {
            current.successfulExecutions++;
        }
        current.averageExecutionTime = ((current.averageExecutionTime * (current.totalExecutions - 1)) + executionTime) / current.totalExecutions;
        current.successRate = current.successfulExecutions / current.totalExecutions;
        this.agentPerformance.set(agentId, current);
    }
    /**
     * Serialization methods
     */
    ,
    /**
     * Serialization methods
     */
    serializePlanForHandoff(plan) {
        const simplified = {
            id: plan.id,
            title: plan.title,
            description: plan.description,
            status: plan.status,
            steps: plan.steps.map(step => ({
                id: step.id,
                title: step.title,
                description: step.description,
                type: step.type,
                status: step.status,
                priority: step.priority
            })),
            context: plan.context
        };
        return JSON.stringify(simplified, null, 2);
    },
    generatePlanInstructions(plan) {
        return Execute;
        the;
        following;
        plan: "${plan.title}";
        n;
        n$;
        {
            plan.description;
        }
        n;
        nSteps;
        to;
        complete: ;
        n$;
        {
            `
      plan.steps.map((step, index) => ${index + 1}`.$;
            {
                step.title;
            }
            $;
            {
                step.description;
            }
        }
    }, : .join('\n')
};
`
  private generateStepInstructions(step: PlanStep): string {`;
let instructions = Execute, step, n, nDescription, { step, description };
`
`;
if (step.fileChanges) {
    `
      instructions += '\n\nFile changes required:\n' +
        step.fileChanges.map(fc => - ${fc.operation} ${fc.path}: ${fc.description}).join('\n');`;
}
`

    if (step.commands) {
      instructions += '\n\nCommands to run:\n' + step.commands.map(cmd => - ${cmd}).join('\n');
    }

    return instructions;
  }

  private generatePlanConversationHistory(plan: TaskPlan): ConversationEntry[] {
    return [
      {
        role: 'user',
        content: plan.userIntent,
        timestamp: plan.createdAt`;
`
      {`;
role: 'assistant',
    content;
I;
've created a plan with ${plan.steps.length} steps to achieve your goal.,;
timestamp: plan.createdAt;
;
generateStepConversationHistory(plan, TaskPlanningService_1.TaskPlan, step, TaskPlanningService_1.PlanStep);
ConversationEntry[];
{
    return [
        ...this.generatePlanConversationHistory(plan),
        {
            role: 'assistant',
        } `
        content: Now executing step: ${step.title}` `,
        timestamp: step.createdAt
      }
    ];
  }

  /**
   * Public getters
   */
  getHandoffRequest(handoffId: string): HandoffRequest | undefined {
    return this.handoffRequests.get(handoffId);
  }

  getActiveChain(chainId: string): ChainContext | undefined {
    return this.activeChains.get(chainId);
  }

  getAgentPerformance(agentId: string): PerformanceMetrics | undefined {
    return this.agentPerformance.get(agentId);
  }

  getAllHandoffs(): HandoffRequest[] {
    return Array.from(this.handoffRequests.values());
  }

  getActiveHandoffs(): HandoffRequest[] {
    return Array.from(this.handoffRequests.values())
      .filter(req => req.status === 'in_progress');
  }
}

interface PerformanceMetrics {
  totalExecutions: number;
  successfulExecutions: number;
  averageExecutionTime: number;
  successRate: number;
}
    ];
}
//# sourceMappingURL=AgentHandoffService.js.map