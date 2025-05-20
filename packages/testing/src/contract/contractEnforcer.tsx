import { Type } from '@nestjs/common';
import { SchemaValidator } from './schemaValidator.js';
// Correct the import path for ApiEnums
import { ProtocolType, SecurityScheme } from '@the-new-fuse/database'; // Corrected import path

export interface ContractDefinition<T> {
  method: string;
  path: string;
  requestSchema: Type<any>;
  responseSchema: Type<any>;
  protocol: ProtocolType;
  security?: SecurityScheme;
}

export class ContractEnforcer {
  private contracts: Map<string, ContractDefinition<any>> = new Map();

  /**
   * Register a new API contract
   */
  registerContract(name: string, contract: ContractDefinition): void { // Ensure <T> is removed
    this.contracts.set(name, contract);
  }

  /**
   * Validate request against contract at runtime
   */
  async validateRequest(contractName: string, requestData: any): Promise<{ isValid: boolean; errors: string[] }> {
    const contract = this.contracts.get(contractName);
    if (!contract) {
      return { isValid: false, errors: [`Contract ${contractName} not found`] };
    }

    return SchemaValidator.validateSchema(contract.requestSchema, requestData);
  }

  /**
   * Validate response against contract at runtime
   */
  async validateResponse(contractName: string, responseData: any): Promise<{ isValid: boolean; errors: string[] }> {
    const contract = this.contracts.get(contractName);
    if (!contract) {
      return { isValid: false, errors: [`Contract ${contractName} not found`] };
    }

    return SchemaValidator.validateSchema(contract.responseSchema, responseData);
  }

  /**
   * Generate test cases for a contract
   */
  generateContractTests(contractName: string): string {
    const contract = this.contracts.get(contractName);
    if (!contract) {
      throw new Error(`Contract ${contractName} not found`);
    }

    return `
import { Test } from '@nestjs/testing';
import { ${contract.requestSchema.name}, ${contract.responseSchema.name} } from './types.js';
import { SchemaValidator } from './schemaValidator.js';

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
  createMockEndpoint(contractName: string): jest.Mock {
    const contract = this.contracts.get(contractName);
    if (!contract) {
      throw new Error(`Contract ${contractName} not found`);
    }

    return jest.fn().mockImplementation(async (req: any) => {
      const { isValid, errors } = await this.validateRequest(contractName, req);
      if (!isValid) {
        throw new Error(`Invalid request: ${errors.join(', ')}`);
      }

      // Return a mock response that matches the response schema
      return {};  // TODO: Generate mock data based on responseSchema
    });
  }
}