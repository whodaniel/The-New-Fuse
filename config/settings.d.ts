import { timedelta } from './timedelta.js';
declare class BaseConfig {
    static SECRET_KEY: string | Buffer;
    static DEBUG: boolean;
    static TESTING: boolean;
    static SESSION_COOKIE_SECURE: boolean;
    static SESSION_COOKIE_HTTPONLY: boolean;
    static SESSION_COOKIE_SAMESITE: string;
    static PERMANENT_SESSION_LIFETIME: timedelta;
    static MAX_CONTENT_LENGTH: number;
    static SQLALCHEMY_TRACK_MODIFICATIONS: boolean;
    static REDIS_HOST: string;
    static REDIS_PORT: number;
    static REDIS_DB: number;
    static REDIS_PASSWORD: string | undefined;
    static RATELIMIT_DEFAULT: string;
    static RATELIMIT_STORAGE_URL: string;
    static ENCRYPTION_KEY: string | undefined;
    static TEMPLATES_AUTO_RELOAD: boolean;
}
type ConfigClass = typeof BaseConfig;
export declare function getConfig(): ConfigClass;
export declare function validateConfig(config: ConfigClass): void;
export {};
