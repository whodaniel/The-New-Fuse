import { User } from './User.js';
export declare class Session {
    id: string;
    userId: string;
    token: string;
    expiresAt: Date;
    createdAt: Date;
    user?: User;
    generateToken(): void;
}
//# sourceMappingURL=Session.d.ts.map