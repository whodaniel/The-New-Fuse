import { User } from './User.js';
export declare class Task {
    : string;
    userId: string;
    : string;
    description: string;
    : pending' | 'in_progress' | 'completed' | 'failed';
    priority: number;
    : Date;
    updatedAt: Date;
    : Date | null;
    user: User;
    toJSON(): {
        id: any;
        userId: string;
        title: any;
        description: string;
        status: any;
        priority: number;
        createdAt: any;
        updatedAt: Date;
        completedAt: any;
    };
}
