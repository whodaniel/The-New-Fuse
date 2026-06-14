import { User } from './User.js';
export declare class Task {
    id: string;
    userId: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    priority: number;
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
    user?: User;
}
//# sourceMappingURL=Task.d.ts.map