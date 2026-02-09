export declare class BaseConfig {
    static PROJECT_ROOT: string;
    static SRC_DIR: string;
    static AGENCY_HUB_PORT: number;
    static CASCADE_BRIDGE_PORT: number;
    static CLINE_BRIDGE_PORT: number;
    static REDIS_HOST: string;
    static REDIS_PORT: number;
    static REDIS_DB: number;
    static REDIS_PASSWORD: string | undefined;
    static LOG_LEVEL: string;
    static LOG_FORMAT: string;
    static SECRET_KEY: string;
    static asDict(): {
        [key: string]: any;
    };
}
