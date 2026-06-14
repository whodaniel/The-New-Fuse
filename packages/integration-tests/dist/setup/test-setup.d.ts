/**
 * Test Environment Setup
 *
 * Provides a comprehensive test environment for integration tests
 * Includes mocked services and utilities for testing
 */
import { Logger, HeartbeatMonitoringService, MasterAgentRegistry } from '@the-new-fuse/relay-core';
export interface TestEnvironment {
    logger: Logger;
    drizzle: any;
    agentRegistry: MasterAgentRegistry;
    heartbeatService: HeartbeatMonitoringService;
    workflowEngine: any;
    extensionManager: any;
    testDataDir: string;
    cleanup: () => Promise<void>;
}
export interface TestHelpersInterface {
    createTestAgent(name: string, type?: string): Promise<{
        createdAt: Date;
        updatedAt: Date;
        name: string;
        type: string;
        status: string;
        userId: string;
        platform: "integrated";
        location: string;
        description: string;
        systemPrompt: string;
        capabilities: any;
        metadata: any;
        agentId: string;
    }>;
    createTestWorkflow(name: string, description?: string): Promise<any>;
    createTestExtension(name: string, type?: string): Promise<any>;
    waitForCondition(condition: () => Promise<boolean> | boolean, timeoutMs?: number, intervalMs?: number): Promise<void>;
    generateTestData(size?: number): any[];
}
/**
 * Get or setup comprehensive test environment
 */
export declare function getTestEnvironment(): Promise<TestEnvironment>;
export declare function setupTestEnvironment(): Promise<TestEnvironment>;
/**
 * Cleanup test environment
 */
export declare function cleanupTestEnvironment(): Promise<void>;
export declare const TestHelpers: TestHelpersInterface;
//# sourceMappingURL=test-setup.d.ts.map