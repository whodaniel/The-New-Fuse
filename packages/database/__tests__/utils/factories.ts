/**
 * Test Data Factories
 * Provides consistent test fixtures for creating database entities
 */

import * as bcrypt from 'bcrypt';
import type {
  NewAgent,
  NewChat,
  NewMessage,
  NewPipeline,
  NewTask,
  NewTaskExecution,
  NewUser,
  NewWorkflow,
} from '../../src/drizzle/types';

/**
 * Generate a unique timestamp-based ID suffix
 */
function uniqueId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * User Factory
 */
export const UserFactory = {
  /**
   * Build user data (not saved to database)
   */
  build: async (overrides: Partial<NewUser> = {}): Promise<NewUser> => {
    const hashedPassword = await bcrypt.hash('testpassword123', 10);

    return {
      email: `test-${uniqueId()}@example.com`,
      name: 'Test User',
      hashedPassword,
      username: `testuser-${uniqueId()}`,
      ...overrides,
    };
  },

  /**
   * Build multiple users
   */
  buildList: async (count: number, overrides: Partial<NewUser> = {}): Promise<NewUser[]> => {
    return Promise.all(Array.from({ length: count }, () => UserFactory.build(overrides)));
  },
};

/**
 * Agent Factory
 */
export const AgentFactory = {
  /**
   * Build agent data (not saved to database)
   */
  build: (overrides: Partial<NewAgent> = {}): NewAgent => {
    return {
      name: `test-agent-${uniqueId()}`,
      userId: overrides.userId || 'default-user-id',
      type: 'CHAT',
      status: 'ACTIVE',
      description: 'Test agent description',
      config: { testConfig: true },
      capabilities: ['chat', 'search'],
      tags: ['test', 'automation'],
      category: 'assistant',
      ...overrides,
    };
  },

  /**
   * Build multiple agents
   */
  buildList: (count: number, overrides: Partial<NewAgent> = {}): NewAgent[] => {
    return Array.from({ length: count }, () => AgentFactory.build(overrides));
  },
};

/**
 * Chat Factory
 */
export const ChatFactory = {
  /**
   * Build chat data (not saved to database)
   */
  build: (overrides: Partial<NewChat> = {}): NewChat => {
    return {
      userId: overrides.userId || 'default-user-id',
      agentId: overrides.agentId || null,
      title: `Test Chat ${uniqueId()}`,
      metadata: { testMetadata: true },
      ...overrides,
    };
  },

  /**
   * Build multiple chats
   */
  buildList: (count: number, overrides: Partial<NewChat> = {}): NewChat[] => {
    return Array.from({ length: count }, () => ChatFactory.build(overrides));
  },
};

/**
 * Message Factory
 */
export const MessageFactory = {
  /**
   * Build message data (not saved to database)
   */
  build: (overrides: Partial<NewMessage> = {}): NewMessage => {
    return {
      chatId: overrides.chatId || 'default-chat-id',
      role: 'user',
      content: `Test message content ${uniqueId()}`,
      metadata: { testMetadata: true },
      ...overrides,
    };
  },

  /**
   * Build multiple messages
   */
  buildList: (count: number, overrides: Partial<NewMessage> = {}): NewMessage[] => {
    return Array.from({ length: count }, () => MessageFactory.build(overrides));
  },
};

/**
 * Task Factory
 */
export const TaskFactory = {
  /**
   * Build task data (not saved to database)
   */
  build: (overrides: Partial<NewTask> = {}): NewTask => {
    return {
      userId: overrides.userId || 'default-user-id',
      agentId: overrides.agentId || null,
      title: `Test Task ${uniqueId()}`,
      description: 'Test task description',
      status: 'PENDING',
      priority: 'MEDIUM',
      metadata: { testMetadata: true },
      ...overrides,
    };
  },

  /**
   * Build multiple tasks
   */
  buildList: (count: number, overrides: Partial<NewTask> = {}): NewTask[] => {
    return Array.from({ length: count }, () => TaskFactory.build(overrides));
  },
};

/**
 * Workflow Factory
 */
export const WorkflowFactory = {
  /**
   * Build workflow data (not saved to database)
   */
  build: (overrides: Partial<NewWorkflow> = {}): NewWorkflow => {
    return {
      userId: overrides.userId || 'default-user-id',
      name: `Test Workflow ${uniqueId()}`,
      description: 'Test workflow description',
      status: 'DRAFT',
      config: { testConfig: true },
      ...overrides,
    };
  },

  /**
   * Build multiple workflows
   */
  buildList: (count: number, overrides: Partial<NewWorkflow> = {}): NewWorkflow[] => {
    return Array.from({ length: count }, () => WorkflowFactory.build(overrides));
  },
};

/**
 * Pipeline Factory
 */
export const PipelineFactory = {
  /**
   * Build pipeline data (not saved to database)
   */
  build: (overrides: Partial<NewPipeline> = {}): NewPipeline => {
    return {
      name: `Test Pipeline ${uniqueId()}`,
      description: 'Test pipeline description',
      configuration: { testConfig: true },
      status: 'DRAFT',
      userId: overrides.userId || 'default-user-id',
      agentId: overrides.agentId || 'default-agent-id',
      ...overrides,
    };
  },

  /**
   * Build multiple pipelines
   */
  buildList: (count: number, overrides: Partial<NewPipeline> = {}): NewPipeline[] => {
    return Array.from({ length: count }, () => PipelineFactory.build(overrides));
  },
};

/**
 * Task Execution Factory
 */
export const TaskExecutionFactory = {
  /**
   * Build task execution data (not saved to database)
   */
  build: (overrides: Partial<NewTaskExecution> = {}): NewTaskExecution => {
    return {
      taskId: overrides.taskId || 'default-task-id',
      status: 'PENDING',
      output: null,
      error: null,
      ...overrides,
    };
  },

  /**
   * Build multiple task executions
   */
  buildList: (count: number, overrides: Partial<NewTaskExecution> = {}): NewTaskExecution[] => {
    return Array.from({ length: count }, () => TaskExecutionFactory.build(overrides));
  },
};

/**
 * Session Factory
 */
export const SessionFactory = {
  /**
   * Build session data
   */
  build: (
    overrides: Partial<{ userId: string; token: string; expiresAt: Date }> = {}
  ): { userId: string; token: string; expiresAt: Date } => {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours from now

    return {
      userId: overrides.userId || 'default-user-id',
      token: `test-session-token-${uniqueId()}`,
      expiresAt: overrides.expiresAt || expiresAt,
    };
  },
};
