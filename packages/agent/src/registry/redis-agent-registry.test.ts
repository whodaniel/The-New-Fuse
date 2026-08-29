import { AgentMetadata, RedisAgentRegistry } from './redis-agent-registry.js';

// Current RedisAgentRegistry contract (src/registry/redis-agent-registry.ts):
//   constructor(Partial<AgentRegistryConfig>)
//   connect() -> createStandaloneRedisClient() + createUpstashRestClient()
//   operations prefer the Upstash REST client when present:
//     register/unregister/updateHeartbeat -> upstash.pipeline().hset/sadd/srem/zadd/zrem/del/expire -> exec()
//     getAgent -> upstash.hgetall
//     findAgentsByCapability -> upstash.smembers
//     listAgents -> upstash.scan(Number(cursor), { match, count })
//     getHealthyAgents -> upstash.zrange(healthKey, minScore, 1, { byScore: true })
// The factories come from @the-new-fuse/infrastructure and are mocked here.

const mockRedisClient = {
  connect: jest.fn().mockResolvedValue(undefined),
  quit: jest.fn().mockResolvedValue(undefined),
  hgetall: jest.fn(),
  smembers: jest.fn(),
  scan: jest.fn(),
  zrangebyscore: jest.fn(),
  multi: jest.fn(),
};

const mockPipeline = {
  hset: jest.fn().mockReturnThis(),
  expire: jest.fn().mockReturnThis(),
  del: jest.fn().mockReturnThis(),
  sadd: jest.fn().mockReturnThis(),
  srem: jest.fn().mockReturnThis(),
  zadd: jest.fn().mockReturnThis(),
  zrem: jest.fn().mockReturnThis(),
  exec: jest.fn().mockResolvedValue([]),
};

const mockUpstash = {
  pipeline: jest.fn(() => mockPipeline),
  hgetall: jest.fn(),
  smembers: jest.fn(),
  scan: jest.fn(),
  zrange: jest.fn(),
};

jest.mock('@the-new-fuse/infrastructure', () => ({
  createStandaloneRedisClient: jest.fn(() => mockRedisClient),
  createUpstashRestClient: jest.fn(() => mockUpstash),
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const infrastructure = require('@the-new-fuse/infrastructure') as {
  createStandaloneRedisClient: jest.Mock;
  createUpstashRestClient: jest.Mock;
};

describe('RedisAgentRegistry', () => {
  let registry: RedisAgentRegistry;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPipeline.exec.mockResolvedValue([]);
    registry = new RedisAgentRegistry({ redisUrl: 'redis://mock' });
    await registry.connect();
  });

  afterEach(async () => {
    await registry.disconnect();
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

  describe('connect', () => {
    it('creates standalone Redis and Upstash REST clients', async () => {
      expect(infrastructure.createStandaloneRedisClient).toHaveBeenCalledTimes(1);
      expect(infrastructure.createUpstashRestClient).toHaveBeenCalledTimes(1);
      // Upstash pipeline is the primary write path once connected
      await registry.updateHeartbeat('agent-1');
      expect(mockUpstash.pipeline).toHaveBeenCalledTimes(1);
    });
  });

  describe('register', () => {
    it('should register a new agent and index its capabilities', async () => {
      mockUpstash.hgetall.mockResolvedValue({}); // No old agent
      await registry.register(agent1);

      expect(mockUpstash.pipeline).toHaveBeenCalledTimes(1);
      expect(mockPipeline.hset).toHaveBeenCalledWith(
        'tnf:registry:agents:agent-1',
        expect.objectContaining({ id: 'agent-1' })
      );
      expect(mockPipeline.expire).toHaveBeenCalledWith('tnf:registry:agents:agent-1', 60);
      expect(mockPipeline.sadd).toHaveBeenCalledWith(
        'tnf:registry:agents:capability:test-capability-1',
        'agent-1'
      );
      expect(mockPipeline.exec).toHaveBeenCalledTimes(1);
    });

    it('should update an existing agent and its capability indexes', async () => {
      mockUpstash.hgetall.mockResolvedValue({
        id: 'agent-1',
        name: 'Test Agent 1',
        capabilities: JSON.stringify([{ name: 'old-capability' }]),
        lastSeen: Date.now().toString(),
      });

      await registry.register(agent1);

      expect(mockPipeline.sadd).toHaveBeenCalledWith(
        'tnf:registry:agents:capability:test-capability-1',
        'agent-1'
      );
      expect(mockPipeline.srem).toHaveBeenCalledWith(
        'tnf:registry:agents:capability:old-capability',
        'agent-1'
      );
    });
  });

  describe('unregister', () => {
    it('should unregister an agent and remove it from capability sets', async () => {
      mockUpstash.hgetall.mockResolvedValue({
        id: 'agent-1',
        name: 'Test Agent 1',
        capabilities: JSON.stringify([{ name: 'test-capability-1' }]),
        lastSeen: Date.now().toString(),
      });

      await registry.unregister('agent-1');

      expect(mockUpstash.pipeline).toHaveBeenCalledTimes(1);
      expect(mockPipeline.srem).toHaveBeenCalledWith(
        'tnf:registry:agents:capability:test-capability-1',
        'agent-1'
      );
      expect(mockPipeline.del).toHaveBeenCalledWith('tnf:registry:agents:agent-1');
      expect(mockPipeline.exec).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateHeartbeat', () => {
    it('should update the lastSeen timestamp and refresh the TTL', async () => {
      await registry.updateHeartbeat('agent-1');

      expect(mockUpstash.pipeline).toHaveBeenCalledTimes(1);
      expect(mockPipeline.hset).toHaveBeenCalledWith('tnf:registry:agents:agent-1', {
        lastSeen: expect.any(String),
      });
      expect(mockPipeline.expire).toHaveBeenCalledWith('tnf:registry:agents:agent-1', 60);
      expect(mockPipeline.exec).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAgentsByCapability', () => {
    it('should return agents with the specified capability', async () => {
      mockUpstash.smembers.mockResolvedValue(['agent-1', 'agent-2']);
      mockUpstash.hgetall
        .mockResolvedValueOnce({
          ...agent1,
          lastSeen: Date.now().toString(),
          capabilities: JSON.stringify(agent1.capabilities),
        } as unknown as Record<string, string>)
        .mockResolvedValueOnce({
          ...agent2,
          lastSeen: Date.now().toString(),
          capabilities: JSON.stringify(agent2.capabilities),
        } as unknown as Record<string, string>);

      const agents = await registry.findAgentsByCapability('test-capability-1');

      expect(agents.length).toBe(2);
      expect(agents[0].id).toBe('agent-1');
      expect(agents[1].id).toBe('agent-2');
      expect(mockUpstash.smembers).toHaveBeenCalledWith(
        'tnf:registry:agents:capability:test-capability-1'
      );
    });
  });

  describe('listAgents', () => {
    it('should return a list of all registered agents using SCAN', async () => {
      const keys = ['tnf:registry:agents:agent-1', 'tnf:registry:agents:agent-2'];
      mockUpstash.scan.mockResolvedValueOnce([1, keys]).mockResolvedValueOnce([0, []]);
      mockUpstash.hgetall
        .mockResolvedValueOnce({
          ...agent1,
          lastSeen: Date.now().toString(),
          capabilities: JSON.stringify(agent1.capabilities),
        } as unknown as Record<string, string>)
        .mockResolvedValueOnce({
          ...agent2,
          lastSeen: Date.now().toString(),
          capabilities: JSON.stringify(agent2.capabilities),
        } as unknown as Record<string, string>);

      const agents = await registry.listAgents();

      expect(agents.length).toBe(2);
      expect(mockUpstash.scan).toHaveBeenCalledWith(0, {
        match: 'tnf:registry:agents:*',
        count: 100,
      });
      expect(agents[0].id).toBe('agent-1');
      expect(agents[1].id).toBe('agent-2');
    });
  });

  describe('getAgent', () => {
    it('should return agent details', async () => {
      mockUpstash.hgetall.mockResolvedValue({
        ...agent1,
        lastSeen: Date.now().toString(),
        capabilities: JSON.stringify(agent1.capabilities),
      } as unknown as Record<string, string>);

      const agent = await registry.getAgent('agent-1');

      expect(agent).not.toBeNull();
      expect(agent?.id).toBe('agent-1');
      expect(mockUpstash.hgetall).toHaveBeenCalledWith('tnf:registry:agents:agent-1');
    });
  });

  describe('getHealthyAgents', () => {
    it('should return agents with a health score above the threshold', async () => {
      mockUpstash.zrange.mockResolvedValue(['agent-1']);
      mockUpstash.hgetall.mockResolvedValue({
        ...agent1,
        lastSeen: Date.now().toString(),
        capabilities: JSON.stringify(agent1.capabilities),
        healthScore: '0.95',
      } as unknown as Record<string, string>);

      const agents = await registry.getHealthyAgents(0.9);

      expect(agents.length).toBe(1);
      expect(agents[0].id).toBe('agent-1');
      expect(mockUpstash.zrange).toHaveBeenCalledWith('tnf:registry:agents:health', 0.9, 1, {
        byScore: true,
      });
    });
  });
});
