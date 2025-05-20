import { Repository } from 'typeorm';
import { TaskActivity } from '../entities/TaskActivity.js';
export declare class TaskActivityService {
    private activityRepository;
    constructor(activityRepository: Repository<TaskActivity>);
    logActivity(): Promise<void>;
}
