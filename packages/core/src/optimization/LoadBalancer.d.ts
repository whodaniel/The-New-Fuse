import { Logger } from '../logging/LoggingService.js';
import { ResourceManager } from './ResourceManager.js';
export interface Node {
    id: string;
    host: string;
    port: number;
    weight: number;
    healthy: boolean;
    lastChecked: number;
    metrics: {
        responseTime: number;
        errorRate: number;
        activeConnections: number;
    };
}
export interface BalancingStrategy {
    name: round-robin' | 'least-connections' | 'weighted-random' | 'response-time';
    config?: unknown;
}
export declare class LoadBalancer {
    private readonly resourceManager;
    private nodes;
    number: number;
    private strategy;
    private logger;
    constructor(resourceManager: ResourceManager, strategy: BalancingStrategy, logger: Logger);
}
