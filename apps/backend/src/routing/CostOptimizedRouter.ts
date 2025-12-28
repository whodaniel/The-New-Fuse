import { Injectable, Logger } from '@nestjs/common';
import { AgentTask } from '@the-new-fuse/core';
import Redis from 'ioredis';

export interface AgentCostModel {
  agentId: string;
  costPerTask: number; // in credits/cents
  intelligenceLevel: 1 | 2 | 3 | 4 | 5; // 1=simple, 5=complex
  capabilities: string[];
  averageExecutionTime: number; // milliseconds
  successRate: number; // 0-1
  maxConcurrency: number; // max parallel tasks
}

export interface RoutingDecision {
  selectedAgent: string;
  cost: number;
  score: number;
  alternatives: Array<{
    agentId: string;
    cost: number;
    score: number;
    reason: string;
  }>;
}

/**
 * CostOptimizedRouter
 * 
 * Routes tasks to the LOWEST COST agent that meets requirements.
 * 
 * Priority:
 * 1. Meets capability requirements
 * 2. Meets intelligence requirements
 * 3. Within budget
 * 4. Lowest cost
 * 5. Highest success rate
 * 6. Fastest execution
 * 
 * This ensures we don't waste expensive GPT-4/Opus calls on simple tasks.
 */
@Injectable()
export class CostOptimizedRouter {
  private readonly logger = new Logger(CostOptimizedRouter.name);
  private readonly redis: Redis;
  private readonly agentCostRegistry: Map<string, AgentCostModel>;

  constructor(redis: Redis) {
    this.redis = redis;
    this.agentCostRegistry = this.initializeAgentCostRegistry();
  }

  /**
   * Initialize agent cost registry
   * This could be loaded from config/database in production
   */
  private initializeAgentCostRegistry(): Map<string, AgentCostModel> {
    const registry = new Map<string, AgentCostModel>();

    // Local/cheap agents
    registry.set('jules-cli', {
      agentId: 'jules-cli',
      costPerTask: 0.01, // $0.01 per task (local execution)
      intelligenceLevel: 2,
      capabilities: [
        'file-operations',
        'simple-analysis',
        'code-formatting',
        'basic-refactoring'
      ],
      averageExecutionTime: 500,
      successRate: 0.95,
      maxConcurrency: 10
    });

    registry.set('codebase-indexer', {
      agentId: 'codebase-indexer',
      costPerTask: 0.05, // $0.05 per task
      intelligenceLevel: 3,
      capabilities: [
        'ast-parsing',
        'dependency-analysis',
        'synergy-detection',
        'duplication-detection'
      ],
      averageExecutionTime: 5000,
      successRate: 0.90,
      maxConcurrency: 3
    });

    // AI agents (API-based, more expensive)
    registry.set('claude-3-haiku', {
      agentId: 'claude-3-haiku',
      costPerTask: 0.10, // ~$0.10 per task (API cost)
      intelligenceLevel: 3,
      capabilities: [
        'code-generation',
        'simple-reasoning',
        'text-processing',
        'basic-debugging'
      ],
      averageExecutionTime: 2000,
      successRate: 0.92,
      maxConcurrency: 5
    });

    registry.set('claude-3-sonnet', {
      agentId: 'claude-3-sonnet',
      costPerTask: 0.50, // ~$0.50 per task
      intelligenceLevel: 4,
      capabilities: [
        'complex-reasoning',
        'code-generation',
        'architecture-design',
        'code-review',
        'debugging'
      ],
      averageExecutionTime: 5000,
      successRate: 0.95,
      maxConcurrency: 3
    });

    registry.set('claude-3-opus', {
      agentId: 'claude-3-opus',
      costPerTask: 2.00, // ~$2.00 per task (expensive!)
      intelligenceLevel: 5,
      capabilities: [
        'advanced-reasoning',
        'complex-problem-solving',
        'creative-solutions',
        'system-design',
        'security-analysis'
      ],
      averageExecutionTime: 10000,
      successRate: 0.98,
      maxConcurrency: 2
    });

    registry.set('gemini-flash', {
      agentId: 'gemini-flash',
      costPerTask: 0.08, // ~$0.08 per task
      intelligenceLevel: 3,
      capabilities: [
        'fast-reasoning',
        'multimodal',
        'code-generation',
        'quick-analysis'
      ],
      averageExecutionTime: 1500,
      successRate: 0.91,
      maxConcurrency: 5
    });

    registry.set('gemini-pro', {
      agentId: 'gemini-pro',
      costPerTask: 0.40, // ~$0.40 per task
      intelligenceLevel: 4,
      capabilities: [
        'complex-reasoning',
        'multimodal',
        'code-generation',
        'data-analysis'
      ],
      averageExecutionTime: 4000,
      successRate: 0.94,
      maxConcurrency: 3
    });

    return registry;
  }

  /**
   * Route task to most cost-effective agent
   */
  async routeTask(task: AgentTask): Promise<RoutingDecision> {
    const requiredCapabilities = task.requiresSkills || [];
    const requiredIntelligence = this.assessTaskComplexity(task);
    const budget = task.metadata?.budget || Infinity;

    this.logger.log(
      `Routing task ${task.id} (type: ${task.type}, intelligence: ${requiredIntelligence}/5, budget: $${budget})`
    );

    // 1. Find all capable agents
    const capableAgents = this.findCapableAgents(requiredCapabilities, requiredIntelligence);

    if (capableAgents.length === 0) {
      throw new Error(
        `No agents found with capabilities: ${requiredCapabilities.join(', ')} ` +
        `and intelligence >= ${requiredIntelligence}`
      );
    }

    // 2. Check current load for each agent
    const agentLoads = await this.getAgentCurrentLoads(capableAgents.map(a => a.agentId));

    // 3. Filter out agents at max capacity
    const availableAgents = capableAgents.filter(
      agent => agentLoads.get(agent.agentId)! < agent.maxConcurrency
    );

    if (availableAgents.length === 0) {
      this.logger.warn('All capable agents at max capacity, queuing task...');
      // In production, this would queue the task for retry
      throw new Error('All capable agents busy');
    }

    // 4. Calculate cost-effectiveness score for each
    const scored = availableAgents.map(agent => ({
      agent,
      score: this.calculateCostEffectiveness(agent, requiredIntelligence, budget)
    }));

    // 5. Sort by score (higher is better)
    scored.sort((a, b) => b.score - a.score);

    // 6. Select best agent
    const selected = scored[0];
    const alternatives = scored.slice(1, 4).map(s => ({
      agentId: s.agent.agentId,
      cost: s.agent.costPerTask,
      score: s.score,
      reason: this.getAlternativeReason(s.agent, selected.agent)
    }));

    this.logger.log(
      `✅ Selected ${selected.agent.agentId} for task ${task.id} ` +
      `(cost: $${selected.agent.costPerTask}, score: ${selected.score.toFixed(2)})`
    );

    // 7. Record routing decision for analytics
    await this.recordRoutingDecision(task.id, selected.agent.agentId, selected.score);

    return {
      selectedAgent: selected.agent.agentId,
      cost: selected.agent.costPerTask,
      score: selected.score,
      alternatives
    };
  }

  /**
   * Find agents that meet capability and intelligence requirements
   */
  private findCapableAgents(
    requiredCapabilities: string[],
    requiredIntelligence: number
  ): AgentCostModel[] {
    const capable: AgentCostModel[] = [];

    for (const agent of this.agentCostRegistry.values()) {
      // Check if agent has ALL required capabilities
      const hasAllCapabilities = requiredCapabilities.every(cap =>
        agent.capabilities.some(agentCap => 
          agentCap.includes(cap) || cap.includes(agentCap)
        )
      );

      // Check if agent meets intelligence requirement
      const meetsIntelligence = agent.intelligenceLevel >= requiredIntelligence;

      if (hasAllCapabilities && meetsIntelligence) {
        capable.push(agent);
      }
    }

    return capable;
  }

  /**
   * Calculate cost-effectiveness score
   * Higher score = better choice
   */
  private calculateCostEffectiveness(
    agent: AgentCostModel,
    requiredIntelligence: number,
    budget: number
  ): number {
    // Cost score: Lower cost = higher score
    const costScore = 1 / agent.costPerTask;

    // Success score: Higher success rate = higher score
    const successScore = agent.successRate;

    // Intelligence weight: Prefer exact match, penalize over/under
    const intelligenceDiff = agent.intelligenceLevel - requiredIntelligence;
    const intelligenceWeight =
      intelligenceDiff === 0 ? 1.5 :  // Perfect match (bonus!)
      intelligenceDiff === 1 ? 1.2 :  // Slight overkill (ok)
      intelligenceDiff === 2 ? 1.0 :  // Moderate overkill (acceptable)
      intelligenceDiff < 0 ? 0 :      // Insufficient (filtered out earlier)
      0.8;                            // Too much overkill (wasteful)

    // Budget fit: Penalize heavily if over budget
    const budgetFit = agent.costPerTask <= budget ? 1.0 : 0.1;

    // Speed bonus: Faster is better (normalized to ~1, less important than cost)
    const speedBonus = 10000 / agent.averageExecutionTime;

    // Combined score
    const score =
      costScore * 10 +          // Cost is most important (weight: 10x)
      successScore * 5 +         // Success rate is important (weight: 5x)
      intelligenceWeight * 3 +   // Intelligence match is important (weight: 3x)
      budgetFit * 20 +           // Budget fit is critical (weight: 20x)
      speedBonus * 0.5;          // Speed is nice-to-have (weight: 0.5x)

    return score;
  }

  /**
   * Assess task complexity to determine required intelligence level
   */
  private assessTaskComplexity(task: AgentTask): number {
    const type = task.type.toLowerCase();
    const data = JSON.stringify(task.data).toLowerCase();

    // Level 1: Very simple (file operations, basic tasks)
    if (
      type.includes('simple') ||
      type.includes('copy') ||
      type.includes('move') ||
      type.includes('delete') ||
      type.includes('format')
    ) {
      return 1;
    }

    // Level 2: Basic processing (parsing, extraction)
    if (
      type.includes('parse') ||
      type.includes('extract') ||
      type.includes('transform') ||
      type.includes('validate')
    ) {
      return 2;
    }

    // Level 3: Analysis (code analysis, detection)
    if (
      type.includes('analyze') ||
      type.includes('detect') ||
      type.includes('index') ||
      type.includes('search')
    ) {
      return 3;
    }

    // Level 4: Design/Architecture (complex reasoning)
    if (
      type.includes('design') ||
      type.includes('architect') ||
      type.includes('optimize') ||
      type.includes('refactor') ||
      type.includes('review')
    ) {
      return 4;
    }

    // Level 5: Creative/Complex (problem-solving, invention)
    if (
      type.includes('solve') ||
      type.includes('invent') ||
      type.includes('create') ||
      type.includes('security') ||
      type.includes('research')
    ) {
      return 5;
    }

    // Check task data for complexity hints
    if (data.includes('complex') || data.includes('advanced')) {
      return 4;
    }

    // Default to medium complexity
    return 3;
  }

  /**
   * Get current load for each agent (number of in-progress tasks)
   */
  private async getAgentCurrentLoads(agentIds: string[]): Promise<Map<string, number>> {
    const loads = new Map<string, number>();

    for (const agentId of agentIds) {
      // Get in-progress task count from agent's inbox
      const count = await this.redis.llen(`agent:${agentId}:inbox:tasks:in-progress`);
      loads.set(agentId, count);
    }

    return loads;
  }

  /**
   * Record routing decision for analytics
   */
  private async recordRoutingDecision(
    taskId: string,
    selectedAgent: string,
    score: number
  ): Promise<void> {
    await this.redis.zadd(
      'routing:decisions',
      Date.now(),
      JSON.stringify({ taskId, selectedAgent, score, timestamp: new Date() })
    );

    // Increment counter for selected agent
    await this.redis.hincrby('routing:agent-usage', selectedAgent, 1);
  }

  /**
   * Get reason why alternative agent wasn't selected
   */
  private getAlternativeReason(
    alternative: AgentCostModel,
    selected: AgentCostModel
  ): string {
    if (alternative.costPerTask > selected.costPerTask * 2) {
      return `Too expensive ($${alternative.costPerTask} vs $${selected.costPerTask})`;
    }
    if (alternative.intelligenceLevel > selected.intelligenceLevel + 1) {
      return 'Overkill intelligence for this task';
    }
    if (alternative.successRate < selected.successRate) {
      return `Lower success rate (${alternative.successRate} vs ${selected.successRate})`;
    }
    return 'Lower cost-effectiveness score';
  }

  /**
   * Get routing statistics
   */
  async getRoutingStats(): Promise<{
    totalRoutings: number;
    agentUsage: Map<string, number>;
    averageCost: number;
  }> {
    const usage = await this.redis.hgetall('routing:agent-usage');
    const agentUsage = new Map(Object.entries(usage).map(([k, v]) => [k, parseInt(v, 10)]));

    const totalRoutings = Array.from(agentUsage.values()).reduce((sum, count) => sum + count, 0);

    // Calculate average cost
    let totalCost = 0;
    for (const [agentId, count] of agentUsage) {
      const agent = this.agentCostRegistry.get(agentId);
      if (agent) {
        totalCost += agent.costPerTask * count;
      }
    }
    const averageCost = totalRoutings > 0 ? totalCost / totalRoutings : 0;

    return {
      totalRoutings,
      agentUsage,
      averageCost
    };
  }

  /**
   * Get savings report (vs always using most expensive agent)
   */
  async getSavingsReport(): Promise<{
    actualCost: number;
    worstCaseCost: number;
    savings: number;
    savingsPercentage: number;
  }> {
    const stats = await this.getRoutingStats();
    
    // Calculate what it would have cost if we always used Claude Opus
    const opusModel = this.agentCostRegistry.get('claude-3-opus')!;
    const worstCaseCost = stats.totalRoutings * opusModel.costPerTask;
    
    // Actual cost
    let actualCost = 0;
    for (const [agentId, count] of stats.agentUsage) {
      const agent = this.agentCostRegistry.get(agentId);
      if (agent) {
        actualCost += agent.costPerTask * count;
      }
    }
    
    const savings = worstCaseCost - actualCost;
    const savingsPercentage = worstCaseCost > 0 ? (savings / worstCaseCost) * 100 : 0;
    
    return {
      actualCost,
      worstCaseCost,
      savings,
      savingsPercentage
    };
  }
}
