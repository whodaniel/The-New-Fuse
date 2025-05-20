import { RedisConfig } from './redis_config.js';
interface CascadeCapabilities {
    code_generation: boolean;
    code_review: boolean;
    code_optimization: boolean;
    architecture_review: boolean;
    dependency_analysis: boolean;
    security_audit: boolean;
    documentation: boolean;
    test_generation: boolean;
    bug_analysis: boolean;
    performance_analysis: boolean;
}
interface CascadeConfig {
    name: string;
    personality: string;
    capabilities: CascadeCapabilities;
    redis_config: RedisConfig;
    zmq_server: string;
    zmq_port: number;
}
export declare const CASCADE_CONFIG: CascadeConfig;
export {};
