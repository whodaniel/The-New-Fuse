"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CASCADE_CONFIG = void 0;
import redis_config_1 from './redis_config.js';
exports.CASCADE_CONFIG = {
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
    redis_config: new redis_config_1.RedisConfig({
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
//# sourceMappingURL=cascade_agent_config.js.map