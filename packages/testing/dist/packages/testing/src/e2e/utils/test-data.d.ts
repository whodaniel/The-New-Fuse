import { Page } from '@playwright/test';
export interface TestUser {
    id: string;
    username: string;
    password: string;
    email: string;
}
export declare class TestDataManager {
    private page;
    private users;
    constructor(page: Page);
    createTestUser(): Promise<TestUser>;
    createTestWorkflow(name: string): Promise<string>;
    cleanup(): Promise<void>;
}
//# sourceMappingURL=test-data.d.ts.map