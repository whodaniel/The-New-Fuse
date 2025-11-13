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
exports.TaskSchedulerAgent = void 0;
const common_1 = require("@nestjs/common");
const LoggingService_1 = require("../../services/LoggingService");
let TaskSchedulerAgent = class TaskSchedulerAgent {
    logger;
    tasks = new Map();
    executions = new Map();
    execution_times = [];
    scheduler_interval;
    cleanup_interval;
    constructor(logger) {
        this.logger = logger;
        this.logger.log('TaskSchedulerAgent initialized', 'TaskSchedulerAgent');
        this.startScheduler();
        this.startCleanup();
    }
    async createTask(task_data) {
        const task = {
            id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)},
      ...task_data,
      created_at: new Date(),
      updated_at: new Date(),
      execution_count: 0,
      success_count: 0,
      failure_count: 0,
      next_execution: this.calculateNextExecution(task_data.schedule_config)
    };

    // Validate task configuration
    this.validateTaskConfig(task);

    this.tasks.set(task.id, task);`,
            this: .logger.log(Scheduled, task, created, $, { task, : .name } ` (${task.id}`), 'TaskSchedulerAgent': 
        };
        return task;
    }
    async updateTask(id, updates) {
        const task = this.tasks.get(id);
        if (!task) {
            return null;
        }
        Object.assign(task, updates, { updated_at: new Date() });
        // Recalculate next execution if schedule changed
        if (updates.schedule_config) {
            task.next_execution = this.calculateNextExecution(task.schedule_config);
        }
        this.logger.log(Scheduled, task, updated, $, { task, : .name }($, { id }), 'TaskSchedulerAgent');
        return task;
    }
    async deleteTask(id) {
        const task = this.tasks.get(id);
        if (!task) {
            return false;
        }
        // Cancel any pending executions
        const pending_executions = Array.from(this.executions.values())
            .filter(exec => exec.task_id === id && exec.status === 'pending');
        pending_executions.forEach(execution => {
            execution.status = 'cancelled';
        });
        this.tasks.delete(id);
        `
    this.logger.log(`;
        Scheduled;
        task;
        deleted: $;
        {
            task.name;
        }
        ($);
        {
            id;
        }
        `, 'TaskSchedulerAgent');
    
    return true;
  }

  async pauseTask(id: string): Promise<boolean> {
    const task = this.tasks.get(id);
    if (!task) {
      return false;
    }

    task.status = 'paused';
    task.updated_at = new Date();
    this.logger.log(Task paused: ${task.name} (${id}), 'TaskSchedulerAgent');
    
    return true;
  }

  async resumeTask(id: string): Promise<boolean> {
    const task = this.tasks.get(id);
    if (!task) {
      return false;
    }

    task.status = 'active';
    task.updated_at = new Date();
    task.next_execution = this.calculateNextExecution(task.schedule_config, new Date());`;
        this.logger.log(Task, resumed, $, { task, : .name }($, { id } `)`, 'TaskSchedulerAgent'));
        return true;
    }
    async executeTaskNow(id) {
        const task = this.tasks.get(id);
        if (!task) {
            throw new Error(Task, not, found, $, { id });
        }
        const execution_id = await this.scheduleExecution(task, new Date(), 'manual');
        `
    this.logger.log(Task executed manually: ${task.name}`($, { execution_id }) `, 'TaskSchedulerAgent');
    
    return execution_id;
  }

  async getTask(id: string): Promise<ScheduledTask | null> {
    return this.tasks.get(id) || null;
  }

  async getTasks(filter: {
    status?: ScheduledTask['status'];
    type?: ScheduledTask['type'];
    created_by?: string;
    tags?: string[];
    search?: string;
  } = {}): Promise<ScheduledTask[]> {
    let tasks = Array.from(this.tasks.values());

    if (filter.status) {
      tasks = tasks.filter(t => t.status === filter.status);
    }
    if (filter.type) {
      tasks = tasks.filter(t => t.type === filter.type);
    }
    if (filter.created_by) {
      tasks = tasks.filter(t => t.created_by === filter.created_by);
    }
    if (filter.tags && filter.tags.length > 0) {
      tasks = tasks.filter(t => filter.tags!.some(tag => t.tags.includes(tag)));
    }
    if (filter.search) {
      const search_lower = filter.search.toLowerCase();
      tasks = tasks.filter(t => 
        t.name.toLowerCase().includes(search_lower) ||
        t.description.toLowerCase().includes(search_lower)
      );
    }

    return tasks.sort((a, b) => a.next_execution.getTime() - b.next_execution.getTime());
  }

  async getExecution(execution_id: string): Promise<TaskExecution | null> {
    return this.executions.get(execution_id) || null;
  }

  async getTaskExecutions(task_id: string, limit: number = 100): Promise<TaskExecution[]> {
    return Array.from(this.executions.values())
      .filter(exec => exec.task_id === task_id)
      .sort((a, b) => b.scheduled_at.getTime() - a.scheduled_at.getTime())
      .slice(0, limit);
  }

  async getUpcomingExecutions(hours: number = 24): Promise<{ task: ScheduledTask; execution_time: Date }[]> {
    const now = new Date();
    const future_time = new Date(now.getTime() + hours * 60 * 60 * 1000);
    
    const upcoming: { task: ScheduledTask; execution_time: Date }[] = [];

    for (const task of this.tasks.values()) {
      if (task.status === 'active' && task.next_execution <= future_time) {
        upcoming.push({
          task,
          execution_time: task.next_execution
        });
      }
    }

    return upcoming.sort((a, b) => a.execution_time.getTime() - b.execution_time.getTime());
  }

  async getStats(): Promise<TaskSchedulerStats> {
    const tasks = Array.from(this.tasks.values());
    const executions = Array.from(this.executions.values());
    
    const tasks_by_type: Record<string, number> = {};
    const tasks_by_status: Record<string, number> = {};

    tasks.forEach(task => {
      tasks_by_type[task.type] = (tasks_by_type[task.type] || 0) + 1;
      tasks_by_status[task.status] = (tasks_by_status[task.status] || 0) + 1;
    });

    const average_execution_time = this.execution_times.length > 0 ?
      this.execution_times.reduce((a, b) => a + b, 0) / this.execution_times.length : 0;

    const next_24h = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const next_24h_executions = tasks.filter(t => 
      t.status === 'active' && t.next_execution <= next_24h
    ).length;

    return {
      total_tasks: tasks.length,
      active_tasks: tasks.filter(t => t.status === 'active').length,
      paused_tasks: tasks.filter(t => t.status === 'paused').length,
      total_executions: executions.length,
      pending_executions: executions.filter(e => e.status === 'pending').length,
      running_executions: executions.filter(e => e.status === 'running').length,
      completed_executions: executions.filter(e => e.status === 'completed').length,
      failed_executions: executions.filter(e => e.status === 'failed').length,
      average_execution_time,
      tasks_by_type,
      tasks_by_status,
      next_24h_executions
    };
  }

  private validateTaskConfig(task: ScheduledTask): void {
    // Validate schedule configuration
    if (task.type === 'one_time' && !task.schedule_config.execute_at) {
      throw new Error('One-time tasks must specify execute_at');
    }

    if (task.type === 'cron' && !task.schedule_config.cron_expression) {
      throw new Error('Cron tasks must specify cron_expression');
    }

    if (task.type === 'interval' && !task.schedule_config.interval) {
      throw new Error('Interval tasks must specify interval');
    }

    // Validate task configuration
    if (!task.task_config.target) {
      throw new Error('Task must specify a target');
    }

    // Validate cron expression if provided
    if (task.schedule_config.cron_expression) {
      this.validateCronExpression(task.schedule_config.cron_expression);
    }
  }

  private validateCronExpression(expression: string): void {
    // Basic cron expression validation (5 or 6 fields)
    const parts = expression.trim().split(/\s+/);
    if (parts.length !== 5 && parts.length !== 6) {
      throw new Error('Cron expression must have 5 or 6 fields');
    }
  }

  private calculateNextExecution(config: ScheduleConfig, from_date: Date = new Date()): Date {
    const now = new Date(from_date);

    switch (config.frequency) {
      case 'minutely':
        return new Date(now.getTime() + 60 * 1000);
      
      case 'hourly':
        const next_hour = new Date(now);
        next_hour.setHours(next_hour.getHours() + 1);
        next_hour.setMinutes(0);
        next_hour.setSeconds(0);
        return next_hour;
      
      case 'daily':
        const next_day = new Date(now);
        next_day.setDate(next_day.getDate() + 1);
        next_day.setHours(0);
        next_day.setMinutes(0);
        next_day.setSeconds(0);
        return next_day;
      
      case 'weekly':
        const next_week = new Date(now);
        next_week.setDate(next_week.getDate() + 7);
        return next_week;
      
      case 'monthly':
        const next_month = new Date(now);
        next_month.setMonth(next_month.getMonth() + 1);
        return next_month;
      
      case 'yearly':
        const next_year = new Date(now);
        next_year.setFullYear(next_year.getFullYear() + 1);
        return next_year;
      
      default:
        if (config.execute_at) {
          return new Date(config.execute_at);
        }
        if (config.interval) {
          return new Date(now.getTime() + config.interval * 1000);
        }
        return new Date(now.getTime() + 60 * 60 * 1000); // Default to 1 hour
    }
  }

  private startScheduler(): void {
    this.scheduler_interval = setInterval(() => {
      this.checkAndScheduleTasks();
    }, 30000); // Check every 30 seconds
  }

  private startCleanup(): void {
    this.cleanup_interval = setInterval(() => {
      this.cleanupOldExecutions();
    }, 60 * 60 * 1000); // Cleanup every hour
  }

  private async checkAndScheduleTasks(): Promise<void> {
    const now = new Date();
    
    for (const task of this.tasks.values()) {
      if (task.status === 'active' && task.next_execution <= now) {
        try {
          await this.scheduleExecution(task, now, 'scheduled');
          
          // Calculate next execution time
          if (task.type !== 'one_time') {
            task.next_execution = this.calculateNextExecution(task.schedule_config, now);
          } else {
            task.status = 'completed';
          }
          
          task.updated_at = new Date();
          
        } catch (error) {
          this.logger.error(Failed to schedule task: ${task.name}, error instanceof Error ? error : new Error(String(error)), 'TaskSchedulerAgent');
        }
      }
    }
  }

  private async scheduleExecution(task: ScheduledTask, scheduled_at: Date, trigger: 'scheduled' | 'manual'): Promise<string> {`;
        const execution = {} `
      id: `, exec_$, { Date, now };
        ();
    }
    _$;
};
exports.TaskSchedulerAgent = TaskSchedulerAgent;
exports.TaskSchedulerAgent = TaskSchedulerAgent = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [LoggingService_1.LoggingService])
], TaskSchedulerAgent);
{
    Math.random().toString(36).substr(2, 9);
}
task_id: task.id,
    status;
'pending',
    scheduled_at,
    attempt_number;
1,
    logs;
[];
;
this.executions.set(execution.id, execution);
// Execute immediately in background
this.executeTask(execution, task);
return execution.id;
async;
executeTask(execution, TaskExecution, task, ScheduledTask);
Promise < void  > {
    try: {
        execution, : .status = 'running',
        execution, : .started_at = new Date(),
        task, : .execution_count++
    } `
      `,
    this: .addExecutionLog(execution, 'info', `Task execution started: ${task.name});
      
      // Simulate task execution based on type
      const result = await this.executeTaskByType(task, execution);
      
      execution.status = 'completed';
      execution.output = result;
      execution.completed_at = new Date();
      execution.duration = execution.completed_at.getTime() - execution.started_at.getTime();
      
      task.success_count++;
      task.last_executed = execution.completed_at;
      
      this.execution_times.push(execution.duration);
      if (this.execution_times.length > 1000) {
        this.execution_times.shift();
      }
      `, this.addExecutionLog(execution, 'info', Task, execution, completed, successfully `);
      this.logger.log(Task executed successfully: ${task.name}`($, { execution, : .id }), 'TaskSchedulerAgent')),
    // Send notifications
    await, this: .sendNotifications(task, execution, 'completed')
};
try { }
catch (error) {
    execution.status = 'failed';
    execution.error_message = error instanceof Error ? error.message : String(error);
    execution.completed_at = new Date();
    execution.duration = execution.completed_at.getTime() - execution.started_at.getTime();
    task.failure_count++;
    `
      this.addExecutionLog(execution, 'error', `;
    Task;
    execution;
    failed: $;
    {
        execution.error_message;
    }
    `);
      this.logger.error(Task execution failed: ${task.name} (${execution.id}), error instanceof Error ? error : new Error(String(error)), 'TaskSchedulerAgent');
      
      // Handle retry logic
      await this.handleTaskRetry(task, execution);
      
      // Send notifications
      await this.sendNotifications(task, execution, 'failed');
    }
  }

  private async executeTaskByType(task: ScheduledTask, execution: TaskExecution): Promise<any> {
    const { task_config } = task;
    
    // Simulate execution time
    const delay = Math.random() * 2000 + 1000; // 1-3 seconds
    await new Promise(resolve => setTimeout(resolve, delay));
    
    switch (task_config.type) {
      case 'workflow':`;
    this.addExecutionLog(execution, 'info', Executing, workflow, $, { task_config, : .target } `);
        return { workflow_id: task_config.target, status: 'completed', result: 'Workflow executed successfully' };
      
      case 'agent_action':
        this.addExecutionLog(execution, 'info', Executing agent action: ${task_config.action}`, on, $, { task_config, : .target });
    return { agent_id: task_config.target, action: task_config.action, result: 'Agent action completed' };
    'webhook';
    `
        this.addExecutionLog(execution, 'info', Calling webhook: ${task_config.target}`;
    ;
    return { url: task_config.target, status_code: 200, response: 'Webhook called successfully' };
    'script';
    this.addExecutionLog(execution, 'info', Executing, script, $, { task_config, : .target } `);
        return { script: task_config.target, exit_code: 0, output: 'Script executed successfully' };
      
      case 'api_call':
        this.addExecutionLog(execution, 'info', Making API call to: ${task_config.target});
        return { endpoint: task_config.target, status_code: 200, response: 'API call successful' };
      
      default:`);
    throw new Error(Unsupported, task, type, $, { task_config, : .type } ``);
}
async;
handleTaskRetry(task, ScheduledTask, execution, TaskExecution);
Promise < void  > {
    if(, task) { }, : .retry_policy.enabled
};
{
    return;
}
if (execution.attempt_number < task.retry_policy.max_attempts) {
    const delay = this.calculateRetryDelay(task.retry_policy, execution.attempt_number);
    setTimeout(async () => {
        const retry_execution = {
            ...execution,
            id: exec_$
        }, { Date, now };
        ();
    }, _$, { Math, : .random().toString(36).substr(2, 9) }, status, 'pending', attempt_number, execution.attempt_number + 1, logs, [], started_at, undefined, completed_at, undefined, duration, undefined, output, undefined, error_message, undefined);
}
;
this.executions.set(retry_execution.id, retry_execution);
`
        this.addExecutionLog(retry_execution, 'info', Retrying task execution (attempt ${retry_execution.attempt_number}`;
;
await this.executeTask(retry_execution, task);
delay;
;
calculateRetryDelay(policy, TaskRetryPolicy, attempt, number);
number;
{
    let delay = policy.delay;
    switch (policy.backoff_strategy) {
        case 'linear':
            delay = policy.delay * attempt;
            break;
        case 'exponential':
            delay = policy.delay * Math.pow(policy.backoff_multiplier, attempt - 1);
            break;
        case 'fixed':
        default:
            delay = policy.delay;
            break;
    }
    return Math.min(delay, policy.max_delay);
}
async;
sendNotifications(task, ScheduledTask, execution, TaskExecution, event, 'started' | 'completed' | 'failed' | 'cancelled' | 'retry');
Promise < void  > {
    for(, notification, of, task) { }, : .notifications
};
{
    if (notification.enabled && notification.events.includes(event)) {
        try {
            await this.sendNotification(notification, task, execution, event);
        }
        catch (error) {
            this.logger.error(Failed, to, send, notification, $, { notification, : .type } `, error instanceof Error ? error : new Error(String(error)), 'TaskSchedulerAgent');
        }
      }
    }
  }

  private async sendNotification(notification: NotificationConfig, task: ScheduledTask, execution: TaskExecution, event: string): Promise<void> {
    // Simulate notification sending
    this.logger.log(Sending ${notification.type} notification for task ${task.name} (${event})`, 'TaskSchedulerAgent');
        }
        addExecutionLog(execution, TaskExecution, level, ExecutionLog['level'], message, string, data ?  : any);
        void {
            execution, : .logs.push({
                timestamp: new Date(),
                level,
                message,
                data
            })
        };
        cleanupOldExecutions();
        void {
            const: cutoff_date = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            : .executions.entries()
        };
        {
            if (execution.scheduled_at < cutoff_date) {
                this.executions.delete(id);
            }
        }
        this.logger.log('Cleaned up old task executions', 'TaskSchedulerAgent');
    }
    async;
    destroy();
    Promise < void  > {
        : .scheduler_interval
    };
    {
        clearInterval(this.scheduler_interval);
    }
    if (this.cleanup_interval) {
        clearInterval(this.cleanup_interval);
    }
    this.logger.log('TaskSchedulerAgent destroyed', 'TaskSchedulerAgent');
}
exports.default = TaskSchedulerAgent;
//# sourceMappingURL=task-scheduler.js.map