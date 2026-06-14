import { DatabaseService } from '@the-new-fuse/database';
export declare class UserManagementController {
    private readonly db;
    constructor(db: DatabaseService);
    getAllUsers(): Promise<any[]>;
    getUserById(id: string): Promise<any>;
    createUser(userData: any): Promise<any>;
    updateUser(id: string, userData: any): Promise<any>;
    deleteUser(id: string): Promise<{
        message: string;
    }>;
    getUserProfile(id: string): Promise<any>;
    updateUserProfile(id: string, profileData: any): Promise<any>;
    private sanitizeUser;
}
//# sourceMappingURL=user-management.controller.d.ts.map