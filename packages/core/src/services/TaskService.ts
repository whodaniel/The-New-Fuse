import { getCustomRepository, In } from 'typeorm';
import { TaskRepository } from '../database/repositories/TaskRepository.js';
import { UserRepository } from '../database/repositories/UserRepository.js';
import { Task } from '../database/entities/Task.js';
import { validate } from 'class-validator';

export class TaskService {
    private taskRepository: TaskRepository;
    private userRepository: UserRepository;

    constructor() {
        this.taskRepository = getCustomRepository(TaskRepository);
        this.userRepository = getCustomRepository(UserRepository);
    }

    async createTask(data: {
        userId: string;
        title: string;
        description?: string;
        priority?: number;
    }): Promise<Task> {
        // Verify user exists
        await this.userRepository.findOneOrFail({
            where: { id: data.userId }
        });

        const task = this.taskRepository.create(data);
        
        // Validate the task
        const errors = await validate(task);
        if (errors.length > 0) {
            throw new Error(`Validation failed: ${errors.toString()}`);
        }
        
        return this.taskRepository.save(task);
    }

    async findTasksByUser(userId: string): Promise<Task[]> {
        return this.taskRepository.findByUser(userId);
    }

    async findTaskById(taskId: string): Promise<Task> {
        return this.taskRepository.findOneOrFail({
            where: { id: taskId }
        });
    }

    async updateTaskStatus(
        taskId: string,
        status: Task['status'],
        userId: string
    ): Promise<Task> {
        const task = await this.taskRepository.findOneOrFail({
            where: { id: taskId }
        });

        if(task.userId !== userId) {
            throw new Error('Unauthorized to update this task');
        }

        task.status = status;
        
        // Validate the updated task
        const errors = await validate(task);
        if (errors.length > 0) {
            throw new Error(`Validation failed: ${errors.toString()}`);
        }
        
        return this.taskRepository.save(task);
    }

    async updateTaskPriority(
        taskId: string,
        priority: number,
        userId: string
    ): Promise<Task> {
        const task = await this.taskRepository.findOneOrFail({
            where: { id: taskId }
        });

        if(task.userId !== userId) {
            throw new Error('Unauthorized to update this task');
        }

        task.priority = priority;
        return this.taskRepository.save(task);
    }

    async deleteTask(taskId: string, userId: string): Promise<boolean> {
        const task = await this.taskRepository.findOneOrFail({
            where: { id: taskId }
        });

        if(task.userId !== userId) {
            throw new Error('Unauthorized to delete this task');
        }

        await this.taskRepository.remove(task);
        return true;
    }

    async getUserTaskStats(userId: string): Promise<{
        total: number;
        pending: number;
        completed: number;
        failed: number;
    }> {
        return this.taskRepository.findUserTaskStats(userId);
    }

    async findPendingTasks(): Promise<Task[]> {
        return this.taskRepository.findPendingTasks();
    }

    async bulkUpdateTaskStatus(
        taskIds: string[],
        status: Task['status'],
        userId: string
    ): Promise<number> {
        const tasks = await this.taskRepository.find({
            where: { id: In(taskIds) }
        });

        const unauthorizedTasks = tasks.filter(task => task.userId !== userId);
        if(unauthorizedTasks.length > 0) {
            throw new Error('Unauthorized to update some tasks');
        }

        const result = await this.taskRepository.update(
            { id: In(taskIds) },
            { status }
        );

        return result.affected || 0;
    }
}
