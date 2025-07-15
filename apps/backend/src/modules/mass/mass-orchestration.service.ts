import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  MassOptimizationConfig,
  TopologyOptimizationConfig,
  OptimizationJob,
  WorkflowTopology,
  AgentPromptVersion
} from '@the-new-fuse/types';
import { PromptOptimizerService } from './prompt-optimizer.service';
import { TopologyOptimizerService } from './topology-optimizer.service';
import { WorkflowPromptOptimizerService } from './workflow-prompt-optimizer.service';

@Injectable()
export class MassOrchestrationService {
  private readonly logger = new Logger(MassOrchestrationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly promptOptimizer: PromptOptimizerService,
    private readonly topologyOptimizer: TopologyOptimizerService,
    private readonly workflowOptimizer: WorkflowPromptOptimizerService
  ) {}

  // Stage 1: Block-Level Prompt Optimization
  async optimizeAgentPrompt(
    agentId: string,
    config: MassOptimizationConfig
  ): Promise<OptimizationJob> {
    this.logger.log(`Starting MASS Stage 1 for agent ${agentId}`);

    const job = await this.createOptimizationJob('block_level', agentId, config);

    try {
      await this.updateJobStatus(job.id, 'running');

      const optimizedPrompt = await this.promptOptimizer.optimizeAgentPrompt(agentId, config);

      await this.updateJobResults(job.id, {
        stage: 'block_level',
        agentId,
        optimizedPromptVersion: optimizedPrompt,
        performanceImprovement: this.calculateImprovement(optimizedPrompt),
        completedAt: new Date()
      });

      await this.updateJobStatus(job.id, 'completed');
      this.logger.log(`MASS Stage 1 completed for agent ${agentId}`);

      return this.getOptimizationJob(job.id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`MASS Stage 1 failed for agent ${agentId}:`, error);
      await this.updateJobStatus(job.id, 'failed', errorMessage);
      throw error;
    }
  }

  // Stage 2: Topology Optimization
  async optimizeWorkflowTopology(
    agentIds: string[],
    config: TopologyOptimizationConfig
  ): Promise<OptimizationJob> {
    this.logger.log(`Starting MASS Stage 2 with ${agentIds.length} agents`);

    const job = await this.createOptimizationJob('topology', JSON.stringify(agentIds), config);

    try {
      await this.updateJobStatus(job.id, 'running');

      const optimizedTopology = await this.topologyOptimizer.optimizeTopology(agentIds, config);

      await this.updateJobResults(job.id, {
        stage: 'topology',
        agentIds,
        optimizedTopology,
        topologyMetrics: optimizedTopology.performanceMetrics,
        completedAt: new Date()
      });

      await this.updateJobStatus(job.id, 'completed');
      this.logger.log(`MASS Stage 2 completed. Topology ID: ${optimizedTopology.id}`);

      return this.getOptimizationJob(job.id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`MASS Stage 2 failed:`, error);
      await this.updateJobStatus(job.id, 'failed', errorMessage);
      throw error;
    }
  }

  // Stage 3: Workflow-Level Prompt Optimization
  async optimizeWorkflowPrompts(
    topologyId: string,
    config: MassOptimizationConfig
  ): Promise<OptimizationJob> {
    this.logger.log(`Starting MASS Stage 3 for topology ${topologyId}`);

    const job = await this.createOptimizationJob('workflow_level', topologyId, config);

    try {
      await this.updateJobStatus(job.id, 'running');

      const optimizedWorkflow = await this.workflowOptimizer.optimizeWorkflowPrompts(topologyId, config);

      await this.updateJobResults(job.id, {
        stage: 'workflow_level',
        topologyId,
        optimizedWorkflow,
        finalMetrics: optimizedWorkflow.performanceMetrics,
        completedAt: new Date()
      });

      await this.updateJobStatus(job.id, 'completed');
      this.logger.log(`MASS Stage 3 completed for topology ${topologyId}`);

      return this.getOptimizationJob(job.id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`MASS Stage 3 failed for topology ${topologyId}:`, error);
      await this.updateJobStatus(job.id, 'failed', errorMessage);
      throw error;
    }
  }

  // Full MASS Pipeline (All 3 Stages)
  async runFullMassOptimization(
    agentIds: string[],
    config: TopologyOptimizationConfig
  ): Promise<{ finalTopologyId: string; jobIds: string[] }> {
    this.logger.log(`Starting full MASS optimization pipeline with ${agentIds.length} agents`);

    const jobIds: string[] = [];

    try {
      // Stage 1: Optimize each agent's prompts
      this.logger.log('Running MASS Stage 1 for all agents...');
      const stage1Jobs = await Promise.all(
        agentIds.map(agentId => this.optimizeAgentPrompt(agentId, config))
      );
      jobIds.push(...stage1Jobs.map(job => job.id));

      // Wait for all Stage 1 jobs to complete
      await this.waitForJobsCompletion(stage1Jobs.map(job => job.id));

      // Stage 2: Optimize topology
      this.logger.log('Running MASS Stage 2 for topology optimization...');
      const stage2Job = await this.optimizeWorkflowTopology(agentIds, config);
      jobIds.push(stage2Job.id);

      // Wait for Stage 2 completion
      await this.waitForJobsCompletion([stage2Job.id]);

      // Get the optimized topology ID
      const stage2Result = await this.getOptimizationJob(stage2Job.id);
      const topologyId = stage2Result.results?.optimizedTopology?.id;

      if (!topologyId) {
        throw new Error('Stage 2 did not produce a valid topology ID');
      }

      // Stage 3: Optimize workflow-level prompts
      this.logger.log('Running MASS Stage 3 for workflow-level optimization...');
      const stage3Job = await this.optimizeWorkflowPrompts(topologyId, config);
      jobIds.push(stage3Job.id);

      // Wait for Stage 3 completion
      await this.waitForJobsCompletion([stage3Job.id]);

      this.logger.log(`Full MASS optimization completed. Final topology: ${topologyId}`);

      return {
        finalTopologyId: topologyId,
        jobIds
      };
    } catch (error) {
      this.logger.error('Full MASS optimization failed:', error);
      throw error;
    }
  }

  // Create a new optimized agent based on an existing one
  async createOptimizedAgent(
    sourceAgentId: string,
    config: MassOptimizationConfig
  ): Promise<{ optimizedAgent: any; optimizationJob: OptimizationJob }> {
    const sourceAgent = await this.prisma.agent.findUnique({
      where: { id: sourceAgentId }
    });

    if (!sourceAgent) {
      throw new Error(`Source agent ${sourceAgentId} not found`);
    }

    // Create new optimized agent
    const optimizedAgent = await this.prisma.agent.create({
      data: {
        name: `${sourceAgent.name} (MASS Optimized)`,
        description: `${sourceAgent.description || ''} - Optimized using MASS framework`,
        type: sourceAgent.type,
        systemPrompt: sourceAgent.systemPrompt,
        capabilities: sourceAgent.capabilities,
        status: 'INACTIVE',
        config: sourceAgent.config,
        userId: config.userId,
        massOptimized: true,
        parentAgentId: sourceAgentId
      }
    });

    // Start optimization
    const optimizationJob = await this.optimizeAgentPrompt(optimizedAgent.id, config);

    return {
      optimizedAgent,
      optimizationJob
    };
  }

  // Get optimization job status
  async getOptimizationJob(jobId: string): Promise<OptimizationJob> {
    const job = await this.prisma.optimizationJob.findUnique({
      where: { id: jobId }
    });

    if (!job) {
      throw new Error(`Optimization job ${jobId} not found`);
    }

    return job as OptimizationJob;
  }

  // Get all optimization jobs for a user
  async getUserOptimizationJobs(
    userId: string,
    status?: string,
    type?: string
  ): Promise<OptimizationJob[]> {
    const where: any = { userId };
    
    if (status) where.status = status;
    if (type) where.type = type;

    const jobs = await this.prisma.optimizationJob.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    return jobs as OptimizationJob[];
  }

  // Get optimization history for an agent
  async getAgentOptimizationHistory(agentId: string, userId: string): Promise<{
    promptVersions: AgentPromptVersion[];
    optimizationJobs: OptimizationJob[];
  }> {
    const [promptVersions, optimizationJobs] = await Promise.all([
      this.prisma.agentPromptVersion.findMany({
        where: { agentId },
        orderBy: { versionNumber: 'desc' }
      }),
      this.prisma.optimizationJob.findMany({
        where: {
          targetId: agentId,
          userId
        },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    return {
      promptVersions: promptVersions as AgentPromptVersion[],
      optimizationJobs: optimizationJobs as OptimizationJob[]
    };
  }

  // Private helper methods
  private async createOptimizationJob(
    type: string,
    targetId: string,
    config: any
  ): Promise<OptimizationJob> {
    const job = await this.prisma.optimizationJob.create({
      data: {
        type,
        targetId,
        status: 'pending',
        config: config as any,
        userId: config.userId
      }
    });

    return job as OptimizationJob;
  }

  private async updateJobStatus(jobId: string, status: string, errorMessage?: string): Promise<void> {
    const updateData: any = {
      status,
      updatedAt: new Date()
    };

    if (errorMessage) {
      updateData.results = { error: errorMessage };
    }

    await this.prisma.optimizationJob.update({
      where: { id: jobId },
      data: updateData
    });
  }

  private async updateJobResults(jobId: string, results: any): Promise<void> {
    await this.prisma.optimizationJob.update({
      where: { id: jobId },
      data: {
        results: results as any,
        updatedAt: new Date()
      }
    });
  }

  private calculateImprovement(optimizedPrompt: any): number {
    // Calculate performance improvement percentage
    if (optimizedPrompt.performanceMetrics?.accuracy && optimizedPrompt.baselineMetrics?.accuracy) {
      return ((optimizedPrompt.performanceMetrics.accuracy - optimizedPrompt.baselineMetrics.accuracy) 
        / optimizedPrompt.baselineMetrics.accuracy) * 100;
    }
    return 0;
  }

  private async waitForJobsCompletion(jobIds: string[]): Promise<void> {
    const maxWaitTime = 30 * 60 * 1000; // 30 minutes
    const checkInterval = 5000; // 5 seconds
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      const jobs = await Promise.all(
        jobIds.map(id => this.getOptimizationJob(id))
      );

      const allCompleted = jobs.every(job => 
        job.status === 'completed' || job.status === 'failed'
      );

      if (allCompleted) {
        const failedJobs = jobs.filter(job => job.status === 'failed');
        if (failedJobs.length > 0) {
          throw new Error(`Some optimization jobs failed: ${failedJobs.map(j => j.id).join(', ')}`);
        }
        return;
      }

      await new Promise(resolve => setTimeout(resolve, checkInterval));
    }

    throw new Error(`Timeout waiting for optimization jobs to complete: ${jobIds.join(', ')}`);
  }
}
