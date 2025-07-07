import { User } from './User';
export declare class LoginAttempt {
    id: string;
    user: User;
    userId: string;
    success: boolean;
    ipAddress: string;
    userAgent: string;
    createdAt: Date;
}
