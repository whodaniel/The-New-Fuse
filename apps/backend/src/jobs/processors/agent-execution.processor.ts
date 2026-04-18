import { Process, Processor, OnQueueActive, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { QueueName } from '../constants/queue-names.js';
import { AgentExecutionJobData } from '../interfaces/job-data.interface.js';

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
    this.logger.log(
      `Processing execute-agent job ${job.id} for agent ${job.data.agentId}`,
    );

    try {
      const { agentId, userId, task, parameters, timeout } = job.data;

      // Update progress
      await job.progress(10);

      // Simulate agent execution (replace with actual agent service)
      const startTime = Date.now();
      const maxDuration = timeout || 300000; // Default 5 minutes

      this.logger.log(`Starting agent ${agentId} with task: ${task}`);

      // Simulated agent processing
      // TODO: Replace with actual agent service integration
      await job.progress(25);

      // Simulate processing time
      await this.sleep(2000);
      await job.progress(50);

      // Check if we're exceeding timeout
      if (Date.now() - startTime > maxDuration) {
        throw new Error('Agent execution timeout exceeded');
      }

      await job.progress(75);
      await this.sleep(1000);

      const result = {
        agentId,
        userId,
        task,
        status: 'completed',
        executionTime: Date.now() - startTime,
        output: {
          message: 'Agent execution completed successfully',
          data: parameters,
        },
      };

      await job.progress(100);

      this.logger.log(
        `Agent ${agentId} execution completed in ${result.executionTime}ms`,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Agent execution failed: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Process batch agent execution job
   */
  @Process('batch-execute-agents')
  async handleBatchExecuteAgents(job: Job<{ agents: AgentExecutionJobData[] }>) {
    this.logger.log(`Processing batch-execute-agents job ${job.id} with ${job.data.agents.length} agents`);

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
    this.logger.debug(
      `Processing agent execution job ${job.id} of type ${job.name}`,
    );
  }

  /**
   * Event handler for completed jobs
   */
  @OnQueueCompleted()
  onCompleted(job: Job, result: any) {
    this.logger.log(
      `Agent execution job ${job.id} completed. Agent: ${result.agentId}, Duration: ${result.executionTime}ms`,
    );
  }

  /**
   * Event handler for failed jobs
   */
  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(
      `Agent execution job ${job.id} failed after ${job.attemptsMade} attempts. Error: ${error.message}`,
      error.stack,
    );
  }

  /**
   * Helper method to sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
