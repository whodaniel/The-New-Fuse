import {
  PipelineTask,
  PipelineStage,
  PipelineDefinition,
  TaskResult,
  PipelineStatus,
  DeploymentConfig,
  DeploymentResult,
  RollbackResult,
  ServiceDeploymentResult,
  HealthCheckResult
} from '../types/pipeline';
import { Logger } from 'winston';
import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';

/**
 * Pipeline Executor handles the actual execution of pipeline tasks and deployments
 */
export class PipelineExecutor extends EventEmitter {
  private logger: Logger;
  private runningTasks: Map<string, ChildProcess> = new Map();
  private taskTimeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor(logger: Logger) {
    super();
    this.logger = logger;
  }

  /**
   * Execute a pipeline task
   */
  async executeTask(
    task: PipelineTask,
    stage: PipelineStage,
    pipeline: PipelineDefinition,
    executionId: string
  ): Promise<TaskResult> {
    const taskId = `${executionId}-${stage.id}-${task.id}`;
    const startTime = new Date();

    this.logger.info(`Executing task: ${task.name}`, {
      taskId,
      type: task.type,
      executionId
    });

    try {
      // Check task conditions
      if (!await this.evaluateTaskConditions(task, stage, pipeline)) {
        return {
          id: taskId,
          taskId: task.id,
          name: task.name,
          status: PipelineStatus.SKIPPED,
          startTime,
          endTime: new Date(),
          duration: 0,
          logs: ['Task skipped due to conditions'],
          artifacts: []
        };
      }

      // Execute task based on type
      let result: TaskResult;
      
      switch (task.type) {
        case 'shell':
          result = await this.executeShellTask(task, taskId, startTime);
          break;
        case 'docker':
          result = await this.executeDockerTask(task, taskId, startTime);
          break;
        case 'kubernetes':
          result = await this.executeKubernetesTask(task, taskId, startTime);
          break;
        case 'test':
          result = await this.executeTestTask(task, taskId, startTime);
          break;
        case 'build':
          result = await this.executeBuildTask(task, taskId, startTime);
          break;
        case 'deploy':
          result = await this.executeDeployTask(task, taskId, startTime);
          break;
        default:
          result = await this.executeCustomTask(task, taskId, startTime);
      }

      // Apply retry policy if task failed
      if (result.status === PipelineStatus.FAILED && task.retryPolicy.enabled) {
        result = await this.retryTask(task, stage, pipeline, executionId, result);
      }

      this.logger.info(`Task completed: ${task.name}`, {
        taskId,
        status: result.status,
        duration: result.duration
      });

      return result;

    } catch (error) {
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      this.logger.error(`Task execution failed: ${task.name}`, {
        taskId,
        error: error.message,
        stack: error.stack
      });

      return {
        id: taskId,
        taskId: task.id,
        name: task.name,
        status: PipelineStatus.FAILED,
        startTime,
        endTime,
        duration,
        logs: [error.message],
        artifacts: [],
        error: error.message
      };
    }
  }

  /**
   * Execute a deployment configuration
   */
  async executeDeployment(deployment: DeploymentConfig): Promise<DeploymentResult> {
    const deploymentId = `deploy-${Date.now()}`;
    const startTime = new Date();

    this.logger.info(`Executing deployment to ${deployment.environment}`, {
      deploymentId: deployment.id,
      services: deployment.services.length
    });

    try {
      const serviceResults: ServiceDeploymentResult[] = [];
      const healthCheckResults: HealthCheckResult[] = [];

      // Deploy each service
      for (const service of deployment.services) {
        const serviceResult = await this.deployService(service, deployment);
        serviceResults.push(serviceResult);

        // If service deployment failed and we're not continuing on error, stop
        if (serviceResult.status === PipelineStatus.FAILED) {
          throw new Error(`Service deployment failed: ${service.name}`);
        }
      }

      // Run health checks
      for (const healthCheck of deployment.healthChecks) {
        const healthResult = await this.executeHealthCheck(healthCheck);
        healthCheckResults.push(healthResult);
      }

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      // Determine overall deployment status
      const overallStatus = serviceResults.every(s => s.status === PipelineStatus.SUCCESS) &&
                           healthCheckResults.every(h => h.status === 'healthy') ?
                           PipelineStatus.SUCCESS : PipelineStatus.FAILED;

      return {
        id: deploymentId,
        deploymentId: deployment.id,
        status: overallStatus,
        startTime,
        endTime,
        duration,
        environment: deployment.environment,
        services: serviceResults,
        healthChecks: healthCheckResults,
        logs: [`Deployment to ${deployment.environment} completed`]
      };

    } catch (error) {
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      this.logger.error(`Deployment failed: ${error.message}`, {
        deploymentId: deployment.id,
        environment: deployment.environment,
        error: error.stack
      });

      return {
        id: deploymentId,
        deploymentId: deployment.id,
        status: PipelineStatus.FAILED,
        startTime,
        endTime,
        duration,
        environment: deployment.environment,
        services: [],
        healthChecks: [],
        logs: [error.message],
        error: error.message
      };
    }
  }

  /**
   * Execute a rollback operation
   */
  async executeRollback(deployment: DeploymentResult): Promise<RollbackResult> {
    const rollbackId = `rollback-${Date.now()}`;
    const startTime = new Date();

    this.logger.info(`Executing rollback for deployment: ${deployment.deploymentId}`);

    try {
      // Implementation would depend on the deployment strategy and platform
      // This is a simplified version
      
      // For Kubernetes, this might involve:
      // 1. kubectl rollout undo deployment/service-name
      // 2. Wait for rollout to complete
      // 3. Verify health checks

      // Simulate rollback execution
      await this.simulateRollback(deployment);

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      return {
        id: rollbackId,
        deploymentId: deployment.deploymentId,
        status: PipelineStatus.SUCCESS,
        startTime,
        endTime,
        duration,
        previousVersion: 'v1.0.0', // TODO: Get actual version
        currentVersion: 'v0.9.0',  // TODO: Get actual version
        reason: 'Manual rollback requested',
        logs: [`Rollback completed for deployment ${deployment.deploymentId}`]
      };

    } catch (error) {
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      return {
        id: rollbackId,
        deploymentId: deployment.deploymentId,
        status: PipelineStatus.FAILED,
        startTime,
        endTime,
        duration,
        previousVersion: 'unknown',
        currentVersion: 'unknown',
        reason: 'Manual rollback requested',
        logs: [error.message],
        error: error.message
      };
    }
  }

  /**
   * Cancel a running execution
   */
  async cancelExecution(executionId: string): Promise<void> {
    this.logger.info(`Cancelling execution: ${executionId}`);

    // Cancel all running tasks for this execution
    for (const [taskId, process] of this.runningTasks.entries()) {
      if (taskId.startsWith(executionId)) {
        process.kill('SIGTERM');
        this.runningTasks.delete(taskId);

        // Clear timeout
        const timeout = this.taskTimeouts.get(taskId);
        if (timeout) {
          clearTimeout(timeout);
          this.taskTimeouts.delete(taskId);
        }
      }
    }
  }

  // Private helper methods

  private async evaluateTaskConditions(
    task: PipelineTask,
    stage: PipelineStage,
    pipeline: PipelineDefinition
  ): Promise<boolean> {
    for (const condition of task.conditions) {
      const result = await this.evaluateCondition(condition, { task, stage, pipeline });
      if (!result) {
        return false;
      }
    }
    return true;
  }

  private async evaluateCondition(condition: any, _context: any): Promise<boolean> {
    switch (condition.type) {
      case 'file_exists':
        const fs = await import('fs/promises');
        try {
          await fs.access(condition.value);
          return true;
        } catch {
          return false;
        }
      case 'variable':
        return process.env[condition.value] !== undefined;
      case 'environment':
        return process.env.NODE_ENV === condition.value;
      default:
        return true;
    }
  }

  private async executeShellTask(
    task: PipelineTask,
    taskId: string,
    startTime: Date
  ): Promise<TaskResult> {
    return new Promise((resolve) => {
      const command = task.command || task.script || '';
      const logs: string[] = [];
      let exitCode = 0;

      this.logger.debug(`Executing shell command: ${command}`, { taskId });

      const shellProcess = spawn('sh', ['-c', command], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, ...task.parameters }
      });

      this.runningTasks.set(taskId, shellProcess);

      // Set timeout
      const timeout = setTimeout(() => {
        shellProcess.kill('SIGTERM');
        logs.push(`Task timed out after ${task.timeout}ms`);
      }, task.timeout);

      this.taskTimeouts.set(taskId, timeout);

      shellProcess.stdout?.on('data', (data) => {
        const output = data.toString();
        logs.push(output);
        this.logger.debug(`Task output: ${output}`, { taskId });
      });

      shellProcess.stderr?.on('data', (data) => {
        const output = data.toString();
        logs.push(output);
        this.logger.debug(`Task error: ${output}`, { taskId });
      });

      shellProcess.on('close', (code) => {
        const endTime = new Date();
        const duration = endTime.getTime() - startTime.getTime();
        exitCode = code || 0;

        // Clean up
        this.runningTasks.delete(taskId);
        clearTimeout(timeout);
        this.taskTimeouts.delete(taskId);

        const status = exitCode === 0 ? PipelineStatus.SUCCESS : PipelineStatus.FAILED;

        resolve({
          id: taskId,
          taskId: task.id,
          name: task.name,
          status,
          startTime,
          endTime,
          duration,
          exitCode,
          logs,
          artifacts: task.artifacts || [],
          error: exitCode !== 0 ? `Process exited with code ${exitCode}` : undefined
        });
      });

      shellProcess.on('error', (_error) => {
        const endTime = new Date();
        const duration = endTime.getTime() - startTime.getTime();

        // Clean up
        this.runningTasks.delete(taskId);
        clearTimeout(timeout);
        this.taskTimeouts.delete(taskId);

        resolve({
          id: taskId,
          taskId: task.id,
          name: task.name,
          status: PipelineStatus.FAILED,
          startTime,
          endTime,
          duration,
          logs: [...logs, _error.message],
          artifacts: [],
          error: _error.message
        });
      });
    });
  }

  private async executeDockerTask(
    task: PipelineTask,
    taskId: string,
    startTime: Date
  ): Promise<TaskResult> {
    // Docker task execution logic
    const dockerCommand = this.buildDockerCommand(task);
    return await this.executeShellTask(
      { ...task, command: dockerCommand },
      taskId,
      startTime
    );
  }

  private async executeKubernetesTask(
    task: PipelineTask,
    taskId: string,
    startTime: Date
  ): Promise<TaskResult> {
    // Kubernetes task execution logic
    const kubectlCommand = this.buildKubectlCommand(task);
    return await this.executeShellTask(
      { ...task, command: kubectlCommand },
      taskId,
      startTime
    );
  }

  private async executeTestTask(
    task: PipelineTask,
    taskId: string,
    startTime: Date
  ): Promise<TaskResult> {
    // Test execution logic
    const testCommand = task.parameters.testCommand || 'npm test';
    return await this.executeShellTask(
      { ...task, command: testCommand },
      taskId,
      startTime
    );
  }

  private async executeBuildTask(
    task: PipelineTask,
    taskId: string,
    startTime: Date
  ): Promise<TaskResult> {
    // Build execution logic
    const buildCommand = task.parameters.buildCommand || 'npm run build';
    return await this.executeShellTask(
      { ...task, command: buildCommand },
      taskId,
      startTime
    );
  }

  private async executeDeployTask(
    task: PipelineTask,
    taskId: string,
    startTime: Date
  ): Promise<TaskResult> {
    // Deploy execution logic
    const deployCommand = this.buildDeployCommand(task);
    return await this.executeShellTask(
      { ...task, command: deployCommand },
      taskId,
      startTime
    );
  }

  private async executeCustomTask(
    task: PipelineTask,
    taskId: string,
    startTime: Date
  ): Promise<TaskResult> {
    // Custom task execution logic
    if (task.script) {
      return await this.executeShellTask(task, taskId, startTime);
    }

    // If no script provided, mark as success
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();

    return {
      id: taskId,
      taskId: task.id,
      name: task.name,
      status: PipelineStatus.SUCCESS,
      startTime,
      endTime,
      duration,
      logs: ['Custom task completed (no script provided)'],
      artifacts: []
    };
  }

  private async retryTask(
    task: PipelineTask,
    stage: PipelineStage,
    pipeline: PipelineDefinition,
    executionId: string,
    lastResult: TaskResult
  ): Promise<TaskResult> {
    const retryPolicy = task.retryPolicy;
    let attempt = 1;
    let result = lastResult;

    while (attempt < retryPolicy.maxAttempts && result.status === PipelineStatus.FAILED) {
      // Calculate delay based on backoff strategy
      const delay = this.calculateRetryDelay(retryPolicy, attempt);
      
      this.logger.info(`Retrying task: ${task.name} (attempt ${attempt + 1}/${retryPolicy.maxAttempts})`, {
        taskId: result.id,
        delay
      });

      // Wait for delay
      await new Promise(resolve => setTimeout(resolve, delay));

      // Retry the task
      result = await this.executeTask(task, stage, pipeline, executionId);
      attempt++;
    }

    return result;
  }

  private calculateRetryDelay(retryPolicy: any, attempt: number): number {
    switch (retryPolicy.backoffStrategy) {
      case 'linear':
        return retryPolicy.initialDelay * attempt;
      case 'exponential':
        return Math.min(retryPolicy.initialDelay * Math.pow(2, attempt - 1), retryPolicy.maxDelay);
      case 'fixed':
      default:
        return retryPolicy.initialDelay;
    }
  }

  private buildDockerCommand(task: PipelineTask): string {
    const { image, tag = 'latest', command, volumes = [], environment = {} } = task.parameters;
    
    let dockerCmd = `docker run --rm`;
    
    // Add volumes
    volumes.forEach((volume: string) => {
      dockerCmd += ` -v ${volume}`;
    });
    
    // Add environment variables
    Object.entries(environment).forEach(([key, value]) => {
      dockerCmd += ` -e ${key}="${value}"`;
    });
    
    dockerCmd += ` ${image}:${tag}`;
    
    if (command) {
      dockerCmd += ` ${command}`;
    }
    
    return dockerCmd;
  }

  private buildKubectlCommand(task: PipelineTask): string {
    const { action, resource, name, namespace, manifest } = task.parameters;
    
    let kubectlCmd = 'kubectl';
    
    if (namespace) {
      kubectlCmd += ` -n ${namespace}`;
    }
    
    kubectlCmd += ` ${action}`;
    
    if (manifest) {
      kubectlCmd += ` -f ${manifest}`;
    } else if (resource && name) {
      kubectlCmd += ` ${resource} ${name}`;
    }
    
    return kubectlCmd;
  }

  private buildDeployCommand(task: PipelineTask): string {
    const { platform = 'kubernetes', ...params } = task.parameters;
    
    switch (platform) {
      case 'kubernetes':
        return this.buildKubectlCommand({ ...task, parameters: params });
      case 'docker':
        return this.buildDockerCommand({ ...task, parameters: params });
      default:
        return task.command || 'echo "No deploy command specified"';
    }
  }

  private async deployService(
    service: any,
    deployment: DeploymentConfig
  ): Promise<ServiceDeploymentResult> {
    this.logger.info(`Deploying service: ${service.name}`, {
      image: service.image,
      tag: service.tag,
      replicas: service.replicas
    });

    try {
      // This would contain the actual deployment logic
      // For now, simulate a successful deployment
      await new Promise(resolve => setTimeout(resolve, 1000));

      return {
        name: service.name,
        status: PipelineStatus.SUCCESS,
        replicas: {
          desired: service.replicas,
          ready: service.replicas,
          available: service.replicas
        },
        image: service.image,
        version: service.tag,
        endpoints: [`http://${service.name}.${deployment.environment}.svc.cluster.local`]
      };

    } catch (error) {
      return {
        name: service.name,
        status: PipelineStatus.FAILED,
        replicas: {
          desired: service.replicas,
          ready: 0,
          available: 0
        },
        image: service.image,
        version: service.tag,
        endpoints: []
      };
    }
  }

  private async executeHealthCheck(healthCheck: any): Promise<HealthCheckResult> {
    const startTime = new Date();
    
    try {
      // This would contain actual health check logic
      // For now, simulate a health check
      await new Promise(resolve => setTimeout(resolve, 500));

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      return {
        name: healthCheck.name || 'health-check',
        status: 'healthy',
        message: 'Health check passed',
        timestamp: endTime,
        duration
      };

    } catch (error) {
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      return {
        name: healthCheck.name || 'health-check',
        status: 'unhealthy',
        message: error.message,
        timestamp: endTime,
        duration
      };
    }
  }

  private async simulateRollback(deployment: DeploymentResult): Promise<void> {
    // Simulate rollback process
    this.logger.info(`Simulating rollback for deployment: ${deployment.deploymentId}`);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}