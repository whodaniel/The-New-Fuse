/**
 * Application Configuration Service
 * Centralizes access to all application configuration
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AppConfigService_1;
import { Injectable, Logger } from '@nestjs/common';
// Simple config service implementation
class SimpleConfigService {
    get(key, defaultValue) {
        const value = process.env[key];
        if (value === undefined) {
            return defaultValue;
        }
        // Try to parse as number if defaultValue is a number
        if (typeof defaultValue === 'number') {
            const parsed = parseInt(value, 10);
            return (isNaN(parsed) ? defaultValue : parsed);
        }
        // Try to parse as boolean if defaultValue is a boolean
        if (typeof defaultValue === 'boolean') {
            return (value.toLowerCase() === 'true');
        }
        return value;
    }
}
let AppConfigService = AppConfigService_1 = class AppConfigService {
    logger = new Logger(AppConfigService_1.name);
    configService;
    constructor() {
        this.configService = new SimpleConfigService();
        this.logger.log('Initializing application configuration service');
    }
    /**
     * Get a configuration value with type safety
     * @param key Configuration key
     * @param defaultValue Default value if not found
     * @returns Configuration value
     */
    get(key, defaultValue) {
        // Handle the case where defaultValue is undefined
        if (defaultValue === undefined) {
            const value = this.configService.get(key);
            if (value === undefined) {
                this.logger.warn(`Configuration key "${key}" not found and no default value provided`);
            }
            return value;
        }
        // Handle the case where defaultValue is provided
        // Use type assertion to fix the type compatibility issue
        const value = this.configService.get(key, { infer: true });
        return (value === undefined ? defaultValue : value);
    }
    /**
     * Get the application environment (development, production, etc.)
     * @returns Application environment
     */
    get environment() {
        return this.get('NODE_ENV', 'development');
    }
    /**
     * Check if the application is running in production
     * @returns True if in production
     */
    get isProduction() {
        return this.environment === 'production';
    }
    /**
     * Check if the application is running in development
     * @returns True if in development
     */
    get isDevelopment() {
        return this.environment === 'development';
    }
    /**
     * Get the server port
     * @returns Server port
     */
    get port() {
        return this.get('PORT', 3000);
    }
    /**
     * Get the JWT configuration
     * @returns JWT configuration
     */
    get jwt() {
        return {
            secret: this.get('JWT_SECRET', 'dev-secret-key'),
            expiresIn: this.get('JWT_EXPIRES_IN', '7d'),
        };
    }
    /**
     * Get the database configuration
     * @returns Database configuration
     */
    get database() {
        return {
            url: this.get('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/fuse'),
        };
    }
    /**
     * Get the logging configuration
     * @returns Logging configuration
     */
    get logging() {
        return {
            level: this.get('LOG_LEVEL', 'info'),
        };
    }
};
AppConfigService = AppConfigService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [])
], AppConfigService);
export { AppConfigService };
//# sourceMappingURL=app-config.service.js.map