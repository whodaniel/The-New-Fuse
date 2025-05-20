import { TestConfig } from '@the-new-fuse/testing';
export declare class E2ETestFramework {
    private config;
    constructor(config: TestConfig);
    setupEnvironment(): Promise<void>;
}
