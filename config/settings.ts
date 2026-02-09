/**
 * Application configuration settings.
 */
import * as path from 'path';
import * as crypto from 'crypto';
import { timedelta } from './timedelta.js';

class BaseConfig {
    /**
     * Base configuration.
     */
    // Application
    static SECRET_KEY: string | Buffer = process.env.SECRET_KEY || crypto.randomBytes(32);
    static DEBUG: boolean = false;
    static TESTING: boolean = false;
    
    // Security
    static SESSION_COOKIE_SECURE: boolean = true;
    static SESSION_COOKIE_HTTPONLY: boolean = true;
    static SESSION_COOKIE_SAMESITE: string = 'Lax';
    static PERMANENT_SESSION_LIFETIME: timedelta = new timedelta({ minutes: 30 });
    static MAX_CONTENT_LENGTH: number = 10 * 1024 * 1024;  // 10MB max request size
    
    // Database
    static SQLALCHEMY_TRACK_MODIFICATIONS: boolean = false;
    
    // Redis
    static REDIS_HOST: string = process.env.REDIS_HOST || 'localhost';
    static REDIS_PORT: number = parseInt(process.env.REDIS_PORT || '6379', 10);
    static REDIS_DB: number = parseInt(process.env.REDIS_DB || '0', 10);
    static REDIS_PASSWORD: string | undefined = process.env.REDIS_PASSWORD;
    
    // Rate Limiting
    static RATELIMIT_DEFAULT: string = "200 per day;50 per hour";
    static RATELIMIT_STORAGE_URL: string = "memory://";
    
    // Encryption
    static ENCRYPTION_KEY: string | undefined = process.env.ENCRYPTION_KEY;
    
    // Templates
    static TEMPLATES_AUTO_RELOAD: boolean = true;
}

class DevelopmentConfig extends BaseConfig {
    /**
     * Development configuration.
     */
    static DEBUG: boolean = true;
    static INSTANCE_PATH: string = path.resolve(__dirname, '..', 'instance');
    static SQLALCHEMY_DATABASE_URI: string = `sqlite://${path.join(this.INSTANCE_PATH, "dashboard.db")}`;
    static DATABASE_URL: string = this.SQLALCHEMY_DATABASE_URI;
    
    // Override security settings for development
    static SESSION_COOKIE_SECURE: boolean = false;
    static SESSION_COOKIE_HTTPONLY: boolean = false;
}

class TestingConfig extends BaseConfig {
    /**
     * Testing configuration.
     */
    static TESTING: boolean = true;
    static DEBUG: boolean = true;
    static SQLALCHEMY_DATABASE_URI: string = 'sqlite:///:memory:';
    static DATABASE_URL: string = this.SQLALCHEMY_DATABASE_URI;
    static REDIS_DB: number = 1;  // Use a different Redis DB for testing
    static RATELIMIT_ENABLED: boolean = false;
}

class ProductionConfig extends BaseConfig {
    /**
     * Production configuration.
     */
    static SQLALCHEMY_DATABASE_URI: string = process.env.DATABASE_URL || 'sqlite:///instance/dashboard.db';
    static DATABASE_URL: string = this.SQLALCHEMY_DATABASE_URI;
    static REDIS_PASSWORD: string | undefined = process.env.REDIS_PASSWORD;
    static SESSION_COOKIE_SECURE: boolean = true;
    static PERMANENT_SESSION_LIFETIME: timedelta = new timedelta({ hours: 1 });
    static RATELIMIT_DEFAULT: string = "100 per day;20 per hour";
    static RATELIMIT_STORAGE_URL: string = process.env.REDIS_URL || "memory://";
}

type ConfigClass = typeof BaseConfig;

// Required environment variables
const REQUIRED_ENV_VARS: { [key: string]: string[] } = {
    'production': [
        'SECRET_KEY',
        'DATABASE_URL',
        'REDIS_PASSWORD',
        'ENCRYPTION_KEY'
    ],
    'development': [],
    'testing': []
};

/**
 * Get the appropriate configuration based on environment.
 */
export function getConfig(): ConfigClass {
    const env = process.env.NODE_ENV || 'development';
    const configs: { [key: string]: ConfigClass } = {
        'development': DevelopmentConfig,
        'testing': TestingConfig,
        'production': ProductionConfig
    };
    return configs[env] || DevelopmentConfig;
}

/**
 * Validate that all required environment variables are set.
 */
export function validateConfig(config: ConfigClass): void {
    const env = process.env.NODE_ENV || 'development';
    const requiredVars = REQUIRED_ENV_VARS[env] || [];
    
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
        throw new Error(
            `Missing required environment variables for ${env} environment: ` +
            missingVars.join(', ')
        );
    }
}

// Validate configuration
validateConfig(getConfig());
