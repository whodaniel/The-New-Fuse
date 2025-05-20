import { TaskPriority, TaskStatus } from './enums.js';
export interface Task {
    id: string;
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    assigneeId?: string;
    creatorId: string;
    departmentId?: string;
    dueDate?: Date;
    tags: string[];
    metadata: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
export interface TaskComment {
    id: string;
    taskId: string;
    userId: string;
    content: string;
    attachments: TaskAttachment[];
    createdAt: Date;
    updatedAt: Date;
}
export interface TaskAttachment {
    id: string;
    taskId: string;
    name: string;
    type: string;
    url: string;
    size: number;
    uploadedBy: string;
    uploadedAt: Date;
}
export interface TaskDependency {
    id: string;
    taskId: string;
    dependsOnTaskId: string;
    type: 'blocks' | 'requires' | 'relates_to';
    createdAt: Date;
}
export interface TaskTimeTracking {
    id: string;
    taskId: string;
    userId: string;
    startTime: Date;
    endTime?: Date;
    duration?: number;
    description?: string;
}
export declare class TaskUtils {
    static isOverdue(task: Task): boolean;
    static calculateProgress(task: Task): number;
    static getPriorityLevel(task: Task): number;
    static calculateTimeSpent(timeTrackings: TaskTimeTracking[]): number;
    static sortTasks(tasks: Task[], sortBy: keyof Task, order: 'asc' | 'desc'): Task[];
    static filterTasks(tasks: Task[], filters: Partial<{
        status: TaskStatus[];
        priority: TaskPriority[];
        assigneeId: string[];
        departmentId: string[];
        tags: string[];
    }>): Task[];
}
