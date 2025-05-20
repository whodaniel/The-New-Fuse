import { Test } from '@nestjs/testing';
import { ContractEnforcer, ContractDefinition } from '../contractEnforcer.js';
import { SchemaValidator } from '../schemaValidator.js';
import { TestUtils } from '../testUtils.js';
import { CreateAgentDto, Agent, AgentType } from '@the-new-fuse/types'; // Corrected import path (assuming types are here)
import { ProtocolType, SecurityScheme } from '@the-new-fuse/database'; // Corrected import path

describe('Agent API Contract Tests', () => {
  let contractEnforcer: ContractEnforcer;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [ContractEnforcer, SchemaValidator],
    }).compile();

    contractEnforcer = moduleRef.get<ContractEnforcer>(ContractEnforcer);

    // Register the create agent contract
    const createAgentContract: ContractDefinition<Agent> = {
      method: 'POST',
      path: '/api/agents',
      requestSchema: CreateAgentDto,
      responseSchema: Agent,
      protocol: ProtocolType.REST,
      security: SecurityScheme.JWT
    };

    contractEnforcer.registerContract('createAgent', createAgentContract);
  });

  describe('Create Agent Contract', () => {
    it('should validate valid create agent request', async () => {
      const validRequest: CreateAgentDto = {
        name: 'Test Agent',
        type: AgentType.BASE,
        config: { key: 'value' },
        description: 'Test agent description'
      };

      const result = await contractEnforcer.validateRequest('createAgent', validRequest);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid create agent request', async () => {
      const invalidRequest = {
        // Missing required 'name' field
        type: AgentType.BASE
      };

      const result = await contractEnforcer.validateRequest('createAgent', invalidRequest);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
    });

    it('should validate valid agent response', async () => {
      const validResponse: Agent = {
        id: '123',
        name: 'Test Agent',
        type: AgentType.BASE,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const result = await contractEnforcer.validateResponse('createAgent', validResponse);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    // Test mock data generation and validation (assuming TestUtils is set up)
    it('should generate mock Agent data that conforms to the Agent schema', async () => { // Made async
      // Arrange: Generate mock data using TestUtils
      // Ensure TestUtils.generateMockData is implemented correctly based on the schema/DTO
      const mockAgent = testUtils.generateMockData<Agent>(Agent); // Pass the class/schema

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
      expect(mockAgent.updatedAt).toBeDefined();

      // Assert: The generated mock data should pass schema validation
      expect(result.isValid).toBe(true); // Check validation result
      expect(result.errors).toBeNull(); // Ensure no validation errors
    });
  });

  // Add more describe blocks for other agent-related contracts (e.g., GET /agents, GET /agents/:id, PUT /agents/:id, DELETE /agents/:id)
});