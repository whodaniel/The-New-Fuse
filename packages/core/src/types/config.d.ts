export interface ConfigOptions {
    port: number;
    databaseUrl: string;
    redisUrl: string;
    jwtSecret: string;
    environment: string;
}
export interface DatabaseConfig {
    url: string;
    type: postgres' | 'mysql' | 'sqlite';
    synchronize: boolean;
    logging: boolean;
}
export interface RedisConfig {
    url: string;
    ttl: number;
    prefix: string;
    aiChannel: string;
}
export interface SecurityConfig {
    jwtSecret: string;
    jwtExpiresIn: string;
    bcryptSaltRounds: number;
    aiCommSecret: string;
}
export interface LoggingConfig {
    level: string;
    format: string;
    directory: string;
}
export interface MonitoringConfig {
    enabled: boolean;
    interval: number;
    metrics: {
        enabled: boolean;
        path: string;
    };
    alerts: {
        enabled: boolean;
        threshold: number;
    };
}
