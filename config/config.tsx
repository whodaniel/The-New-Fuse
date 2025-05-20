import * as dotenv from 'dotenv';
import { timedelta } from './timedelta.js'; // Assuming you'll create a timedelta.ts
import { lru_cache } from './lru_cache.js'; // Assuming you'll create a lru_cache.ts
import * as crypto from 'crypto';

dotenv.config();

class Config {
    // Flask
    SECRET_KEY: string = process.env.SECRET_KEY || 'your-secret-key-here';
    
    // Database
    SQLALCHEMY_DATABASE_URI: string = process.env.DATABASE_URL ||
        'sqlite:///instance/dashboard.db';
    SQLALCHEMY_TRACK_MODIFICATIONS: boolean = false;
    
    // Redis
    REDIS_HOST: string = process.env.REDIS_HOST || 'localhost';
    REDIS_PORT: number = parseInt(process.env.REDIS_PORT || '6379', 10);
    REDIS_DB: number = parseInt(process.env.REDIS_DB || '0', 10);
    REDIS_PASSWORD: string | undefined = process.env.REDIS_PASSWORD;
    REDIS_SSL: boolean = (process.env.REDIS_SSL || 'false').toLowerCase() === 'true';
    REDIS_TIMEOUT: number = parseInt(process.env.REDIS_TIMEOUT || '5', 10);
    
    // Security
    SESSION_TYPE: string = 'redis';
    PERMANENT_SESSION_LIFETIME: timedelta = new timedelta({ days: 1 });
    SESSION_REDIS_HOST: string = this.REDIS_HOST;
    SESSION_REDIS_PORT: number = this.REDIS_PORT;
    SESSION_REDIS_DB: number = this.REDIS_DB;
    SESSION_REDIS_PASSWORD: string | undefined = this.REDIS_PASSWORD;
    SESSION_REDIS_SSL: boolean = this.REDIS_SSL;
    
    // Rate Limiting
    RATELIMIT_STORAGE_URL: string = `redis://${this.REDIS_HOST}:${this.REDIS_PORT}/${this.REDIS_DB}`;
    RATELIMIT_STRATEGY: string = 'fixed-window';
    RATELIMIT_DEFAULT: string = "200 per day;50 per hour;10 per minute";
    
    // Encryption
    ENCRYPTION_KEY: string | Buffer = process.env.ENCRYPTION_KEY || Buffer.from(crypto.randomBytes(32));
    
    // JWT Authentication
    ACCESS_TOKEN_EXPIRE_MINUTES: number = parseInt(process.env.ACCESS_TOKEN_EXPIRE_MINUTES || '60', 10);
    REFRESH_TOKEN_EXPIRE_DAYS: number = parseInt(process.env.REFRESH_TOKEN_EXPIRE_DAYS || '7', 10);
    JWT_ALGORITHM: string = "HS256";
    
    // Email Verification
    SMTP_SERVER: string = process.env.SMTP_SERVER || 'smtp.gmail.com';
    SMTP_PORT: number = parseInt(process.env.SMTP_PORT || '587', 10);
    SMTP_USERNAME: string | undefined = process.env.SMTP_USERNAME;
    SMTP_PASSWORD: string | undefined = process.env.SMTP_PASSWORD;
    SMTP_FROM_EMAIL: string = process.env.SMTP_FROM_EMAIL || 'noreply@fuse-ai.com';
    
    // FUSE-AI Specific
    MIN_PASSWORD_LENGTH: number = 8;
    PASSWORD_REQUIRE_SPECIAL: boolean = true;
    PASSWORD_REQUIRE_NUMBERS: boolean = true;
    MAX_LOGIN_ATTEMPTS: number = 5;
    LOCKOUT_DURATION_MINUTES: number = 30;
    REQUIRE_EMAIL_VERIFICATION: boolean = true;
}

class DevelopmentConfig extends Config {
    DEBUG: boolean = true;
    TEMPLATES_AUTO_RELOAD: boolean = true;
    REQUIRE_EMAIL_VERIFICATION: boolean = false;  // Disable for development
}

class ProductionConfig extends Config {
    DEBUG: boolean = false;
    
    // Override these in production
    SECRET_KEY: string = process.env.SECRET_KEY!;
    ENCRYPTION_KEY: string | Buffer = process.env.ENCRYPTION_KEY!;
    REQUIRE_EMAIL_VERIFICATION: boolean = true;
}

const config: { [key: string]: typeof Config } = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
};

export function get_settings<T extends Config>(): T {
    const env = process.env.FLASK_ENV || 'default';
    return new config[env]() as T;
}
