import { BaseRepository } from './BaseRepository.js';
import { Task } from '../entities/Task.js';
export declare class TaskRepository extends BaseRepository<Task> {
    findByUser(): Promise<void>;
}
