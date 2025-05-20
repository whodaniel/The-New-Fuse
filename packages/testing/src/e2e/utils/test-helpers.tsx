import { Page } from '@playwright/test';
import { config } from '../config/test-config.js';

export interface TestWorkflow {
  id: string;
  name: string;
  nodes: any[];
  edges: any[];
}

export class TestHelpers {
  constructor(private page: Page) {}

  async createTestWorkflowData(options: {
    name?: string;
    nodeCount?: number;
    status?: 'active' | 'completed' | 'failed';
  } = {}): Promise<TestWorkflow> {
    const { name = `Test Workflow ${Date.now()}`, nodeCount = 2, status = 'active' } = options;

    // Create basic workflow structure
    const nodes = Array.from({ length: nodeCount }, (_, i) => ({
      id: `node-${i + 1}`,
      type: i === 0 ? 'source' : i === nodeCount - 1 ? 'target' : 'processor',
      position: { x: i * 200, y: 100 }
    }));

    // Connect nodes sequentially
    const edges = nodes.slice(0, -1).map((node, i) => ({
      id: `edge-${i + 1}`,
      source: node.id,
      target: nodes[i + 1].id
    }));

    // Create workflow via API
    const response = await this.page.request.post(`${config.apiUrl}/api/workflows`, {
      data: {
        name,
        nodes,
        edges,
        status
      }
    });

    const workflow = await response.json();
    return workflow;
  }

  async cleanupTestData() {
    // Clean up workflows
    await this.page.request.delete(`${config.apiUrl}/api/workflows/test-*`);
    
    // Clean up test users except admin
    const testUsers = await this.page.request.get(`${config.apiUrl}/api/users/test-*`);
    const users = await testUsers.json();
    
    for (const user of users) {
      if (user.username !== config.userPool.admin.username) {
        await this.page.request.delete(`${config.apiUrl}/api/users/${user.id}`);
      }
    }
  }

  async createTestUser(options: {
    username?: string;
    email?: string;
    isAdmin?: boolean;
  } = {}) {
    const timestamp = Date.now();
    const {
      username = `testuser-${timestamp}`,
      email = `test-${timestamp}@example.com`,
      isAdmin = false
    } = options;

    const response = await this.page.request.post(`${config.apiUrl}/api/users`, {
      data: {
        username,
        email,
        password: 'testpass123',
        isAdmin
      }
    });

    return response.json();
  }

  async setTestEnvironment() {
    // Set test environment variables
    await this.page.evaluate((cfg) => {
      window.localStorage.setItem('test-mode', 'true');
      window.localStorage.setItem('api-url', cfg.apiUrl);
    }, config);
  }

  async resetTestEnvironment() {
    // Clear test environment settings
    await this.page.evaluate(() => {
      window.localStorage.removeItem('test-mode');
      window.localStorage.removeItem('api-url');
    });
  }
}