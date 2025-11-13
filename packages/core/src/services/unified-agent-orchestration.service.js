"use strict";
/**
 * Unified Agent Orchestration Service
 * Integrates AgentFederation, DACC, Terminal Orchestration, and VSCode Extension systems
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __addDisposableResource = (this && this.__addDisposableResource) || function (env, value, async) {
    if (value !== null && value !== void 0) {
        if (typeof value !== "object" && typeof value !== "function") throw new TypeError("Object expected.");
        var dispose, inner;
        if (async) {
            if (!Symbol.asyncDispose) throw new TypeError("Symbol.asyncDispose is not defined.");
            dispose = value[Symbol.asyncDispose];
        }
        if (dispose === void 0) {
            if (!Symbol.dispose) throw new TypeError("Symbol.dispose is not defined.");
            dispose = value[Symbol.dispose];
            if (async) inner = dispose;
        }
        if (typeof dispose !== "function") throw new TypeError("Object not disposable.");
        if (inner) dispose = function() { try { inner.call(this); } catch (e) { return Promise.reject(e); } };
        env.stack.push({ value: value, dispose: dispose, async: async });
    }
    else if (async) {
        env.stack.push({ async: true });
    }
    return value;
};
var __disposeResources = (this && this.__disposeResources) || (function (SuppressedError) {
    return function (env) {
        function fail(e) {
            env.error = env.hasError ? new SuppressedError(e, env.error, "An error was suppressed during disposal.") : e;
            env.hasError = true;
        }
        var r, s = 0;
        function next() {
            while (r = env.stack.pop()) {
                try {
                    if (!r.async && s === 1) return s = 0, env.stack.push(r), Promise.resolve().then(next);
                    if (r.dispose) {
                        var result = r.dispose.call(r.value);
                        if (r.async) return s |= 2, Promise.resolve(result).then(next, function(e) { fail(e); return next(); });
                    }
                    else s |= 1;
                }
                catch (e) {
                    fail(e);
                }
            }
            if (s === 1) return env.hasError ? Promise.reject(env.error) : Promise.resolve();
            if (env.hasError) throw env.error;
        }
        return next();
    };
})(typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
});
var UnifiedAgentOrchestration_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnifiedAgentOrchestration = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const agent_federation_terminal_bridge_service_1 = require("./agent-federation-terminal-bridge.service");
const vscode_agent_communication_bridge_service_1 = require("./vscode-agent-communication-bridge.service");
const terminal_discovery_service_1 = require("./terminal-discovery.service");
let UnifiedAgentOrchestration = UnifiedAgentOrchestration_1 = class UnifiedAgentOrchestration {
    federationBridge;
    vscodeBridge;
    terminalDiscovery;
    eventEmitter;
    logger = new common_1.Logger(UnifiedAgentOrchestration_1.name);
    agentSystems = new Map();
    allAgents = new Map();
    activeTasks = new Map();
    orchestrationHistory = [];
    healthCheckInterval;
    performanceTrackingInterval;
    orchestrationConfig = {
        maxConcurrentTasks: 50,
        defaultTaskTimeout: 300000, // 5 minutes
        healthCheckInterval: 30000, // 30 seconds
        performanceTrackingInterval: 60000, // 1 minute
        autoRebalancing: true,
        consensusThreshold: 0.7
    };
    constructor(federationBridge, vscodeBridge, terminalDiscovery, eventEmitter) {
        this.federationBridge = federationBridge;
        this.vscodeBridge = vscodeBridge;
        this.terminalDiscovery = terminalDiscovery;
        this.eventEmitter = eventEmitter;
        this.initializeUnifiedOrchestration();
    }
    /**
     * Initialize unified orchestration system
     */
    async initializeUnifiedOrchestration() {
        this.logger.log('Initializing Unified Agent Orchestration');
        // Discover and register all agent systems
        await this.discoverAgentSystems();
        // Start monitoring services
        this.startHealthMonitoring();
        this.startPerformanceTracking();
        this.setupEventListeners();
        this.logger.log(`Initialized with ${this.agentSystems.size} agent systems and ${this.allAgents.size} agents);
  }

  /**
   * Discover all available agent systems
   */
  private async discoverAgentSystems(): Promise<void> {
    try {
      // Register DACC Agent System
      await this.registerDACCSystem();

      // Register Federation Terminal System
      await this.registerFederationSystem();

      // Register VSCode Extension System
      await this.registerVSCodeSystem();

      // Register External Systems
      await this.discoverExternalSystems();

    } catch (error) {
      this.logger.error('Failed to discover agent systems', error as any);
    }
  }

  /**
   * Register DACC agent system
   */
  private async registerDACCSystem(): Promise<void> {
    const daccSystem: UnifiedAgentSystem = {
      id: 'dacc_system',
      type: 'dacc',
      name: 'DACC Agent System',
      status: 'active',
      capabilities: [
        'workflow_execution',
        'agent_factory',
        'schema_compilation',
        'poml_templates',
        'structured_output'
      ],
      agents: [],
      lastHealthCheck: new Date(),
      metadata: {
        maxConcurrentAgents: 50,
        supportedProtocols: ['http', 'websocket']
      }
    };

    // TODO: Discover DACC agents from AgentFactory
    // This would integrate with the existing DACC system
    const daccAgents = await this.discoverDACCAgents();
    daccSystem.agents = daccAgents;

    this.agentSystems.set(daccSystem.id, daccSystem);
    daccAgents.forEach(agent => this.allAgents.set(agent.id, agent));
`, this.logger.log(Registered, DACC, system));
        with ($) {
            daccAgents.length;
        }
        ` agents);
  }

  /**
   * Register Federation terminal system
   */
  private async registerFederationSystem(): Promise<void> {
    const federationStatus = this.federationBridge.getFederationStatus();

    const federationSystem: UnifiedAgentSystem = {
      id: 'federation_system',
      type: 'federation',
      name: 'Agent Federation Terminal System',
      status: 'active',
      capabilities: [
        'terminal_orchestration',
        'ai_cli_integration',
        'multi_agent_coordination',
        'load_balancing',
        'fault_tolerance'
      ],
      agents: [],
      lastHealthCheck: new Date(),
      metadata: {
        totalTerminalAgents: federationStatus.totalAgents,
        taskQueue: federationStatus.taskQueue,
        config: federationStatus.config
      }
    };

    // Convert federation agents to unified format
    const federationAgents = await this.convertFederationAgents();
    federationSystem.agents = federationAgents;

    this.agentSystems.set(federationSystem.id, federationSystem);
    federationAgents.forEach(agent => this.allAgents.set(agent.id, agent));

    this.logger.log(`;
        Registered;
        Federation;
        system;
        with ($) {
            federationAgents.length;
        }
        agents;
        ;
    }
    /**
     * Register VSCode extension system
     */
    async registerVSCodeSystem() {
        const bridgeStatus = this.vscodeBridge.getBridgeStatus();
        const vscodeSystem = {
            id: 'vscode_system',
            type: 'vscode_extension',
            name: 'VSCode Extension System',
            status: 'active',
            capabilities: [
                'vscode_integration',
                'real_time_collaboration',
                'context_sharing',
                'bidirectional_communication',
                'extension_coordination'
            ],
            agents: [],
            lastHealthCheck: new Date(),
            metadata: {
                serverPort: bridgeStatus.serverPort,
                totalConnections: bridgeStatus.totalConnections,
                extensions: bridgeStatus.extensions
            }
        };
        // Convert VSCode extensions to unified agents
        const vscodeAgents = await this.convertVSCodeExtensions();
        vscodeSystem.agents = vscodeAgents;
        this.agentSystems.set(vscodeSystem.id, vscodeSystem);
        vscodeAgents.forEach(agent => this.allAgents.set(agent.id, agent));
        `
    this.logger.log(Registered VSCode system with ${vscodeAgents.length}`;
        extension;
        agents `);
  }

  /**
   * Execute orchestrated task across all systems
   */
  async executeOrchestrationTask(taskRequest: Partial<OrchestrationTask>): Promise<string> {
    const task: OrchestrationTask = {
      id: this.generateTaskId(),
      type: taskRequest.type || 'general',
      description: taskRequest.description || 'No description provided',
      priority: taskRequest.priority || 'medium',
      requiredCapabilities: taskRequest.requiredCapabilities || [],
      context: taskRequest.context || {},
      orchestration: {
        strategy: 'single',
        maxAgents: 1,
        timeout: this.orchestrationConfig.defaultTaskTimeout,
        requiresHuman: false,
        ...taskRequest.orchestration
      },
      assignments: [],
      status: 'pending',
      createdAt: new Date(),
      deadline: taskRequest.deadline,
      results: []
    };

    this.activeTasks.set(task.id, task);

    try {
      // Create orchestration plan
      const plan = await this.createOrchestrationPlan(task);

      // Execute plan
      await this.executePlan(task, plan);

      this.logger.log(Started orchestration task: ${task.id});
      return task.id;

    } catch (error) {`;
        this.logger.error(`Failed to start orchestration task ${task.id}, error as any);
      task.status = 'failed';
      throw error;
    }
  }

  /**
   * Create orchestration plan for task
   */
  private async createOrchestrationPlan(task: OrchestrationTask): Promise<OrchestrationPlan> {`);
        const availableAgents = await this.findAgentsForTask(task);
        `

    if (availableAgents.length === 0) {
      throw new Error(No agents available for task ${task.id}`;
        with (required)
            capabilities: $;
        {
            task.requiredCapabilities.join(', ');
        }
        ;
    }
    plan = {
        taskId: task.id,
        strategy: task.orchestration.strategy,
        phases: [],
        dependencies: [],
        expectedDuration: this.estimateTaskDuration(task),
        riskAssessment: this.assessTaskRisk(task, availableAgents)
    };
    // Create phases based on strategy
    switch(task, orchestration, strategy) {
        'single';
        plan.phases = [this.createSingleAgentPhase(task, availableAgents[0])];
        break;
        'parallel';
        plan.phases = [this.createParallelPhase(task, availableAgents)];
        break;
        'sequential';
        plan.phases = this.createSequentialPhases(task, availableAgents);
        break;
        'consensus';
        plan.phases = this.createConsensusPhases(task, availableAgents);
        break;
        'competitive';
        plan.phases = [this.createCompetitivePhase(task, availableAgents)];
        `
        break;`;
    }
    default;
};
exports.UnifiedAgentOrchestration = UnifiedAgentOrchestration;
exports.UnifiedAgentOrchestration = UnifiedAgentOrchestration = UnifiedAgentOrchestration_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [agent_federation_terminal_bridge_service_1.AgentFederationTerminalBridge,
        vscode_agent_communication_bridge_service_1.VSCodeAgentCommunicationBridge,
        terminal_discovery_service_1.TerminalDiscoveryService,
        event_emitter_1.EventEmitter2])
], UnifiedAgentOrchestration);
new Error(Unknown, orchestration, strategy, $, { task, : .orchestration.strategy } `);
    }

    return plan;
  }

  /**
   * Execute orchestration plan
   */
  private async executePlan(task: OrchestrationTask, plan: OrchestrationPlan): Promise<void> {
    task.status = 'in_progress';

    this.eventEmitter.emit('orchestration.task.started', {
      taskId: task.id,
      plan,
      timestamp: new Date()
    });

    try {
      for (const phase of plan.phases) {
        await this.executePhase(task, phase);
      }

      task.status = 'completed';
      this.logger.log(Orchestration task ${task.id}`, completed, successfully);
try { }
catch (error) {
    task.status = 'failed';
    this.logger.error(Orchestration, task, $, { task, : .id }, failed, error);
    throw error;
}
finally {
    // Archive completed task
    this.orchestrationHistory.push({ ...task });
    this.activeTasks.delete(task.id);
    this.eventEmitter.emit('orchestration.task.completed', {
        taskId: task.id,
        status: task.status,
        results: task.results,
        timestamp: new Date()
    });
}
async;
executePhase(task, OrchestrationTask, phase, OrchestrationPhase);
Promise < void  > {} `
    this.logger.debug(`;
Executing;
phase: $;
{
    phase.name;
}
for (task; $; { task, : .id })
    ;
const rawAgents = phase.requiredAgents.map(agentId => this.allAgents.get(agentId));
console.log('DEBUG: executePhase - rawAgents:', rawAgents.map(a => a ? { id: a.id, status: a.status } : 'undefined'));
const phaseAgents = rawAgents.filter((agent) => !!agent);
console.log('DEBUG: executePhase - phaseAgents after filter:', phaseAgents.map(a => ({ id: a.id, status: a.status })));
`
`;
if (phaseAgents.length === 0) {
    throw new Error(No, agents, available);
    for (phase; $; { phase, : .name })
        ;
}
// Execute phase based on its requirements
const phaseResults = await Promise.allSettled(phaseAgents.map(agent => this.executeAgentSubtask(task, agent, phase)));
// Process phase results
const successfulResults = phaseResults
    .filter(result => result.status === 'fulfilled')
    .map(result => result.value);
`
    if (successfulResults.length === 0) {`;
throw new Error(`All agents failed in phase ${phase.name});
    }

    // Add results to task
    task.results = task.results || [];
    task.results.push({
      phaseId: phase.id,
      phaseName: phase.name,
      results: successfulResults,
      timestamp: new Date()
    });` `
    this.logger.debug(Phase ${phase.name} completed with ${successfulResults.length}`, successful, results);
async;
executeAgentSubtask(task, OrchestrationTask, agent, UnifiedAgent, phase, OrchestrationPhase);
Promise < any > {
    const: assignment, AgentAssignment = {
        agentId: agent.id,
        role: 'primary',
        subtask: Phase, $
    }
};
{
    phase.name;
}
status: 'assigned';
;
task.assignments.push(assignment);
assignment.status = 'in_progress';
try {
    let result;
    // Route to appropriate system based on agent connection type
    switch (agent.connection.type) {
        case 'terminal':
            result = await this.executeTerminalAgentTask(agent, task, phase);
            break;
        case 'websocket':
            result = await this.executeWebSocketAgentTask(agent, task, phase);
            break;
        case 'api':
            result = await this.executeAPIAgentTask(agent, task, phase);
            break;
        case 'direct':
            result = await this.executeDACCAgentTask(agent, task, phase);
            break;
        default:
            throw new Error(Unknown, agent, connection, type, $, { agent, : .connection.type });
    }
    assignment.status = 'completed';
    assignment.result = result;
    // Update agent performance
    this.updateAgentPerformance(agent, true, Date.now() - task.createdAt.getTime());
    return result;
}
catch (error) {
    console.log('DEBUG: executeAgentSubtask - caught error:', error, 'typeof:', typeof error);
    assignment.status = 'failed';
    assignment.feedback = error.message;
    // Update agent performance
    this.updateAgentPerformance(agent, false, Date.now() - task.createdAt.getTime());
    throw error;
}
async;
executeTerminalAgentTask(agent, UnifiedAgent, task, OrchestrationTask, phase, OrchestrationPhase);
Promise < any > {
    if(, agent) { }, : .connection.pid
};
{
    throw new Error(Terminal, agent, $, { agent, : .id }, missing, PID);
}
// Delegate to federation bridge
const federationTaskId = await this.federationBridge.delegateTask({
    type: task.type,
    payload: {
        task: task.description,
        context: task.context,
        phase: phase.name,
        requirements: task.requiredCapabilities
    },
    priority: task.priority
});
// Wait for task completion (simplified - in practice would use events)
return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
        reject(new Error('Terminal agent task timeout'));
        `
      }, task.orchestration.timeout || this.orchestrationConfig.defaultTaskTimeout);` `
      this.eventEmitter.once(agent.task.completed.${federationTaskId}, (result) => {
        clearTimeout(timeout);
        resolve(result);
      });` `
      this.eventEmitter.once(agent.task.failed.${federationTaskId}`, (error) => {
            clearTimeout(timeout);
            reject(new Error(error.message));
        };
    });
});
async;
executeWebSocketAgentTask(agent, UnifiedAgent, task, OrchestrationTask, phase, OrchestrationPhase);
Promise < any > {
    const: extensionId = agent.connection.websocketId,
    if(, extensionId) {
        throw new Error(WebSocket, agent, $, { agent, : .id }, missing, extension, ID);
    },
    const: success = await this.vscodeBridge.sendMessageToExtension(extensionId, {
        type: 'orchestration_task',
        taskId: task.id,
        phaseId: phase.id,
        task: task.description,
        context: task.context,
        requirements: task.requiredCapabilities
    }),
    if(, success) {
        throw new Error(Failed, to, send, task, to, VSCode, extension, $, { extensionId });
    }
    // Wait for extension response
    ,
    // Wait for extension response
    return: new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error('VSCode extension task timeout'));
            `
      }, task.orchestration.timeout || this.orchestrationConfig.defaultTaskTimeout);` `
      this.eventEmitter.once(vscode.task.completed.${task.id}.${phase.id}, (result) => {
        clearTimeout(timeout);
        resolve(result);`;
        });
        `
`;
        this.eventEmitter.once(vscode.task.failed.$, { task, : .id }.$, { phase, : .id }, (error) => {
            clearTimeout(timeout);
            reject(new Error(error.message));
        });
    })
};
async;
executeAPIAgentTask(agent, UnifiedAgent, task, OrchestrationTask, phase, OrchestrationPhase);
Promise < any > {
    // Implementation would depend on specific API agent integration
    throw: new Error('API agent execution not yet implemented')
};
async;
executeDACCAgentTask(agent, UnifiedAgent, task, OrchestrationTask, phase, OrchestrationPhase);
Promise < any > {
    // Implementation would integrate with existing DACC orchestration
    throw: new Error('DACC agent execution not yet implemented')
};
async;
findAgentsForTask(task, OrchestrationTask);
Promise < UnifiedAgent[] > {
    const: availableAgents = Array.from(this.allAgents.values())
        .filter(agent => agent.status === 'idle' || agent.status === 'busy')
        .filter(agent => this.hasRequiredCapabilities(agent, task.requiredCapabilities))
        .sort((a, b) => {
        // Sort by performance score
        const scoreA = this.calculateAgentScore(a, task);
        const scoreB = this.calculateAgentScore(b, task);
        return scoreB - scoreA;
    }),
    return: availableAgents.slice(0, task.orchestration.maxAgents || 1)
};
hasRequiredCapabilities(agent, UnifiedAgent, requiredCapabilities, string[]);
boolean;
{
    if (requiredCapabilities.length === 0)
        return true;
    return requiredCapabilities.every(capability => agent.capabilities.includes(capability) ||
        agent.coordination.specializations.includes(capability));
}
calculateAgentScore(agent, UnifiedAgent, task, OrchestrationTask);
number;
{
    let score = 0;
    // Capability matching
    const capabilityMatch = task.requiredCapabilities.filter(cap => agent.capabilities.includes(cap) || agent.coordination.specializations.includes(cap)).length / Math.max(task.requiredCapabilities.length, 1);
    score += capabilityMatch * 40;
    // Performance metrics
    score += agent.performance.successRate * 30;
    score += Math.max(0, 20 - agent.performance.averageResponseTime / 1000) * 20; // Prefer faster agents
    // Availability
    if (agent.status === 'idle')
        score += 20;
    score -= agent.currentTasks.length * 5;
    // Trust level
    const trustScore = { low: 5, medium: 10, high: 15 };
    score += trustScore[agent.coordination.trustLevel] || 0;
    return score;
}
createSingleAgentPhase(task, OrchestrationTask, agent, UnifiedAgent);
OrchestrationPhase;
{
    `
    return {`;
    id: $;
    {
        task.id;
    }
    `_single_phase,
      name: 'Single Agent Execution',
      description: Execute task using ${agent.name},
      requiredAgents: [agent.id],
      dependencies: [],
      estimatedDuration: this.estimateAgentTaskDuration(agent, task),
      validations: ['result_completeness', 'quality_check']
    };
  }

  private createParallelPhase(task: OrchestrationTask, agents: UnifiedAgent[]): OrchestrationPhase {
    return {
      id: ${task.id}_parallel_phase,
      name: 'Parallel Execution',
      description: Execute task in parallel across ${agents.length} agents,
      requiredAgents: agents.map(a => a.id),
      dependencies: [],
      estimatedDuration: Math.max(...agents.map(agent => this.estimateAgentTaskDuration(agent, task))),
      validations: ['result_aggregation', 'consensus_check']
    };
  }
`;
    createSequentialPhases(task, OrchestrationTask, agents, UnifiedAgent[]);
    OrchestrationPhase[];
    {
        const env_1 = { stack: [], error: void 0, hasError: false };
        try {
            `
    return agents.map((agent, index) => ({`;
            id: $;
            {
                task.id;
            }
            _sequential_phase_$;
            {
                index;
            }
            `
      name: Sequential Phase ${index + 1}`,
                description;
            Execute;
            subtask;
            $;
            {
                index + 1;
            }
            using $, { agent, name };
            `
      requiredAgents: [agent.id],`;
            dependencies: index > 0 ? [$, { task, : .id }, _sequential_phase_$, { index } - 1] : ;
        }
        catch (e_1) {
            env_1.error = e_1;
            env_1.hasError = true;
        }
        finally {
            __disposeResources(env_1);
        }
    }
    [],
        estimatedDuration;
    this.estimateAgentTaskDuration(agent, task),
        validations;
    ['phase_completion', 'handoff_validation'];
}
;
createConsensusPhases(task, OrchestrationTask, agents, UnifiedAgent[]);
OrchestrationPhase[];
{
    `
    return [`;
    {
        id: $;
        {
            task.id;
        }
        `_consensus_execution,
        name: 'Consensus Execution',
        description: Execute task across ${agents.length} agents for consensus,
        requiredAgents: agents.map(a => a.id),
        dependencies: [],
        estimatedDuration: Math.max(...agents.map(agent => this.estimateAgentTaskDuration(agent, task))),
        validations: ['individual_results']`;
    }
    `
      {
        id: `;
    $;
    {
        task.id;
    }
    _consensus_validation,
        name;
    'Consensus Validation', `
        description: 'Validate and select consensus result',`;
    requiredAgents: agents.slice(0, 3).map(a => a.id), // Use top 3 for validation
        dependencies;
    [$, { task, : .id } `_consensus_execution],
        estimatedDuration: 30000, // 30 seconds for consensus
        validations: ['consensus_threshold', 'result_quality']
      }
    ];
  }

  private createCompetitivePhase(task: OrchestrationTask, agents: UnifiedAgent[]): OrchestrationPhase {
    return {
      id: ${task.id}_competitive_phase,`,
        name, 'Competitive Execution', `
      description: Execute task competitively across ${agents.length} agents,
      requiredAgents: agents.map(a => a.id),
      dependencies: [],
      estimatedDuration: Math.min(...agents.map(agent => this.estimateAgentTaskDuration(agent, task))),
      validations: ['first_valid_result', 'quality_threshold']
    };
  }

  /**
   * Helper methods for system integration
   */
  private async discoverDACCAgents(): Promise<UnifiedAgent[]> {
    // TODO: Integrate with existing DACC system to discover agents
    // This would call the AgentFactory to get active agents
    return [];
  }

  private async convertFederationAgents(): Promise<UnifiedAgent[]> {
    // Convert federation terminal agents to unified format
    const federationStatus = this.federationBridge.getFederationStatus();
    // This would convert the federation agents to UnifiedAgent format
    return [];
  }

  private async convertVSCodeExtensions(): Promise<UnifiedAgent[]> {
    // Convert VSCode extensions to unified agents
    const bridgeStatus = this.vscodeBridge.getBridgeStatus();
    return bridgeStatus.extensions.map((ext: any) => ({`,
        id, `vscode_${ext.id},
      systemId: 'vscode_system',
      type: this.mapExtensionToType(ext.id),
      name: ext.name,
      status: ext.status === 'connected' ? 'idle' : 'offline',
      capabilities: ext.capabilities,
      currentTasks: [],
      performance: {
        tasksCompleted: 0,
        averageResponseTime: 5000,
        successRate: 0.85,
        lastActivity: ext.lastActivity
      },
      connection: {
        type: 'websocket',
        websocketId: ext.id
      },
      coordination: {
        canCollaborate: true,
        trustLevel: 'medium',
        specializations: ext.capabilities,
        preferredPartners: []
      }
    }));
  }

  private mapExtensionToType(extensionId: string): UnifiedAgent['type'] {
    if (extensionId.includes('copilot')) return 'copilot';
    if (extensionId.includes('cursor')) return 'cursor';
    if (extensionId.includes('continue')) return 'continue';
    return 'custom';
  }

  private async discoverExternalSystems(): Promise<void> {
    // Discover external agent systems (APIs, webhooks, etc.)
    // Implementation would scan for known external integrations
  }

  /**
   * Utility methods
   */
  private estimateTaskDuration(task: OrchestrationTask): number {
    const baseTime = 30000; // 30 seconds base
    const complexityMultiplier = task.requiredCapabilities.length * 0.2;
    const priorityMultiplier = { low: 0.8, medium: 1.0, high: 1.3, critical: 1.5 }[task.priority];

    return baseTime * (1 + complexityMultiplier) * priorityMultiplier;
  }

  private estimateAgentTaskDuration(agent: UnifiedAgent, task: OrchestrationTask): number {
    return Math.max(this.estimateTaskDuration(task) / agent.performance.successRate, 10000);
  }

  private assessTaskRisk(task: OrchestrationTask, agents: UnifiedAgent[]): OrchestrationPlan['riskAssessment'] {
    const factors = [];
    let riskLevel: 'low' | 'medium' | 'high' = 'low';

    if (task.requiredCapabilities.length > 5) {
      factors.push('high_complexity');
      riskLevel = 'medium';
    }

    if (agents.length < 2 && task.orchestration.strategy !== 'single') {
      factors.push('insufficient_agents');
      riskLevel = 'high';
    }

    if (task.deadline && (task.deadline.getTime() - Date.now()) < this.estimateTaskDuration(task)) {
      factors.push('tight_deadline');
      riskLevel = 'high';
    }

    const avgSuccessRate = agents.reduce((sum, agent) => sum + agent.performance.successRate, 0) / agents.length;
    if (avgSuccessRate < 0.7) {
      factors.push('low_agent_reliability');
      riskLevel = riskLevel === 'high' ? 'high' : 'medium';
    }

    const mitigation = [];
    if (factors.includes('insufficient_agents')) {
      mitigation.push('queue_for_more_agents', 'reduce_scope');
    }
    if (factors.includes('tight_deadline')) {
      mitigation.push('increase_priority', 'parallel_execution');
    }

    return { level: riskLevel, factors, mitigation };
  }

  private updateAgentPerformance(agent: UnifiedAgent, success: boolean, duration: number): void {
    agent.performance.tasksCompleted += 1;
    agent.performance.averageResponseTime = (
      (agent.performance.averageResponseTime * (agent.performance.tasksCompleted - 1)) + duration
    ) / agent.performance.tasksCompleted;

    agent.performance.successRate = (
      (agent.performance.successRate * (agent.performance.tasksCompleted - 1)) + (success ? 1 : 0)
    ) / agent.performance.tasksCompleted;

    agent.performance.lastActivity = new Date();
  }

  /**
   * Monitoring and health check methods
   */
  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthChecks();
    }, this.orchestrationConfig.healthCheckInterval);
  }

  private startPerformanceTracking(): void {
    this.performanceTrackingInterval = setInterval(async () => {
      await this.trackPerformanceMetrics();
    }, this.orchestrationConfig.performanceTrackingInterval);
  }

  private async performHealthChecks(): Promise<void> {
    for (const system of this.agentSystems.values()) {
      try {
        // Perform system-specific health checks
        await this.performSystemHealthCheck(system);
        system.lastHealthCheck = new Date();
        system.status = 'active';`];
}
try { }
catch (error) {
    `
        this.logger.warn(Health check failed for system ${system.id}, error as any);
        system.status = 'error';
      }
    }
  }

  private async performSystemHealthCheck(system: UnifiedAgentSystem): Promise<void> {
    switch (system.type) {
      case 'federation':
        // Check federation bridge status
        const federationStatus = this.federationBridge.getFederationStatus();
        if (federationStatus.totalAgents === 0) {
          throw new Error('No federation agents available');
        }
        break;

      case 'vscode_extension':
        // Check VSCode bridge status
        const bridgeStatus = this.vscodeBridge.getBridgeStatus();
        if (bridgeStatus.connectionsByStatus.connected === 0) {
          throw new Error('No VSCode extensions connected');
        }
        break;

      // Add other system health checks as needed
    }
  }

  private async trackPerformanceMetrics(): Promise<void> {
    const metrics = {
      timestamp: new Date(),
      totalAgents: this.allAgents.size,
      activeTasks: this.activeTasks.size,
      averageResponseTime: this.calculateAverageResponseTime(),
      overallSuccessRate: this.calculateOverallSuccessRate(),
      systemsStatus: this.getSystemsStatus()
    };

    this.eventEmitter.emit('orchestration.performance.metrics', metrics);
  }

  private calculateAverageResponseTime(): number {
    const agents = Array.from(this.allAgents.values());
    if (agents.length === 0) return 0;

    return agents.reduce((sum, agent) => sum + agent.performance.averageResponseTime, 0) / agents.length;
  }

  private calculateOverallSuccessRate(): number {
    const agents = Array.from(this.allAgents.values());
    if (agents.length === 0) return 0;

    return agents.reduce((sum, agent) => sum + agent.performance.successRate, 0) / agents.length;
  }

  private getSystemsStatus(): Record<string, string> {
    const status: Record<string, string> = {};
    for (const [id, system] of this.agentSystems) {
      status[id] = system.status;
    }
    return status;
  }

  /**
   * Event listener setup
   */
  private setupEventListeners(): void {
    // Listen for agent status changes
    this.eventEmitter.on('agent.status.changed', (data) => {
      this.handleAgentStatusChange(data);
    });

    // Listen for system events
    this.eventEmitter.on('system.health.warning', (data) => {
      this.handleSystemHealthWarning(data);
    });

    // Listen for task completion events from sub-systems
    this.eventEmitter.on('federation.task.completed', (data) => {`;
    this.eventEmitter.emit(agent.task.completed.$, { data, : .taskId } `, data.result);
    });

    this.eventEmitter.on('vscode.extension.message', (data) => {
      if (data.message.type === 'response' && data.message.payload.responseType === 'delegation_result') {
        this.eventEmitter.emit(vscode.task.completed.${data.message.payload.delegationId}, data.message.payload.result);
      }
    });
  }

  private handleAgentStatusChange(data: any): void {
    const agent = this.allAgents.get(data.agentId);
    if (agent) {`, agent.status = data.status);
    `
      this.logger.debug(Agent ${data.agentId} status changed to ${data.status});
    }
  }` `
  private handleSystemHealthWarning(data: any): void {`;
    this.logger.warn(System, health, warning, $, { data, : .systemId } - $, { data, : .message });
}
generateTaskId();
string;
{
    `
    return orch_task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` `;
  }

  /**
   * Public API methods
   */
  getOrchestrationStatus(): any {
    return {
      systems: Array.from(this.agentSystems.values()).map(system => ({
        id: system.id,
        name: system.name,
        type: system.type,
        status: system.status,
        agentCount: system.agents.length,
        lastHealthCheck: system.lastHealthCheck
      })),
      agents: {
        total: this.allAgents.size,
        byStatus: this.getAgentsByStatus(),
        byType: this.getAgentsByType(),
        averagePerformance: {
          responseTime: this.calculateAverageResponseTime(),
          successRate: this.calculateOverallSuccessRate()
        }
      },
      tasks: {
        active: this.activeTasks.size,
        completed: this.orchestrationHistory.length,
        byStatus: this.getTasksByStatus()
      },
      config: this.orchestrationConfig
    };
  }

  private getAgentsByStatus(): Record<string, number> {
    const byStatus: Record<string, number> = { idle: 0, busy: 0, offline: 0, error: 0 };
    for (const agent of this.allAgents.values()) {
      byStatus[agent.status] = (byStatus[agent.status] || 0) + 1;
    }
    return byStatus;
  }

  private getAgentsByType(): Record<string, number> {
    const byType: Record<string, number> = {};
    for (const agent of this.allAgents.values()) {
      byType[agent.type] = (byType[agent.type] || 0) + 1;
    }
    return byType;
  }

  private getTasksByStatus(): Record<string, number> {
    const byStatus: Record<string, number> = { pending: 0, in_progress: 0, completed: 0, failed: 0, cancelled: 0 };

    for (const task of this.activeTasks.values()) {
      byStatus[task.status] = (byStatus[task.status] || 0) + 1;
    }

    for (const task of this.orchestrationHistory) {
      byStatus[task.status] = (byStatus[task.status] || 0) + 1;
    }

    return byStatus;
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    if (this.performanceTrackingInterval) {
      clearInterval(this.performanceTrackingInterval);
    }

    // Cancel all active tasks
    for (const task of this.activeTasks.values()) {
      task.status = 'cancelled';
    }

    this.agentSystems.clear();
    this.allAgents.clear();
    this.activeTasks.clear();

    this.logger.log('Unified Agent Orchestration cleaned up');
  }
}
    ;
}
//# sourceMappingURL=unified-agent-orchestration.service.js.map