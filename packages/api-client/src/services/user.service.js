import { BaseService } from './BaseService';
/**
 * User service for managing users
 */
export class UserService extends BaseService {
    /**
     * Create a new user service
     * @param api API client instance
     */
    constructor(api) {
        super(api, '/users');
    }
    /**
     * Get all users
     * @param options Query options (page, limit, search, etc.)
     * @returns Promise with users list
     */
    async getUsers(options = {}) {
        return this.list('', options);
    }
    /**
     * Get user by ID
     * @param id User ID
     * @returns Promise with user data
     */
    async getUserById(id) {
        return this.getById(id);
    }
    /**
     * Update user
     * @param id User ID
     * @param data User data to update
     * @returns Promise with updated user data
     */
    async updateUser(id, data) {
        return this.updateById(id, data);
    }
    /**
     * Delete user
     * @param id User ID
     * @returns Promise with deletion response
     */
    async deleteUser(id) {
        return this.deleteById(id);
    }
    /**
     * Update user profile
     * @param data Profile data to update
     * @returns Promise with updated profile data
     */
    async updateProfile(data) {
        this.validateRequired({ name: data.name, email: data.email }, ['name', 'email']);
        return this.put('/profile', data);
    }
    /**
     * Change user password
     * @param currentPassword Current password
     * @param newPassword New password
     * @returns Promise with password change response
     */
    async changePassword(currentPassword, newPassword) {
        this.validateRequired({ currentPassword, newPassword }, ['currentPassword', 'newPassword']);
        return this.post('/change-password', {
            currentPassword,
            newPassword,
        });
    }
}
/**
 * Create a new user service
 * @param api API client instance
 * @returns User service instance
 *
 * @example
 * `typescript
 * import {
 *   createApiClient,
 *   createUserService,
 *   UserProfile
 * } from '@the-new-fuse/api-client';
 *
 * // Create a new API client
 * const api = createApiClient({
 *   baseURL: 'https://api.example.com',
 * });
 *
 * // Create user service
 * const userService = createUserService(api);
 *
 * // Get all users
 * const users = await userService.getUsers();
 *
 * // Update user profile
 * const profileData: UserProfile = {
 *   name: 'John Doe',
 *   email: 'john.doe@example.com',
 *   bio: 'Software developer',
 *   avatar: 'https://example.com/avatar.jpg'
 * };
 *
 * const updatedUser = await userService.updateProfile(profileData);
 * console.log(Profile updated for ${updatedUser.name});`
 * ``
 */
export function createUserService(api) {
    return new UserService(api);
}
//# sourceMappingURL=user.service.js.map