import { Repository } from 'typeorm';
import { Task } from '../entities/Task.js';
export declare class TaskRepository extends Repository<Task> {
    findTasks(): Promise<void>;
}
