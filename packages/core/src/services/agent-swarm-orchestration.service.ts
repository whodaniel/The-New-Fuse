/**
 * Agent Swarm Orchestration Service
 * Inspired by the Python Agency Hub's swarm architecture
 * Implements hierarchical agent organization, communication flows, and service routing
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@the-new-fuse/database';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AgencyHubCacheService } from './agency-hub-cache.service';
import { 
  Agent, 
  Agency, 
  AgencyTier,
  User 
} from '@prisma/client';

// =====================================================
// CORE INTERFACES & TYPES
// =====================================================

export interface ServiceRequest {
  id: string;
  categoryId: string;
  requirements: Record<string, any>;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  location?: string;
  timeline?: {
    startDate?: Date;
    endDate?: Date;
    estimatedDuration?: number; // in hours
  };
  budget?: {
    min?: number;
    max?: number;
    currency: string;
  };
  requesterId: string;
  agencyId: string;
  metadata?: Record<string, any>;
}

export interface AgentCapability {
  name: string;
  category: string;
  proficiencyLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  tools: AgentTool[];
  constraints?: Record<string, any>;
}

export interface AgentTool {
  id: string;
  name: string;
  type: 'SERVICE_LOOKUP' | 'PROVIDER_MATCHING' | 'QUALITY_CONTROL' | 'ANALYTICS' | 'COMMUNICATION' | 'CUSTOM';
  configuration: Record<string, any>;
  permissions: string[];
}

export interface CommunicationFlow {
  fromAgentId: string;
  toAgentId: string;
  flowType: 'HANDOFF' | 'COLLABORATION' | 'SUPERVISION' | 'ESCALATION';
  conditions?: Record<string, any>;
  priority: number;
}

export interface AgencySwarmConfig {
  agencyId: string;
  hierarchy: AgentHierarchy;
  communicationFlows: CommunicationFlow[];
  sharedInstructions: string;
  temperature: number; // 0-1 for AI agent creativity
  qualityThreshold: number;
  autoScalingEnabled: boolean;
}

export interface AgentHierarchy {
  managers: string[]; // Agent IDs
  specialists: string[];
  support: string[];
  relationships: HierarchyRelationship[];
}

export interface HierarchyRelationship {
  supervisorId: string;
  subordinateIds: string[];
  relationshipType: 'MANAGES' | 'COORDINATES' | 'SUPPORTS';
}

export interface SwarmExecution {
  id: string;
  serviceRequestId: string;
  agencyId: string;
  status: 'INITIALIZING' | 'ROUTING' | 'EXECUTING' | 'COLLABORATING' | 'COMPLETED' | 'FAILED';
  activeAgents: string[];
  executionPlan: ExecutionStep[];
  startedAt: Date;
  completedAt?: Date;
  results?: Record<string, any>;
  qualityScore?: number;
}

export interface ExecutionStep {
  stepId: string;
  agentId: string;
  action: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
  startedAt?: Date;
  completedAt?: Date;
  results?: Record<string, any>;
  dependencies: string[]; // Other step IDs
}

// =====================================================
// MAIN SERVICE IMPLEMENTATION
// =====================================================

@Injectable()
export class AgentSwarmOrchestrationService {
  private readonly logger = new Logger(AgentSwarmOrchestrationService.name);
  private readonly activeSwarms = new Map<string, SwarmExecution>();
  private readonly messageQueues = new Map<string, any[]>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly cache: AgencyHubCacheService
  ) {
    this.initializeMessageBus();
  }

  // =====================================================
  // SERVICE REQUEST PROCESSING
  // =====================================================

  /**
   * Process a service request through the agency swarm
   */
  async processServiceRequest(
    request: ServiceRequest,
    swarmConfig?: Partial<AgencySwarmConfig>
  ): Promise<SwarmExecution> {
    this.logger.log(`Processing service request: ${request.id} for category: ${request.categoryId}`);

    // 1. Get or create swarm configuration
    const config = await this.getSwarmConfig(request.agencyId, swarmConfig);

    // 2. Route request to appropriate agents
    const selectedAgents = await this.routeRequest(request, config);

    // 3. Create execution plan
    const executionPlan = await this.createExecutionPlan(request, selectedAgents, config);

    // 4. Initialize swarm execution
    const swarmExecution: SwarmExecution = {
      id: this.generateExecutionId(),
      serviceRequestId: request.id,
      agencyId: request.agencyId,
      status: 'INITIALIZING',
      activeAgents: selectedAgents.map(agent => agent.id),
      executionPlan,
      startedAt: new Date()
    };

    this.activeSwarms.set(swarmExecution.id, swarmExecution);

    // 5. Start execution
    await this.executeSwarm(swarmExecution, config);

    return swarmExecution;
  }

  /**
   * Route service request to appropriate agents based on capabilities
   */
  private async routeRequest(
    request: ServiceRequest,
    config: AgencySwarmConfig
  ): Promise<Agent[]> {
    const agency = await this.prisma.agency.findUnique({
      where: { id: request.agencyId },
      include: { agents: true }
    });

    if (!agency) {
      throw new Error(`Agency not found: ${request.agencyId}`);
    }

    // 1. Find agents with matching capabilities
    const matchingAgents = agency.agents.filter(agent => 
      this.agentMatchesRequest(agent, request)
    );

    // 2. Apply hierarchy-based selection
    const selectedAgents = this.selectAgentsByHierarchy(
      matchingAgents,
      config.hierarchy,
      request
    );

    // 3. Ensure minimum viable team
    return this.ensureMinimumViableTeam(selectedAgents, request, agency.agents);
  }

  /**
   * Check if agent capabilities match service request requirements
   */
  private agentMatchesRequest(agent: Agent, request: ServiceRequest): boolean {
    // Parse agent capabilities from configuration
    const capabilities = agent.capabilities as AgentCapability[] || [];
    
    return capabilities.some(capability => 
      capability.category === request.categoryId ||
      this.isCapabilityCompatible(capability, request.requirements)
    );
  }

  /**
   * Select agents based on hierarchy and optimization
   */
  private selectAgentsByHierarchy(
    candidates: Agent[],
    hierarchy: AgentHierarchy,
    request: ServiceRequest
  ): Agent[] {
    const selected: Agent[] = [];

    // Always include a manager for complex requests
    if (request.priority === 'HIGH' || request.priority === 'URGENT') {
      const managers = candidates.filter(agent => 
        hierarchy.managers.includes(agent.id)
      );
      if (managers.length > 0) {
        selected.push(managers[0]); // Select best available manager
      }
    }

    // Add specialists based on requirements
    const specialists = candidates.filter(agent =>
      hierarchy.specialists.includes(agent.id)
    );
    selected.push(...this.selectBestSpecialists(specialists, request, 3));

    // Add support if needed
    if (request.requirements.needsSupport) {
      const supportAgents = candidates.filter(agent =>
        hierarchy.support.includes(agent.id)
      );
      if (supportAgents.length > 0) {
        selected.push(supportAgents[0]);
      }
    }

    return selected;
  }

  /**
   * Create execution plan for the swarm
   */
  private async createExecutionPlan(
    request: ServiceRequest,
    agents: Agent[],
    config: AgencySwarmConfig
  ): Promise<ExecutionStep[]> {
    const steps: ExecutionStep[] = [];

    // 1. Analysis phase
    steps.push({
      stepId: 'analysis',
      agentId: agents[0]?.id || '',
      action: 'ANALYZE_REQUEST',
      status: 'PENDING',
      dependencies: []
    });

    // 2. Planning phase
    if (agents.some(a => config.hierarchy.managers.includes(a.id))) {
      steps.push({
        stepId: 'planning',
        agentId: agents.find(a => config.hierarchy.managers.includes(a.id))?.id || '',
        action: 'CREATE_EXECUTION_PLAN',
        status: 'PENDING',
        dependencies: ['analysis']
      });
    }

    // 3. Execution phases (parallel where possible)
    const specialists = agents.filter(a => config.hierarchy.specialists.includes(a.id));
    specialists.forEach((agent, index) => {
      steps.push({
        stepId: `execution_${index}`,
        agentId: agent.id,
        action: 'EXECUTE_SPECIALIST_TASK',
        status: 'PENDING',
        dependencies: config.hierarchy.managers.length > 0 ? ['planning'] : ['analysis']
      });
    });

    // 4. Quality control
    steps.push({
      stepId: 'quality_control',
      agentId: agents[0]?.id || '',
      action: 'QUALITY_REVIEW',
      status: 'PENDING',
      dependencies: specialists.map((_, index) => `execution_${index}`)
    });

    // 5. Finalization
    steps.push({
      stepId: 'finalization',
      agentId: agents.find(a => config.hierarchy.managers.includes(a.id))?.id || agents[0]?.id || '',
      action: 'FINALIZE_RESULTS',
      status: 'PENDING',
      dependencies: ['quality_control']
    });

    return steps;
  }

  // =====================================================
  // SWARM EXECUTION ENGINE
  // =====================================================

  /**
   * Execute the swarm orchestration
   */
  private async executeSwarm(
    execution: SwarmExecution,
    config: AgencySwarmConfig
  ): Promise<void> {
    try {
      execution.status = 'EXECUTING';
      this.activeSwarms.set(execution.id, execution);

      // Execute steps according to dependencies
      await this.executeStepsInOrder(execution, config);

      // Calculate quality score
      execution.qualityScore = await this.calculateQualityScore(execution);

      // Complete execution
      execution.status = 'COMPLETED';
      execution.completedAt = new Date();

      this.logger.log(`Swarm execution completed: ${execution.id} with quality score: ${execution.qualityScore}`);

      // Emit completion event
      this.eventEmitter.emit('swarm.execution.completed', {
        executionId: execution.id,
        agencyId: execution.agencyId,
        qualityScore: execution.qualityScore,
        duration: execution.completedAt.getTime() - execution.startedAt.getTime()
      });

    } catch (error) {
      execution.status = 'FAILED';
      execution.completedAt = new Date();
      this.logger.error(`Swarm execution failed: ${execution.id}`, error);

      this.eventEmitter.emit('swarm.execution.failed', {
        executionId: execution.id,
        agencyId: execution.agencyId,
        error: error.message
      });
    }
  }

  /**
   * Execute steps respecting dependencies
   */
  private async executeStepsInOrder(
    execution: SwarmExecution,
    config: AgencySwarmConfig
  ): Promise<void> {
    const completedSteps = new Set<string>();
    const maxRetries = 3;

    while (completedSteps.size < execution.executionPlan.length) {
      const readySteps = execution.executionPlan.filter(step =>
        step.status === 'PENDING' &&
        step.dependencies.every(dep => completedSteps.has(dep))
      );

      if (readySteps.length === 0) {
        // Check for circular dependencies or stuck execution
        const pendingSteps = execution.executionPlan.filter(s => s.status === 'PENDING');
        if (pendingSteps.length > 0) {
          throw new Error(`Execution stuck: circular dependencies detected`);
        }
        break;
      }

      // Execute ready steps in parallel
      await Promise.all(
        readySteps.map(step => this.executeStep(step, execution, config))
      );

      // Mark completed steps
      readySteps.forEach(step => {
        if (step.status === 'COMPLETED') {
          completedSteps.add(step.stepId);
        }
      });
    }
  }

  /**
   * Execute individual step
   */
  private async executeStep(
    step: ExecutionStep,
    execution: SwarmExecution,
    config: AgencySwarmConfig
  ): Promise<void> {
    step.status = 'IN_PROGRESS';
    step.startedAt = new Date();

    try {
      this.logger.debug(`Executing step: ${step.stepId} by agent: ${step.agentId}`);

      // Get agent details
      const agent = await this.prisma.agent.findUnique({
        where: { id: step.agentId }
      });

      if (!agent) {
        throw new Error(`Agent not found: ${step.agentId}`);
      }

      // Execute the step based on action type
      step.results = await this.executeAgentAction(agent, step.action, execution, config);

      step.status = 'COMPLETED';
      step.completedAt = new Date();

      // Send results through message bus
      await this.sendMessage(`agent_${step.agentId}`, {
        type: 'STEP_COMPLETED',
        stepId: step.stepId,
        results: step.results,
        timestamp: new Date()
      });

    } catch (error) {
      step.status = 'FAILED';
      step.completedAt = new Date();
      this.logger.error(`Step execution failed: ${step.stepId}`, error);
      throw error;
    }
  }

  // =====================================================
  // AGENT ACTION EXECUTION
  // =====================================================

  /**
   * Execute specific agent action
   */
  private async executeAgentAction(
    agent: Agent,
    action: string,
    execution: SwarmExecution,
    config: AgencySwarmConfig
  ): Promise<Record<string, any>> {
    switch (action) {
      case 'ANALYZE_REQUEST':
        return this.analyzeServiceRequest(agent, execution);

      case 'CREATE_EXECUTION_PLAN':
        return this.createDetailedPlan(agent, execution);

      case 'EXECUTE_SPECIALIST_TASK':
        return this.executeSpecialistTask(agent, execution);

      case 'QUALITY_REVIEW':
        return this.performQualityReview(agent, execution, config);

      case 'FINALIZE_RESULTS':
        return this.finalizeResults(agent, execution);

      default:
        return this.executeCustomAction(agent, action, execution);
    }
  }

  /**
   * Analyze service request requirements
   */
  private async analyzeServiceRequest(
    agent: Agent,
    execution: SwarmExecution
  ): Promise<Record<string, any>> {
    // Simulate AI analysis of the service request
    return {
      complexity: 'MEDIUM',
      estimatedDuration: 120, // minutes
      requiredSkills: ['problem_solving', 'technical_analysis'],
      riskFactors: ['timeline_constraint'],
      recommendedApproach: 'collaborative_execution'
    };
  }

  /**
   * Create detailed execution plan
   */
  private async createDetailedPlan(
    agent: Agent,
    execution: SwarmExecution
  ): Promise<Record<string, any>> {
    return {
      phases: [
        { name: 'Research', duration: 30, priority: 'HIGH' },
        { name: 'Implementation', duration: 60, priority: 'HIGH' },
        { name: 'Testing', duration: 20, priority: 'MEDIUM' },
        { name: 'Documentation', duration: 10, priority: 'LOW' }
      ],
      resourceAllocation: {
        specialists: execution.activeAgents.length - 1,
        estimatedCost: 500
      },
      successCriteria: ['functional_requirements_met', 'quality_standards_achieved']
    };
  }

  /**
   * Execute specialist task
   */
  private async executeSpecialistTask(
    agent: Agent,
    execution: SwarmExecution
  ): Promise<Record<string, any>> {
    // Simulate specialist work execution
    const capabilities = agent.capabilities as AgentCapability[] || [];
    
    return {
      tasksCompleted: capabilities.map(cap => cap.name),
      deliverables: ['technical_implementation', 'documentation'],
      qualityMetrics: {
        accuracy: 0.95,
        completeness: 0.98,
        timeliness: 0.92
      }
    };
  }

  /**
   * Perform quality review
   */
  private async performQualityReview(
    agent: Agent,
    execution: SwarmExecution,
    config: AgencySwarmConfig
  ): Promise<Record<string, any>> {
    const completedSteps = execution.executionPlan.filter(s => s.status === 'COMPLETED');
    const avgQuality = completedSteps.reduce((sum, step) => {
      const metrics = step.results?.qualityMetrics;
      return sum + (metrics ? (metrics.accuracy + metrics.completeness + metrics.timeliness) / 3 : 0.8);
    }, 0) / completedSteps.length;

    return {
      overallQuality: avgQuality,
      passesThreshold: avgQuality >= config.qualityThreshold,
      recommendations: avgQuality < config.qualityThreshold ? ['require_rework', 'additional_review'] : ['approve_for_delivery'],
      reviewNotes: `Quality assessment completed with score: ${avgQuality.toFixed(2)}`
    };
  }

  /**
   * Finalize execution results
   */
  private async finalizeResults(
    agent: Agent,
    execution: SwarmExecution
  ): Promise<Record<string, any>> {
    const allResults = execution.executionPlan
      .filter(s => s.status === 'COMPLETED' && s.results)
      .map(s => s.results);

    return {
      consolidatedResults: this.consolidateResults(allResults),
      deliveryPackage: {
        completionDate: new Date(),
        deliverables: this.extractDeliverables(allResults),
        qualityAssurance: this.extractQualityMetrics(allResults)
      },
      nextSteps: ['client_delivery', 'feedback_collection', 'performance_analysis']
    };
  }

  // =====================================================
  // MESSAGE BUS & COMMUNICATION
  // =====================================================

  /**
   * Initialize message bus for inter-agent communication
   */
  private initializeMessageBus(): void {
    this.logger.log('Initializing agent message bus');
    
    // Set up default queues
    this.createQueue('system_events');
    this.createQueue('agent_coordination');
    this.createQueue('quality_alerts');
    this.createQueue('execution_updates');
  }

  /**
   * Create message queue
   */
  private createQueue(queueName: string): void {
    if (!this.messageQueues.has(queueName)) {
      this.messageQueues.set(queueName, []);
      this.logger.debug(`Created message queue: ${queueName}`);
    }
  }

  /**
   * Send message to queue
   */
  private async sendMessage(queueName: string, message: any): Promise<void> {
    this.createQueue(queueName);
    this.messageQueues.get(queueName)?.push({
      ...message,
      id: this.generateMessageId(),
      timestamp: new Date()
    });

    // Emit event for real-time listeners
    this.eventEmitter.emit('message.sent', { queueName, message });
  }

  /**
   * Receive message from queue
   */
  async receiveMessage(queueName: string): Promise<any | null> {
    const queue = this.messageQueues.get(queueName);
    return queue && queue.length > 0 ? queue.shift() : null;
  }

  // =====================================================
  // CONFIGURATION MANAGEMENT
  // =====================================================

  /**
   * Get swarm configuration for agency
   */
  private async getSwarmConfig(
    agencyId: string,
    overrides?: Partial<AgencySwarmConfig>
  ): Promise<AgencySwarmConfig> {
    // Get agency agents
    const agency = await this.prisma.agency.findUnique({
      where: { id: agencyId },
      include: { agents: true }
    });

    if (!agency) {
      throw new Error(`Agency not found: ${agencyId}`);
    }

    // Create default hierarchy
    const hierarchy = this.createDefaultHierarchy(agency.agents);

    // Default configuration
    const defaultConfig: AgencySwarmConfig = {
      agencyId,
      hierarchy,
      communicationFlows: this.createDefaultCommunicationFlows(hierarchy),
      sharedInstructions: this.getSharedInstructions(agency.subscriptionTier),
      temperature: 0.7,
      qualityThreshold: 0.8,
      autoScalingEnabled: agency.subscriptionTier !== AgencyTier.TRIAL
    };

    return { ...defaultConfig, ...overrides };
  }

  /**
   * Create default agent hierarchy
   */
  private createDefaultHierarchy(agents: Agent[]): AgentHierarchy {
    // Simple classification based on agent type and capabilities
    const managers = agents.filter(a => 
      a.type === 'MANAGER' || 
      (a.capabilities as any)?.some?.((c: any) => c.category === 'management')
    ).map(a => a.id);

    const specialists = agents.filter(a => 
      a.type === 'SPECIALIST' || 
      (!managers.includes(a.id) && a.type !== 'SUPPORT')
    ).map(a => a.id);

    const support = agents.filter(a => 
      a.type === 'SUPPORT' ||
      (a.capabilities as any)?.some?.((c: any) => c.category === 'support')
    ).map(a => a.id);

    return {
      managers,
      specialists,
      support,
      relationships: [
        ...managers.map(managerId => ({
          supervisorId: managerId,
          subordinateIds: [...specialists, ...support],
          relationshipType: 'MANAGES' as const
        }))
      ]
    };
  }

  // =====================================================
  // UTILITY METHODS
  // =====================================================

  private generateExecutionId(): string {
    return `swarm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private isCapabilityCompatible(capability: AgentCapability, requirements: Record<string, any>): boolean {
    // Simple compatibility check - can be enhanced with ML matching
    return Object.keys(requirements).some(req => 
      capability.name.toLowerCase().includes(req.toLowerCase()) ||
      capability.category.toLowerCase().includes(req.toLowerCase())
    );
  }

  private selectBestSpecialists(specialists: Agent[], request: ServiceRequest, maxCount: number): Agent[] {
    // Rank specialists by capability match and select top performers
    return specialists
      .sort((a, b) => this.calculateAgentScore(b, request) - this.calculateAgentScore(a, request))
      .slice(0, maxCount);
  }

  private calculateAgentScore(agent: Agent, request: ServiceRequest): number {
    // Simple scoring algorithm - can be enhanced with ML
    const capabilities = agent.capabilities as AgentCapability[] || [];
    let score = 0;

    capabilities.forEach(cap => {
      if (cap.category === request.categoryId) score += 10;
      if (this.isCapabilityCompatible(cap, request.requirements)) score += 5;
      if (cap.proficiencyLevel === 'EXPERT') score += 3;
      if (cap.proficiencyLevel === 'ADVANCED') score += 2;
    });

    return score;
  }

  private ensureMinimumViableTeam(selected: Agent[], request: ServiceRequest, allAgents: Agent[]): Agent[] {
    if (selected.length === 0) {
      // Emergency fallback - select any available agent
      return allAgents.slice(0, 1);
    }
    return selected;
  }

  private executeCustomAction(agent: Agent, action: string, execution: SwarmExecution): Promise<Record<string, any>> {
    // Placeholder for custom action execution
    return Promise.resolve({
      action,
      agentId: agent.id,
      status: 'completed',
      message: `Custom action ${action} executed successfully`
    });
  }

  private consolidateResults(results: Record<string, any>[]): Record<string, any> {
    return results.reduce((consolidated, result) => ({
      ...consolidated,
      ...result
    }), {});
  }

  private extractDeliverables(results: Record<string, any>[]): string[] {
    return results.flatMap(r => r.deliverables || []);
  }

  private extractQualityMetrics(results: Record<string, any>[]): Record<string, number> {
    const metrics = results.map(r => r.qualityMetrics).filter(Boolean);
    if (metrics.length === 0) return { overall: 0.8 };

    const avgMetrics = metrics.reduce((sum, m) => ({
      accuracy: sum.accuracy + (m.accuracy || 0),
      completeness: sum.completeness + (m.completeness || 0),
      timeliness: sum.timeliness + (m.timeliness || 0)
    }), { accuracy: 0, completeness: 0, timeliness: 0 });

    return {
      accuracy: avgMetrics.accuracy / metrics.length,
      completeness: avgMetrics.completeness / metrics.length,
      timeliness: avgMetrics.timeliness / metrics.length,
      overall: (avgMetrics.accuracy + avgMetrics.completeness + avgMetrics.timeliness) / (3 * metrics.length)
    };
  }

  private async calculateQualityScore(execution: SwarmExecution): Promise<number> {
    const qualityReviewStep = execution.executionPlan.find(s => s.action === 'QUALITY_REVIEW');
    return qualityReviewStep?.results?.overallQuality || 0.8;
  }

  private createDefaultCommunicationFlows(hierarchy: AgentHierarchy): CommunicationFlow[] {
    const flows: CommunicationFlow[] = [];

    // Manager to all flows
    hierarchy.managers.forEach(managerId => {
      [...hierarchy.specialists, ...hierarchy.support].forEach(agentId => {
        flows.push({
          fromAgentId: managerId,
          toAgentId: agentId,
          flowType: 'SUPERVISION',
          priority: 1
        });
      });
    });

    // Specialist collaboration flows
    hierarchy.specialists.forEach((agentId, index) => {
      hierarchy.specialists.slice(index + 1).forEach(otherAgentId => {
        flows.push({
          fromAgentId: agentId,
          toAgentId: otherAgentId,
          flowType: 'COLLABORATION',
          priority: 2
        });
      });
    });

    return flows;
  }

  private getSharedInstructions(tier: AgencyTier): string {
    const instructions = {
      [AgencyTier.TRIAL]: 'Basic collaboration protocols. Focus on learning and simple tasks.',
      [AgencyTier.STARTER]: 'Standard operational procedures. Moderate complexity handling.',
      [AgencyTier.PROFESSIONAL]: 'Advanced collaboration protocols. Complex task orchestration.',
      [AgencyTier.ENTERPRISE]: 'Enterprise-grade procedures. Full automation and optimization.',
      [AgencyTier.WHITE_LABEL]: 'Custom protocols with full autonomy and advanced AI capabilities.'
    };

    return instructions[tier] || instructions[AgencyTier.STARTER];
  }

  // =====================================================
  // PUBLIC API METHODS
  // =====================================================

  /**
   * Get active swarm executions for an agency
   */
  async getActiveSwarms(agencyId: string): Promise<SwarmExecution[]> {
    return Array.from(this.activeSwarms.values())
      .filter(exec => exec.agencyId === agencyId);
  }

  /**
   * Get swarm execution details
   */
  async getSwarmExecution(executionId: string): Promise<SwarmExecution | null> {
    return this.activeSwarms.get(executionId) || null;
  }

  /**
   * Cancel running swarm execution
   */
  async cancelSwarmExecution(executionId: string): Promise<boolean> {
    const execution = this.activeSwarms.get(executionId);
    if (execution && execution.status === 'EXECUTING') {
      execution.status = 'FAILED';
      execution.completedAt = new Date();
      this.logger.log(`Swarm execution cancelled: ${executionId}`);
      return true;
    }
    return false;
  }

  /**
   * Get agent performance metrics
   */
  async getAgentPerformanceMetrics(agentId: string, timeframe: { start: Date; end: Date }): Promise<Record<string, any>> {
    const executions = Array.from(this.activeSwarms.values())
      .filter(exec => 
        exec.activeAgents.includes(agentId) &&
        exec.startedAt >= timeframe.start &&
        (exec.completedAt || new Date()) <= timeframe.end
      );

    const completedSteps = executions.flatMap(exec => 
      exec.executionPlan.filter(step => 
        step.agentId === agentId && step.status === 'COMPLETED'
      )
    );

    return {
      totalExecutions: executions.length,
      completedSteps: completedSteps.length,
      averageExecutionTime: this.calculateAverageExecutionTime(completedSteps),
      successRate: completedSteps.length / (completedSteps.length + executions.flatMap(e => e.executionPlan).filter(s => s.agentId === agentId && s.status === 'FAILED').length),
      qualityScore: this.calculateAverageQualityScore(completedSteps)
    };
  }

  private calculateAverageExecutionTime(steps: ExecutionStep[]): number {
    const timings = steps
      .filter(s => s.startedAt && s.completedAt)
      .map(s => s.completedAt!.getTime() - s.startedAt!.getTime());
    
    return timings.length > 0 ? timings.reduce((sum, time) => sum + time, 0) / timings.length : 0;
  }

  private calculateAverageQualityScore(steps: ExecutionStep[]): number {
    const qualityScores = steps
      .map(s => s.results?.qualityMetrics?.overall)
      .filter(score => score !== undefined);
    
    return qualityScores.length > 0 ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length : 0;
  }
}
