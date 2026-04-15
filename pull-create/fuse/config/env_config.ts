/**
 * Environment-specific configuration classes.
 */
import * as crypto from 'crypto';

export class BaseConfig {
    /**
     * Base configuration.
     */
    static DEBUG: boolean = false;
    static TESTING: boolean = false;
    static LOG_LEVEL: string = 'INFO';
    static LOG_FORMAT: string = '%(asctime)s - %(name)s - %(levelname)s - %(message)s';
    static SECRET_KEY: string = process.env.SECRET_KEY || crypto.randomBytes(32).toString('hex');
}

export class ProductionConfig extends BaseConfig {
    /**
     * Production configuration.
     */
    static LOG_LEVEL: string = 'INFO';
    static LOG_FORMAT: string = '%(asctime)s - %(name)s - %(levelname)s - %(message)s';
    static REDIS_HOST: string = process.env.REDIS_HOST || 'redis';
    static REDIS_PORT: number = parseInt(process.env.REDIS_PORT || '6379', 10);
    static REDIS_DB: number = parseInt(process.env.REDIS_DB || '0', 10);
}

export class DevelopmentConfig extends BaseConfig {
    /**
     * Development configuration.
     */
    static DEBUG: boolean = true;
    static LOG_LEVEL: string = 'DEBUG';
    static LOG_FORMAT: string = '%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s';
    static REDIS_HOST: string = process.env.REDIS_HOST || 'localhost';
    static REDIS_PORT: number = parseInt(process.env.REDIS_PORT || '6379', 10);
    static REDIS_DB: number = parseInt(process.env.REDIS_DB || '0', 10);
}

export class TestingConfig extends BaseConfig {
    /**
     * Testing configuration.
     */
    static TESTING: boolean = true;
    static DEBUG: boolean = true;
    static LOG_LEVEL: string = 'DEBUG';
    static LOG_FORMAT: string = '%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s';
    static REDIS_HOST: string = process.env.TEST_REDIS_HOST || 'localhost';
    static REDIS_PORT: number = parseInt(process.env.TEST_REDIS_PORT || '6379', 10);
    static REDIS_DB: number = parseInt(process.env.TEST_REDIS_DB || '1', 10);
    static SECRET_KEY: string = 'test-secret-key';  // Fixed key for testing
}

type ConfigClass = typeof BaseConfig;

export function getConfig(env?: string): ConfigClass {
    /**
     * Get configuration based on environment.
     */
    env = env || process.env.FLASK_ENV || 'development';
    const configs: { [key: string]: ConfigClass } = {
        'development': DevelopmentConfig,
        'production': ProductionConfig,
        'testing': TestingConfig
    };
    return configs[env] || DevelopmentConfig;
}
