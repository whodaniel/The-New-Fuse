/**
 * Secure Configuration Manager
 * Handles secure storage and retrieval of sensitive data using an in-memory store (for backend).
 */
export declare class SecureConfigManager {
    private context;
    private secrets;
    private _encryptionKey;
    _initialized: boolean;
    constructor(context: any);
    /**
     * Initialize the secure configuration manager
     */
    initialize(): Promise<void>;
    /**
     * Get or create encryption key for data protection
     */
    _getOrCreateEncryptionKey(): Promise<string>;
    /**
     * Generate a cryptographically secure random key
     */
    _generateSecureKey(): string;
    /**
     * Initialize secure storage with default configurations
     */
    _initializeSecureStorage(): Promise<void>;
    /**
     * Securely store API key
     */
    storeApiKey(provider: string, key: string): Promise<void>;
    /**
     * Securely retrieve API key
     */
    getApiKey(provider: string): Promise<string | null>;
    /**
     * Get all stored API keys (without decryption)
     */
    getApiKeys(): Promise<Record<string, string>>;
    /**
     * Remove API key
     */
    removeApiKey(provider: string): Promise<void>;
    /**
     * Store MCP endpoint configuration securely
     */
    storeMcpEndpoint(endpoint: any): Promise<void>;
    /**
     * Get MCP endpoints
     */
    getMcpEndpoints(): Promise<unknown[]>;
    /**
     * Update rate limiting configuration
     */
    updateRateLimits(limits: any): Promise<void>;
    /**
     * Get rate limiting configuration
     */
    getRateLimits(): Promise<any>;
    /**
     * Update permissions
     */
    updatePermissions(permissions: Record<string, boolean>): Promise<void>;
    /**
     * Get permissions
     */
    getPermissions(): Promise<Record<string, boolean>>;
    /**
     * Check if user has permission for action
     */
    hasPermission(action: string): Promise<boolean>;
    /**
     * Encrypt sensitive data
     */
    _encryptData(data: string): Promise<string>;
}
//# sourceMappingURL=SecureConfigManager.d.ts.map