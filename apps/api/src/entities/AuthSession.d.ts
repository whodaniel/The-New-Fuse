import { User } from './User.js';
export declare class AuthSession {
    id: string;
    user: User;
    userId: string;
    token: string;
    lastActivity: Date;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
