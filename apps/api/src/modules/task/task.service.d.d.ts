import { Repository } from 'typeorm';
import { Task } from '../../entities/Task.js';
import { TaskExecution } from '../../entities/TaskExecution.js';
export declare class TaskService {
    private readonly taskRepository;
    private readonly taskExecutionRepository;
    constructor(taskRepository: Repository<Task>, taskExecutionRepository: Repository<TaskExecution>);
    findStuckTasks(): Promise<Task[]>;
    updateTask(taskId: string, updates: Partial<Task>): Promise<Task>;
    getTaskById(taskId: string): Promise<Task | null>;
    createTask(data: Partial<Task>): Promise<Task>;
    getPendingTasks(): Promise<Task[]>;
    getTaskExecutions(taskId: string): Promise<TaskExecution[]>;
    deleteTasks(pipelineId: string): Promise<void>;
    deleteTaskExecutions(taskId: string): Promise<void>;
}
