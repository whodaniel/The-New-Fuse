"use strict";
/**
 * Unified Agent Registry for The New Fuse Framework
 *
 * This registry consolidates all agent types from CLI, Workflow, Sync, and Custom agents
 * into a single, unified system while maintaining backward compatibility and enabling
 * advanced orchestration capabilities.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnifiedAgentRegistry = void 0;
const events_1 = require("events");
class UnifiedAgentRegistry extends events_1.EventEmitter {
    agents = new Map();
    capabilities = new Map(); // capability -> agent IDs
    agentsByType = new Map();
    agentsByStatus = new Map();
    healthChecks = new Map();
    metricsCache = new Map();
    // Legacy system integrations
    cliOrchestrator;
    syncOrchestrator;
    workflowEngine;
    config;
    isInitialized = false;
    constructor(config = {}) {
        super();
        this.config = {
            maxAgents: 1000,
            defaultTimeout: 30000,
            healthCheckInterval: 60000,
            metricsRetentionPeriod: 86400000, // 24 hours
            loadBalancingStrategy: 'performance_based',
            enableCaching: true,
            cacheTimeout: 5000,
            maxConcurrentExecutions: 100,
            enableMetrics: true,
            enableHealthChecks: true,
            enableEventLogging: true,
            enableTenantIsolation: true,
            requireAuthentication: false,
            allowCrossTenanantAccess: false,
            enableLegacySupport: true,
            enableFederation: true,
            legacyMappings: this.getDefaultLegacyMappings(),
            ...config
        };
        this.setupPeriodicCleanup();
    }
    /**
     * Initialize the registry and integrate with existing systems
     */
    async initialize() {
        if (this.isInitialized)
            return;
        try {
            // Initialize legacy system integrations if enabled
            if (this.config.enableLegacySupport) {
                await this.initializeLegacyIntegrations();
            }
            // Start health checking if enabled
            if (this.config.enableHealthChecks) {
                this.startHealthCheckingSystem();
            }
            // Setup metrics collection if enabled
            if (this.config.enableMetrics) {
                this.setupMetricsCollection();
            }
            this.isInitialized = true;
            this.emitRegistryEvent('agent_registered', 'system', { agentCount: this.agents.size });
            console.log(`✅ UnifiedAgentRegistry initialized with ${this.agents.size} agents);
    } catch (error) {
      console.error('❌ Failed to initialize UnifiedAgentRegistry:', error);
      throw error;
    }
  }

  /**
   * Register a new agent in the unified registry
   */
  async registerAgent(request: AgentRegistrationRequest): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (this.agents.size >= this.config.maxAgents) {`);
            throw new Error(`Maximum number of agents (${this.config.maxAgents}`);
            reached;
            ;
        }
        finally {
        }
        const agentId = this.generateAgentId();
        const now = new Date();
        // Create unified agent from registration request
        const agent = {
            id: agentId,
            ...request.agent,
            registeredAt: now,
            lastSeen: now,
            metrics: this.initializeMetrics()
        };
        // Store agent
        this.agents.set(agentId, agent);
        // Update indices
        this.updateAgentIndices(agent);
        // Setup health checking if provided
        if (request.healthCheck && this.config.enableHealthChecks) {
            this.setupAgentHealthCheck(agentId, request.healthCheck);
        }
        // Emit registration event
        this.emitRegistryEvent('agent_registered', agentId, { agent });
        console.log(Registered, agent, $, { agentId }($, { agent, : .type }));
        with (capabilities)
            : $;
        {
            agent.capabilities.join(', ');
        }
        ;
        return agentId;
    }
    /**
     * Deregister an agent from the registry
     */
    async deregisterAgent(agentId) {
        const agent = this.agents.get(agentId);
        if (!agent)
            return false;
        // Clean up health checks
        this.cleanupAgentHealthCheck(agentId);
        // Remove from indices
        this.removeFromAgentIndices(agent);
        // Remove from main storage
        this.agents.delete(agentId);
        this.metricsCache.delete(agentId);
        // Emit deregistration event`
        this.emitRegistryEvent('agent_deregistered', agentId, { agent });
        `
`;
        console.log(Deregistered, agent, $, { agentId });
        return true;
    }
    /**
     * Find optimal agent for given criteria
     */
    async selectOptimalAgent(criteria) {
        const startTime = Date.now();
        // Get candidate agents based on capabilities
        const candidates = this.findCandidateAgents(criteria);
        if (candidates.length === 0) {
            return null;
        }
        // Score and rank candidates
        const scoredCandidates = await Promise.all(candidates.map(async (agent) => ({
            agent,
            score: await this.calculateAgentScore(agent, criteria)
        })));
        // Sort by score (highest first)
        scoredCandidates.sort((a, b) => b.score - a.score);
        const bestCandidate = scoredCandidates[0];
        const alternatives = scoredCandidates.slice(1, 4); // Top 3 alternatives
        const selectionTime = Date.now() - startTime;
        `
    console.log(🎯 Selected agent ${bestCandidate.agent.id}`(score, $, { bestCandidate, : .score.toFixed(2) }) in $;
        {
            selectionTime;
        }
        ms;
        ;
        return {
            agent: bestCandidate.agent,
            score: bestCandidate.score,
            reasoning: this.generateSelectionReasoning(bestCandidate.agent, criteria),
            alternativeAgents: alternatives.map(({ agent, score }) => ({ agent, score }))
        };
    }
    /**
     * Execute task using optimal agent selection
     */
    async executeTask(request) {
        const startTime = new Date();
        try {
            let agent;
            if (request.agentId) {
                `
        // Use specific agent`;
                const specifiedAgent = this.agents.get(request.agentId);
                if (!specifiedAgent) {
                    throw new Error(Agent, $, { request, : .agentId } ` not found);
        }
        if (specifiedAgent.status !== 'available') {
          throw new Error(Agent ${request.agentId}`, is, not, available(status, $, { specifiedAgent, : .status }));
                }
                agent = specifiedAgent;
            }
            else {
                // Select optimal agent
                const selection = await this.selectOptimalAgent({
                    requiredCapabilities: [], // Will be inferred from task
                    priority: request.priority || 'medium',
                    maxResponseTime: request.timeout,
                    maxCurrentLoad: 80
                });
                if (!selection) {
                    throw new Error('No suitable agent found for task execution');
                }
                agent = selection.agent;
            }
            // Update agent status
            await this.updateAgentStatus(agent.id, 'busy');
            // Execute task based on agent type
            let result;
            const executionTimeout = request.timeout || agent.configuration.timeout || this.config.defaultTimeout;
            try {
                result = await this.executeTaskOnAgent(agent, request.task, request.context, executionTimeout);
                // Update success metrics
                this.updateAgentMetrics(agent.id, { successfulExecutions: 1 });
            }
            catch (executionError) {
                // Update failure metrics
                this.updateAgentMetrics(agent.id, { failedExecutions: 1 });
                throw executionError;
            }
            finally {
                // Reset agent status
                await this.updateAgentStatus(agent.id, 'available');
            }
            const endTime = new Date();
            const executionTime = endTime.getTime() - startTime.getTime();
            // Update execution metrics
            this.updateAgentMetrics(agent.id, {
                totalExecutions: 1,
                averageExecutionTime: executionTime
            });
            return {
                agentId: agent.id,
                taskId: request.taskId,
                success: true,
                result,
                metrics: {
                    startTime,
                    endTime,
                    executionTime
                }
            };
        }
        catch (error) {
            const endTime = new Date();
            const executionTime = endTime.getTime() - startTime.getTime();
            return {
                agentId: request.agentId || 'unknown',
                taskId: request.taskId,
                success: false,
                error: {
                    code: 'EXECUTION_FAILED',
                    message: error instanceof Error ? error.message : 'Unknown error',
                    details: error
                },
                metrics: {
                    startTime,
                    endTime,
                    executionTime
                }
            };
        }
    }
    /**
     * Get all registered agents
     */
    getAllAgents() {
        return Array.from(this.agents.values());
    }
    /**
     * Get agent by ID
     */
    getAgent(agentId) {
        return this.agents.get(agentId) || null;
    }
    /**
     * Get agents by type
     */
    getAgentsByType(type) {
        const agentIds = this.agentsByType.get(type) || new Set();
        return Array.from(agentIds).map(id => this.agents.get(id)).filter(Boolean);
    }
    /**
     * Get agents by capability
     */
    getAgentsByCapability(capability) {
        const agentIds = this.capabilities.get(capability) || new Set();
        return Array.from(agentIds).map(id => this.agents.get(id)).filter(Boolean);
    }
    /**
     * Update agent status
     */
    async updateAgentStatus(agentId, status) {
        const agent = this.agents.get(agentId);
        if (!agent)
            return false;
        const oldStatus = agent.status;
        agent.status = status;
        agent.lastSeen = new Date();
        // Update status indices
        this.agentsByStatus.get(oldStatus)?.delete(agentId);
        if (!this.agentsByStatus.has(status)) {
            this.agentsByStatus.set(status, new Set());
        }
        this.agentsByStatus.get(status).add(agentId);
        // Emit status change event
        this.emitRegistryEvent('agent_status_changed', agentId, {
            oldStatus,
            newStatus: status
        });
        return true;
    }
    /**
     * Get registry statistics
     */
    getRegistryStats() {
        const stats = {
            totalAgents: this.agents.size,
            agentsByType: {},
            agentsByStatus: {},
            totalCapabilities: this.capabilities.size,
            healthyAgents: 0,
            busyAgents: 0,
            offlineAgents: 0
        };
        // Count by type
        for (const [type, agentIds] of this.agentsByType) {
            stats.agentsByType[type] = agentIds.size;
        }
        // Count by status
        for (const [status, agentIds] of this.agentsByStatus) {
            stats.agentsByStatus[status] = agentIds.size;
        }
        // Special counts
        stats.healthyAgents = (this.agentsByStatus.get('available')?.size || 0);
        stats.busyAgents = (this.agentsByStatus.get('busy')?.size || 0);
        stats.offlineAgents = (this.agentsByStatus.get('offline')?.size || 0);
        return stats;
    }
    // Private implementation methods...
    async initializeLegacyIntegrations() {
        try {
            // Import and register CLI agents
            await this.integrateCLIAgents();
            // Import and register Workflow agents
            await this.integrateWorkflowAgents();
            // Import and register Sync agents
            await this.integrateSyncAgents();
            console.log('✅ Legacy integrations initialized');
        }
        catch (error) {
            console.error('❌ Failed to initialize legacy integrations:', error);
        }
    }
    async integrateCLIAgents() {
        // Import CLI agents from AgentOrchestrator
        const cliAgents = [
            'code-assistant',
            'project-manager',
            'documentation-writer',
            'test-engineer',
            'deployment-specialist',
            'security-auditor'
        ];
        for (const agentType of cliAgents) {
            const agentId = cli - $, { agentType };
            const agent = {
                id: agentId,
                type: 'cli',
                metadata: {} `
          name: agentType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),`,
                description: `CLI agent for ${agentType} tasks,
          version: '1.0.0',
          lastUpdated: new Date()
        },
        status: 'available',
        capabilities: [agentType, 'cli-command', 'interactive'],
        metrics: this.initializeMetrics(),
        configuration: this.getDefaultConfiguration(),
        lastSeen: new Date(),
        registeredAt: new Date(),
        integrationData: {
          cliCommands: [agentType]
        }
      };

      this.agents.set(agentId, agent);
      this.updateAgentIndices(agent);
    }
  }

  private async integrateWorkflowAgents(): Promise<void> {
    // Workflow agents are dynamically created based on node types
    // Register capability to create workflow agents as needed
    const workflowCapabilities = [
      'api-call',
      'vector-store',
      'database-query',
      'condition-check',
      'data-transform'
    ];

    for (const capability of workflowCapabilities) {`
                // Create placeholder workflow agent`
                ,
                // Create placeholder workflow agent`
                const: agentId = workflow - $
            }, { capability };
            `;
      const agent: UnifiedAgent = {
        id: agentId,
        type: 'workflow',
        metadata: {
          name: Workflow ${capability},`;
            description: Workflow;
            agent;
            for ($; { capability } ` operations,
          version: '1.0.0',
          lastUpdated: new Date()
        },
        status: 'available',
        capabilities: [capability, 'workflow-node'],
        metrics: this.initializeMetrics(),
        configuration: this.getDefaultConfiguration(),
        lastSeen: new Date(),
        registeredAt: new Date(),
        integrationData: {
          nodeTypes: [capability]
        }
      };

      this.agents.set(agentId, agent);
      this.updateAgentIndices(agent);
    }
  }

  private async integrateSyncAgents(): Promise<void> {
    // Sync agents for cross-instance coordination
    const syncAgent: UnifiedAgent = {
      id: 'sync-coordinator',
      type: 'sync',
      metadata: {
        name: 'Sync Coordinator',
        description: 'Multi-tenant synchronization coordinator',
        version: '1.0.0',
        lastUpdated: new Date()
      },
      status: 'available',
      capabilities: ['synchronization', 'multi-tenant', 'conflict-resolution'],
      metrics: this.initializeMetrics(),
      configuration: this.getDefaultConfiguration(),
      lastSeen: new Date(),
      registeredAt: new Date(),
      integrationData: {
        syncCapabilities: ['data-sync', 'state-sync', 'conflict-resolution']
      }
    };

    this.agents.set(syncAgent.id, syncAgent);
    this.updateAgentIndices(syncAgent);
  }

  private findCandidateAgents(criteria: AgentSelectionCriteria): UnifiedAgent[] {
    let candidates: UnifiedAgent[] = [];

    // Start with agents that have required capabilities
    if (criteria.requiredCapabilities.length > 0) {
      const capabilitySets: Set<string>[] = criteria.requiredCapabilities.map(cap =>
        this.capabilities.get(cap) || new Set<string>()
      );

      // Find intersection of all capability sets
      const intersection = capabilitySets.reduce((acc, set) =>
        new Set([...acc].filter(id => set.has(id)))
      );

      candidates = Array.from(intersection)
        .map(id => this.agents.get(id)!)
        .filter(Boolean);
    } else {
      // If no specific capabilities required, use all available agents
      candidates = this.getAllAgents();
    }

    // Filter by status (only available agents)
    candidates = candidates.filter(agent => agent.status === 'available');

    // Filter by tenant if specified
    if (criteria.tenantId) {
      candidates = candidates.filter(agent =>
        !agent.tenantId || agent.tenantId === criteria.tenantId
      );
    }

    // Filter by excluded agents
    if (criteria.excludeAgents?.length) {
      candidates = candidates.filter(agent =>
        !criteria.excludeAgents!.includes(agent.id)
      );
    }

    // Filter by performance requirements
    if (criteria.minSuccessRate) {
      candidates = candidates.filter(agent =>
        agent.metrics.successRate >= criteria.minSuccessRate!
      );
    }

    if (criteria.maxCurrentLoad) {
      candidates = candidates.filter(agent =>
        agent.metrics.currentLoad <= criteria.maxCurrentLoad!
      );
    }

    return candidates;
  }

  private async calculateAgentScore(agent: UnifiedAgent, criteria: AgentSelectionCriteria): Promise<number> {
    let score = 0;

    // Base score from success rate (0-40 points)
    score += agent.metrics.successRate * 0.4;

    // Load score (0-20 points) - lower load is better
    const loadScore = Math.max(0, 100 - agent.metrics.currentLoad) * 0.2;
    score += loadScore;

    // Response time score (0-20 points)
    const responseTimeScore = Math.max(0,
      (5000 - agent.metrics.averageResponseTime) / 5000
    ) * 20;
    score += responseTimeScore;

    // Capability match score (0-20 points)
    const requiredCapabilities = criteria.requiredCapabilities.length;
    const matchedCapabilities = criteria.requiredCapabilities.filter(cap =>
      agent.capabilities.includes(cap)
    ).length;

    if (requiredCapabilities > 0) {
      score += (matchedCapabilities / requiredCapabilities) * 20;
    } else {
      score += 10; // Base score if no specific requirements
    }

    // Priority bonus (0-10 points)
    if (criteria.preferredAgents?.includes(agent.id)) {
      score += 10;
    }

    // Optional capabilities bonus
    if (criteria.optionalCapabilities?.length) {
      const optionalMatches = criteria.optionalCapabilities.filter(cap =>
        agent.capabilities.includes(cap)
      ).length;
      score += (optionalMatches / criteria.optionalCapabilities.length) * 5;
    }

    return Math.min(100, Math.max(0, score));
  }

  private generateSelectionReasoning(agent: UnifiedAgent, criteria: AgentSelectionCriteria): string {
    const reasons = [];

    reasons.push(`; Success)
                rate: $;
            {
                agent.metrics.successRate.toFixed(1);
            }
             % ;
            ;
            `
    reasons.push(Current load: ${agent.metrics.currentLoad.toFixed(1)}` % ;
            ;
            reasons.push(Response, time, $, { agent, : .metrics.averageResponseTime } `ms);

    const matchedCapabilities = criteria.requiredCapabilities.filter(cap =>
      agent.capabilities.includes(cap)
    );

    if (matchedCapabilities.length > 0) {
      reasons.push(Capabilities: ${matchedCapabilities.join(', ')});
    }

    return reasons.join('; ');
  }

  private async executeTaskOnAgent(
    agent: UnifiedAgent,
    task: any,
    context?: Record<string, any>,
    timeout = 30000
  ): Promise<any> {
    // Execute based on agent type
    switch (agent.type) {
      case 'cli':
        return this.executeCLIAgentTask(agent, task, context, timeout);

      case 'workflow':
        return this.executeWorkflowAgentTask(agent, task, context, timeout);

      case 'sync':
        return this.executeSyncAgentTask(agent, task, context, timeout);

      case 'custom':
        return this.executeCustomAgentTask(agent, task, context, timeout);

      case 'federation':
        return this.executeFederationAgentTask(agent, task, context, timeout);

      default:`);
            throw new Error(Unsupported, agent, type, $, { agent, : .type } `);
    }
  }

  private async executeCLIAgentTask(agent: UnifiedAgent, task: any, context?: Record<string, any>, timeout = 30000): Promise<any> {
    // For now, implement a simple CLI execution without AgentOrchestrator
    // TODO: Integrate with proper CLI execution system
    const agentType = agent.integrationData?.cliCommands?.[0];
    if (!agentType) {
      throw new Error('No CLI command found for agent');
    }

    // Simulate CLI execution
    console.log(Executing CLI agent ${agentType}`);
            with (task)
                : , task;
            ;
            // Mock successful execution
            return {
                success: true,
                result: CLI, task, executed, for: $
            };
            {
                agentType;
            }
            context;
        }
        ;
    }
    async executeWorkflowAgentTask(agent, task, context, timeout = 30000) {
        // Delegate to workflow engine
        if (!this.workflowEngine) {
            // Initialize workflow engine if needed
            throw new Error('Workflow engine not initialized');
        }
        return { success: true, result: 'Workflow task executed', context };
    }
    async executeSyncAgentTask(agent, task, context, timeout = 30000) {
        // Delegate to sync orchestrator
        if (!this.syncOrchestrator) {
            throw new Error('Sync orchestrator not initialized');
        }
        return { success: true, result: 'Sync task executed', context };
    }
    async executeCustomAgentTask(agent, task, context, timeout = 30000) {
        // Execute custom agent logic
        return { success: true, result: 'Custom task executed', agent: agent.id, context };
    }
    async executeFederationAgentTask(agent, task, context, timeout = 30000) {
        // Delegate to federated agent
        const endpoint = agent.integrationData?.federationEndpoint;
        if (!endpoint) {
            throw new Error('No federation endpoint configured');
        }
        // Implementation would depend on federation protocol
        return { success: true, result: 'Federation task executed', endpoint, context };
    }
    updateAgentIndices(agent) {
        // Update capability index
        for (const capability of agent.capabilities) {
            if (!this.capabilities.has(capability)) {
                this.capabilities.set(capability, new Set());
            }
            this.capabilities.get(capability).add(agent.id);
        }
        // Update type index
        if (!this.agentsByType.has(agent.type)) {
            this.agentsByType.set(agent.type, new Set());
        }
        this.agentsByType.get(agent.type).add(agent.id);
        // Update status index
        if (!this.agentsByStatus.has(agent.status)) {
            this.agentsByStatus.set(agent.status, new Set());
        }
        this.agentsByStatus.get(agent.status).add(agent.id);
    }
    removeFromAgentIndices(agent) {
        // Remove from capability index
        for (const capability of agent.capabilities) {
            this.capabilities.get(capability)?.delete(agent.id);
            if (this.capabilities.get(capability)?.size === 0) {
                this.capabilities.delete(capability);
            }
        }
        // Remove from type index
        this.agentsByType.get(agent.type)?.delete(agent.id);
        // Remove from status index
        this.agentsByStatus.get(agent.status)?.delete(agent.id);
    }
    initializeMetrics() {
        return {
            totalExecutions: 0,
            successfulExecutions: 0,
            failedExecutions: 0,
            averageExecutionTime: 0,
            averageResponseTime: 0,
            successRate: 100,
            currentLoad: 0,
            maxLoad: 100,
            queueSize: 0,
            uptime: 0
        };
    }
    updateAgentMetrics(agentId, updates) {
        const agent = this.agents.get(agentId);
        if (!agent)
            return;
        // Apply incremental updates
        for (const [key, value] of Object.entries(updates)) {
            if (key === 'totalExecutions' || key === 'successfulExecutions' || key === 'failedExecutions') {
                agent.metrics[key] += value;
            }
            else if (key === 'averageExecutionTime' || key === 'averageResponseTime') {
                // Update running average
                const currentAvg = agent.metrics[key] || 0;
                const totalExec = agent.metrics.totalExecutions || 1;
                agent.metrics[key] = ((currentAvg * (totalExec - 1)) + value) / totalExec;
            }
            else {
                agent.metrics[key] = value;
            }
        }
        // Recalculate success rate
        if (agent.metrics.totalExecutions > 0) {
            agent.metrics.successRate =
                (agent.metrics.successfulExecutions / agent.metrics.totalExecutions) * 100;
        }
    }
    getDefaultConfiguration() {
        return {
            timeout: this.config.defaultTimeout,
            retryPolicy: {
                maxRetries: 3,
                backoffStrategy: 'exponential',
                baseDelay: 1000,
                maxDelay: 10000
            },
            resources: {
                cpu: { min: 0, max: 100, current: 0 },
                memory: { min: 0, max: 1024, current: 0 },
                concurrent: { max: 10, current: 0 }
            },
            communication: {
                protocols: ['websocket', 'redis'],
                preferredProtocol: 'websocket'
            },
            getDefaultLegacyMappings() {
                return {
                    cliAgentTypes: {
                        'code-assistant': 'cli',
                        'project-manager': 'cli',
                        'documentation-writer': 'cli',
                        'test-engineer': 'cli',
                        'deployment-specialist': 'cli',
                        'security-auditor': 'cli'
                    },
                    workflowNodeCapabilities: {
                        'api': ['api-call', 'http-request'],
                        'vectorStore': ['vector-search', 'embedding'],
                        'database': ['database-query', 'data-storage'],
                        'condition': ['conditional-logic', 'decision-making']
                    },
                    syncAgentTypes: {
                        'sync-coordinator': 'sync'
                    },
                    customAgentMappings: {}
                };
            },
            setupAgentHealthCheck(agentId, healthCheck) {
                const interval = setInterval(async () => {
                    try {
                        const isHealthy = await healthCheck();
                        const agent = this.agents.get(agentId);
                        if (!agent) {
                            clearInterval(interval);
                            return;
                        }
                        if (isHealthy) {
                            agent.lastSeen = new Date();
                            if (agent.status === 'error') {
                                await this.updateAgentStatus(agentId, 'available');
                            }
                        }
                        else {
                            await this.updateAgentStatus(agentId, 'error');
                        }
                    }
                    catch (error) {
                        await this.updateAgentStatus(agentId, 'error');
                    }
                }, this.config.healthCheckInterval);
                this.healthChecks.set(agentId, interval);
            },
            cleanupAgentHealthCheck(agentId) {
                const interval = this.healthChecks.get(agentId);
                if (interval) {
                    clearInterval(interval);
                    this.healthChecks.delete(agentId);
                }
            },
            startHealthCheckingSystem() {
                // Periodic health check for all agents without custom health checks
                setInterval(() => {
                    const staleThreshold = new Date(Date.now() - this.config.healthCheckInterval * 2);
                    for (const agent of this.agents.values()) {
                        if (agent.lastSeen < staleThreshold && agent.status !== 'offline') {
                            this.updateAgentStatus(agent.id, 'offline');
                        }
                    }
                }, this.config.healthCheckInterval);
            },
            setupMetricsCollection() {
                // Periodic metrics cleanup
                setInterval(() => {
                    const cutoff = Date.now() - this.config.metricsRetentionPeriod;
                    for (const [agentId, cached] of this.metricsCache) {
                        if (cached.timestamp < cutoff) {
                            this.metricsCache.delete(agentId);
                        }
                    }
                }, 60000); // Clean up every minute
            },
            setupPeriodicCleanup() {
                // Clean up stale data periodically
                setInterval(() => {
                    this.performPeriodicCleanup();
                }, 300000); // Every 5 minutes
            },
            performPeriodicCleanup() {
                // Remove agents that have been offline for too long
                const offlineThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours
                for (const agent of this.agents.values()) {
                    if (agent.status === 'offline' && agent.lastSeen < offlineThreshold) {
                        this.deregisterAgent(agent.id);
                    }
                }
            },
            generateAgentId() {
                `
    return agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` ``;
            },
            emitRegistryEvent(type, agentId, data) {
                if (!this.config.enableEventLogging)
                    return;
                const event = {
                    type,
                    agentId,
                    timestamp: new Date(),
                    data
                };
                this.emit('registry_event', event);
                this.emit(type, event);
            }
        };
    }
}
exports.UnifiedAgentRegistry = UnifiedAgentRegistry;
//# sourceMappingURL=UnifiedAgentRegistry.js.map