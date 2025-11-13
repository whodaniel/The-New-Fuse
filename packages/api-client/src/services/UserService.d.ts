import { BaseService } from './BaseService';
/**
 * User data
 */
export interface User {
    /**
     * User ID
     */
    id: string;
    /**
     * User email
     */
    email: string;
    /**
     * User name
     */
    name: string;
    /**
     * User avatar URL
     */
    avatar?: string;
    /**
     * User creation date
     */
    createdAt: string;
    /**
     * User update date
     */
    updatedAt: string;
}
/**
 * User update data
 */
export interface UserUpdateData {
    /**
     * User name
     */
    name?: string;
    /**
     * User avatar URL
     */
    avatar?: string;
}
/**
 * User service for managing users
 */
export declare class UserService extends BaseService {
    /**
     * Create a new user service
     * @param apiClient API client
     */
    constructor(apiClient: any);
    /**
     * Get a user by ID
     * @param id User ID
     * @returns Promise resolving to the user data
     */
    getUser(id: string): Promise<User>;
    /**
     * Get the current user
     * @returns Promise resolving to the current user data
     */
    getCurrentUser(): Promise<User>;
    /**
     * Update the current user
     * @param data User update data
     * @returns Promise resolving to the updated user data
     */
    updateCurrentUser(data: UserUpdateData): Promise<User>;
    /**
     * Change the current user's password
     * @param currentPassword Current password
     * @param newPassword New password
     * @returns Promise resolving when the password is changed
     */
    changePassword(currentPassword: string, newPassword: string): Promise<void>;
    /**
     * Get all users
     * @param page Page number
     * @param limit Number of users per page
     * @returns Promise resolving to the users data
     */
    getUsers(page?: number, limit?: number): Promise<{
        users: User[];
        total: number;
    }>;
}
//# sourceMappingURL=UserService.d.ts.map