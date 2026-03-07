import { Test } from '@nestjs/testing';
import { AgentsService } from '../src/agents/agents.service';
import { DrizzleService } from '../src/drizzle/drizzle.service';
import { ConfigService } from '@nestjs/config';
import { UnifiedMonitoringService } from '@the-new-fuse/core';
import { AgentFactory } from '../src/agents/agent.factory';
import { AgentType } from '@the-new-fuse/database'; // Removed DrizzleAgent alias
import { jest, describe, beforeEach, it, expect } from '@jest/globals';
// Mock DrizzleClient methods used by the service
const mockDrizzle = {
    agent: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(), // Added delete mock
    },
};
describe('AgentsService', () => {
    let service;
    let module; // Declare module here
    // Keep drizzle variable if needed for direct assertions on the mock, though usually asserting on mockDrizzle.agent.* is sufficient
    // let drizzle: DrizzleService;
    // Define a reusable mock agent structure consistent with Drizzle Agent type
    const mockAgent = {
        id: 'agent-1',
        userId: 'user-1',
        name: 'Test Agent',
        type: AgentType.CHAT,
        description: 'Test description',
        config: {}, // Use JSON type or specific config type if defined
        createdAt: new Date(),
        updatedAt: new Date(),
    };
    beforeEach(async () => {
        // Reset mocks before each test
        jest.clearAllMocks();
        // Assign to the outer module variable
        module = await Test.createTestingModule({
            providers: [
                AgentsService,
                {
                    provide: DrizzleService,
                    // Use the mockDrizzle object directly
                    useValue: mockDrizzle,
                },
                {
                    provide: ConfigService,
                    useValue: { get: jest.fn().mockReturnValue('test-value') }, // Mock common config calls if needed
                },
                {
                    provide: UnifiedMonitoringService,
                    useValue: {
                        recordMetric: jest.fn(),
                        captureError: jest.fn(),
                    },
                },
                {
                    provide: AgentFactory,
                    useValue: {
                        // Mock specific methods of AgentFactory used in the service
                        getDefaultConfig: jest.fn().mockReturnValue({ default: 'config' }),
                    },
                },
            ],
        }).compile();
        service = module.get(AgentsService);
        // drizzle = module.get<DrizzleService>(DrizzleService); // Get the mocked instance if needed
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    describe('create', () => {
        it('should create a new agent', async () => {
            const dto = {
                name: 'Test Agent',
                type: AgentType.CHAT,
                description: 'Test description',
            };
            const userId = 'user-1';
            const defaultConfig = { default: 'config' }; // Match AgentFactory mock
            // Mock the AgentFactory return value for this specific test if needed, otherwise rely on beforeEach mock
            // (module.get(AgentFactory) as jest.Mocked<AgentFactory>).getDefaultConfig.mockReturnValue(defaultConfig);
            const expectedAgentData = {
                ...dto,
                userId: userId,
                config: defaultConfig,
            };
            const createdAgent = {
                ...mockAgent, // Use base mock agent
                ...expectedAgentData, // Override with DTO and userId/config
            };
            mockDrizzle.agent.create.mockResolvedValue(createdAgent);
            const result = await service.create(userId, dto);
            expect(result).toEqual(createdAgent);
            expect(mockDrizzle.agent.create).toHaveBeenCalledWith({
                data: expectedAgentData,
            });
            // Optionally check AgentFactory call
            expect(module.get(AgentFactory).getDefaultConfig).toHaveBeenCalledWith(dto.type);
        });
    });
    describe('findAll', () => {
        it('should return an array of agents for a user', async () => {
            const userId = 'user-1';
            const agents = [
                { ...mockAgent, id: 'agent-1', userId },
                { ...mockAgent, id: 'agent-2', userId, name: 'Test Agent 2' },
            ];
            mockDrizzle.agent.findMany.mockResolvedValue(agents);
            const result = await service.findAll(userId);
            expect(result).toEqual(agents);
            expect(mockDrizzle.agent.findMany).toHaveBeenCalledWith({
                where: { userId },
            });
        });
    });
    describe('findOne', () => {
        it('should return a single agent by id and userId', async () => {
            const userId = 'user-1';
            const agentId = 'agent-1';
            const agent = { ...mockAgent, id: agentId, userId };
            mockDrizzle.agent.findFirst.mockResolvedValue(agent);
            const result = await service.findOne(userId, agentId);
            expect(result).toEqual(agent);
            expect(mockDrizzle.agent.findFirst).toHaveBeenCalledWith({
                where: { id: agentId, userId },
            });
        });
        it('should return null if agent not found', async () => {
            const userId = 'user-1';
            const agentId = 'not-found-agent';
            mockDrizzle.agent.findFirst.mockResolvedValue(null);
            const result = await service.findOne(userId, agentId);
            expect(result).toBeNull();
            expect(mockDrizzle.agent.findFirst).toHaveBeenCalledWith({
                where: { id: agentId, userId },
            });
        });
    });
    describe('update', () => {
        it('should update an agent', async () => {
            const userId = 'user-1';
            const agentId = 'agent-1';
            const dto = {
                name: 'Updated Agent Name',
                description: 'Updated description',
                // Add other updatable fields from UpdateAgentDto if necessary
            };
            const updatedAgent = {
                ...mockAgent,
                id: agentId,
                userId,
                ...dto, // Apply updates
                updatedAt: new Date(), // Drizzle update returns the updated record
            };
            mockDrizzle.agent.update.mockResolvedValue(updatedAgent);
            const result = await service.update(userId, agentId, dto);
            expect(result).toEqual(updatedAgent);
            expect(mockDrizzle.agent.update).toHaveBeenCalledWith({
                where: { id: agentId, userId }, // Ensure userId is used for security/scoping
                data: dto,
            });
        });
        it('should throw an error if agent to update is not found (or handle as per service logic)', async () => {
            const userId = 'user-1';
            const agentId = 'not-found-agent';
            const dto = { name: 'Updated Name' };
            // Simulate Drizzle's behavior when update target doesn't exist (depends on Drizzle version/config)
            // Often throws a P2025 error or similar. Mock that behavior.
            mockDrizzle.agent.update.mockRejectedValue(new Error('Record to update not found.')); // Or specific Drizzle error
            await expect(service.update(userId, agentId, dto)).rejects.toThrow('Record to update not found.'); // Adjust error message if needed
            expect(mockDrizzle.agent.update).toHaveBeenCalledWith({
                where: { id: agentId, userId },
                data: dto,
            });
        });
    });
    describe('remove', () => {
        it('should remove an agent', async () => {
            const userId = 'user-1';
            const agentId = 'agent-1';
            const deletedAgent = { ...mockAgent, id: agentId, userId }; // Drizzle delete returns the deleted record
            mockDrizzle.agent.delete.mockResolvedValue(deletedAgent);
            // Assuming remove returns void or the deleted agent
            await service.remove(userId, agentId); // Or: const result = await service.remove(userId, agentId);
            // Assert delete was called correctly
            expect(mockDrizzle.agent.delete).toHaveBeenCalledWith({
                where: { id: agentId, userId }, // Ensure userId is used
            });
            // Optional: Assert the return value if service.remove returns something
            // expect(result).toEqual(deletedAgent); // If it returns the deleted agent
        });
        it('should throw an error if agent to remove is not found (or handle as per service logic)', async () => {
            const userId = 'user-1';
            const agentId = 'not-found-agent';
            // Simulate Drizzle's behavior when delete target doesn't exist
            mockDrizzle.agent.delete.mockRejectedValue(new Error('Record to delete not found.')); // Or specific Drizzle error
            await expect(service.remove(userId, agentId)).rejects.toThrow('Record to delete not found.'); // Adjust error message if needed
            expect(mockDrizzle.agent.delete).toHaveBeenCalledWith({
                where: { id: agentId, userId },
            });
        });
    });
});
// Remove the unused MockResponse interface if not needed elsewhere
// interface MockResponse {
//   data: Record<string, unknown>;
// }
//# sourceMappingURL=agents.service.spec.js.map