import { AgentStatus, AgentType, TaskStatus } from '@the-new-fuse/types';
import { JulesAgentAdapter } from '../src/JulesAgentAdapter.js';
import { JulesApiClient } from '../src/JulesApiClient.js';
import { fromBase64Url, toBase64Url } from '../src/utils.js';

// Mock workspace dependencies
jest.mock('@the-new-fuse/agent', () => ({
  RedisAgentRegistry: class MockRedisAgentRegistry {},
  AgentMetadata: {},
}));
jest.mock('@the-new-fuse/database', () => ({
  DrizzleAgentRepository: class MockDrizzleAgentRepository {},
  DrizzleTaskRepository: class MockDrizzleTaskRepository {},
}));
jest.mock('../src/JulesApiClient');

describe('Utilities', () => {
  it('should correctly encode to base64url and decode back', () => {
    const original = '{"tenantId":"123","taskId":"456"}';
    const encoded = toBase64Url(original);
    const decoded = fromBase64Url(encoded);
    expect(decoded).toBe(original);
  });
});

const mockAgentRegistry = {
  register: jest.fn(),
};
const mockAgentRepo = {
  findById: jest.fn(),
  create: jest.fn(),
  updateStatus: jest.fn(),
};
const mockTaskRepo = {
  createTask: jest.fn(),
  updateTask: jest.fn(),
};
const mockRedis = {};

describe('JulesAgentAdapter', () => {
  let adapter: JulesAgentAdapter;
  const originalPlatformApiKey = process.env.PLATFORM_JULES_API_KEY;

  beforeEach(() => {
    jest.clearAllMocks();
    adapter = new JulesAgentAdapter(
      mockAgentRegistry as any,
      mockAgentRepo as any,
      mockTaskRepo as any,
      mockRedis as any
    );
  });

  afterEach(() => {
    process.env.PLATFORM_JULES_API_KEY = originalPlatformApiKey;
  });

  describe('registerJulesAgent', () => {
    it('should create and register a new agent if it does not exist', async () => {
      const tenantId = 'tenant-123';
      const agentId = `jules-agent-${tenantId}`;
      const agentData = {
        id: agentId,
        name: 'Jules Assistant',
        type: AgentType.GITHUB_JULES,
        status: AgentStatus.IDLE,
        userId: tenantId,
        capabilities: ['code_implementation'],
      };

      (mockAgentRepo.findById as jest.Mock).mockResolvedValue(null);
      (mockAgentRepo.create as jest.Mock).mockResolvedValue(agentData);

      const agent = await adapter.registerJulesAgent(tenantId);

      expect(mockAgentRepo.findById).toHaveBeenCalledWith(agentId);
      expect(mockAgentRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ id: agentId, name: 'Jules Assistant' })
      );
      expect(mockAgentRegistry.register).toHaveBeenCalledWith(
        expect.objectContaining({ id: agentId, status: 'online' })
      );
      expect(agent).toEqual(agentData);
    });

    it('should not create a new agent if it already exists', async () => {
      const tenantId = 'tenant-456';
      const agentId = `jules-agent-${tenantId}`;
      const existingAgent = { id: agentId, name: 'Jules Assistant', capabilities: [] };

      (mockAgentRepo.findById as jest.Mock).mockResolvedValue(existingAgent);

      await adapter.registerJulesAgent(tenantId);

      expect(mockAgentRepo.findById).toHaveBeenCalledWith(agentId);
      expect(mockAgentRepo.create).not.toHaveBeenCalled();
      expect(mockAgentRegistry.register).toHaveBeenCalledWith(
        expect.objectContaining({ id: agentId })
      );
    });
  });

  describe('delegateTask', () => {
    it('should successfully delegate a task to Jules', async () => {
      process.env.PLATFORM_JULES_API_KEY = 'platform-secret-key';
      const params = {
        tenantId: 'tenant-789',
        taskDescription: 'Implement a new feature',
        repo: 'owner/repo',
        requireApproval: true,
      };
      const agent = {
        id: `jules-agent-${params.tenantId}`,
        name: 'Jules Assistant',
        capabilities: [],
      };
      const task = { id: 'task-123', status: TaskStatus.PENDING, metadata: {} };

      (mockAgentRepo.findById as jest.Mock).mockResolvedValue(agent);
      (mockTaskRepo.createTask as jest.Mock).mockResolvedValue(task);

      const mockCreateSession = jest.fn().mockResolvedValue({ sessionId: 'jules-session-abc' });
      (JulesApiClient as jest.Mock).mockImplementation(() => ({
        createSession: mockCreateSession,
      }));

      const result = await adapter.delegateTask(params);

      expect(JulesApiClient).toHaveBeenCalledWith('platform-secret-key');
      expect(mockTaskRepo.createTask).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'jules_task' })
      );
      expect(mockCreateSession).toHaveBeenCalledWith(
        expect.objectContaining({
          repo: params.repo,
          task: params.taskDescription,
          webhookUrl: expect.stringContaining(
            'https://app.thenewfuse.com/api/webhooks/incoming/jules/'
          ),
        })
      );
      expect(mockTaskRepo.updateTask).toHaveBeenCalledWith('task-123', {
        metadata: { julesSessionId: 'jules-session-abc' },
        status: TaskStatus.RUNNING,
      });
      expect(mockAgentRepo.updateStatus).toHaveBeenCalledWith(
        `jules-agent-${params.tenantId}`,
        AgentStatus.BUSY
      );
      expect(result).toEqual({
        taskId: 'task-123',
        julesSessionId: 'jules-session-abc',
      });
    });

    it('should throw an error if no API key is configured', async () => {
      process.env.PLATFORM_JULES_API_KEY = '';
      const params = { tenantId: 'tenant-no-key', taskDescription: 'Test', repo: 'test/repo' };

      await expect(adapter.delegateTask(params)).rejects.toThrow(
        'Jules API key is not configured for the tenant or the platform.'
      );
    });
  });

  describe('updateAgentStatus', () => {
    it('should update agent status in both DB and Redis registry', async () => {
      const tenantId = 'tenant-for-status-update';
      const agentId = `jules-agent-${tenantId}`;
      const agent = {
        id: agentId,
        name: 'Jules Assistant',
        type: AgentType.GITHUB_JULES,
        capabilities: [],
      };

      (mockAgentRepo.findById as jest.Mock).mockResolvedValue(agent);

      await adapter.updateAgentStatus(tenantId, AgentStatus.IDLE);

      expect(mockAgentRepo.updateStatus).toHaveBeenCalledWith(agentId, AgentStatus.IDLE);
      expect(mockAgentRegistry.register).toHaveBeenCalledWith(
        expect.objectContaining({
          id: agentId,
          status: 'online',
        })
      );
    });
  });
});
