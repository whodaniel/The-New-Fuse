import { Page } from '@playwright/test';
export interface TestWorkflow {
    id: string;
    name: string;
    nodes: any[];
    edges: any[];
}
export declare class TestHelpers {
    private page;
    constructor(page: Page);
    createTestWorkflowData(options?: {
        name?: string;
        nodeCount?: number;
        status?: 'active' | 'completed' | 'failed';
    }): Promise<TestWorkflow>;
    cleanupTestData(): Promise<void>;
    createTestUser(options?: {
        username?: string;
        email?: string;
        isAdmin?: boolean;
    }): Promise<any>;
    setTestEnvironment(): Promise<void>;
    resetTestEnvironment(): Promise<void>;
}
//# sourceMappingURL=test-helpers.d.ts.map