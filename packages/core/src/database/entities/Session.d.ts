import { User } from './User.tsx';
export declare class Session {
    : string;
    userId: string;
    : string;
    expiresAt: Date;
    : Date;
    user: User;
    generateToken(): boolean | {
        id: any;
        userId: string;
        token: any;
        expiresAt: Date;
        createdAt: any;
    };
}
