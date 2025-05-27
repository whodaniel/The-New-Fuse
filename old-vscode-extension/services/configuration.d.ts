import * as vscode from 'vscode';
export declare class ConfigurationService {
    private static instance;
    private logger;
    private config;
    private constructor();
    static getInstance(): ConfigurationService;
    getSetting<T>(key: string, defaultValue?: T): T;
    updateSetting<T>(key: string, value: T, target?: vscode.ConfigurationTarget): Promise<void>;
    getDefaultSettings(): Record<string, any>;
    initialize(): Promise<void>;
    dispose(): void;
}
//# sourceMappingURL=configuration.d.ts.map