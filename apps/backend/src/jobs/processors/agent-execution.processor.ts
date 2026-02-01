import { OnQueueActive, OnQueueCompleted, OnQueueFailed, Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { ClawdEngine } from '@the-new-fuse/agent';
import { Job } from 'bull';
import * as fs from 'fs';
import * as path from 'path';
import { QueueName } from '../constants/queue-names';
import { AgentExecutionJobData } from '../interfaces/job-data.interface';

/**
 * Agent execution job processor
 * Handles long-running agent executions in the background
 */
@Processor(QueueName.AGENT_EXECUTION)
export class AgentExecutionProcessor {
  private readonly logger = new Logger(AgentExecutionProcessor.name);

  /**
   * Process agent execution job
   */
  @Process('execute-agent')
  async handleExecuteAgent(job: Job<AgentExecutionJobData>) {
    this.logger.log(`Processing execute-agent job ${job.id} for agent ${job.data.agentId}`);

    let engine: ClawdEngine | null = null;

    try {
      const { agentId, userId, task, parameters, timeout } = job.data;

      // Update progress
      await job.progress(10);

      const startTime = Date.now();
      const maxDuration = timeout || 300000; // Default 5 minutes

      this.logger.log(`Starting agent ${agentId} with task: ${task}`);

      // Initialize Agent Engine
      // Create a temporary workspace for this execution
      const workerId = `worker-${job.id}`;
      // In production (Railway), we might be in /app. Use appropriate temp dir.
      const workspacePath = path.join(process.cwd(), '.agent-workspaces', workerId);

      if (!fs.existsSync(workspacePath)) {
        fs.mkdirSync(workspacePath, { recursive: true });
      }

      // Initialize engine
      engine = new ClawdEngine(workspacePath);

      // Wait a moment for connection (hacky, but ClawdEngine needs a better lifecycle API)
      await new Promise((r) => setTimeout(r, 1000));

      await job.progress(25);

      // Execute the Skill via handleRequest
      // We assume the skill name is in 'task' and args in 'parameters'
      const response = await engine.handleRequest({
        type: 'req',
        id: job.id.toString(),
        method: 'node.invoke',
        params: { skillName: task, args: parameters || {} },
      });

      if (!response.ok) {
        throw new Error(response.error?.message || 'Unknown agent error');
      }

      await job.progress(100);

      const executionTime = Date.now() - startTime;
      this.logger.log(`Agent ${agentId} execution completed in ${executionTime}ms`);

      return {
        agentId,
        userId,
        task,
        status: 'completed',
        executionTime,
        output: response.payload,
      };
    } catch (error) {
      this.logger.error(`Agent execution failed: ${error.message}`, error.stack);
      throw error;
    } finally {
      if (engine) {
        await engine.shutdown();
      }
    }
  }

  /**
   * Process batch agent execution job
   */
  @Process('batch-execute-agents')
  async handleBatchExecuteAgents(job: Job<{ agents: AgentExecutionJobData[] }>) {
    this.logger.log(
      `Processing batch-execute-agents job ${job.id} with ${job.data.agents.length} agents`
    );

    try {
      const results = [];
      const totalAgents = job.data.agents.length;

      for (let i = 0; i < totalAgents; i++) {
        const agentData = job.data.agents[i];

        this.logger.log(`Executing agent ${i + 1}/${totalAgents}: ${agentData.agentId}`);

        // Execute each agent
        // TODO: Replace with actual agent service
        const result = {
          agentId: agentData.agentId,
          status: 'completed',
          output: 'Agent execution completed',
        };

        results.push(result);

        // Update progress
        const progress = Math.round(((i + 1) / totalAgents) * 100);
        await job.progress(progress);
      }

      this.logger.log(`Batch execution completed. ${results.length} agents processed.`);

      return {
        totalAgents,
        successCount: results.length,
        results,
      };
    } catch (error) {
      this.logger.error(`Batch execution failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Event handler for active jobs
   */
  @OnQueueActive()
  onActive(job: Job) {
    this.logger.debug(`Processing agent execution job ${job.id} of type ${job.name}`);
  }

  /**
   * Event handler for completed jobs
   */
  @OnQueueCompleted()
  onCompleted(job: Job, result: any) {
    this.logger.log(
      `Agent execution job ${job.id} completed. Agent: ${result.agentId}, Duration: ${result.executionTime}ms`
    );
  }

  /**
   * Event handler for failed jobs
   */
  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(
      `Agent execution job ${job.id} failed after ${job.attemptsMade} attempts. Error: ${error.message}`,
      error.stack
    );
  }

  /**
   * Helper method to sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
