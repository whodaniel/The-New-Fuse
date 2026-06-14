"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContractEnforcer = void 0;
const schemaValidator_1 = require("./schemaValidator");
class ContractEnforcer {
    constructor() {
        this.contracts = new Map(); // Use <any> here
    }
    /**
     * Register a new API contract
     */
    registerContract(name, contract) {
        this.contracts.set(name, contract);
    }
    /**
     * Validate request against contract at runtime
     */
    async validateRequest(contractName, requestData) {
        const contract = this.contracts.get(contractName);
        if (!contract) {
            return { isValid: false, errors: [`Contract ${contractName} not found`] };
        }
        return schemaValidator_1.SchemaValidator.validateSchema(contract.requestSchema, requestData);
    }
    /**
     * Validate response against contract at runtime
     */
    async validateResponse(contractName, responseData) {
        const contract = this.contracts.get(contractName);
        if (!contract) {
            return { isValid: false, errors: [`Contract ${contractName} not found`] };
        }
        return schemaValidator_1.SchemaValidator.validateSchema(contract.responseSchema, responseData);
    }
    /**
     * Generate test cases for a contract
     */
    generateContractTests(contractName) {
        const contract = this.contracts.get(contractName);
        if (!contract) {
            throw new Error(`Contract ${contractName} not found`);
        }
        return `
import { Test } from '@nestjs/testing';
import { ${contract.requestSchema.name}, ${contract.responseSchema.name} } from './types';
import { SchemaValidator } from './schemaValidator';

describe('${contractName} Contract Tests', () => {
  let validator: SchemaValidator;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [SchemaValidator],
    }).compile();

    validator = moduleRef.get<SchemaValidator>(SchemaValidator);
  });

  describe('Request Validation', () => {
    it('should validate valid request', async () => {
      // TODO: Add valid request test case
    });

    it('should reject invalid request', async () => {
      // TODO: Add invalid request test case
    });
  });

  describe('Response Validation', () => {
    it('should validate valid response', async () => {
      // TODO: Add valid response test case
    });

    it('should reject invalid response', async () => {
      // TODO: Add invalid response test case
    });
  });
});
`;
    }
    /**
     * Create a mock endpoint based on contract
     */
    createMockEndpoint(contractName) {
        const contract = this.contracts.get(contractName);
        if (!contract) {
            throw new Error(`Contract ${contractName} not found`);
        }
        return jest.fn().mockImplementation(async (req) => {
            const { isValid, errors } = await this.validateRequest(contractName, req);
            if (!isValid) {
                throw new Error(`Invalid request: ${errors.join(', ')}`);
            }
            // Return a mock response that matches the response schema
            return {}; // TODO: Generate mock data based on responseSchema
        });
    }
}
exports.ContractEnforcer = ContractEnforcer;
//# sourceMappingURL=contractEnforcer.js.map