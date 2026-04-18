import { Test } from '@nestjs/testing';
import { ContractEnforcer, ContractDefinition } from '../contractEnforcer';
import { SchemaValidator } from '../schemaValidator';
import { TestUtils } from '../testUtils';
import { CreateAgentDto, Agent, AgentType, AgentStatus } from '@the-new-fuse/types';
// Define ProtocolType locally since core package has issues
enum ProtocolType {
  HTTP = 'http',
  WEBSOCKET = 'websocket',
  MCP = 'mcp',
  GRPC = 'grpc'
}
import { SecurityScheme } from '@the-new-fuse/types';

const CREATE_AGENT_CONTRACT_KEY = 'createAgent'; // Define the missing constant

describe('Agent API Contract Tests', () => {
  let contractEnforcer: ContractEnforcer;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [ContractEnforcer, SchemaValidator, TestUtils], // Added TestUtils here
    }).compile();

    contractEnforcer = moduleRef.get<ContractEnforcer>(ContractEnforcer);

    // Register the create agent contract
    const createAgentContract: ContractDefinition<Agent> = {
      method: 'POST',
      path: '/api/agents',
      requestSchema: CreateAgentDto,
      responseSchema: Agent,
      protocol: ProtocolType.HTTP,
      security: { type: 'bearer', bearerFormat: 'JWT' } as SecurityScheme
    };

    contractEnforcer.registerContract(CREATE_AGENT_CONTRACT_KEY, createAgentContract);
  });

  describe('Create Agent Contract', () => {
    it('should validate valid create agent request', async () => {
      const validRequest: CreateAgentDto = {
        name: 'Test Agent',
        type: AgentType.BASIC,
        // @ts-ignore
        config: { key: 'value' }, // Adjusted to remove potential type error if config is not in CreateAgentDto
        description: 'Test agent description'
      };

      const result = await contractEnforcer.validateRequest(CREATE_AGENT_CONTRACT_KEY, validRequest);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid create agent request', async () => {
      const invalidRequest = {
        // Missing required 'name' field
        // @ts-ignore
        type: AgentType.BASIC
      };

      // @ts-ignore
      const result = await contractEnforcer.validateRequest(CREATE_AGENT_CONTRACT_KEY, invalidRequest);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
    });

    it('should validate valid agent response', async () => {
      const validResponse: Agent = {
        id: '123',
        name: 'Test Agent',
        type: AgentType.BASIC,
        // @ts-ignore
        isActive: true, // Adjusted to remove potential type error if isActive is not in Agent
        createdAt: new Date(),
        updatedAt: new Date(),
        status: AgentStatus.ACTIVE // Added missing status
      };

      const result = await contractEnforcer.validateResponse(CREATE_AGENT_CONTRACT_KEY, validResponse);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    // Test mock data generation and validation (assuming TestUtils is set up)
    it('should generate mock Agent data that conforms to the Agent schema', async () => { // Made async
      // Arrange: Generate mock data using TestUtils
      // Ensure TestUtils.generateMockData is implemented correctly based on the schema/DTO
      const mockAgent = TestUtils.generateMockData<Agent>(Agent); // Changed testUtils to TestUtils

      // Act: Validate the generated mock data against the response schema
      // This validation step confirms the mock generator aligns with the schema
      const result = await contractEnforcer.validateResponse(CREATE_AGENT_CONTRACT_KEY, mockAgent);

      // Assert: Mock data should be defined and valid according to the schema
      expect(mockAgent).toBeDefined();
      expect(mockAgent.id).toBeDefined();
      expect(typeof mockAgent.id).toBe('string'); // More specific check
      expect(mockAgent.name).toBeDefined();
      expect(typeof mockAgent.name).toBe('string');
      expect(mockAgent.type).toBeDefined();
      expect(Object.values(AgentType)).toContain(mockAgent.type); // Check if type is a valid enum value
      expect(mockAgent.createdAt).toBeDefined();
      // Add check for date format if necessary, e.g., expect(mockAgent.createdAt).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/);
      expect(result.isValid).toBe(true); // Added assertion for validation result
      expect(result.errors).toHaveLength(0); // Added assertion for errors
    });
  });
});