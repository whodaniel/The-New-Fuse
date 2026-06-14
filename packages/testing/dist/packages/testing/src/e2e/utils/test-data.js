"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestDataManager = void 0;
class TestDataManager {
    constructor(page) {
        this.page = page;
        this.users = [];
    }
    async createTestUser() {
        const timestamp = Date.now();
        const user = {
            id: `user-${timestamp}`,
            username: `testuser-${timestamp}`,
            password: 'testpass123',
            email: `test-${timestamp}@example.com`
        };
        // Register user via API
        await this.page.request.post('/api/auth/register', {
            data: {
                username: user.username,
                password: user.password,
                email: user.email
            }
        });
        this.users.push(user);
        return user;
    }
    async createTestWorkflow(name) {
        const response = await this.page.request.post('/api/workflows', {
            data: {
                name,
                description: 'Test workflow',
                nodes: [],
                edges: []
            }
        });
        const data = await response.json();
        return data.id;
    }
    async cleanup() {
        // Cleanup test users
        for (const user of this.users) {
            try {
                await this.page.request.delete(`/api/users/${user.id}`);
            }
            catch (error) {
                console.error(`Failed to cleanup user ${user.id}:`, error);
            }
        }
        this.users = [];
    }
}
exports.TestDataManager = TestDataManager;
//# sourceMappingURL=test-data.js.map