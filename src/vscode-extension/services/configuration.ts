import * as vscode from 'vscode';
import { getLogger,  Logger  } from '../core/logging.js';

export class ConfigurationService {
    private static instance: ConfigurationService;
    private logger: Logger;
    private config: vscode.WorkspaceConfiguration;

    private constructor() {
        this.logger = Logger.getInstance();
        this.config = vscode.workspace.getConfiguration('thefuse');
    }

    public static getInstance(): ConfigurationService {
        if (!ConfigurationService.instance) {
            ConfigurationService.instance = new ConfigurationService();
        }
        return ConfigurationService.instance;
    }

    public getSetting<T>(key: string, defaultValue?: T): T {
        const value = this.config.get<T>(key, defaultValue as T);
        this.logger.debug(`Retrieved configuration value for ${key}:`, value);
        return value;
    }

    public async updateSetting<T>(key: string, value: T, target: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Workspace): Promise<void> {
        try {
            await this.config.update(key, value, target);
            this.logger.info(`Updated configuration value for ${key}:`, value);
        } catch (error) {
            this.logger.error(`Failed to update configuration value for ${key}:`, error);
            throw error;
        }
    }

    public getDefaultSettings(): Record<string, any> {
        return {
            mcpPort: 9229,
            heartbeatInterval: 30000,
            logLevel: 'info',
            maxLogFiles: 5,
            maxLogSize: 1048576, // 1MB
            enableDebugMode: false
        };
    }

    public async initialize(): Promise<void> {
        try {
            const defaults = this.getDefaultSettings();
            for (const [key, defaultValue] of Object.entries(defaults)) {
                if (this.getSetting(key) === undefined) {
                    await this.updateSetting(key, defaultValue);
                }
            }
            this.logger.info('Configuration service initialized with default settings');
        } catch (error) {
            this.logger.error('Failed to initialize configuration service:', error);
            throw error;
        }
    }

    public dispose(): void {
        // Clean up any resources if needed
    }
}