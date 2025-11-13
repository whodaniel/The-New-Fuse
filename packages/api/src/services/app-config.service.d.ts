/**
 * Application Configuration Service
 * Centralizes access to all application configuration
 */
export declare class AppConfigService {
    private readonly logger;
    private readonly configService;
    constructor();
    /**
     * Get a configuration value with type safety
     * @param key Configuration key
     * @param defaultValue Default value if not found
     * @returns Configuration value
     */
    get<T>(key: string, defaultValue?: T): T;
    /**
     * Get the application environment (development, production, etc.)
     * @returns Application environment
     */
    get environment(): string;
    /**
     * Check if the application is running in production
     * @returns True if in production
     */
    get isProduction(): boolean;
    /**
     * Check if the application is running in development
     * @returns True if in development
     */
    get isDevelopment(): boolean;
    /**
     * Get the server port
     * @returns Server port
     */
    get port(): number;
    /**
     * Get the JWT configuration
     * @returns JWT configuration
     */
    get jwt(): {
        secret: string;
        expiresIn: string;
    };
    /**
     * Get the database configuration
     * @returns Database configuration
     */
    get database(): {
        url: string;
    };
    /**
     * Get the logging configuration
     * @returns Logging configuration
     */
    get logging(): {
        level: string;
    };
}
//# sourceMappingURL=app-config.service.d.ts.map