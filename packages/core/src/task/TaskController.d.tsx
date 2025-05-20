import { TaskManager } from './TaskManager.js';
import { CreateTaskDto, UpdateTaskDto, TaskFilterDto } from './dto/task.dto.js';
import { User } from '../user/entities/User.js';
import { Task } from './entities/Task.js';
import { TaskStatistics } from './interfaces/task.interface.js';
import { TaskStatus } from './types.js';

export declare class TaskController {
    private readonly taskManager;
    constructor(taskManager: TaskManager);

    create(createTaskDto: CreateTaskDto, user: User): Promise<Task>;
    findAll(filterDto: TaskFilterDto): Promise<Task[]>;
    getStatistics(): Promise<TaskStatistics>;
    findOne(id: string): Promise<Task>;
    update(id: string, updateTaskDto: UpdateTaskDto, user: User): Promise<Task>;
    assign(id: string, userId: string, user: User): Promise<Task>;
    updateStatus(id: string, status: TaskStatus, user: User): Promise<Task>;
    remove(id: string, user: User): Promise<void>;
}
