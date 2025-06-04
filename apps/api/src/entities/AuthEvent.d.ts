import { User } from './User.js';
export declare class AuthEvent {
    id: string;
    user: User;
    userId: string;
    type: string;
    description: string;
    metadata: Record<string, any>;
    createdAt: Date;
}
