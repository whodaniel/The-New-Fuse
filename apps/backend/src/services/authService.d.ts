import { DatabaseService } from '@the-new-fuse/database';
import { User } from '@the-new-fuse/types';
export declare class AuthService {
    private readonly databaseService;
    constructor(databaseService: DatabaseService);
    validateUser(email: string, password: string): Promise<User | null>;
    createUser(data: {
        email: string;
        password: string;
        name?: string;
    }): Promise<User>;
    logout(userId: string): Promise<void>;
}
