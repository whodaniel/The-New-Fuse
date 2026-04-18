/**
 * DrizzleAgentRepository Integration Tests
 * Tests all 23 methods of the agent repository
 */

import { drizzleAgentRepository } from '../../src/drizzle/repositories/agent.repository.js';
import { drizzleUserRepository } from '../../src/drizzle/repositories/user.repository.js';
import { AgentFactory, UserFactory } from '../utils/factories.js';
import {
  expectDatabaseRow,
  expectSoftDeleted,
  expectNotNull,
  expectArrayLength,
  expectEmptyArray,
  expectNonEmptyArray,
  expectValidPagination,
  expectNotDeleted,
  expectDeleted,
} from '../utils/assertions.js';
import { pastTimestamp, sleep } from '../utils/database-helpers.js';

describe('DrizzleAgentRepository', () => {
  let testUserId: string;

  beforeEach(async () => {
    // Create a test user for agent operations
    const userData = await UserFactory.build();
    const user = await drizzleUserRepository.create(userData);
    testUserId = user.id;
  });

  describe('create', () => {
    it('should create a new agent with all fields', async () => {
      const agentData = AgentFactory.build({ userId: testUserId });

      const agent = await drizzleAgentRepository.create(agentData);

      expectDatabaseRow(agent, {
        name: agentData.name,
        userId: testUserId,
        type: agentData.type,
        status: agentData.status,
      });
      expect(agent.capabilities).toEqual(agentData.capabilities);
      expect(agent.tags).toEqual(agentData.tags);
      expectNotDeleted(agent);
    });

    it('should create agent with minimal required fields', async () => {
      const agentData = AgentFactory.build({
        userId: testUserId,
        description: undefined,
        config: undefined,
        capabilities: undefined,
        tags: undefined,
      });

      const agent = await drizzleAgentRepository.create(agentData);

      expect(agent.userId).toBe(testUserId);
      expect(agent.name).toBeDefined();
    });
  });

  describe('findById', () => {
    it('should find agent by ID', async () => {
      const agentData = AgentFactory.build({ userId: testUserId });
      const created = await drizzleAgentRepository.create(agentData);

      const found = await drizzleAgentRepository.findById(created.id);

      expectNotNull(found);
      expect(found.id).toBe(created.id);
      expect(found.name).toBe(created.name);
    });

    it('should return null for non-existent ID', async () => {
      const found = await drizzleAgentRepository.findById('non-existent-id');

      expect(found).toBeNull();
    });

    it('should not return soft-deleted agents', async () => {
      const agentData = AgentFactory.build({ userId: testUserId });
      const created = await drizzleAgentRepository.create(agentData);
      await drizzleAgentRepository.softDelete(created.id);

      const found = await drizzleAgentRepository.findById(created.id);

      expectSoftDeleted(found);
    });
  });

  describe('findByIdWithMetadata', () => {
    it('should find agent with null metadata when no metadata exists', async () => {
      const agentData = AgentFactory.build({ userId: testUserId });
      const created = await drizzleAgentRepository.create(agentData);

      const found = await drizzleAgentRepository.findByIdWithMetadata(created.id);

      expectNotNull(found);
      expect(found.id).toBe(created.id);
      expect(found.metadata).toBeNull();
    });

    it('should find agent with metadata after upserting metadata', async () => {
      const agentData = AgentFactory.build({ userId: testUserId });
      const created = await drizzleAgentRepository.create(agentData);
      await drizzleAgentRepository.upsertMetadata(created.id, {
        customFields: { key: 'value' },
      });

      const found = await drizzleAgentRepository.findByIdWithMetadata(created.id);

      expectNotNull(found);
      expect(found.metadata).not.toBeNull();
      expect(found.metadata?.agentId).toBe(created.id);
    });

    it('should return null for non-existent agent', async () => {
      const found = await drizzleAgentRepository.findByIdWithMetadata('non-existent-id');

      expect(found).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('should find all agents for a user', async () => {
      const agents = AgentFactory.buildList(3, { userId: testUserId });
      await Promise.all(agents.map((a) => drizzleAgentRepository.create(a)));

      const found = await drizzleAgentRepository.findByUserId(testUserId);

      expectArrayLength(found, 3);
    });

    it('should return empty array when user has no agents', async () => {
      const found = await drizzleAgentRepository.findByUserId('user-with-no-agents');

      expectEmptyArray(found);
    });

    it('should order agents by creation date (newest first)', async () => {
      const agent1 = await drizzleAgentRepository.create(AgentFactory.build({ userId: testUserId }));
      await sleep(10); // Ensure different timestamps
      const agent2 = await drizzleAgentRepository.create(AgentFactory.build({ userId: testUserId }));

      const found = await drizzleAgentRepository.findByUserId(testUserId);

      expect(found[0].id).toBe(agent2.id); // Newest first
      expect(found[1].id).toBe(agent1.id);
    });
  });

  describe('findActive', () => {
    it('should find all active agents', async () => {
      await drizzleAgentRepository.create(AgentFactory.build({ userId: testUserId, status: 'ACTIVE' }));
      await drizzleAgentRepository.create(AgentFactory.build({ userId: testUserId, status: 'ACTIVE' }));
      await drizzleAgentRepository.create(AgentFactory.build({ userId: testUserId, status: 'INACTIVE' }));

      const found = await drizzleAgentRepository.findActive();

      expect(found.length).toBe(2);
      expect(found.every((a) => a.status === 'ACTIVE')).toBe(true);
    });

    it('should return empty array when no active agents exist', async () => {
      await drizzleAgentRepository.create(AgentFactory.build({ userId: testUserId, status: 'INACTIVE' }));

      const found = await drizzleAgentRepository.findActive();

      expectEmptyArray(found);
    });
  });

  describe('update', () => {
    it('should update agent fields', async () => {
      const created = await drizzleAgentRepository.create(AgentFactory.build({ userId: testUserId }));

      const updated = await drizzleAgentRepository.update(created.id, {
        name: 'Updated Name',
        description: 'Updated Description',
        status: 'INACTIVE',
      });

      expectNotNull(updated);
      expect(updated.name).toBe('Updated Name');
      expect(updated.description).toBe('Updated Description');
      expect(updated.status).toBe('INACTIVE');
      expect(updated.updatedAt.getTime()).toBeGreaterThan(created.updatedAt.getTime());
    });

    it('should return null for non-existent agent', async () => {
      const updated = await drizzleAgentRepository.update('non-existent-id', { name: 'New Name' });

      expect(updated).toBeNull();
    });
  });

  describe('softDelete', () => {
    it('should soft delete agent', async () => {
      const created = await drizzleAgentRepository.create(AgentFactory.build({ userId: testUserId }));

      const deleted = await drizzleAgentRepository.softDelete(created.id);

      expect(deleted).toBe(true);

      const found = await drizzleAgentRepository.findById(created.id);
      expectSoftDeleted(found);
    });

    it('should return false for non-existent agent', async () => {
      const deleted = await drizzleAgentRepository.softDelete('non-existent-id');

      expect(deleted).toBe(false);
    });
  });

  describe('hardDelete', () => {
    it('should permanently delete agent', async () => {
      const created = await drizzleAgentRepository.create(AgentFactory.build({ userId: testUserId }));

      const deleted = await drizzleAgentRepository.hardDelete(created.id);

      expect(deleted).toBe(true);

      // Even bypassing soft delete filter, agent should not exist
      const { getTestDb } = await import('../setup');
      const db = getTestDb();
      const result = await db.query.agents.findFirst({
        where: (agents, { eq }) => eq(agents.id, created.id),
      });

      expect(result).toBeUndefined();
    });
  });

  describe('search', () => {
    it('should search agents by name', async () => {
      await drizzleAgentRepository.create(AgentFactory.build({ userId: testUserId, name: 'SearchBot' }));
      await drizzleAgentRepository.create(AgentFactory.build({ userId: testUserId, name: 'OtherAgent' }));

      const found = await drizzleAgentRepository.search('SearchBot', testUserId);

      expectNonEmptyArray(found);
      expect(found[0].name).toContain('SearchBot');
    });

    it('should search agents by description', async () => {
      await drizzleAgentRepository.create(AgentFactory.build({ userId: testUserId, description: 'Unique Description' }));

      const found = await drizzleAgentRepository.search('Unique', testUserId);

      expectNonEmptyArray(found);
    });

    it('should limit results to 50', async () => {
      const agents = AgentFactory.buildList(60, { userId: testUserId, name: 'Agent' });
      await Promise.all(agents.map((a) => drizzleAgentRepository.create(a)));

      const found = await drizzleAgentRepository.search('Agent', testUserId);

      expect(found.length).toBeLessThanOrEqual(50);
    });

    it('should search across all users when userId not provided', async () => {
      const userData2 = await UserFactory.build();
      const user2 = await drizzleUserRepository.create(userData2);

      await drizzleAgentRepository.create(AgentFactory.build({ userId: testUserId, name: 'GlobalSearch' }));
      await drizzleAgentRepository.create(AgentFactory.build({ userId: user2.id, name: 'GlobalSearch' }));

      const found = await drizzleAgentRepository.search('GlobalSearch');

      expect(found.length).toBe(2);
    });
  });

  describe('countByStatus', () => {
    it('should count agents by status', async () => {
      await drizzleAgentRepository.create(AgentFactory.build({ userId: testUserId, status: 'ACTIVE' }));
      await drizzleAgentRepository.create(AgentFactory.build({ userId: testUserId, status: 'ACTIVE' }));
      await drizzleAgentRepository.create(AgentFactory.build({ userId: testUserId, status: 'INACTIVE' }));

      const counts = await drizzleAgentRepository.countByStatus();

      const activeCount = counts.find((c) => c.status === 'ACTIVE')?.count || 0;
      const inactiveCount = counts.find((c) => c.status === 'INACTIVE')?.count || 0;

      expect(activeCount).toBe(2);
      expect(inactiveCount).toBe(1);
    });
  });

  describe('upsertMetadata', () => {
    it('should create metadata for agent without existing metadata', async () => {
      const created = await drizzleAgentRepository.create(AgentFactory.build({ userId: testUserId }));

      const metadata = await drizzleAgentRepository.upsertMetadata(created.id, {
        customFields: { setting: 'value' },
      });

      expect(metadata.agentId).toBe(created.id);
      expect(metadata.customFields).toEqual({ setting: 'value' });
    });

    it('should update metadata for agent with existing metadata', async () => {
      const created = await drizzleAgentRepository.create(AgentFactory.build({ userId: testUserId }));
      await drizzleAgentRepository.upsertMetadata(created.id, { customFields: { old: 'data' } });

      const updated = await drizzleAgentRepository.upsertMetadata(created.id, {
        customFields: { new: 'data' },
      });

      expect(updated.agentId).toBe(created.id);
      expect(updated.customFields).toEqual({ new: 'data' });
    });
  });

  describe('findByNameAndUserId', () => {
    it('should find agent by name and userId', async () => {
      const created = await drizzleAgentRepository.create(
        AgentFactory.build({ userId: testUserId, name: 'UniqueAgentName' })
      );

      const found = await drizzleAgentRepository.findByNameAndUserId('UniqueAgentName', testUserId);

      expectNotNull(found);
      expect(found.id).toBe(created.id);
    });

    it('should return null when name exists for different user', async () => {
      const userData2 = await UserFactory.build();
      const user2 = await drizzleUserRepository.create(userData2);
      await drizzleAgentRepository.create(AgentFactory.build({ userId: user2.id, name: 'AgentName' }));

      const found = await drizzleAgentRepository.findByNameAndUserId('AgentName', testUserId);

      expect(found).toBeNull();
    });

    it('should return null for non-existent name', async () => {
      const found = await drizzleAgentRepository.findByNameAndUserId('NonExistentName', testUserId);

      expect(found).toBeNull();
    });
  });

  describe('findWithPagination', () => {
    it('should paginate agents correctly', async () => {
      const agents = AgentFactory.buildList(25, { userId: testUserId });
      await Promise.all(agents.map((a) => drizzleAgentRepository.create(a)));

      const page1 = await drizzleAgentRepository.findWithPagination(testUserId, 1, 10);
      const page2 = await drizzleAgentRepository.findWithPagination(testUserId, 2, 10);

      expectValidPagination(page1, 25);
      expectValidPagination(page2, 25);
      expectArrayLength(page1.data, 10);
      expectArrayLength(page2.data, 10);
      expect(page1.data[0].id).not.toBe(page2.data[0].id);
    });

    it('should return empty page when no agents exist', async () => {
      const result = await drizzleAgentRepository.findWithPagination(testUserId, 1, 10);

      expectValidPagination(result, 0);
      expectEmptyArray(result.data);
    });
  });

  describe('findByStatusAndUserId', () => {
    it('should find agents by status and userId', async () => {
      await drizzleAgentRepository.create(AgentFactory.build({ userId: testUserId, status: 'ACTIVE' }));
      await drizzleAgentRepository.create(AgentFactory.build({ userId: testUserId, status: 'ACTIVE' }));
      await drizzleAgentRepository.create(AgentFactory.build({ userId: testUserId, status: 'INACTIVE' }));

      const found = await drizzleAgentRepository.findByStatusAndUserId('ACTIVE', testUserId);

      expectArrayLength(found, 2);
      expect(found.every((a) => a.status === 'ACTIVE')).toBe(true);
    });
  });

  describe('searchAgents', () => {
    it('should search by name only', async () => {
      await drizzleAgentRepository.create(AgentFactory.build({ userId: testUserId, name: 'TestAgent123' }));
      await drizzleAgentRepository.create(AgentFactory.build({ userId: testUserId, name: 'OtherAgent' }));

      const found = await drizzleAgentRepository.searchAgents(testUserId, { name: 'Test' });

      expectNonEmptyArray(found);
      expect(found[0].name).toContain('Test');
    });

    it('should search by type only', async () => {
      await drizzleAgentRepository.create(AgentFactory.build({ userId: testUserId, type: 'CHAT' }));
      await drizzleAgentRepository.create(AgentFactory.build({ userId: testUserId, type: 'TASK' }));

      const found = await drizzleAgentRepository.searchAgents(testUserId, { type: 'CHAT' });

      expectNonEmptyArray(found);
      expect(found.every((a) => a.type === 'CHAT')).toBe(true);
    });

    it('should search by capability', async () => {
      await drizzleAgentRepository.create(AgentFactory.build({ userId: testUserId, capabilities: ['search', 'analyze'] }));
      await drizzleAgentRepository.create(AgentFactory.build({ userId: testUserId, capabilities: ['chat'] }));

      const found = await drizzleAgentRepository.searchAgents(testUserId, { capability: 'search' });

      expectNonEmptyArray(found);
      expect(found[0].capabilities).toContain('search');
    });

    it('should combine multiple search criteria', async () => {
      await drizzleAgentRepository.create(
        AgentFactory.build({ userId: testUserId, name: 'SearchBot', type: 'CHAT', capabilities: ['search'] })
      );
      await drizzleAgentRepository.create(
        AgentFactory.build({ userId: testUserId, name: 'SearchBot', type: 'TASK', capabilities: ['analyze'] })
      );

      const found = await drizzleAgentRepository.searchAgents(testUserId, {
        name: 'Search',
        type: 'CHAT',
        capability: 'search',
      });

      expectArrayLength(found, 1);
      expect(found[0].type).toBe('CHAT');
    });
  });

  describe('findByCapability', () => {
    it('should find agents with specific capability', async () => {
      await drizzleAgentRepository.create(AgentFactory.build({ userId: testUserId, capabilities: ['coding', 'debug'] }));
      await drizzleAgentRepository.create(AgentFactory.build({ userId: testUserId, capabilities: ['chat'] }));

      const found = await drizzleAgentRepository.findByCapability('coding', testUserId);

      expectNonEmptyArray(found);
      expect(found[0].capabilities).toContain('coding');
    });
  });

  describe('updateStatus', () => {
    it('should update agent status', async () => {
      const created = await drizzleAgentRepository.create(AgentFactory.build({ userId: testUserId, status: 'ACTIVE' }));

      const updated = await drizzleAgentRepository.updateStatus(created.id, 'INACTIVE');

      expectNotNull(updated);
      expect(updated.status).toBe('INACTIVE');
    });

    it('should return null for non-existent agent', async () => {
      const updated = await drizzleAgentRepository.updateStatus('non-existent-id', 'ACTIVE');

      expect(updated).toBeNull();
    });
  });

  describe('Registration Methods', () => {
    describe('createRegistration', () => {
      it('should create agent registration', async () => {
        const agent = await drizzleAgentRepository.create(AgentFactory.build({ userId: testUserId }));

        const registration = await drizzleAgentRepository.createRegistration({
          agentId: agent.id,
          authToken: 'test-token-123',
          registrationData: { key: 'value' },
          verificationStatus: 'PENDING',
          onboardingStatus: 'STARTED',
          onboardingProgress: 0,
          heartbeatInterval: 30000,
          isOnline: true,
          metadata: {},
        });

        expect(registration.agentId).toBe(agent.id);
        expect(registration.authToken).toBe('test-token-123');
        expect(registration.isOnline).toBe(true);
      });
    });

    describe('findRegistrationByToken', () => {
      it('should find registration by auth token', async () => {
        const agent = await drizzleAgentRepository.create(AgentFactory.build({ userId: testUserId }));
        const created = await drizzleAgentRepository.createRegistration({
          agentId: agent.id,
          authToken: 'find-me-token',
          registrationData: {},
          verificationStatus: 'VERIFIED',
          onboardingStatus: 'COMPLETE',
          onboardingProgress: 100,
          heartbeatInterval: 30000,
          isOnline: true,
          metadata: {},
        });

        const found = await drizzleAgentRepository.findRegistrationByToken('find-me-token');

        expectNotNull(found);
        expect(found.id).toBe(created.id);
      });

      it('should return null for non-existent token', async () => {
        const found = await drizzleAgentRepository.findRegistrationByToken('non-existent-token');

        expect(found).toBeNull();
      });
    });

    describe('findRegistrationById', () => {
      it('should find registration by ID', async () => {
        const agent = await drizzleAgentRepository.create(AgentFactory.build({ userId: testUserId }));
        const created = await drizzleAgentRepository.createRegistration({
          agentId: agent.id,
          authToken: 'token-123',
          registrationData: {},
          verificationStatus: 'VERIFIED',
          onboardingStatus: 'COMPLETE',
          onboardingProgress: 100,
          heartbeatInterval: 30000,
          isOnline: true,
          metadata: {},
        });

        const found = await drizzleAgentRepository.findRegistrationById(created.id);

        expectNotNull(found);
        expect(found.id).toBe(created.id);
      });
    });

    describe('updateRegistrationHeartbeat', () => {
      it('should update registration heartbeat', async () => {
        const agent = await drizzleAgentRepository.create(AgentFactory.build({ userId: testUserId }));
        const registration = await drizzleAgentRepository.createRegistration({
          agentId: agent.id,
          authToken: 'token-123',
          registrationData: {},
          verificationStatus: 'VERIFIED',
          onboardingStatus: 'COMPLETE',
          onboardingProgress: 100,
          heartbeatInterval: 30000,
          isOnline: false,
          metadata: {},
        });

        const beforeUpdate = new Date();
        await sleep(10);
        await drizzleAgentRepository.updateRegistrationHeartbeat(registration.id);

        const updated = await drizzleAgentRepository.findRegistrationById(registration.id);
        expectNotNull(updated);
        expect(updated.isOnline).toBe(true);
        expect(updated.lastHeartbeat.getTime()).toBeGreaterThan(beforeUpdate.getTime());
      });
    });

    describe('createCapability', () => {
      it('should create capability registry entry', async () => {
        const agent = await drizzleAgentRepository.create(AgentFactory.build({ userId: testUserId }));
        const registration = await drizzleAgentRepository.createRegistration({
          agentId: agent.id,
          authToken: 'token-123',
          registrationData: {},
          verificationStatus: 'VERIFIED',
          onboardingStatus: 'COMPLETE',
          onboardingProgress: 100,
          heartbeatInterval: 30000,
          isOnline: true,
          metadata: {},
        });

        const capability = await drizzleAgentRepository.createCapability({
          registrationId: registration.id,
          capabilityName: 'code_analysis',
          capabilityType: 'ANALYSIS',
          version: '1.0.0',
          description: 'Analyze code quality',
          parameters: { language: 'typescript' },
          verificationStatus: 'VERIFIED',
        });

        expect(capability.registrationId).toBe(registration.id);
        expect(capability.capabilityName).toBe('code_analysis');
        expect(capability.version).toBe('1.0.0');
      });
    });

    describe('createOnboardingEvent', () => {
      it('should create onboarding event', async () => {
        const agent = await drizzleAgentRepository.create(AgentFactory.build({ userId: testUserId }));
        const registration = await drizzleAgentRepository.createRegistration({
          agentId: agent.id,
          authToken: 'token-123',
          registrationData: {},
          verificationStatus: 'VERIFIED',
          onboardingStatus: 'IN_PROGRESS',
          onboardingProgress: 50,
          heartbeatInterval: 30000,
          isOnline: true,
          metadata: {},
        });

        const event = await drizzleAgentRepository.createOnboardingEvent({
          registrationId: registration.id,
          eventType: 'STEP_COMPLETED',
          message: 'Configuration step completed',
          eventData: { step: 'config' },
        });

        expect(event.registrationId).toBe(registration.id);
        expect(event.eventType).toBe('STEP_COMPLETED');
        expect(event.message).toContain('completed');
      });
    });

    describe('createDirectoryEntry', () => {
      it('should create directory entry for agent', async () => {
        const agent = await drizzleAgentRepository.create(AgentFactory.build({ userId: testUserId }));

        const entry = await drizzleAgentRepository.createDirectoryEntry({
          agentId: agent.id,
          displayName: 'Public Agent',
          description: 'A public agent for testing',
          category: 'productivity',
          tags: ['automation', 'testing'],
          isPublic: true,
          isVerified: true,
          rating: 4.5,
          usageCount: 100,
          metadata: {},
        });

        expect(entry.agentId).toBe(agent.id);
        expect(entry.displayName).toBe('Public Agent');
        expect(entry.isPublic).toBe(true);
        expect(entry.rating).toBe(4.5);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle agents with empty arrays', async () => {
      const agent = await drizzleAgentRepository.create(
        AgentFactory.build({ userId: testUserId, capabilities: [], tags: [] })
      );

      expect(agent.capabilities).toEqual([]);
      expect(agent.tags).toEqual([]);
    });

    it('should handle very long agent names', async () => {
      const longName = 'A'.repeat(200);
      const agent = await drizzleAgentRepository.create(AgentFactory.build({ userId: testUserId, name: longName }));

      expect(agent.name).toBe(longName);
    });

    it('should maintain data integrity across concurrent creates', async () => {
      const agents = AgentFactory.buildList(10, { userId: testUserId });
      const created = await Promise.all(agents.map((a) => drizzleAgentRepository.create(a)));

      expectArrayLength(created, 10);
      const uniqueIds = new Set(created.map((a) => a.id));
      expect(uniqueIds.size).toBe(10);
    });
  });
});
