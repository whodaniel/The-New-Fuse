import { EventEmitter2 } from '@nestjs/event-emitter';
export interface User {
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    role: 'user' | 'admin' | 'super_admin';
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    lastLoginAt?: Date;
}
export declare class UserService {
    private eventEmitter;
    private readonly logger;
    private users;
    constructor(eventEmitter: EventEmitter2);
    createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
    getUserById(id: string): Promise<User | null>;
    getUserByEmail(email: string): Promise<User | null>;
    getUserByUsername(username: string): Promise<User | null>;
    updateUser(id: string, updates: Partial<User>): Promise<User | null>;
    deleteUser(id: string): Promise<boolean>;
    getUsers(filters?: {
        role?: string;
        isActive?: boolean;
    }): Promise<User[]>;
    deactivateUser(id: string): Promise<User | null>;
    activateUser(id: string): Promise<User | null>;
    updateLastLogin(id: string): Promise<User | null>;
    getUserStats(): Promise<any>;
}
//# sourceMappingURL=UserService.d.ts.map