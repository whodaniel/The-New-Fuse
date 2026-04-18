/**
 * Agent Discovery System Integration Tests
 */

import { AgentDiscoveryRegistry } from '../agent-discovery-registry.service';
import { CapabilityMatcher } from '../capability-matcher.service';
import {
  AgentRegistration,
  AgentHeartbeat,
  AgentStatus,
  DiscoveryQuery,
} from '../../types/agent-discovery.types';

describe('Agent Discovery System', () => {
  let registry: AgentDiscoveryRegistry;
  let matcher: CapabilityMatcher;

  beforeAll(async () => {
    registry = new AgentDiscoveryRegistry({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
      heartbeatInterval: 30000,
      heartbeatTimeout: 60000,
      enablePubSub: false, // Disable for tests
      keyPrefix: 'test:agent:discovery',
    });

    matcher = new CapabilityMatcher();
  });

  afterAll(async () => {
    // Clean up all test agents
    const agents = await registry.getAllAgents();
    for (const agent of agents) {
      await registry.deregisterAgent(agent.registration.agentId);
    }
    await registry.close();
  });

  describe('Agent Registration', () => {
    const testAgent: AgentRegistration = {
      agentId: 'test-agent-01',
      name: 'Test Agent',
      description: 'Test agent for unit tests',
      type: 'test',
      groups: ['testing'],
      version: '1.0.0',
      capabilities: [
        {
          name: 'test-capability',
          version: '1.0.0',
          description: 'Test capability',
          confidence: 0.9,
        },
      ],
    };

    it('should register a new agent', async () => {
      await registry.registerAgent(testAgent);

      const agent = await registry.getAgentById(testAgent.agentId);
      expect(agent).not.toBeNull();
      expect(agent?.registration.agentId).toBe(testAgent.agentId);
      expect(agent?.registration.name).toBe(testAgent.name);
    });

    it('should update existing agent registration', async () => {
      const updatedAgent: AgentRegistration = {
        ...testAgent,
        name: 'Updated Test Agent',
      };

      await registry.registerAgent(updatedAgent);

      const agent = await registry.getAgentById(testAgent.agentId);
      expect(agent?.registration.name).toBe('Updated Test Agent');
    });

    it('should deregister an agent', async () => {
      await registry.deregisterAgent(testAgent.agentId);

      const agent = await registry.getAgentById(testAgent.agentId);
      expect(agent).toBeNull();
    });
  });

  describe('Heartbeat Management', () => {
    const testAgent: AgentRegistration = {
      agentId: 'heartbeat-test-agent',
      name: 'Heartbeat Test Agent',
      version: '1.0.0',
      capabilities: [
        {
          name: 'test-capability',
          version: '1.0.0',
          description: 'Test capability',
          confidence: 0.9,
        },
      ],
    };

    beforeEach(async () => {
      await registry.registerAgent(testAgent);
    });

    afterEach(async () => {
      await registry.deregisterAgent(testAgent.agentId);
    });

    it('should update agent heartbeat', async () => {
      const heartbeat: AgentHeartbeat = {
        agentId: testAgent.agentId,
        timestamp: new Date(),
        status: AgentStatus.ONLINE,
        metrics: {
          isHealthy: true,
          uptime: 100,
          successRate: 0.95,
          avgResponseTime: 1000,
          cpuUsage: 25,
          memoryUsage: 40,
          activeTasks: 2,
          totalTasks: 10,
          failedTasks: 1,
        },
      };

      await registry.heartbeat(heartbeat);

      const agent = await registry.getAgentById(testAgent.agentId);
      expect(agent?.status).toBe(AgentStatus.ONLINE);
      expect(agent?.metrics.cpuUsage).toBe(25);
      expect(agent?.metrics.activeTasks).toBe(2);
    });
  });

  describe('Agent Discovery', () => {
    const pythonAgent: AgentRegistration = {
      agentId: 'python-agent',
      name: 'Python Expert Agent',
      type: 'code-analysis',
      groups: ['coding', 'python'],
      version: '1.0.0',
      capabilities: [
        {
          name: 'code-review',
          version: '1.0.0',
          description: 'Review Python code for quality and best practices',
          languages: ['python'],
          confidence: 0.95,
        },
      ],
    };

    const jsAgent: AgentRegistration = {
      agentId: 'js-agent',
      name: 'JavaScript Expert Agent',
      type: 'code-analysis',
      groups: ['coding', 'javascript'],
      version: '1.0.0',
      capabilities: [
        {
          name: 'code-review',
          version: '1.0.0',
          description: 'Review JavaScript code',
          languages: ['javascript', 'typescript'],
          confidence: 0.92,
        },
      ],
    };

    beforeEach(async () => {
      await registry.registerAgent(pythonAgent);
      await registry.registerAgent(jsAgent);

      // Send heartbeats
      const now = new Date();
      await registry.heartbeat({
        agentId: pythonAgent.agentId,
        timestamp: now,
        status: AgentStatus.ONLINE,
        metrics: {
          isHealthy: true,
          uptime: 1000,
          successRate: 0.95,
          avgResponseTime: 500,
          cpuUsage: 20,
          memoryUsage: 30,
          activeTasks: 1,
          totalTasks: 100,
          failedTasks: 5,
        },
      });

      await registry.heartbeat({
        agentId: jsAgent.agentId,
        timestamp: now,
        status: AgentStatus.IDLE,
        metrics: {
          isHealthy: true,
          uptime: 500,
          successRate: 0.92,
          avgResponseTime: 800,
          cpuUsage: 15,
          memoryUsage: 25,
          activeTasks: 0,
          totalTasks: 50,
          failedTasks: 4,
        },
      });
    });

    afterEach(async () => {
      await registry.deregisterAgent(pythonAgent.agentId);
      await registry.deregisterAgent(jsAgent.agentId);
    });

    it('should discover agents by capability', async () => {
      const query: DiscoveryQuery = {
        capability: 'code-review',
      };

      const result = await registry.discoverAgents(query);

      expect(result.agents.length).toBe(2);
      expect(result.total).toBe(2);
    });

    it('should filter agents by language', async () => {
      const query: DiscoveryQuery = {
        languages: ['python'],
      };

      const result = await registry.discoverAgents(query);

      expect(result.agents.length).toBe(1);
      expect(result.agents[0].registration.agentId).toBe('python-agent');
    });

    it('should filter agents by group', async () => {
      const query: DiscoveryQuery = {
        groups: ['python'],
      };

      const result = await registry.discoverAgents(query);

      expect(result.agents.length).toBe(1);
      expect(result.agents[0].registration.agentId).toBe('python-agent');
    });

    it('should filter agents by status', async () => {
      const query: DiscoveryQuery = {
        status: [AgentStatus.IDLE],
      };

      const result = await registry.discoverAgents(query);

      expect(result.agents.length).toBe(1);
      expect(result.agents[0].registration.agentId).toBe('js-agent');
    });

    it('should filter agents by CPU usage', async () => {
      const query: DiscoveryQuery = {
        maxCpuUsage: 18,
      };

      const result = await registry.discoverAgents(query);

      expect(result.agents.length).toBe(1);
      expect(result.agents[0].registration.agentId).toBe('js-agent');
    });

    it('should sort agents by success rate', async () => {
      const query: DiscoveryQuery = {
        sortBy: 'successRate',
        sortDirection: 'desc',
      };

      const result = await registry.discoverAgents(query);

      expect(result.agents[0].registration.agentId).toBe('python-agent');
      expect(result.agents[1].registration.agentId).toBe('js-agent');
    });

    it('should sort agents by load', async () => {
      const query: DiscoveryQuery = {
        sortBy: 'load',
        sortDirection: 'asc',
      };

      const result = await registry.discoverAgents(query);

      // JS agent should have lower load (idle, lower CPU)
      expect(result.agents[0].registration.agentId).toBe('js-agent');
    });

    it('should limit results', async () => {
      const query: DiscoveryQuery = {
        limit: 1,
      };

      const result = await registry.discoverAgents(query);

      expect(result.agents.length).toBe(1);
      expect(result.total).toBe(2);
    });

    it('should provide load balancing recommendations', async () => {
      const query: DiscoveryQuery = {
        capability: 'code-review',
      };

      const result = await registry.discoverAgents(query);

      expect(result.recommendations).toBeDefined();
      expect(result.recommendations!.length).toBeGreaterThan(0);
      expect(result.recommendations![0]).toHaveProperty('agentId');
      expect(result.recommendations![0]).toHaveProperty('score');
      expect(result.recommendations![0]).toHaveProperty('reason');
    });
  });

  describe('Capability Matching', () => {
    const agents = [
      {
        registration: {
          agentId: 'agent-1',
          name: 'Code Review Agent',
          version: '1.0.0',
          capabilities: [
            {
              name: 'code-review',
              version: '1.0.0',
              description: 'Advanced code review for Python and TypeScript',
              languages: ['python', 'typescript'],
              confidence: 0.95,
            },
          ],
        },
        status: AgentStatus.ONLINE,
        load: 0.3,
        metrics: {
          isHealthy: true,
          uptime: 1000,
          successRate: 0.95,
          avgResponseTime: 500,
          cpuUsage: 20,
          memoryUsage: 30,
          activeTasks: 1,
          totalTasks: 100,
          failedTasks: 5,
        },
        lastHeartbeat: new Date(),
        firstSeen: new Date(),
      },
    ];

    it('should find capability matches with semantic search', () => {
      const matches = matcher.findCapabilityMatches(agents as any, 'review code', {
        minScore: 0.5,
      });

      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].capability.name).toBe('code-review');
      expect(matches[0].score).toBeGreaterThan(0.5);
    });

    it('should boost scores for language matches', () => {
      const matches = matcher.findCapabilityMatches(agents as any, 'review Python code', {
        minScore: 0.5,
      });

      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].matchReasons).toContain('Supports python, typescript');
    });

    it('should filter by minimum score', () => {
      const matches = matcher.findCapabilityMatches(agents as any, 'unrelated query', {
        minScore: 0.8,
      });

      expect(matches.length).toBe(0);
    });
  });

  describe('Capability Composition', () => {
    const agents = [
      {
        registration: {
          agentId: 'cleaner',
          name: 'Data Cleaner',
          version: '1.0.0',
          capabilities: [
            {
              name: 'data-cleaning',
              version: '1.0.0',
              description: 'Clean and prepare data',
              confidence: 0.9,
            },
          ],
        },
        status: AgentStatus.ONLINE,
        load: 0.2,
        metrics: {
          isHealthy: true,
          uptime: 1000,
          successRate: 0.95,
          avgResponseTime: 500,
          cpuUsage: 20,
          memoryUsage: 30,
          activeTasks: 1,
          totalTasks: 100,
          failedTasks: 5,
        },
        lastHeartbeat: new Date(),
        firstSeen: new Date(),
      },
      {
        registration: {
          agentId: 'analyzer',
          name: 'Data Analyzer',
          version: '1.0.0',
          capabilities: [
            {
              name: 'statistical-analysis',
              version: '1.0.0',
              description: 'Perform statistical analysis',
              confidence: 0.92,
            },
          ],
        },
        status: AgentStatus.ONLINE,
        load: 0.3,
        metrics: {
          isHealthy: true,
          uptime: 1000,
          successRate: 0.93,
          avgResponseTime: 800,
          cpuUsage: 25,
          memoryUsage: 35,
          activeTasks: 2,
          totalTasks: 80,
          failedTasks: 6,
        },
        lastHeartbeat: new Date(),
        firstSeen: new Date(),
      },
    ];

    it('should compose capabilities across agents', () => {
      const compositions = matcher.composeCapabilities(
        ['data-cleaning', 'statistical-analysis'],
        agents as any
      );

      expect(compositions.length).toBeGreaterThan(0);
      expect(compositions[0].composition.agentChain).toEqual(['cleaner', 'analyzer']);
      expect(compositions[0].composition.capabilities).toEqual([
        'data-cleaning',
        'statistical-analysis',
      ]);
    });

    it('should score compositions based on reliability', () => {
      const compositions = matcher.composeCapabilities(
        ['data-cleaning', 'statistical-analysis'],
        agents as any,
        { preferReliable: true }
      );

      expect(compositions[0].reliability).toBeCloseTo(0.95 * 0.93, 2);
    });
  });
});
