import { BaseService } from './BaseService';
/**
 * User service for managing users
 */
export class UserService extends BaseService {
    /**
     * Create a new user service
     * @param apiClient API client
     */
    constructor(apiClient) {
        super(apiClient, '/users');
    }
    /**
     * Get a user by ID
     * @param id User ID
     * @returns Promise resolving to the user data
     */
    async getUser(id) {
        return this.apiClient.get(this.getPath(`/${id}`));
    }
    /**
     * Get the current user
     * @returns Promise resolving to the current user data
     */
    async getCurrentUser() {
        return this.apiClient.get(this.getPath('/me'));
    }
    /**
     * Update the current user
     * @param data User update data
     * @returns Promise resolving to the updated user data
     */
    async updateCurrentUser(data) {
        return this.apiClient.patch(this.getPath('/me'), data);
    }
    /**
     * Change the current user's password
     * @param currentPassword Current password
     * @param newPassword New password
     * @returns Promise resolving when the password is changed
     */
    async changePassword(currentPassword, newPassword) {
        await this.apiClient.post(this.getPath('/me/password'), {
            currentPassword,
            newPassword,
        });
    }
    /**
     * Get all users
     * @param page Page number
     * @param limit Number of users per page
     * @returns Promise resolving to the users data
     */
    async getUsers(page = 1, limit = 10) {
        return this.apiClient.get(this.getPath(), { params: { page, limit } });
    }
}
//# sourceMappingURL=UserService.js.map