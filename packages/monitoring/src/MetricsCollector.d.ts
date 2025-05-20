import { Logger } from 'winston';
export declare class MetricsCollector {
    private logger;
    private registry;
    private activeAgents;
    private activePipelines;
    private taskCounter;
    private errorCounter;
    constructor(logger: Logger);
}
