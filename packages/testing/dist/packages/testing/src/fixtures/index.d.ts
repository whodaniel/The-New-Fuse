/**
 * Test Fixtures
 *
 * Common test data and fixtures for use across the monorepo.
 */
/**
 * User fixtures
 */
export declare const createUserFixture: (overrides?: Partial<any>) => {
    id: string;
    email: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
};
/**
 * Agent fixtures
 */
export declare const createAgentFixture: (overrides?: Partial<any>) => {
    id: string;
    name: string;
    type: string;
    status: string;
    capabilities: string[];
    createdAt: Date;
    updatedAt: Date;
};
/**
 * Workflow fixtures
 */
export declare const createWorkflowFixture: (overrides?: Partial<any>) => {
    id: string;
    name: string;
    description: string;
    nodes: never[];
    edges: never[];
    status: string;
    createdAt: Date;
    updatedAt: Date;
};
/**
 * Message fixtures
 */
export declare const createMessageFixture: (overrides?: Partial<any>) => {
    id: string;
    content: string;
    role: string;
    timestamp: Date;
};
/**
 * API Response fixtures
 */
export declare const createApiResponseFixture: <T>(data: T, overrides?: Partial<any>) => {
    success: boolean;
    data: T;
    message: string;
    timestamp: string;
};
/**
 * Error fixtures
 */
export declare const createErrorFixture: (overrides?: Partial<any>) => {
    success: boolean;
    error: {
        code: string;
        message: string;
        details: {};
    };
    timestamp: string;
};
/**
 * Pagination fixtures
 */
export declare const createPaginationFixture: (overrides?: Partial<any>) => {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
};
/**
 * Create array of fixtures
 */
export declare function createFixtureArray<T>(fixtureFactory: (overrides?: any) => T, count: number, overrides?: Partial<T>): T[];
//# sourceMappingURL=index.d.ts.map