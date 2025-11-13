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
exports.TaskService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const LoggingService_1 = require("./LoggingService");
const MetricsService_1 = require("./MetricsService");
let TaskService = class TaskService {
    loggingService;
    metricsService;
    eventEmitter;
    tasks = new Map();
    userTasks = new Map(); // userId -> taskIds
    agentTasks = new Map(); // agentId -> taskIds
    agencyTasks = new Map(); // agencyId -> taskIds
    taskAssignments = new Map(); // taskId -> assignment
    constructor(loggingService, metricsService, eventEmitter) {
        this.loggingService = loggingService;
        this.metricsService = metricsService;
        this.eventEmitter = eventEmitter;
    }
    async createTask(createTaskDto, createdBy) {
        const { title, description, priority = 'medium', type = 'custom', assigneeId, assignerId, agentId, agencyId, parentTaskId, dueDate, estimatedDuration, tags = [], metadata, } = createTaskDto;
        // Validate parent task if provided
        if (parentTaskId && !this.tasks.has(parentTaskId)) {
            throw new common_1.NotFoundException(`Parent task with ID ${parentTaskId} not found);
    }

    const task: Task = {
      id: this.generateId(),
      title,
      description,
      status: 'pending',
      priority,
      type,
      assigneeId,
      assignerId,
      agentId,
      agencyId,
      parentTaskId,
      dueDate,
      estimatedDuration,
      progress: 0,
      tags,
      metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy,
      updatedBy: createdBy,
    };

    // Store task
    this.tasks.set(task.id, task);

    // Update indexes
    if (assigneeId) {
      this.addUserTask(assigneeId, task.id);
    }
    if (agentId) {
      this.addAgentTask(agentId, task.id);
    }
    if (agencyId) {
      this.addAgencyTask(agencyId, task.id);
    }

    // Record metrics
    this.metricsService.incrementCounter('tasks.created', 1, {
      labels: {
        priority: task.priority,
        type: task.type,
      }
    });

    // Log activity`, this.loggingService.log(`Task created: ${title}`($, { task, : .id }), 'TaskService'));
            // Emit event
            this.eventEmitter.emit('task.created', {
                taskId: task.id,
                title: task.title,
                priority: task.priority,
                type: task.type,
                assigneeId: task.assigneeId,
                agentId: task.agentId,
            });
            return task;
        }
        async;
        updateTask(id, string, updateTaskDto, UpdateTaskDto, updatedBy, string);
        Promise < Task > {
            const: task = this.tasks.get(id),
            if(, task) {
                `
      throw new NotFoundException(`;
                Task;
                with (ID)
                    $;
                {
                    id;
                }
                ` not found);
    }

    const {
      title,
      description,
      status,
      priority,
      assigneeId,
      agentId,
      dueDate,
      progress,
      tags,
      metadata,
    } = updateTaskDto;

    const oldStatus = task.status;
    const oldAssigneeId = task.assigneeId;

    // Update fields
    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (status) {
      task.status = status;
      if (status === 'in_progress' && !task.startedAt) {
        task.startedAt = new Date();
      }
      if (status === 'completed' && !task.completedAt) {
        task.completedAt = new Date();
        if (task.startedAt) {
          task.actualDuration = Math.round(
            (task.completedAt.getTime() - task.startedAt.getTime()) / 60000
          ); // Convert to minutes
        }
      }
    }
    if (priority) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (progress !== undefined) task.progress = Math.max(0, Math.min(100, progress));
    if (tags) task.tags = tags;
    if (metadata) task.metadata = { ...task.metadata, ...metadata };

    // Handle assignee change
    if (assigneeId !== undefined && assigneeId !== oldAssigneeId) {
      if (oldAssigneeId) {
        this.removeUserTask(oldAssigneeId, task.id);
      }
      if (assigneeId) {
        this.addUserTask(assigneeId, task.id);
      }
      task.assigneeId = assigneeId;
    }

    if (agentId !== undefined) {
      if (task.agentId) {
        this.removeAgentTask(task.agentId, task.id);
      }
      if (agentId) {
        this.addAgentTask(agentId, task.id);
      }
      task.agentId = agentId;
    }

    task.updatedAt = new Date();
    task.updatedBy = updatedBy;

    // Record metrics
    this.metricsService.incrementCounter('tasks.updated', 1, {
      labels: {
        priority: task.priority,
        type: task.type,
      }
    });

    if (oldStatus !== task.status) {
      this.metricsService.incrementCounter('tasks.status_changed', 1, {
        labels: {
          from: oldStatus,
          to: task.status,
        }
      });
    }

    // Log activity
    this.loggingService.log(Task updated: ${task.title} (${task.id}), 'TaskService');

    // Emit event
    this.eventEmitter.emit('task.updated', {
      taskId: task.id,
      title: task.title,
      status: task.status,
      priority: task.priority,
      assigneeId: task.assigneeId,
      agentId: task.agentId,
      changes: Object.keys(updateTaskDto),
    });

    return task;
  }

  async deleteTask(id: string): Promise<void> {
    const task = this.tasks.get(id);
    if (!task) {`;
                throw new common_1.NotFoundException(Task);
                with (ID)
                    $;
                {
                    id;
                }
                ` not found);
    }

    // Remove from indexes
    if (task.assigneeId) {
      this.removeUserTask(task.assigneeId, task.id);
    }
    if (task.agentId) {
      this.removeAgentTask(task.agentId, task.id);
    }
    if (task.agencyId) {
      this.removeAgencyTask(task.agencyId, task.id);
    }

    // Remove task
    this.tasks.delete(id);

    // Record metrics
    this.metricsService.incrementCounter('tasks.deleted', 1, {
      labels: {
        priority: task.priority,
        type: task.type,
      }
    });

    // Log activity
    this.loggingService.log(Task deleted: ${task.title}`($, { task, : .id }), 'TaskService';
                ;
                // Emit event
                this.eventEmitter.emit('task.deleted', {
                    taskId: id,
                    title: task.title,
                    priority: task.priority,
                    type: task.type,
                });
            },
            async getTask(id) {
                return this.tasks.get(id) || null;
            },
            async getTasks(filter) {
                let tasks = Array.from(this.tasks.values());
                if (filter) {
                    if (filter.status) {
                        tasks = tasks.filter(task => task.status === filter.status);
                    }
                    if (filter.priority) {
                        tasks = tasks.filter(task => task.priority === filter.priority);
                    }
                    if (filter.type) {
                        tasks = tasks.filter(task => task.type === filter.type);
                    }
                    if (filter.assigneeId) {
                        tasks = tasks.filter(task => task.assigneeId === filter.assigneeId);
                    }
                    if (filter.assignerId) {
                        tasks = tasks.filter(task => task.assignerId === filter.assignerId);
                    }
                    if (filter.agentId) {
                        tasks = tasks.filter(task => task.agentId === filter.agentId);
                    }
                    if (filter.agencyId) {
                        tasks = tasks.filter(task => task.agencyId === filter.agencyId);
                    }
                    if (filter.parentTaskId) {
                        tasks = tasks.filter(task => task.parentTaskId === filter.parentTaskId);
                    }
                    if (filter.dueBefore !== undefined) {
                        tasks = tasks.filter(task => task.dueDate && task.dueDate <= filter.dueBefore);
                    }
                    if (filter.dueAfter !== undefined) {
                        tasks = tasks.filter(task => task.dueDate && task.dueDate >= filter.dueAfter);
                    }
                    if (filter.createdAfter !== undefined) {
                        tasks = tasks.filter(task => task.createdAt >= filter.createdAfter);
                    }
                    if (filter.createdBefore !== undefined) {
                        tasks = tasks.filter(task => task.createdAt <= filter.createdBefore);
                    }
                    if (filter.tags && filter.tags.length > 0) {
                        tasks = tasks.filter(task => filter.tags.some(tag => task.tags.includes(tag)));
                    }
                    if (filter.search) {
                        const searchLower = filter.search.toLowerCase();
                        tasks = tasks.filter(task => task.title.toLowerCase().includes(searchLower) ||
                            (task.description && task.description.toLowerCase().includes(searchLower)));
                    }
                }
                return tasks;
            },
            async getUserTasks(userId, filter) {
                const taskIds = this.userTasks.get(userId);
                if (!taskIds || taskIds.size === 0) {
                    return [];
                }
                const tasks = Array.from(taskIds)
                    .map(taskId => this.tasks.get(taskId))
                    .filter(task => task !== undefined);
                if (filter) {
                    return this.applyFilter(tasks, filter);
                }
                return tasks;
            },
            async getAgentTasks(agentId, filter) {
                const taskIds = this.agentTasks.get(agentId);
                if (!taskIds || taskIds.size === 0) {
                    return [];
                }
                const tasks = Array.from(taskIds)
                    .map(taskId => this.tasks.get(taskId))
                    .filter(task => task !== undefined);
                if (filter) {
                    return this.applyFilter(tasks, filter);
                }
                return tasks;
            },
            async getAgencyTasks(agencyId, filter) {
                const taskIds = this.agencyTasks.get(agencyId);
                if (!taskIds || taskIds.size === 0) {
                    return [];
                }
                const tasks = Array.from(taskIds)
                    .map(taskId => this.tasks.get(taskId))
                    .filter(task => task !== undefined);
                if (filter) {
                    return this.applyFilter(tasks, filter);
                }
                return tasks;
            },
            async assignTask(taskId, userId, assignedBy, notes) {
                const task = this.tasks.get(taskId);
                if (!task) {
                    throw new common_1.NotFoundException(Task);
                    with (ID)
                        $;
                    {
                        taskId;
                    }
                    not;
                    found;
                    ;
                }
                const oldAssigneeId = task.assigneeId;
                // Remove from old assignee if different
                if (oldAssigneeId && oldAssigneeId !== userId) {
                    this.removeUserTask(oldAssigneeId, taskId);
                }
                // Add to new assignee if different
                if (!oldAssigneeId || oldAssigneeId !== userId) {
                    this.addUserTask(userId, taskId);
                }
                // Update task
                task.assigneeId = userId;
                task.updatedAt = new Date();
                task.updatedBy = assignedBy;
                // Record assignment
                this.taskAssignments.set(taskId, {
                    taskId,
                    userId,
                    assignedAt: new Date(),
                    assignedBy,
                    notes,
                });
                // Record metrics
                this.metricsService.incrementCounter('tasks.assigned', 1, {
                    labels: {
                        priority: task.priority,
                        type: task.type,
                    }
                });
                `
    // Log activity`;
                this.loggingService.log(`Task assigned: ${task.title} to user ${userId}, 'TaskService');

    // Emit event
    this.eventEmitter.emit('task.assigned', {
      taskId,
      userId,
      assignedBy,
      oldAssigneeId,
    });
  }

  async updateTaskProgress(taskId: string, progress: number, updatedBy: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new NotFoundException(Task with ID ${taskId} not found);
    }

    const oldProgress = task.progress;
    task.progress = Math.max(0, Math.min(100, progress));
    task.updatedAt = new Date();
    task.updatedBy = updatedBy;

    // Record metrics
    this.metricsService.observeHistogram('task.progress', progress, {
      labels: {
        taskId: task.id,
        priority: task.priority,
        type: task.type,
      }
    });` `
    // Log activity`, this.loggingService.log(Task, progress, updated, $, { task, : .title }, from, $, { oldProgress } % to, $, { task, : .progress } % , 'TaskService'));
                // Emit event
                this.eventEmitter.emit('task.progress_updated', {
                    taskId,
                    oldProgress,
                    newProgress: task.progress,
                    updatedBy,
                });
            },
            getTaskStats() {
                const tasks = Array.from(this.tasks.values());
                const now = new Date();
                const stats = {
                    totalTasks: tasks.length,
                    tasksByStatus: {},
                    tasksByPriority: {},
                    tasksByType: {},
                    overdueTasks: 0,
                    completionRate: 0,
                    averageCompletionTime: 0,
                };
                let completedTasks = 0;
                let totalCompletionTime = 0;
                tasks.forEach(task => {
                    // Count by status
                    stats.tasksByStatus[task.status] = (stats.tasksByStatus[task.status] || 0) + 1;
                    // Count by priority
                    stats.tasksByPriority[task.priority] = (stats.tasksByPriority[task.priority] || 0) + 1;
                    // Count by type
                    stats.tasksByType[task.type] = (stats.tasksByType[task.type] || 0) + 1;
                    // Count overdue tasks
                    if (task.dueDate && task.status !== 'completed' && task.dueDate < now) {
                        stats.overdueTasks++;
                    }
                    // Calculate completion rate and average time
                    if (task.status === 'completed') {
                        completedTasks++;
                        if (task.actualDuration) {
                            totalCompletionTime += task.actualDuration;
                        }
                    }
                });
                stats.completionRate = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;
                stats.averageCompletionTime = completedTasks > 0 ? totalCompletionTime / completedTasks : 0;
                return stats;
            }
            // Helper methods
            ,
            // Helper methods
            generateId() {
                `
    return task_${Date.now()}`;
                _$;
                {
                    Math.random().toString(36).substr(2, 9);
                }
                `;
  }

  private addUserTask(userId: string, taskId: string): void {
    if (!this.userTasks.has(userId)) {
      this.userTasks.set(userId, new Set());
    }
    this.userTasks.get(userId)!.add(taskId);
  }

  private removeUserTask(userId: string, taskId: string): void {
    const userTaskSet = this.userTasks.get(userId);
    if (userTaskSet) {
      userTaskSet.delete(taskId);
      if (userTaskSet.size === 0) {
        this.userTasks.delete(userId);
      }
    }
  }

  private addAgentTask(agentId: string, taskId: string): void {
    if (!this.agentTasks.has(agentId)) {
      this.agentTasks.set(agentId, new Set());
    }
    this.agentTasks.get(agentId)!.add(taskId);
  }

  private removeAgentTask(agentId: string, taskId: string): void {
    const agentTaskSet = this.agentTasks.get(agentId);
    if (agentTaskSet) {
      agentTaskSet.delete(taskId);
      if (agentTaskSet.size === 0) {
        this.agentTasks.delete(agentId);
      }
    }
  }

  private addAgencyTask(agencyId: string, taskId: string): void {
    if (!this.agencyTasks.has(agencyId)) {
      this.agencyTasks.set(agencyId, new Set());
    }
    this.agencyTasks.get(agencyId)!.add(taskId);
  }

  private removeAgencyTask(agencyId: string, taskId: string): void {
    const agencyTaskSet = this.agencyTasks.get(agencyId);
    if (agencyTaskSet) {
      agencyTaskSet.delete(taskId);
      if (agencyTaskSet.size === 0) {
        this.agencyTasks.delete(agencyId);
      }
    }
  }

  private applyFilter(tasks: Task[], filter: TaskFilter): Task[] {
    return tasks.filter(task => {
      if (filter.status && task.status !== filter.status) return false;
      if (filter.priority && task.priority !== filter.priority) return false;
      if (filter.type && task.type !== filter.type) return false;
      if (filter.assigneeId && task.assigneeId !== filter.assigneeId) return false;
      if (filter.assignerId && task.assignerId !== filter.assignerId) return false;
      if (filter.agentId && task.agentId !== filter.agentId) return false;
      if (filter.agencyId && task.agencyId !== filter.agencyId) return false;
      if (filter.parentTaskId && task.parentTaskId !== filter.parentTaskId) return false;
      if (filter.dueBefore && (!task.dueDate || task.dueDate > filter.dueBefore)) return false;
      if (filter.dueAfter && (!task.dueDate || task.dueDate < filter.dueAfter)) return false;
      if (filter.createdAfter && task.createdAt < filter.createdAfter) return false;
      if (filter.createdBefore && task.createdAt > filter.createdBefore) return false;
      if (filter.tags && filter.tags.length > 0) {
        if (!filter.tags.some(tag => task.tags.includes(tag))) return false;
      }
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        if (!task.title.toLowerCase().includes(searchLower) &&
            !(task.description && task.description.toLowerCase().includes(searchLower))) {
          return false;
        }
      }
      return true;
    });
  }
}

export default TaskService;;
            }
        };
    }
};
exports.TaskService = TaskService;
exports.TaskService = TaskService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [LoggingService_1.LoggingService,
        MetricsService_1.MetricsService,
        event_emitter_1.EventEmitter2])
], TaskService);
//# sourceMappingURL=TaskService.js.map