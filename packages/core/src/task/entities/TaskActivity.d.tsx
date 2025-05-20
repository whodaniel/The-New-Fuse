import { Task } from './Task.js';
import { User } from '../../user/entities/User.js';
export declare enum TaskActivityType {
    CREATED = "created",
    UPDATED = "updated",
    STATUS_CHANGED = "status_changed",
    ASSIGNED = "assigned",
    COMMENTED = "commented",
    ATTACHMENT_ADDED = "attachment_added",
    DELETED = "deleted"
}
export declare class TaskActivity {
    : string;
    task: Task;
    : string;
    actor: User;
    actorId: string;
    type: TaskActivityType;
    changes: Record<string, unknown>;
    createdAt: Date;
}
