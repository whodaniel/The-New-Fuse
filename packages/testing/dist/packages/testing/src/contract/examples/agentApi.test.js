"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const contractEnforcer_1 = require("../contractEnforcer");
const schemaValidator_1 = require("../schemaValidator");
const testUtils_1 = require("../testUtils");
const types_1 = require("@the-new-fuse/types");
// Define ProtocolType locally since core package has issues
var ProtocolType;
(function (ProtocolType) {
    ProtocolType["HTTP"] = "http";
    ProtocolType["WEBSOCKET"] = "websocket";
    ProtocolType["MCP"] = "mcp";
    ProtocolType["GRPC"] = "grpc";
})(ProtocolType || (ProtocolType = {}));
const CREATE_AGENT_CONTRACT_KEY = 'createAgent'; // Define the missing constant
describe('Agent API Contract Tests', () => {
    let contractEnforcer;
    beforeEach(async () => {
        const moduleRef = await testing_1.Test.createTestingModule({
            providers: [contractEnforcer_1.ContractEnforcer, schemaValidator_1.SchemaValidator, testUtils_1.TestUtils], // Added TestUtils here
        }).compile();
        contractEnforcer = moduleRef.get(contractEnforcer_1.ContractEnforcer);
        // Register the create agent contract
        const createAgentContract = {
            method: 'POST',
            path: '/api/agents',
            requestSchema: types_1.CreateAgentDto,
            responseSchema: types_1.Agent,
            protocol: ProtocolType.HTTP,
            security: { type: 'bearer', bearerFormat: 'JWT' }
        };
        contractEnforcer.registerContract(CREATE_AGENT_CONTRACT_KEY, createAgentContract);
    });
    describe('Create Agent Contract', () => {
        it('should validate valid create agent request', async () => {
            const validRequest = {
                name: 'Test Agent',
                type: types_1.AgentType.BASIC,
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
                type: types_1.AgentType.BASIC
            };
            // @ts-ignore
            const result = await contractEnforcer.validateRequest(CREATE_AGENT_CONTRACT_KEY, invalidRequest);
            expect(result.isValid).toBe(false);
            expect(result.errors).toHaveLength(1);
        });
        it('should validate valid agent response', async () => {
            const validResponse = {
                id: '123',
                name: 'Test Agent',
                type: types_1.AgentType.BASIC,
                // @ts-ignore
                isActive: true, // Adjusted to remove potential type error if isActive is not in Agent
                createdAt: new Date(),
                updatedAt: new Date(),
                status: types_1.AgentStatus.ACTIVE // Added missing status
            };
            const result = await contractEnforcer.validateResponse(CREATE_AGENT_CONTRACT_KEY, validResponse);
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });
        // Test mock data generation and validation (assuming TestUtils is set up)
        it('should generate mock Agent data that conforms to the Agent schema', async () => {
            // Arrange: Generate mock data using TestUtils
            // Ensure TestUtils.generateMockData is implemented correctly based on the schema/DTO
            const mockAgent = testUtils_1.TestUtils.generateMockData(types_1.Agent); // Changed testUtils to TestUtils
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
            expect(Object.values(types_1.AgentType)).toContain(mockAgent.type); // Check if type is a valid enum value
            expect(mockAgent.createdAt).toBeDefined();
            // Add check for date format if necessary, e.g., expect(mockAgent.createdAt).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/);
            expect(result.isValid).toBe(true); // Added assertion for validation result
            expect(result.errors).toHaveLength(0); // Added assertion for errors
        });
    });
});
//# sourceMappingURL=agentApi.test.js.map