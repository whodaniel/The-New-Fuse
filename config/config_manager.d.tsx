export declare class ConfigurationManager {
    private static _instance;
    private _config;
    private constructor();
    static getInstance(): ConfigurationManager;
    private _initialize;
    private _setupLogging;
    private _validateConfiguration;
    get<T>(key: string): T;
    getAll(): {
        [key: string]: any;
    };
}
