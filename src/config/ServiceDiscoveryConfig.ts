import { registerAs } from '@nestjs/config';

export interface ServiceDiscoveryOptions {
    discoveryMethod: 'consul' | 'etcd' | 'kubernetes';
    serviceName: string;
    namespace: string;
    ttl: number;
    healthCheck: {
        interval: number;
        timeout: number;
        path: string;
    };
}

export default registerAs('serviceDiscovery', () => ({
    discoveryMethod: process.env.DISCOVERY_METHOD || 'kubernetes',
    serviceName: process.env.SERVICE_NAME || 'a2a-agent',
    namespace: process.env.SERVICE_NAMESPACE || 'default',
    ttl: parseInt(process.env.SERVICE_TTL, 10) || 30,
    healthCheck: {
        interval: parseInt(process.env.HEALTH_CHECK_INTERVAL, 10) || 10,
        timeout: parseInt(process.env.HEALTH_CHECK_TIMEOUT, 10) || 5,
        path: process.env.HEALTH_CHECK_PATH || '/health'
    }
}));