import { Task } from './Task.js';
import { Session } from './Session.js';
export declare class User {
    id: string;
    username: string;
    email: string;
    passwordHash: string;
    updatedAt: Date;
    createdAt: Date;
    tasks: Task[];
    sessions: Session[];
    hashPassword(): Promise<void>;
}
