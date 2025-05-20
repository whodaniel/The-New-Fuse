import * as vscode from 'vscode';
import { getLogger, ExtensionLogger } from './logging.js'; // Added getLogger, changed Logger to ExtensionLogger
import { MCPError, ErrorCode } from './error-handling.js';

interface ConfigurationSchema {
    required: string[];
    types: Record<string, string>;
    patterns?: Record<string, RegExp>;
    ranges?: Record<string, { min?: number; max?: number }>;
}

export class ConfigurationValidator {
    private static instance: ConfigurationValidator;
    private logger: ExtensionLogger; // Changed Logger to ExtensionLogger

    private constructor() {
        this.logger = getLogger();
    }

    static getInstance(): ConfigurationValidator {
        if (!ConfigurationValidator.instance) {
            ConfigurationValidator.instance = new ConfigurationValidator();
        }
        return ConfigurationValidator.instance;
    }

    async validateConfiguration(config: any, schema: ConfigurationSchema): Promise<void> {
        // Check required fields
        for (const required of schema.required) {
            if (!(required in config)) {
                throw new MCPError(
                    ErrorCode.CONFIG_INVALID,
                    `Missing required configuration: ${required}`
                );
            }
        }

        // Validate types
        for (const [key, expectedType] of Object.entries(schema.types)) {
            if (key in config) {
                const actualType = typeof config[key];
                if (actualType !== expectedType) {
                    throw new MCPError(
                        ErrorCode.CONFIG_INVALID,
                        `Invalid type for ${key}: expected ${expectedType}, got ${actualType}`
                    );
                }
            }
        }

        // Validate patterns
        if (schema.patterns) {
            for (const [key, pattern] of Object.entries(schema.patterns)) {
                if (key in config && typeof config[key] === 'string') {
                    if (!pattern.test(config[key])) {
                        throw new MCPError(
                            ErrorCode.CONFIG_INVALID,
                            `Invalid format for ${key}`
                        );
                    }
                }
            }
        }

        // Validate ranges
        if (schema.ranges) {
            for (const [key, range] of Object.entries(schema.ranges)) {
                if (key in config && typeof config[key] === 'number') {
                    if (range.min !== undefined && config[key] < range.min) {
                        throw new MCPError(
                            ErrorCode.CONFIG_INVALID,
                            `${key} must be at least ${range.min}`
                        );
                    }
                    if (range.max !== undefined && config[key] > range.max) {
                        throw new MCPError(
                            ErrorCode.CONFIG_INVALID,
                            `${key} must be at most ${range.max}`
                        );
                    }
                }
            }
        }
    }
}
