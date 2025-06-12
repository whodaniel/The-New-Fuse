import { Controller, Post, Get, Body, Param, Query, UseGuards } from '@nestjs/common';
import { 
  MassOptimizationConfig, 
  TopologyOptimizationConfig,
  OptimizationJob,
  WorkflowTopology 
} from '@the-new-fuse/types';
import { MassOrchestrationService } from './mass-orchestration.service.js';
import { PromptOptimizerService } from './prompt-optimizer.service.js';
import { TopologyOptimizerService } from './topology-optimizer.service.js';
import { WorkflowPromptOptimizerService } from './workflow-prompt-optimizer.service.js';
import { AggregateService } from './building-blocks/aggregate.service.js';
import { ReflectService } from './building-blocks/reflect.service.js';
import { DebateService } from './building-blocks/debate.service.js';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@Controller('mass')
@UseGuards(AuthGuard('jwt'))
export class MassController {
  constructor(
    private readonly massOrchestration: MassOrchestrationService,
    private readonly promptOptimizer: PromptOptimizerService,
    private readonly topologyOptimizer: TopologyOptimizerService,
    private readonly workflowOptimizer: WorkflowPromptOptimizerService,
    private readonly aggregateService: AggregateService,
    private readonly reflectService: ReflectService,
    private readonly debateService: DebateService
  ) {}

  // Stage 1: Block-Level Prompt Optimization
  @Post('optimize/agent/:agentId')
  async optimizeAgentPrompt(
    @Param('agentId') agentId: string,
    @Body() config: MassOptimizationConfig,
    @CurrentUser() user: any
  ): Promise<{ job: OptimizationJob }> {
    const optimizationConfig = { ...config, userId: user.id };
    const job = await this.massOrchestration.optimizeAgentPrompt(agentId, optimizationConfig);
    return { job };
  }

  // Stage 2: Topology Optimization
  @Post('optimize/topology')
  async optimizeTopology(
    @Body() request: { agentIds: string[]; config: TopologyOptimizationConfig },
    @CurrentUser() user: any
  ): Promise<{ job: OptimizationJob }> {
    const config = { ...request.config, userId: user.id };
    const job = await this.massOrchestration.optimizeWorkflowTopology(request.agentIds, config);
    return { job };
  }

  // Stage 3: Workflow-Level Prompt Optimization
  @Post('optimize/workflow/:topologyId')
  async optimizeWorkflowPrompts(
    @Param('topologyId') topologyId: string,
    @Body() config: MassOptimizationConfig,
    @CurrentUser() user: any
  ): Promise<{ job: OptimizationJob }> {
    const optimizationConfig = { ...config, userId: user.id };
    const job = await this.massOrchestration.optimizeWorkflowPrompts(topologyId, optimizationConfig);
    return { job };
  }

  // Full MASS Pipeline
  @Post('optimize/full')
  async runFullOptimization(
    @Body() request: { agentIds: string[]; config: TopologyOptimizationConfig },
    @CurrentUser() user: any
  ): Promise<{ finalTopologyId: string; jobIds: string[] }> {
    const config = { ...request.config, userId: user.id };
    return this.massOrchestration.runFullMassOptimization(request.agentIds, config);
  }

  // Create optimized agent copy
  @Post('agents/:agentId/create-optimized')
  async createOptimizedAgent(
    @Param('agentId') agentId: string,
    @Body() config: MassOptimizationConfig,
    @CurrentUser() user: any
  ): Promise<{ optimizedAgent: any; optimizationJob: OptimizationJob }> {
    const optimizationConfig = { ...config, userId: user.id };
    return this.massOrchestration.createOptimizedAgent(agentId, optimizationConfig);
  }

  // Get optimization job status
  @Get('jobs/:jobId')
  async getOptimizationJob(
    @Param('jobId') jobId: string
  ): Promise<OptimizationJob> {
    return this.massOrchestration.getOptimizationJob(jobId);
  }

  // Get user's optimization jobs
  @Get('jobs')
  async getUserOptimizationJobs(
    @CurrentUser() user: any,
    @Query('status') status?: string,
    @Query('type') type?: string
  ): Promise<{ jobs: OptimizationJob[] }> {
    const jobs = await this.massOrchestration.getUserOptimizationJobs(user.id, status, type);
    return { jobs };
  }

  // Get agent optimization history
  @Get('agents/:agentId/history')
  async getAgentOptimizationHistory(
    @Param('agentId') agentId: string,
    @CurrentUser() user: any
  ): Promise<{
    promptVersions: any[];
    optimizationJobs: OptimizationJob[];
  }> {
    return this.massOrchestration.getAgentOptimizationHistory(agentId, user.id);
  }

  // Execute MASS building blocks
  @Post('execute/aggregate')
  async executeAggregate(
    @Body() request: {
      agentIds: string[];
      input: any;
      aggregationStrategy: 'majority_vote' | 'weighted_average' | 'consensus';
      parallelExecution?: boolean;
    },
    @CurrentUser() user: any
  ): Promise<{ result: any; executionMetrics: any }> {
    return this.aggregateService.execute(
      request.agentIds,
      request.input,
      {
        aggregationStrategy: request.aggregationStrategy,
        parallelExecution: request.parallelExecution || true,
        userId: user.id
      }
    );
  }

  @Post('execute/reflect')
  async executeReflect(
    @Body() request: {
      predictorAgentId: string;
      reflectorAgentId: string;
      input: any;
      maxRounds?: number;
    },
    @CurrentUser() user: any
  ): Promise<{ result: any; reflectionHistory: any[]; executionMetrics: any }> {
    return this.reflectService.execute(
      request.predictorAgentId,
      request.reflectorAgentId,
      request.input,
      {
        maxRounds: request.maxRounds || 3,
        userId: user.id
      }
    );
  }

  @Post('execute/debate')
  async executeDebate(
    @Body() request: {
      debaterAgentIds: string[];
      input: any;
      debateRounds?: number;
      votingStrategy?: 'majority' | 'weighted' | 'consensus';
    },
    @CurrentUser() user: any
  ): Promise<{ result: any; debateHistory: any[]; executionMetrics: any }> {
    return this.debateService.execute(
      request.debaterAgentIds,
      request.input,
      {
        debateRounds: request.debateRounds || 3,
        votingStrategy: request.votingStrategy || 'majority',
        userId: user.id
      }
    );
  }

  // Validation and testing endpoints
  @Post('validate/dataset')
  async createValidationDataset(
    @Body() request: {
      name: string;
      description?: string;
      items: Array<{ input: any; expectedOutput: any }>;
    },
    @CurrentUser() user: any
  ): Promise<{ datasetId: string }> {
    // Implementation would create validation dataset
    return { datasetId: 'temp-dataset-id' };
  }

  @Get('validate/datasets')
  async getUserValidationDatasets(
    @CurrentUser() user: any
  ): Promise<{ datasets: any[] }> {
    // Implementation would return user's validation datasets
    return { datasets: [] };
  }

  // Performance analytics
  @Get('analytics/performance/:agentId')
  async getAgentPerformanceAnalytics(
    @Param('agentId') agentId: string,
    @CurrentUser() user: any,
    @Query('timeRange') timeRange?: string
  ): Promise<{
    performanceHistory: any[];
    improvementTrend: number;
    averageMetrics: any;
  }> {
    // Implementation would return performance analytics
    return {
      performanceHistory: [],
      improvementTrend: 0,
      averageMetrics: {}
    };
  }

  @Get('analytics/topology/:topologyId')
  async getTopologyPerformanceAnalytics(
    @Param('topologyId') topologyId: string,
    @CurrentUser() user: any
  ): Promise<{
    nodePerformance: Record<string, any>;
    bottlenecks: string[];
    optimizationSuggestions: string[];
  }> {
    // Implementation would return topology analytics
    return {
      nodePerformance: {},
      bottlenecks: [],
      optimizationSuggestions: []
    };
  }

  // Export/Import optimized configurations
  @Get('export/agent/:agentId')
  async exportOptimizedAgent(
    @Param('agentId') agentId: string,
    @CurrentUser() user: any
  ): Promise<{ exportData: any }> {
    // Implementation would export agent configuration
    return { exportData: {} };
  }

  @Post('import/agent')
  async importOptimizedAgent(
    @Body() importData: any,
    @CurrentUser() user: any
  ): Promise<{ importedAgentId: string }> {
    // Implementation would import agent configuration
    return { importedAgentId: 'temp-agent-id' };
  }

  @Get('export/topology/:topologyId')
  async exportOptimizedTopology(
    @Param('topologyId') topologyId: string,
    @CurrentUser() user: any
  ): Promise<{ exportData: any }> {
    // Implementation would export topology configuration
    return { exportData: {} };
  }

  @Post('import/topology')
  async importOptimizedTopology(
    @Body() importData: any,
    @CurrentUser() user: any
  ): Promise<{ importedTopologyId: string }> {
    // Implementation would import topology configuration
    return { importedTopologyId: 'temp-topology-id' };
  }
}
