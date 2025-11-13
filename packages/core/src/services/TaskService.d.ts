import { EventEmitter2 } from '@nestjs/event-emitter';
import { LoggingService } from './LoggingService';
import { MetricsService } from './MetricsService';
export interface Task {
    id: string;
    title: string;
    description?: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    type: 'data_processing' | 'report_generation' | 'system_maintenance' | 'user_request' | 'automated' | 'custom';
    assigneeId?: string;
    assignerId?: string;
    agentId?: string;
    agencyId?: string;
    parentTaskId?: string;
    dueDate?: Date;
    startedAt?: Date;
    completedAt?: Date;
    estimatedDuration?: number;
    actualDuration?: number;
    progress: number;
    tags: string[];
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    updatedBy: string;
}
export interface CreateTaskDto {
    title: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    type?: 'data_processing' | 'report_generation' | 'system_maintenance' | 'user_request' | 'automated' | 'custom';
    assigneeId?: string;
    assignerId?: string;
    agentId?: string;
    agencyId?: string;
    parentTaskId?: string;
    dueDate?: Date;
    estimatedDuration?: number;
    tags?: string[];
    metadata?: Record<string, any>;
}
export interface UpdateTaskDto {
    title?: string;
    description?: string;
    status?: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    assigneeId?: string;
    agentId?: string;
    dueDate?: Date;
    progress?: number;
    tags?: string[];
    metadata?: Record<string, any>;
}
export interface TaskFilter {
    status?: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    type?: string;
    assigneeId?: string;
    assignerId?: string;
    agentId?: string;
    agencyId?: string;
    parentTaskId?: string;
    dueBefore?: Date;
    dueAfter?: Date;
    createdAfter?: Date;
    createdBefore?: Date;
    tags?: string[];
    search?: string;
}
export interface TaskStats {
    totalTasks: number;
    tasksByStatus: Record<string, number>;
    tasksByPriority: Record<string, number>;
    tasksByType: Record<string, number>;
    overdueTasks: number;
    completionRate: number;
    averageCompletionTime: number;
}
export interface TaskAssignment {
    taskId: string;
    userId: string;
    assignedAt: Date;
    assignedBy: string;
    notes?: string;
}
export declare class TaskService {
    private readonly loggingService;
    private readonly metricsService;
    private readonly eventEmitter;
    private tasks;
    private userTasks;
    private agentTasks;
    private agencyTasks;
    private taskAssignments;
    constructor(loggingService: LoggingService, metricsService: MetricsService, eventEmitter: EventEmitter2);
    createTask(createTaskDto: CreateTaskDto, createdBy: string): Promise<Task>;
}
//# sourceMappingURL=TaskService.d.ts.map