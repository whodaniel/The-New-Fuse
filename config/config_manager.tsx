/**
 * Configuration manager for the AI Communication System.
 */
import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
import * as winston from 'winston';
import { getConfig } from './env_config.js';

export class ConfigurationManager {
    /**
     * Manages configuration loading and validation.
     */
    private static _instance: ConfigurationManager;
    private _config: any;
    
    private constructor() {
        this._initialize();
    }
    
    /**
     * Singleton pattern to ensure only one configuration instance.
     */
    public static getInstance(): ConfigurationManager {
        if (!ConfigurationManager._instance) {
            ConfigurationManager._instance = new ConfigurationManager();
        }
        return ConfigurationManager._instance;
    }
    
    /**
     * Initialize the configuration manager.
     */
    private _initialize(): void {
        // Load environment variables from .env file if it exists
        const envFile = path.resolve(__dirname, '..', '..', '.env');
        if (fs.existsSync(envFile)) {
            dotenv.config({ path: envFile });
        }
        
        // Load configuration based on environment
        this._config = getConfig();
        
        // Setup logging
        this._setupLogging();
        
        // Validate configuration
        this._validateConfiguration();
    }
    
    /**
     * Setup logging configuration.
     */
    private _setupLogging(): void {
        winston.configure({
            level: this._config.LOG_LEVEL.toLowerCase(),
            format: winston.format.printf(({ level, message, timestamp }) => {
                return this._config.LOG_FORMAT
                    .replace('%(asctime)s', timestamp)
                    .replace('%(levelname)s', level.toUpperCase())
                    .replace('%(message)s', message);
            }),
            transports: [
                new winston.transports.Console()
            ]
        });
    }
    
    /**
     * Validate required configuration settings.
     */
    private _validateConfiguration(): void {
        const requiredSettings: { [key: string]: string } = {
            'REDIS_HOST': 'Redis host must be specified',
            'REDIS_PORT': 'Redis port must be specified',
            'SECRET_KEY': 'Secret key must be specified'
        };
        
        for (const [setting, message] of Object.entries(requiredSettings)) {
            if (!this._config[setting]) {
                throw new Error(`Configuration Error: ${message}`);
            }
        }
    }
    
    /**
     * Get configuration value.
     */
    public get<T>(key: string): T {
        return this._config[key];
    }
    
    /**
     * Get all configuration values.
     */
    public getAll(): { [key: string]: any } {
        return { ...this._config };
    }
}
