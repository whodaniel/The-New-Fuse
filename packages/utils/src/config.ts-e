export interface Config {
    redis: {
        host: string;
        port: number;
        password?: string;
        db?: number;
    };
    logger: {
        level: string;
        format: string;
    };
}

export function loadConfig(): Config {
    return {
        redis: {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379', 10),
            password: process.env.REDIS_PASSWORD,
            db: parseInt(process.env.REDIS_DB || '0', 10),
        },
        logger: {
            level: process.env.LOG_LEVEL || 'info',
            format: process.env.LOG_FORMAT || 'json',
        },
    };
}
