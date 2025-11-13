"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskQueue = void 0;
const common_1 = require("@nestjs/common");
const LoggingService_1 = require("../services/LoggingService");
const MetricsService_1 = require("../monitoring/MetricsService");
let TaskQueue = class TaskQueue {
    logger;
    metricsService;
    tasks = new Map();
    taskExecutions = new Map();
    taskTemplates = new Map();
    taskDependencies = new Map();
    taskWorkers = new Map();
    taskHandlers = new Map();
    pendingTasks = [];
    scheduledTasks = [];
    isInitialized = false;
    processingInterval;
    schedulerInterval;
    maxConcurrentTasks = 100;
    constructor(logger, metricsService) {
        this.logger = logger;
        this.metricsService = metricsService;
    }
    async initialize() {
        try {
            this.logger.log('Initializing Task Queue...', 'TaskQueue');
            // Create default worker
            await this.createWorker('default-worker', ['*'], 5);
            // Start processing intervals
            this.startTaskProcessor();
            this.startTaskScheduler();
            this.startMetricsCollection();
            this.isInitialized = true;
            this.logger.log('Task Queue initialized successfully', 'TaskQueue');
            await this.metricsService.recordMetric('task_queue_initialized', 1, 'counter', { labels: { component: 'task_queue' } });
        }
        catch (error) {
            this.logger.error('Failed to initialize Task Queue', error instanceof Error ? error : new Error(String(error)), 'TaskQueue');
            throw error;
        }
    }
    async createTask(name, type, payload, options = {}) {
        try {
            const task = {
                id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)},
        name,
        type,
        payload,
        priority: options.priority || 'normal',
        status: 'pending',
        dependencies: options.dependencies || [],
        schedule: options.schedule,
        execution_config: {
          timeout_ms: 300000, // 5 minutes
          max_retries: 3,
          retry_delay_ms: 5000,
          retry_backoff_multiplier: 2,
          ...options.execution_config
        },
        created_at: new Date(),
        attempt_count: 0,
        metadata: options.metadata || {}
      };

      // Set scheduling information
      if (task.schedule) {
        task.scheduled_at = this.calculateNextRun(task.schedule);
        task.next_run_at = task.scheduled_at;
      }

      this.tasks.set(task.id, task);

      // Add dependencies if any
      if (task.dependencies.length > 0) {
        const dependencies: TaskDependency[] = task.dependencies.map(depId => ({
          task_id: task.id,
          depends_on: depId,
          dependency_type: 'success',
          wait_for_result: false
        }));
        this.taskDependencies.set(task.id, dependencies);
      }

      // Add to appropriate queue
      if (task.type === 'scheduled' || task.type === 'recurring') {
        this.scheduledTasks.push(task);
      } else if (this.areDependenciesMet(task)) {
        this.addToPendingQueue(task);
      }

      await this.metricsService.recordMetric('task_created', 1, 'counter', { 
        labels: { 
          type: task.type,
          priority: task.priority
        } 
      });

      return task;
    } catch (error) {
      this.logger.error('Failed to create task', error instanceof Error ? error : new Error(String(error)), 'TaskQueue');
      throw error;
    }
  }

  async getTask(taskId: string): Promise<Task | null> {
    return this.tasks.get(taskId) || null;
  }

  async cancelTask(taskId: string): Promise<boolean> {
    try {
      const task = this.tasks.get(taskId);
      if (!task) {
        return false;
      }

      if (task.status === 'running') {
        // Cannot cancel running tasks
        return false;
      }

      task.status = 'cancelled';
      task.completed_at = new Date();
      this.tasks.set(taskId, task);

      // Remove from pending queue
      this.pendingTasks = this.pendingTasks.filter(t => t.id !== taskId);
      
      // Remove from scheduled queue
      this.scheduledTasks = this.scheduledTasks.filter(t => t.id !== taskId);

      await this.metricsService.recordMetric('task_cancelled', 1, 'counter', { 
        labels: { 
          task_type: task.type
        } 
      });

      return true;
    } catch (error) {
      this.logger.error('Failed to cancel task', error instanceof Error ? error : new Error(String(error)), 'TaskQueue');
      return false;
    }
  }

  async pauseTask(taskId: string): Promise<boolean> {
    try {
      const task = this.tasks.get(taskId);
      if (!task) {
        return false;
      }

      if (task.status === 'running') {
        return false; // Cannot pause running tasks
      }

      task.status = 'paused';
      this.tasks.set(taskId, task);

      // Remove from pending queue
      this.pendingTasks = this.pendingTasks.filter(t => t.id !== taskId);

      return true;
    } catch (error) {
      this.logger.error('Failed to pause task', error instanceof Error ? error : new Error(String(error)), 'TaskQueue');
      return false;
    }
  }

  async resumeTask(taskId: string): Promise<boolean> {
    try {
      const task = this.tasks.get(taskId);
      if (!task) {
        return false;
      }

      if (task.status !== 'paused') {
        return false;
      }

      task.status = 'pending';
      this.tasks.set(taskId, task);

      // Add back to pending queue if dependencies are met
      if (this.areDependenciesMet(task)) {
        this.addToPendingQueue(task);
      }

      return true;
    } catch (error) {
      this.logger.error('Failed to resume task', error instanceof Error ? error : new Error(String(error)), 'TaskQueue');
      return false;
    }
  }

  async registerTaskHandler(taskType: string, handler: TaskHandler): Promise<void> {
    this.taskHandlers.set(taskType, handler);`,
                this: .logger.log(Task, handler, registered), for: type, $
            }, { taskType };
            `, 'TaskQueue');

    await this.metricsService.recordMetric('task_handler_registered', 1, 'counter', { 
      labels: { 
        task_type: taskType
      } 
    });
  }

  async createWorker(
    name: string,
    capabilities: string[],
    maxConcurrentTasks: number = 1,
    metadata: Record<string, any> = {}
  ): Promise<TaskWorker> {
    const worker: TaskWorker = {
      id: `;
            worker_$;
            {
                Date.now();
            }
            _$;
            {
                Math.random().toString(36).substr(2, 9);
            }
            name,
                status;
            'idle',
                capabilities,
                max_concurrent_tasks;
            maxConcurrentTasks,
                current_tasks;
            [],
                total_tasks_processed;
            0,
                total_tasks_failed;
            0,
                last_heartbeat;
            new Date(),
                created_at;
            new Date(),
                metadata;
        }
        finally { }
        ;
        this.taskWorkers.set(worker.id, worker);
        await this.metricsService.recordMetric('task_worker_created', 1, 'counter', {
            labels: {
                worker_name: name
            }
        });
        return worker;
    }
    async createTaskTemplate(name, description, defaultConfig, parameterSchema, validationRules, isPublic, createdBy) {
        const template = {} `
      id: template_${Date.now()}`, _$, { Math, random };
        ().toString(36).substr(2, 9);
    }
    name;
    description;
    default_config;
    parameter_schema;
    validation_rules;
    is_public;
    created_by;
    created_at;
    updated_at;
};
exports.TaskQueue = TaskQueue;
exports.TaskQueue = TaskQueue = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [LoggingService_1.LoggingService,
        MetricsService_1.MetricsService])
], TaskQueue);
;
this.taskTemplates.set(template.id, template);
await this.metricsService.recordMetric('task_template_created', 1, 'counter', {
    labels: {
        template_name: name
    }
});
return template;
async;
createTaskFromTemplate(templateId, string, parameters, (Record), overrides, (Partial) = {});
Promise < Task > {} `
    const template = this.taskTemplates.get(templateId);`;
if (!template) {
    throw new Error(Task, template, $, { templateId } ` not found);
    }

    // Validate parameters against schema
    this.validateParameters(parameters, template.parameter_schema);

    // Merge template config with overrides
    const taskConfig = { ...template.default_config, ...overrides };
    
    return await this.createTask(
      taskConfig.name || template.name,
      taskConfig.type || 'immediate',
      parameters,
      taskConfig
    );
  }

  async getTaskMetrics(): Promise<TaskQueueMetrics> {
    const allTasks = Array.from(this.tasks.values());
    const allWorkers = Array.from(this.taskWorkers.values());
    const allExecutions = Array.from(this.taskExecutions.values());

    const pendingTasks = allTasks.filter(t => t.status === 'pending').length;
    const runningTasks = allTasks.filter(t => t.status === 'running').length;
    const completedTasks = allTasks.filter(t => t.status === 'completed').length;
    const failedTasks = allTasks.filter(t => t.status === 'failed').length;
    const cancelledTasks = allTasks.filter(t => t.status === 'cancelled').length;
    const scheduledTasks = this.scheduledTasks.length;

    const activeWorkers = allWorkers.filter(w => w.status === 'busy').length;
    const idleWorkers = allWorkers.filter(w => w.status === 'idle').length;

    const completedExecutions = allExecutions.filter(e => e.status === 'completed' && e.execution_time_ms);
    const avgExecutionTime = completedExecutions.length > 0 ?
      completedExecutions.reduce((sum, e) => sum + (e.execution_time_ms || 0), 0) / completedExecutions.length : 0;

    const completedTasksWithWait = allTasks.filter(t => t.status === 'completed' && t.created_at && t.started_at);
    const avgWaitTime = completedTasksWithWait.length > 0 ?
      completedTasksWithWait.reduce((sum, t) => {
        const waitTime = t.started_at!.getTime() - t.created_at.getTime();
        return sum + waitTime;
      }, 0) / completedTasksWithWait.length : 0;

    const successRate = allTasks.length > 0 ? completedTasks / allTasks.length : 0;

    // Calculate throughput (tasks completed in last minute)
    const oneMinuteAgo = new Date(Date.now() - 60000);
    const recentCompletedTasks = allTasks.filter(t => 
      t.status === 'completed' && t.completed_at && t.completed_at > oneMinuteAgo
    ).length;

    const oldestPendingTask = allTasks
      .filter(t => t.status === 'pending')
      .sort((a, b) => a.created_at.getTime() - b.created_at.getTime())[0];

    // Calculate resource utilization
    const totalCapacity = allWorkers.reduce((sum, w) => sum + w.max_concurrent_tasks, 0);
    const currentlyUsed = allWorkers.reduce((sum, w) => sum + w.current_tasks.length, 0);
    const queueCapacityPercent = totalCapacity > 0 ? (currentlyUsed / totalCapacity) * 100 : 0;

    return {
      total_tasks: allTasks.length,
      pending_tasks: pendingTasks,
      running_tasks: runningTasks,
      completed_tasks: completedTasks,
      failed_tasks: failedTasks,
      cancelled_tasks: cancelledTasks,
      scheduled_tasks: scheduledTasks,
      workers_active: activeWorkers,
      workers_idle: idleWorkers,
      average_execution_time_ms: avgExecutionTime,
      average_wait_time_ms: avgWaitTime,
      success_rate: successRate,
      throughput_per_minute: recentCompletedTasks,
      oldest_pending_task: oldestPendingTask?.created_at,
      resource_utilization: {
        cpu_percent: 0, // Would be calculated from actual system metrics
        memory_percent: 0, // Would be calculated from actual system metrics
        queue_capacity_percent: queueCapacityPercent
      },
      last_updated: new Date()
    };
  }

  async getHealthStatus(): Promise<{ 
    status: 'healthy' | 'degraded' | 'unhealthy'; 
    details: Record<string, any> 
  }> {
    try {
      const metrics = await this.getTaskMetrics();
      const pendingTasks = metrics.pending_tasks;
      const failureRate = metrics.total_tasks > 0 ? metrics.failed_tasks / metrics.total_tasks : 0;
      const avgExecutionTime = metrics.average_execution_time_ms;

      const status = failureRate > 0.1 || avgExecutionTime > 300000 || pendingTasks > 1000 ? 'unhealthy' : 
                    failureRate > 0.05 || avgExecutionTime > 60000 || pendingTasks > 100 ? 'degraded' : 'healthy';

      return {
        status,
        details: {
          pending_tasks: pendingTasks,
          running_tasks: metrics.running_tasks,
          failure_rate: failureRate,
          average_execution_time_ms: avgExecutionTime,
          active_workers: metrics.workers_active,
          queue_capacity: metrics.resource_utilization.queue_capacity_percent,
          initialized: this.isInitialized
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: { error: error instanceof Error ? error.message : String(error) }
      };
    }
  }

  private addToPendingQueue(task: Task): void {
    // Insert task based on priority
    const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
    
    let insertIndex = this.pendingTasks.length;
    for (let i = 0; i < this.pendingTasks.length; i++) {
      if (priorityOrder[task.priority] < priorityOrder[this.pendingTasks[i].priority]) {
        insertIndex = i;
        break;
      }
    }
    
    this.pendingTasks.splice(insertIndex, 0, task);
  }

  private areDependenciesMet(task: Task): boolean {
    const dependencies = this.taskDependencies.get(task.id) || [];
    
    return dependencies.every(dep => {
      const dependentTask = this.tasks.get(dep.depends_on);
      if (!dependentTask) return false;
      
      switch (dep.dependency_type) {
        case 'success':
          return dependentTask.status === 'completed';
        case 'completion':
          return dependentTask.status === 'completed' || dependentTask.status === 'failed';
        case 'failure':
          return dependentTask.status === 'failed';
        default:
          return false;
      }
    });
  }

  private calculateNextRun(schedule: Task['schedule']): Date {
    if (!schedule) return new Date();

    const now = new Date();
    
    switch (schedule.type) {
      case 'once':
        return schedule.start_time || now;
      case 'interval':
        return new Date(now.getTime() + (schedule.interval_ms || 60000));
      case 'cron':
        // Simplified cron calculation - in a real implementation use a proper cron library
        return new Date(now.getTime() + 60 * 60 * 1000); // Next hour
      default:
        return now;
    }
  }

  private validateParameters(parameters: Record<string, any>, schema: Record<string, any>): void {
    // Basic parameter validation - in a real implementation use a proper schema validator
    for (const [key, schemaInfo] of Object.entries(schema)) {
      if (schemaInfo.required && !(key in parameters)) {
        throw new Error(Required parameter '${key}' is missing`);
}
async;
executeTask(task, Task);
Promise < void  > {
    const: execution, TaskExecution = {
        id: exec_$
    }
};
{
    Date.now();
}
_$;
{
    Math.random().toString(36).substr(2, 9);
}
task_id: task.id,
    status;
'running',
    started_at;
new Date(),
    attempt_number;
task.attempt_count + 1,
    resource_usage;
{ }
;
this.taskExecutions.set(execution.id, execution);
try {
    task.status = 'running';
    task.started_at = new Date();
    task.attempt_count++;
    this.tasks.set(task.id, task);
    // Find appropriate handler
    const handler = this.taskHandlers.get(task.type) || this.taskHandlers.get('*');
    `
      if (!handler) {`;
    throw new Error(No, handler, found);
    for (task; type; )
        : $;
    {
        task.type;
    }
    `);
      }

      // Set timeout for task execution
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Task timeout')), task.execution_config.timeout_ms);
      });

      // Execute task with timeout
      const result = await Promise.race([
        handler(task, execution),
        timeoutPromise
      ]);

      task.status = 'completed';
      task.completed_at = new Date();
      task.result = result;
      task.last_run_at = new Date();

      execution.status = 'completed';
      execution.completed_at = new Date();
      execution.execution_time_ms = execution.completed_at.getTime() - execution.started_at.getTime();
      execution.result = result;

      // Handle recurring tasks
      if (task.type === 'recurring' && task.schedule) {
        task.next_run_at = this.calculateNextRun(task.schedule);
        task.status = 'pending';
        this.scheduledTasks.push(task);
      }

      // Check for dependent tasks
      this.checkDependentTasks(task.id);

      await this.metricsService.recordMetric('task_completed', 1, 'counter', { 
        labels: { 
          task_type: task.type,
          attempts: task.attempt_count.toString()
        } 
      });

    } catch (error) {
      task.error_message = error instanceof Error ? error.message : String(error);
      execution.error_message = task.error_message;

      if (task.attempt_count >= task.execution_config.max_retries) {
        task.status = 'failed';
        task.completed_at = new Date();
        execution.status = 'failed';
        execution.completed_at = new Date();

        await this.metricsService.recordMetric('task_failed', 1, 'counter', { 
          labels: { 
            task_type: task.type,
            final_attempt: 'true');
      } else {
        // Retry with exponential backoff
        const delay = task.execution_config.retry_delay_ms * 
          Math.pow(task.execution_config.retry_backoff_multiplier, task.attempt_count - 1);
        
        setTimeout(() => {
          task.status = 'pending';
          this.addToPendingQueue(task);
        }, delay);

        await this.metricsService.recordMetric('task_retried', 1, 'counter', { 
          labels: { 
            task_type: task.type,
            attempt: task.attempt_count.toString()
          } 
        });
      }

      this.logger.error(Task ${task.id} failed`, error instanceof Error ? error : new Error(String(error)), 'TaskQueue';
    ;
}
finally {
}
this.tasks.set(task.id, task);
this.taskExecutions.set(execution.id, execution);
checkDependentTasks(completedTaskId, string);
void {
    : .taskDependencies.entries()
};
{
    const task = this.tasks.get(taskId);
    if (!task || task.status !== 'pending')
        continue;
    const dependsOnCompleted = dependencies.some(dep => dep.depends_on === completedTaskId);
    if (dependsOnCompleted && this.areDependenciesMet(task)) {
        this.addToPendingQueue(task);
    }
}
findAvailableWorker(task, Task);
TaskWorker | null;
{
    for (const worker of this.taskWorkers.values()) {
        if (worker.status === 'idle' &&
            worker.current_tasks.length < worker.max_concurrent_tasks &&
            (worker.capabilities.includes('*') || worker.capabilities.includes(task.type))) {
            return worker;
        }
    }
    return null;
}
startTaskProcessor();
void {
    this: .processingInterval = setInterval(async () => {
        if (this.pendingTasks.length === 0)
            return;
        const currentRunningTasks = Array.from(this.tasks.values()).filter(t => t.status === 'running').length;
        if (currentRunningTasks >= this.maxConcurrentTasks)
            return;
        const task = this.pendingTasks.shift();
        if (!task)
            return;
        const worker = this.findAvailableWorker(task);
        if (!worker) {
            // Put task back at front of queue
            this.pendingTasks.unshift(task);
            return;
        }
        // Assign task to worker
        worker.status = 'busy';
        worker.current_tasks.push(task.id);
        worker.last_heartbeat = new Date();
        this.taskWorkers.set(worker.id, worker);
        // Execute task
        this.executeTask(task).finally(() => {
            // Clean up worker assignment
            worker.current_tasks = worker.current_tasks.filter(id => id !== task.id);
            worker.total_tasks_processed++;
            if (task.status === 'failed') {
                worker.total_tasks_failed++;
            }
            if (worker.current_tasks.length === 0) {
                worker.status = 'idle';
            }
            worker.last_heartbeat = new Date();
            this.taskWorkers.set(worker.id, worker);
        });
    }, 1000)
};
startTaskScheduler();
void {
    this: .schedulerInterval = setInterval(() => {
        const now = new Date();
        const readyTasks = this.scheduledTasks.filter(task => task.next_run_at && task.next_run_at <= now);
        readyTasks.forEach(task => {
            // Remove from scheduled tasks
            this.scheduledTasks = this.scheduledTasks.filter(t => t.id !== task.id);
            // Add to pending queue
            task.status = 'pending';
            this.addToPendingQueue(task);
        });
    }, 5000)
};
startMetricsCollection();
void {
    setInterval(async) { }
}();
{
    const metrics = await this.getTaskMetrics();
    await this.metricsService.recordMetric('task_queue_pending', metrics.pending_tasks, 'gauge', { labels: {} });
    await this.metricsService.recordMetric('task_queue_running', metrics.running_tasks, 'gauge', { labels: {} });
    await this.metricsService.recordMetric('task_queue_success_rate', metrics.success_rate, 'gauge', { labels: {} });
    await this.metricsService.recordMetric('task_queue_throughput', metrics.throughput_per_minute, 'gauge', { labels: {} });
}
30000;
; // Every 30 seconds
exports.default = TaskQueue;
//# sourceMappingURL=TaskQueue.js.map