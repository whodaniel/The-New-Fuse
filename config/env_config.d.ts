export declare class BaseConfig {
    static DEBUG: boolean;
    static TESTING: boolean;
    static LOG_LEVEL: string;
    static LOG_FORMAT: string;
    static SECRET_KEY: string;
}
export declare class ProductionConfig extends BaseConfig {
    static LOG_LEVEL: string;
    static LOG_FORMAT: string;
    static REDIS_HOST: string;
    static REDIS_PORT: number;
    static REDIS_DB: number;
}
export declare class DevelopmentConfig extends BaseConfig {
    static DEBUG: boolean;
    static LOG_LEVEL: string;
    static LOG_FORMAT: string;
    static REDIS_HOST: string;
    static REDIS_PORT: number;
    static REDIS_DB: number;
}
export declare class TestingConfig extends BaseConfig {
    static TESTING: boolean;
    static DEBUG: boolean;
    static LOG_LEVEL: string;
    static LOG_FORMAT: string;
    static REDIS_HOST: string;
    static REDIS_PORT: number;
    static REDIS_DB: number;
    static SECRET_KEY: string;
}
type ConfigClass = typeof BaseConfig;
export declare function getConfig(env?: string): ConfigClass;
export {};
