/**
 * Configuration for Cascade AI agent.
 */

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

export const CASCADE_CONFIG: CascadeConfig = {
    name: "Cascade",
    personality: "Collaborative and analytical AI development assistant",
    capabilities: {
        code_generation: true,
        code_review: true,
        code_optimization: true,
        architecture_review: true,
        dependency_analysis: true,
        security_audit: true,
        documentation: true,
        test_generation: true,
        bug_analysis: true,
        performance_analysis: true
    },
    redis_config: new RedisConfig({
        host: "localhost",
        port: 6379,
        password: undefined,
        db: 0,
        use_cluster: false,
        cluster_nodes: undefined,
        max_connections: 10,
        socket_timeout: 5,
        socket_connect_timeout: 5,
        retry_on_timeout: true,
        decode_responses: true
    }),
    zmq_server: "localhost",
    zmq_port: 5555
};
