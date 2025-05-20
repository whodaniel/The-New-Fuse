import { Task } from './Task.js';
import { User } from '../../user/entities/User.js';
export declare class TaskComment {
    : string;
    content: string;
    task: Task;
    : string;
    author: User;
    authorId: string;
    parentCommentId?: string;
    metadata?: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}
