import * as vscode from 'vscode';
import { ExtensionLogger, getLogger } from './logging.js';

export interface ExtensionConfig {
    relayServerPort: number;
    fileProtocolDir: string;
    enableChromeIntegration: boolean;
    enableLogging: boolean;
    mcpEnabled?: boolean; // Added for MCP support
}

export class ConfigurationService {
    private readonly logger: ExtensionLogger;
    private readonly configSection = 'thefuse';

    constructor() {
        this.logger = getLogger();
    }

    public get<T>(key: keyof ExtensionConfig): T {
        const config = vscode.workspace.getConfiguration(this.configSection);
        return config.get<T>(key) as T;
    }

    public async set<T>(key: keyof ExtensionConfig, value: T): Promise<void> {
        const config = vscode.workspace.getConfiguration(this.configSection);
        await config.update(key, value, vscode.ConfigurationTarget.Global);
    }

    public getFeatureFlag(key: string): boolean {
        const config = vscode.workspace.getConfiguration(this.configSection);
        return config.get<boolean>(`enable${key}`, false);
    }

    public getAll(): ExtensionConfig {
        const config = vscode.workspace.getConfiguration(this.configSection);
        return {
            relayServerPort: config.get('relayServerPort', 3000),
            fileProtocolDir: config.get('fileProtocolDir', 'ai-communication'),
            enableChromeIntegration: config.get('enableChromeIntegration', true),
            enableLogging: config.get('enableLogging', true)
        };
    }
}

/**
 * Configuration Manager for MCP-specific settings
 */
export class ConfigurationManager {
    private readonly logger;
    private readonly configSection = 'thefuse.mcp';
    private static instance: ConfigurationManager;

    private constructor() {
        this.logger = getLogger();
    }

    public static getInstance(): ConfigurationManager {
        if (!ConfigurationManager.instance) {
            ConfigurationManager.instance = new ConfigurationManager();
        }
        return ConfigurationManager.instance;
    }

    public getConfiguration(): ExtensionConfig {
        const config = vscode.workspace.getConfiguration(this.configSection);
        return {
            relayServerPort: config.get('relayServerPort', 3000),
            fileProtocolDir: config.get('fileProtocolDir', 'ai-communication'),
            enableChromeIntegration: config.get('enableChromeIntegration', true),
            enableLogging: config.get('enableLogging', true),
            mcpEnabled: config.get('enabled', true)
        };
    }

    public get<T>(key: string, defaultValue?: T): T {
        const config = vscode.workspace.getConfiguration(this.configSection);
        return config.get<T>(key, defaultValue as T);
    }

    public async set<T>(key: string, value: T): Promise<void> {
        const config = vscode.workspace.getConfiguration(this.configSection);
        await config.update(key, value, vscode.ConfigurationTarget.Global);
    }
}