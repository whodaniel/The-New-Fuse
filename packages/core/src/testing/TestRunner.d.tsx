import { Logger } from 'winston';
export declare class TestRunner {
    private readonly logger;
    private suites;
    constructor(logger: Logger);
    registerSuite(): Promise<void>;
}
