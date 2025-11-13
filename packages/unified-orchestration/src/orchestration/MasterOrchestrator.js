"use strict";
/**
 * Master Orchestrator for The New Fuse Framework
 *
 * This orchestrator serves as the central coordination point for all agent systems,
 * unifying CLI agents, Workflow engines, Sync orchestrators, and custom agents
 * while maintaining backward compatibility and enabling advanced multi-agent workflows.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MasterOrchestrator = void 0;
const events_1 = require("events");
class MasterOrchestrator extends events_1.EventEmitter {
    agentRegistry;
    activeExecutions = new Map();
    // Legacy orchestrator integrations
    cliOrchestrator;
    syncOrchestrator;
    workflowEngine;
    handoffFlywheel;
    // Configuration and state
    config = {
        maxConcurrentExecutions: 100,
        defaultTimeout: 300000, // 5 minutes
        enableMetrics: true,
        enableTracing: true,
        enableRecovery: true,
        maxRetryAttempts: 3,
        handoffEnabled: true,
        federationEnabled: true
    };
    metrics = {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageExecutionTime: 0,
        currentConcurrentExecutions: 0,
        handoffsPerformed: 0,
        agentUtilization: new Map()
    };
    constructor(agentRegistry) {
        super();
        this.agentRegistry = agentRegistry;
        // TODO: Implement proper AgentOrchestrator integration
        // this.cliOrchestrator = new AgentOrchestrator(agentManager, communicationManager, logger);
        this.setupEventHandlers();
    }
    /**
     * Initialize the master orchestrator with all subsystems
     */
    async initialize() {
        try {
            // Initialize agent registry
            await this.agentRegistry.initialize();
            // Initialize handoff system if available
            if (this.config.handoffEnabled) {
                try {
                    // Initialize handoff flywheel with sync orchestrator
                    // this.handoffFlywheel = new PromptHandoffFlywheel(...);
                    console.log('✅ Handoff system initialized');
                }
                catch (error) {
                    console.warn('⚠️ Handoff system initialization failed:', error);
                }
            }
            // Initialize workflow engine if available
            try {
                // this.workflowEngine = new UnifiedWorkflowEngine(...);
                console.log('✅ Workflow engine initialized');
            }
            catch (error) {
                console.warn('⚠️ Workflow engine initialization failed:', error);
            }
            console.log('✅ MasterOrchestrator initialized successfully');
        }
        catch (error) {
            console.error('❌ Failed to initialize MasterOrchestrator:', error);
            throw error;
        }
    }
    /**
     * Execute a master orchestration request
     */
    async execute(request) {
        const startTime = new Date();
        this.activeExecutions.set(request.id, request);
        this.metrics.totalRequests++;
        this.metrics.currentConcurrentExecutions++;
        try {
            // Emit start event
            this.emit('execution_started', request);
            let result;
            // Route to appropriate execution method based on type
            switch (request.type) {
                case 'single_agent':
                    result = await this.executeSingleAgent(request);
                    break;
                case 'multi_agent':
                    result = await this.executeMultiAgent(request);
                    break;
                case 'workflow':
                    result = await this.executeWorkflow(request);
                    break;
                case 'federated':
                    result = await this.executeFederated(request);
                    break;
                default:
                    throw new Error(`Unsupported orchestration type: ${request.type});
      }

      // Mark as successful
      result.success = true;
      this.metrics.successfulRequests++;

      // Emit completion event
      this.emit('execution_completed', result);

      return result;

    } catch (error) {
      // Handle execution failure
      const endTime = new Date();
      const executionTime = endTime.getTime() - startTime.getTime();

      this.metrics.failedRequests++;

      const errorResult: MasterOrchestrationResult = {
        requestId: request.id,
        success: false,
        type: request.type,
        startTime,
        endTime,
        executionTime,
        error: {
          code: 'EXECUTION_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error
        },
        metrics: {
          agentsInvolved: 0,
          handoffsPerformed: 0,
          resourcesUsed: {}
        }
      };

      // Emit failure event
      this.emit('execution_failed', errorResult);

      return errorResult;

    } finally {
      // Cleanup
      this.activeExecutions.delete(request.id);
      this.metrics.currentConcurrentExecutions--;

      // Update average execution time
      const executionTime = new Date().getTime() - startTime.getTime();
      this.updateAverageExecutionTime(executionTime);
    }
  }

  /**
   * Execute single agent request
   */
  private async executeSingleAgent(request: MasterOrchestrationRequest): Promise<MasterOrchestrationResult> {
    const startTime = new Date();

    if (!request.agentRequest) {
      throw new Error('Agent request is required for single_agent type');
    }

    // Execute through agent registry
    const agentResult = await this.agentRegistry.executeTask(request.agentRequest);

    const endTime = new Date();
    const executionTime = endTime.getTime() - startTime.getTime();

    return {
      requestId: request.id,
      success: agentResult.success,
      type: 'single_agent',
      startTime,
      endTime,
      executionTime,
      agentResult,
      metrics: {
        agentsInvolved: 1,
        handoffsPerformed: 0,
        resourcesUsed: {
          'execution_time_ms': executionTime
        }
      }
    };
  }

  /**
   * Execute multi-agent request
   */
  private async executeMultiAgent(request: MasterOrchestrationRequest): Promise<MasterOrchestrationResult> {
    const startTime = new Date();

    if (!request.multiAgentRequest) {
      throw new Error('Multi-agent request is required for multi_agent type');
    }

    const multiRequest = request.multiAgentRequest;
    const results: Array<{
      taskId: string;
      agentId: string;
      success: boolean;
      result?: any;
      error?: string;
    }> = [];

    let handoffsPerformed = 0;
    const agentsUsed = new Set<string>();

    try {
      switch (multiRequest.coordination) {
        case 'parallel':
          await this.executeParallelTasks(multiRequest, results, agentsUsed);
          break;

        case 'sequential':
          await this.executeSequentialTasks(multiRequest, results, agentsUsed);
          break;

        case 'dependency_graph':
          await this.executeDependencyGraphTasks(multiRequest, results, agentsUsed);
          break;

        case 'handoff_chain':
          handoffsPerformed = await this.executeHandoffChain(multiRequest, results, agentsUsed);
          break;

        default:`);
                    throw new Error(`Unsupported coordination strategy: ${multiRequest.coordination}`);
            }
            const endTime = new Date();
            const executionTime = endTime.getTime() - startTime.getTime();
            return {
                requestId: request.id,
                success: results.every(r => r.success),
                type: 'multi_agent',
                startTime,
                endTime,
                executionTime,
                multiAgentResult: {
                    tasksCompleted: results.filter(r => r.success).length,
                    tasksTotal: results.length,
                    results
                },
                metrics: {
                    agentsInvolved: agentsUsed.size,
                    handoffsPerformed,
                    resourcesUsed: {
                        'execution_time_ms': executionTime,
                        'parallel_tasks': multiRequest.coordination === 'parallel' ? results.length : 1
                    }
                }
            };
        }
        catch (error) {
            throw new Error(Multi - agent, execution, failed, $, { error, instanceof: Error ? error.message : error });
        }
    }
    /**
     * Execute workflow request
     */
    async executeWorkflow(request) {
        const startTime = new Date();
        if (!request.workflowRequest) {
            throw new Error('Workflow request is required for workflow type');
        }
        if (!this.workflowEngine) {
            throw new Error('Workflow engine not initialized');
        }
        try {
            // Execute workflow through workflow engine
            const executionId = await this.workflowEngine.executeWorkflow(request.workflowRequest.workflowId, request.workflowRequest.parameters, request.metadata?.userId || 'system', request.workflowRequest.executionMode || 'standard');
            // Wait for the workflow to complete
            let workflowExecution = await this.workflowEngine.getExecutionStatus(executionId);
            while (workflowExecution && (workflowExecution.status === 'PENDING' || workflowExecution.status === 'RUNNING')) {
                await new Promise(resolve => setTimeout(resolve, 1000)); // wait 1 second
                workflowExecution = await this.workflowEngine.getExecutionStatus(executionId);
            }
            if (!workflowExecution) {
                throw new Error('Workflow execution not found after running');
            }
            const endTime = new Date();
            const executionTime = endTime.getTime() - startTime.getTime();
            return {
                requestId: request.id,
                success: workflowExecution.status === 'COMPLETED',
                type: 'workflow',
                startTime,
                endTime,
                executionTime,
                workflowResult: {
                    workflowId: request.workflowRequest.workflowId,
                    executionId: workflowExecution.id,
                    nodesExecuted: workflowExecution.statistics.completedNodes || 0,
                    nodesTotal: workflowExecution.statistics.totalNodes || 0,
                    result: workflowExecution.output
                },
                metrics: {
                    agentsInvolved: 0, // This information is not available in the execution status
                    handoffsPerformed: 0, // This information is not available in the execution status
                    resourcesUsed: {
                        'execution_time_ms': executionTime,
                        'nodes_executed': workflowExecution.statistics.completedNodes || 0
                    }
                }
            };
        }
        catch (error) {
            `
      throw new Error(Workflow execution failed: ${error instanceof Error ? error.message : error}`;
            ;
        }
    }
    /**
     * Execute federated request
     */
    async executeFederated(request) {
        const startTime = new Date();
        if (!request.federatedRequest) {
            throw new Error('Federated request is required for federated type');
        }
        const fedRequest = request.federatedRequest;
        const results = [];
        try {
            // Execute on each target system based on coordination strategy
            switch (fedRequest.coordinationStrategy) {
                case 'broadcast':
                    await this.executeFederatedBroadcast(fedRequest, results);
                    break;
                case 'primary_backup':
                    await this.executeFederatedPrimaryBackup(fedRequest, results);
                    break;
                case 'consensus':
                    await this.executeFederatedConsensus(fedRequest, results);
                    break;
                default:
                    throw new Error(Unsupported, federation, strategy, $, { fedRequest, : .coordinationStrategy });
            }
            const endTime = new Date();
            const executionTime = endTime.getTime() - startTime.getTime();
            const successfulSystems = results.filter(r => r.success).length;
            const success = fedRequest.requireAllSuccess
                ? successfulSystems === results.length
                : successfulSystems > 0;
            return {
                requestId: request.id,
                success,
                type: 'federated',
                startTime,
                endTime,
                executionTime,
                federatedResult: {
                    systemsResponded: results.length,
                    systemsTotal: fedRequest.targetSystems.length,
                    results
                },
                metrics: {
                    agentsInvolved: results.length,
                    handoffsPerformed: 0,
                    resourcesUsed: {
                        'execution_time_ms': executionTime,
                        'federated_systems': results.length
                    }
                }
            };
            `
`;
        }
        catch (error) {
            throw new Error(Federated, execution, failed, $, { error, instanceof: Error ? error.message : error } `);
    }
  }

  // Private execution methods for different coordination strategies

  private async executeParallelTasks(
    multiRequest: MultiAgentRequest,
    results: Array<any>,
    agentsUsed: Set<string>
  ): Promise<void> {
    const promises = multiRequest.tasks.map(async (task) => {
      try {
        // Select optimal agent
        const selection = await this.agentRegistry.selectOptimalAgent(task.agentCriteria);
        if (!selection) {
          throw new Error('No suitable agent found');
        }

        agentsUsed.add(selection.agent.id);

        // Execute task
        const executionRequest: AgentExecutionRequest = {
          agentId: selection.agent.id,
          taskId: task.id,
          task: task.task,
          timeout: task.timeout
        };

        const result = await this.agentRegistry.executeTask(executionRequest);

        results.push({
          taskId: task.id,
          agentId: selection.agent.id,
          success: result.success,
          result: result.result,
          error: result.error?.message
        });

      } catch (error) {
        results.push({
          taskId: task.id,
          agentId: 'unknown',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    await Promise.all(promises);
  }

  private async executeSequentialTasks(
    multiRequest: MultiAgentRequest,
    results: Array<any>,
    agentsUsed: Set<string>
  ): Promise<void> {
    for (const task of multiRequest.tasks) {
      try {
        // Select optimal agent
        const selection = await this.agentRegistry.selectOptimalAgent(task.agentCriteria);
        if (!selection) {
          throw new Error('No suitable agent found');
        }

        agentsUsed.add(selection.agent.id);

        // Execute task
        const executionRequest: AgentExecutionRequest = {
          agentId: selection.agent.id,
          taskId: task.id,
          task: task.task,
          timeout: task.timeout
        };

        const result = await this.agentRegistry.executeTask(executionRequest);

        results.push({
          taskId: task.id,
          agentId: selection.agent.id,
          success: result.success,
          result: result.result,
          error: result.error?.message
        });

        // Stop on failure if fail_fast strategy
        if (!result.success && multiRequest.failureStrategy === 'fail_fast') {
          throw new Error(Task ${task.id} failed: ${result.error?.message}`);
        }
    }
    catch(error) {
        results.push({
            taskId: task.id,
            agentId: 'unknown',
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        if (multiRequest.failureStrategy === 'fail_fast') {
            throw error;
        }
    }
}
exports.MasterOrchestrator = MasterOrchestrator;
async;
executeDependencyGraphTasks(multiRequest, MultiAgentRequest, results, (Array), agentsUsed, (Set));
Promise < void  > {
    // Build dependency graph
    const: taskMap = new Map(multiRequest.tasks.map(task => [task.id, task])),
    const: completed = new Set(),
    const: inProgress = new Set(),
    // Execute tasks respecting dependencies
    while(completed) { }, : .size < multiRequest.tasks.length
};
{
    const readyTasks = multiRequest.tasks.filter(task => !completed.has(task.id) &&
        !inProgress.has(task.id) &&
        (task.dependencies?.every(dep => completed.has(dep)) ?? true));
    if (readyTasks.length === 0) {
        throw new Error('Dependency deadlock detected');
    }
    // Execute ready tasks in parallel
    const promises = readyTasks.map(async (task) => {
        inProgress.add(task.id);
        try {
            const selection = await this.agentRegistry.selectOptimalAgent(task.agentCriteria);
            if (!selection) {
                throw new Error('No suitable agent found');
            }
            agentsUsed.add(selection.agent.id);
            const executionRequest = {
                agentId: selection.agent.id,
                taskId: task.id,
                task: task.task,
                timeout: task.timeout
            };
            const result = await this.agentRegistry.executeTask(executionRequest);
            results.push({
                taskId: task.id,
                agentId: selection.agent.id,
                success: result.success,
                result: result.result,
                error: result.error?.message
            });
            return result.success;
        }
        catch (error) {
            results.push({
                taskId: task.id,
                agentId: 'unknown',
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return false;
        }
        finally {
            inProgress.delete(task.id);
            completed.add(task.id);
        }
    });
    const taskResults = await Promise.all(promises);
    // Check for failures
    if (taskResults.some(success => !success) && multiRequest.failureStrategy === 'fail_fast') {
        throw new Error('Task failed in dependency graph execution');
    }
}
async;
executeHandoffChain(multiRequest, MultiAgentRequest, results, (Array), agentsUsed, (Set));
Promise < number > {
    let, handoffsPerformed = 0,
    // Execute tasks as a handoff chain
    for(let, i = 0, i, , multiRequest) { }, : .tasks.length, i
}++;
{
    const task = multiRequest.tasks[i];
    try {
        // Select optimal agent
        const selection = await this.agentRegistry.selectOptimalAgent(task.agentCriteria);
        if (!selection) {
            throw new Error('No suitable agent found');
        }
        agentsUsed.add(selection.agent.id);
        // Prepare handoff context from previous results
        let context = {};
        if (i > 0) {
            context = {
                previousResults: results.slice(0, i),
                chainPosition: i,
                totalTasks: multiRequest.tasks.length
            };
        }
        // Execute with handoff if available
        let result;
        if (this.handoffFlywheel && i > 0) {
            // Use handoff flywheel for context-aware execution
            handoffsPerformed++;
            // Create handoff context (simplified for now)
            result = await this.agentRegistry.executeTask({
                agentId: selection.agent.id,
                taskId: task.id,
                task: task.task,
                context,
                timeout: task.timeout
            });
        }
        else {
            // Direct execution for first task or when handoff not available
            result = await this.agentRegistry.executeTask({
                agentId: selection.agent.id,
                taskId: task.id,
                task: task.task,
                context,
                timeout: task.timeout
            });
        }
        results.push({
            taskId: task.id,
            agentId: selection.agent.id,
            success: result.success,
            result: result.result,
            error: result.error?.message
        });
        // Stop on failure if fail_fast strategy
        if (!result.success && multiRequest.failureStrategy === 'fail_fast') {
            throw new Error(Handoff, chain, failed, at, task, $, { task, : .id }, $, { result, : .error?.message });
        }
    }
    catch (error) {
        results.push({
            taskId: task.id,
            agentId: 'unknown',
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        if (multiRequest.failureStrategy === 'fail_fast') {
            throw error;
        }
    }
}
return handoffsPerformed;
async;
executeFederatedBroadcast(fedRequest, FederatedExecutionRequest, results, (Array));
Promise < void  > {
    // Broadcast to all systems simultaneously
    const: promises = fedRequest.targetSystems.map(async (systemId) => {
        try {
            // Find federation agents for this system
            const federationAgents = this.agentRegistry.getAgentsByType('federation')
                .filter(agent => agent.integrationData?.externalSystem === systemId);
            `
        if (federationAgents.length === 0) {`;
            throw new Error(No, federation, agent, found);
            for (system; $; { systemId } `);
        }

        const result = await this.agentRegistry.executeTask({
          agentId: federationAgents[0].id,
          taskId: federation_${systemId},
          task: fedRequest.task
        });

        results.push({
          systemId,
          success: result.success,
          result: result.result,
          error: result.error?.message
        });

      } catch (error) {
        results.push({
          systemId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    await Promise.all(promises);
  }

  private async executeFederatedPrimaryBackup(
    fedRequest: FederatedExecutionRequest,
    results: Array<any>
  ): Promise<void> {
    // Try primary system first, fallback to backup systems
    for (const systemId of fedRequest.targetSystems) {
      try {
        const federationAgents = this.agentRegistry.getAgentsByType('federation')
          .filter(agent => agent.integrationData?.externalSystem === systemId);

        if (federationAgents.length === 0) {
          continue;
        }

        const result = await this.agentRegistry.executeTask({`)
                agentId: federationAgents[0].id, `
          taskId: `;
            federation_$;
            {
                systemId;
            }
            task: fedRequest.task;
        }
        finally { }
    }),
    results, : .push({
        systemId,
        success: result.success,
        result: result.result,
        error: result.error?.message
    }),
    // If successful, we're done (primary succeeded)
    if(result) { }, : .success
};
{
    break;
}
try { }
catch (error) {
    results.push({
        systemId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
    });
}
async;
executeFederatedConsensus(fedRequest, FederatedExecutionRequest, results, (Array));
Promise < void  > {
    // Execute on all systems and require majority consensus
    await, this: .executeFederatedBroadcast(fedRequest, results),
    // Check for consensus (simplified - just majority)
    const: successfulSystems = results.filter(r => r.success),
    const: majorityThreshold = Math.ceil(results.length / 2)
} `
    if (successfulSystems.length < majorityThreshold) {`;
throw new Error(Consensus, not, reached, $, { successfulSystems, : .length } `/${results.length} systems succeeded`);
setupEventHandlers();
void {
    // Listen to agent registry events
    this: .agentRegistry.on('registry_event', (event) => {
        this.emit('agent_registry_event', event);
    }),
    // Set up metrics updates
    setInterval() { }
}();
{
    this.updateMetrics();
}
60000;
; // Update every minute
updateAverageExecutionTime(executionTime, number);
void {
    const: totalRequests = this.metrics.totalRequests,
    const: currentAvg = this.metrics.averageExecutionTime,
    this: .metrics.averageExecutionTime =
        ((currentAvg * (totalRequests - 1)) + executionTime) / totalRequests
};
updateMetrics();
void {
    : .agentRegistry.getAllAgents()
};
{
    this.metrics.agentUtilization.set(agent.id, agent.metrics.currentLoad);
}
// Emit metrics update
this.emit('metrics_updated', this.metrics);
// Public API methods
/**
 * Get current orchestration metrics
 */
getMetrics();
{
    return {
        ...this.metrics,
        registryStats: this.agentRegistry.getRegistryStats(),
        activeExecutions: this.activeExecutions.size
    };
}
/**
 * Get active executions
 */
getActiveExecutions();
MasterOrchestrationRequest[];
{
    return Array.from(this.activeExecutions.values());
}
/**
 * Cancel an active execution
 */
async;
cancelExecution(requestId, string);
Promise < boolean > {
    const: request = this.activeExecutions.get(requestId),
    if(, request) {
        return false;
    }
    // Implementation would depend on execution type and current state
    ,
    // Implementation would depend on execution type and current state
    this: .activeExecutions.delete(requestId),
    this: .emit('execution_cancelled', requestId),
    return: true
};
/**
 * Get orchestrator status
 */
getStatus();
{
    return {
        initialized: !!this.agentRegistry,
        components: {
            agentRegistry: !!this.agentRegistry,
            cliOrchestrator: !!this.cliOrchestrator,
            syncOrchestrator: !!this.syncOrchestrator,
            workflowEngine: !!this.workflowEngine,
            handoffFlywheel: !!this.handoffFlywheel
        },
        metrics: this.getMetrics()
    };
}
//# sourceMappingURL=MasterOrchestrator.js.map