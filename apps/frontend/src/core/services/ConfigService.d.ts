export declare class ConfigService {
    constructor();
    static getInstance(): any;
    initialize(): Promise<{
        success: boolean;
        data: undefined;
        error?: undefined;
    } | {
        success: boolean;
        error: {
            code: string;
            message: string;
            details: unknown;
        };
        data?: undefined;
    }>;
    validateConfig(config: any): {
        apiUrl: any;
        wsUrl: any;
        environment: any;
        version: any;
        features: any;
        settings: any;
    };
    getConfig(): any;
    isFeatureEnabled(featureKey: any): any;
    getSetting(key: any, defaultValue: any): any;
    updateSetting(key: any, value: any): Promise<{
        success: boolean;
        data: undefined;
        error?: undefined;
    } | {
        success: boolean;
        error: {
            code: string;
            message: string;
            details: unknown;
        };
        data?: undefined;
    }>;
    isDevelopment(): boolean;
    isStaging(): boolean;
    isProduction(): boolean;
    getVersion(): any;
    subscribeToConfig(callback: any): any;
    subscribeToSetting(key: any, callback: any): any;
}
