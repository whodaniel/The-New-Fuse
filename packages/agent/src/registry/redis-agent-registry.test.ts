import { AgentMetadata, RedisAgentRegistry } from './redis-agent-registry.js';

// Mock Redis client
const mockRedisClient = {
  on: jest.fn(),
  connect: jest.fn().mockResolvedValue(undefined),
  quit: jest.fn().mockResolvedValue(undefined),
  hGetAll: jest.fn(),
  hSet: jest.fn(),
  expire: jest.fn(),
  del: jest.fn(),
  sAdd: jest.fn(),
  sRem: jest.fn(),
  sMembers: jest.fn(),
  scan: jest.fn(),
  zRangeByScore: jest.fn(),
  multi: jest.fn(),
};

jest.mock('redis', () => ({
  createClient: () => mockRedisClient,
}));

describe('RedisAgentRegistry', () => {
  let registry: RedisAgentRegistry;
  let mockMulti: any;

  beforeEach(() => {
    registry = new RedisAgentRegistry({ redisUrl: 'redis://mock' });
    mockMulti = {
      hSet: jest.fn().mockReturnThis(),
      expire: jest.fn().mockReturnThis(),
      del: jest.fn().mockReturnThis(),
      sAdd: jest.fn().mockReturnThis(),
      sRem: jest.fn().mockReturnThis(),
      zAdd: jest.fn().mockReturnThis(),
      zRem: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([]),
      hGetAll: jest.fn().mockReturnThis(),
    };
    mockRedisClient.multi.mockReturnValue(mockMulti);
    jest.clearAllMocks();
  });

  const agent1: Omit<AgentMetadata, 'lastSeen'> = {
    id: 'agent-1',
    name: 'Test Agent 1',
    capabilities: [{ name: 'test-capability-1' }],
    status: 'online',
  };

  const agent2: Omit<AgentMetadata, 'lastSeen'> = {
    id: 'agent-2',
    name: 'Test Agent 2',
    capabilities: [{ name: 'test-capability-1' }, { name: 'test-capability-2' }],
    status: 'online',
  };

  describe('register', () => {
    it('should register a new agent and index its capabilities', async () => {
      mockRedisClient.hGetAll.mockResolvedValue({}); // No old agent
      await registry.register(agent1);

      expect(mockRedisClient.multi).toHaveBeenCalledTimes(1);
      expect(mockMulti.hSet).toHaveBeenCalledWith(
        'tnf:registry:agents:agent-1',
        expect.objectContaining({ id: 'agent-1' })
      );
      expect(mockMulti.expire).toHaveBeenCalledWith('tnf:registry:agents:agent-1', 60);
      expect(mockMulti.sAdd).toHaveBeenCalledWith(
        'tnf:registry:agents:capability:test-capability-1',
        'agent-1'
      );
      expect(mockMulti.exec).toHaveBeenCalledTimes(1);
    });

    it('should update an existing agent and its capability indexes', async () => {
      const oldAgentData = {
        id: 'agent-1',
        name: 'Test Agent 1',
        capabilities: JSON.stringify([{ name: 'old-capability' }]),
        lastSeen: Date.now().toString(),
      };
      mockRedisClient.hGetAll.mockResolvedValue(oldAgentData);

      await registry.register(agent1);

      expect(mockMulti.sAdd).toHaveBeenCalledWith(
        'tnf:registry:agents:capability:test-capability-1',
        'agent-1'
      );
      expect(mockMulti.sRem).toHaveBeenCalledWith(
        'tnf:registry:agents:capability:old-capability',
        'agent-1'
      );
    });
  });

  describe('unregister', () => {
    it('should unregister an agent and remove it from capability sets', async () => {
      const agentData = {
        id: 'agent-1',
        name: 'Test Agent 1',
        capabilities: JSON.stringify([{ name: 'test-capability-1' }]),
        lastSeen: Date.now().toString(),
      };
      mockRedisClient.hGetAll.mockResolvedValue(agentData);

      await registry.unregister('agent-1');

      expect(mockRedisClient.multi).toHaveBeenCalledTimes(1);
      expect(mockMulti.sRem).toHaveBeenCalledWith(
        'tnf:registry:agents:capability:test-capability-1',
        'agent-1'
      );
      expect(mockMulti.del).toHaveBeenCalledWith('tnf:registry:agents:agent-1');
      expect(mockMulti.exec).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateHeartbeat', () => {
    it('should update the lastSeen timestamp and refresh the TTL', async () => {
      await registry.updateHeartbeat('agent-1');

      expect(mockRedisClient.multi).toHaveBeenCalledTimes(1);
      expect(mockMulti.hSet).toHaveBeenCalledWith(
        'tnf:registry:agents:agent-1',
        'lastSeen',
        expect.any(Number)
      );
      expect(mockMulti.expire).toHaveBeenCalledWith('tnf:registry:agents:agent-1', 60);
      expect(mockMulti.exec).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAgentsByCapability', () => {
    it('should return agents with the specified capability', async () => {
      const agentIds = ['agent-1', 'agent-2'];
      const agentData1 = {
        ...agent1,
        lastSeen: Date.now().toString(),
        capabilities: JSON.stringify(agent1.capabilities),
      };
      const agentData2 = {
        ...agent2,
        lastSeen: Date.now().toString(),
        capabilities: JSON.stringify(agent2.capabilities),
      };

      mockRedisClient.sMembers.mockResolvedValue(agentIds);
      mockMulti.exec.mockResolvedValue([agentData1, agentData2]);

      const agents = await registry.findAgentsByCapability('test-capability-1');

      expect(agents.length).toBe(2);
      expect(agents[0].id).toBe('agent-1');
      expect(agents[1].id).toBe('agent-2');
      expect(mockRedisClient.sMembers).toHaveBeenCalledWith(
        'tnf:registry:agents:capability:test-capability-1'
      );
      expect(mockMulti.hGetAll).toHaveBeenCalledWith('tnf:registry:agents:agent-1');
      expect(mockMulti.hGetAll).toHaveBeenCalledWith('tnf:registry:agents:agent-2');
    });
  });

  describe('listAgents', () => {
    it('should return a list of all registered agents using SCAN', async () => {
      const keys = ['tnf:registry:agents:agent-1', 'tnf:registry:agents:agent-2'];
      const agentData1 = {
        ...agent1,
        lastSeen: Date.now().toString(),
        capabilities: JSON.stringify(agent1.capabilities),
      };
      const agentData2 = {
        ...agent2,
        lastSeen: Date.now().toString(),
        capabilities: JSON.stringify(agent2.capabilities),
      };

      mockRedisClient.scan
        .mockResolvedValueOnce({ cursor: '1', keys })
        .mockResolvedValueOnce({ cursor: '0', keys: [] });
      mockMulti.exec.mockResolvedValue([agentData1, agentData2]);

      const agents = await registry.listAgents();

      expect(agents.length).toBe(2);
      expect(mockRedisClient.scan).toHaveBeenCalledWith('0' as any, {
        MATCH: 'tnf:registry:agents:*',
        COUNT: 100,
      });
    });
  });

  describe('getAgent', () => {
    it('should return agent details', async () => {
      const agentData = {
        ...agent1,
        lastSeen: Date.now().toString(),
        capabilities: JSON.stringify(agent1.capabilities),
      };
      mockRedisClient.hGetAll.mockResolvedValue(agentData);

      const agent = await registry.getAgent('agent-1');

      expect(agent).not.toBeNull();
      expect(agent?.id).toBe('agent-1');
      expect(mockRedisClient.hGetAll).toHaveBeenCalledWith('tnf:registry:agents:agent-1');
    });
  });

  describe('getHealthyAgents', () => {
    it('should return agents with a health score above the threshold', async () => {
      const agentIds = ['agent-1'];
      const agentData1 = {
        ...agent1,
        lastSeen: Date.now().toString(),
        capabilities: JSON.stringify(agent1.capabilities),
        healthScore: '0.95',
      };
      mockRedisClient.zRangeByScore.mockResolvedValue(agentIds);
      mockMulti.exec.mockResolvedValue([agentData1]);

      const agents = await registry.getHealthyAgents(0.9);

      expect(agents.length).toBe(1);
      expect(agents[0].id).toBe('agent-1');
      expect(mockRedisClient.zRangeByScore).toHaveBeenCalledWith(
        'tnf:registry:agents:health',
        0.9,
        1
      );
    });
  });
});
