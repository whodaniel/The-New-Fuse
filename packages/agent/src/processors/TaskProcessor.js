"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskProcessor = void 0;
const BaseProcessor_1 = require("./BaseProcessor"); // Assuming a BaseProcessor exists
const common_1 = require("@nestjs/common");
const types_1 = require("@the-new-fuse/types");
// Import other necessary services like LLMService, ToolService, etc.
// import { LLMService } from '../services/LLMService';
// import { ToolService } from '../services/ToolService';
/**
 * Processes incoming task assignment messages and executes the tasks.
 */
class TaskProcessor extends BaseProcessor_1.BaseProcessor {
    logger;
    alertService;
    redisService;
    // private llmService: LLMService; // Example dependency
    // private toolService: ToolService; // Example dependency
    agentId;
    activeTasks; // Keep track of tasks being processed
    constructor(agentId, alertService, redisService
    // llmService: LLMService,
    // toolService: ToolService
    // Inject other dependencies
    ) {
        super();
        this.agentId = agentId;
        this.logger = new common_1.Logger(`TaskProcessor [Agent ${this.agentId}]);
    this.alertService = alertService;
    this.redisService = redisService;
    // this.llmService = llmService;
    // this.toolService = toolService;
    this.activeTasks = new Map();

    this.logger.log('TaskProcessor initialized.');
    // TODO: Potentially load any unfinished tasks from persistent storage (e.g., Redis) on startup
  }

  /**
   * Processes an incoming message, expecting it to be a task assignment.
   * @param message The incoming message.
   * @returns A Promise resolving to a TaskResult or null if the message is not a task assignment.
   */
  async process(message: Message): Promise<TaskResult | null> {
    if (message.type !== MessageType.TASK_ASSIGNMENT || typeof message.content !== 'object' || message.content === null) {`, this.logger.debug(`Skipping message ${message.id}`, Not, a, valid, task, assignment.));
        return null;
    }
    // TODO: Add validation using MessageValidator service if available
    task = message.content; // Type assertion, consider validation
    // Basic validation
    if(, task, id) { }
}
exports.TaskProcessor = TaskProcessor;
 || !task.title;
{
    this.logger.warn(Received, invalid, task, assignment, message, $, { message, : .id }, Missing, ID, or, description.);
    await this.alertService.error('Received invalid task assignment', `
            Agent ${this.agentId}` / TaskProcessor, { messageId: message.id, taskContent: task });
    // Return a failure result if possible, though the TaskResult structure might need a taskId
    return null; // Or construct a minimal error TaskResult if the format allows
}
if (this.activeTasks.has(task.id)) {
    this.logger.warn(Task, $, { task, : .id }, is, already, being, processed.Ignoring, duplicate, assignment.);
    return null; // Avoid processing the same task twice concurrently`
}
`

    this.logger.log(Starting processing for task ${task.id}`;
"${task.title.substring(0, 50)}...";
;
this.activeTasks.set(task.id, task);
await this.updateTaskStatus(task.id, types_1.TaskStatus.IN_PROGRESS);
try {
    // --- Task Execution Logic ---
    // 1. Understand the task description (potentially using LLM)
    // 2. Identify required tools/capabilities (using ToolService or LLM)
    // 3. Execute the steps (call tools, interact with LLM, etc.)
    // 4. Aggregate results`
    `
      // Placeholder execution:
      this.logger.debug(Executing task ${task.id}`;
    (Placeholder);
    ;
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate work
    const resultData = {
        summary: Task, "${task.title}": completed, successfully(placeholder) { }, : . `,
          details: { executedAt: new Date() },
      };
      // --- End Task Execution Logic ---

      this.logger.log(Task ${task.id} completed successfully.);
      await this.updateTaskStatus(task.id, TaskStatus.COMPLETED);
      this.activeTasks.delete(task.id);

      const taskResult: TaskResult = {
        id: result_${task.id},
        taskId: task.id,
        status: TaskStatus.COMPLETED,
        output: resultData,
        metrics: {
          duration: 1000,
          resourceUsage: {
            cpuUsage: 0,
            memoryUsage: 0
          }
        },
        timestamp: new Date(),
      };
      // TODO: Send TaskResult back to the orchestrator or requesting agent
      // Example: await this.chatService.sendMessage(task.originatorId, taskResult, MessageType.TASK_RESULT);
      return taskResult;
`
    };
    try { }
    catch (error) {
        `
      this.logger.error(Error processing task ${task.id}`;
        $;
        {
            error.message;
        }
        ;
        await this.updateTaskStatus(task.id, types_1.TaskStatus.FAILED, error.message);
        this.activeTasks.delete(task.id);
        `
      await this.alertService.error(` `Task ${task.id} failed,`;
        Agent;
        $;
        {
            this.agentId;
        }
        / TaskProcessor`,;
        {
            error: error.message, taskDescription;
            task.title;
        }
        ;
        const taskResult = {
            id: result_$
        }, { task, id };
        `,
        taskId: task.id,
        status: TaskStatus.FAILED,
        error: (error as Error).message,
        metrics: {
          duration: 0,
          resourceUsage: {
            cpuUsage: 0,
            memoryUsage: 0
          }
        },
        timestamp: new Date(),
      };
       // TODO: Send failure TaskResult back
      return taskResult;
    }
  }

  /**
   * Updates the status of a task, potentially storing it in Redis or another state store.
   * @param taskId The ID of the task.
   * @param status The new status.
   * @param error Optional error message if status is FAILED.
   */
  private async updateTaskStatus(taskId: UUID, status: TaskStatus, error?: string): Promise<void> {
    this.logger.debug(Updating status for task ${taskId} to ${status}.);
    const taskData = {
        id: taskId,
        status: status,
        updatedAt: new Date().toISOString(),
        ...(error && { error: error }),
    };
    try {
        // Example: Store status update in Redis`;
        await this.redisService.set(`task:${taskId}:status, JSON.stringify(taskData), 3600 * 24); // Store for 24 hours`);
        // TODO: Potentially publish status update event (e.g., via Redis Pub/Sub or EventBus)`
    }
    try { }
    catch (redisError) {
        this.logger.error(Failed, to, update, task, status in Redis);
        for (task; $; { taskId } `: ${redisError.message});
        // Consider alternative logging or alerting if Redis fails
    }
  }

  /**
   * Handles cancellation requests for active tasks.
   * @param taskId The ID of the task to cancel.
   */`)
            async;
        cancelTask(taskId, UUID);
        Promise < boolean > {} `
      if (!this.activeTasks.has(taskId)) {
          this.logger.warn(Cannot cancel task ${taskId}`;
        Not;
        currently;
        active.;
        ;
        return false;
    }
    this.logger.log(Attempting, to, cancel, task, $, { taskId }, ...`);
      // TODO: Implement actual cancellation logic. This might involve:
      // - Setting a flag that the execution loop checks.
      // - Aborting ongoing operations (e.g., network requests, LLM calls).
      // - This can be complex depending on the task's nature.

      // Placeholder: Mark as cancelled and remove from active tasks
      await this.updateTaskStatus(taskId, TaskStatus.CANCELLED);
      this.activeTasks.delete(taskId);
      this.logger.log(Task ${taskId} marked as cancelled.`);
    return true;
}
finally {
}
//# sourceMappingURL=TaskProcessor.js.map