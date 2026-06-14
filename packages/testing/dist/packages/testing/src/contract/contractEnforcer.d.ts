import { Type } from '@nestjs/common';
type ProtocolType = 'http' | 'websocket' | 'mcp' | 'grpc';
import { SecurityScheme } from '@the-new-fuse/types';
export interface ContractDefinition<T = any> {
    method: string;
    path: string;
    requestSchema: Type<any>;
    responseSchema: Type<any>;
    protocol: ProtocolType;
    security?: SecurityScheme;
}
export declare class ContractEnforcer {
    private contracts;
    /**
     * Register a new API contract
     */
    registerContract(name: string, contract: ContractDefinition): void;
    /**
     * Validate request against contract at runtime
     */
    validateRequest(contractName: string, requestData: any): Promise<{
        isValid: boolean;
        errors: string[];
    }>;
    /**
     * Validate response against contract at runtime
     */
    validateResponse(contractName: string, responseData: any): Promise<{
        isValid: boolean;
        errors: string[];
    }>;
    /**
     * Generate test cases for a contract
     */
    generateContractTests(contractName: string): string;
    /**
     * Create a mock endpoint based on contract
     */
    createMockEndpoint(contractName: string): jest.Mock;
}
export {};
//# sourceMappingURL=contractEnforcer.d.ts.map