interface TestConfig {
    [key: string]: unknown;
}
export declare class E2ETestFramework {
    private config;
    private agentTestRunner;
    constructor(config: TestConfig);
    setupEnvironment(): Promise<void>;
}
export {};
//# sourceMappingURL=setup.d.ts.map