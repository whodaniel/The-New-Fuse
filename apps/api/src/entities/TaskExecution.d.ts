import { Task } from './Task.js';
export declare class TaskExecution {
    id: string;
    status: string;
    output: any;
    error: string;
    task: Task;
    taskId: string;
    startTime: Date;
    endTime: Date;
    createdAt: Date;
    updatedAt: Date;
}
