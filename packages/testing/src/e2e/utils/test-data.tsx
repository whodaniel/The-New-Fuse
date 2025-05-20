import { Page } from '@playwright/test';
import { AuthUtils } from './auth.utils.js';

export interface TestUser {
  id: string;
  username: string;
  password: string;
  email: string;
}

export class TestDataManager {
  private users: TestUser[] = [];

  constructor(private page: Page) {}

  async createTestUser(): Promise<TestUser> {
    const timestamp = Date.now();
    const user: TestUser = {
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

  async createTestWorkflow(name: string): Promise<string> {
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
      } catch (error) {
        console.error(`Failed to cleanup user ${user.id}:`, error);
      }
    }
    this.users = [];
  }
}