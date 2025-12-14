const vscode = require('vscode');
const crypto = require('crypto');

/**
 * Secure Configuration Manager
 * Handles secure storage and retrieval of sensitive data using VSCode secrets API
 */
class SecureConfigManager {
    constructor(context) {
        this.context = context;
        this.secrets = context.secrets;
        this._encryptionKey = null;
        this._initialized = false;

        // Encryption settings
        this.ALGORITHM = 'aes-256-gcm';
        this.KEY_LENGTH = 32; // 256 bits
        this.IV_LENGTH = 16;
        this.AUTH_TAG_LENGTH = 16;
    }

    /**
     * Initialize the secure configuration manager
     */
    async initialize() {
        if (this._initialized) return;

        try {
            // Generate or retrieve encryption key
            this._encryptionKey = await this._getOrCreateEncryptionKey();

            // Initialize secure storage
            await this._initializeSecureStorage();

            this._initialized = true;
            console.log('🔐 Secure Configuration Manager initialized');
        } catch (error) {
            console.error('Failed to initialize SecureConfigManager:', error);
            throw new Error('Secure configuration initialization failed');
        }
    }

    /**
     * Get or create encryption key for data protection
     */
    async _getOrCreateEncryptionKey() {
        const keyId = 'tnf.encryption.key';
        let key = await this.secrets.get(keyId);

        if (!key) {
            // Generate a new 256-bit encryption key
            key = this._generateSecureKey();
            await this.secrets.store(keyId, key);
        }

        return key;
    }

    /**
     * Generate a cryptographically secure random key
     */
    _generateSecureKey() {
        // Generate 256-bit key using Node.js crypto
        return crypto.randomBytes(this.KEY_LENGTH).toString('hex');
    }

    /**
     * Initialize secure storage with default configurations
     */
    async _initializeSecureStorage() {
        // Initialize default secure configurations
        const defaults = {
            'apiKeys': {},
            'mcp.endpoints': [],
            'security.rateLimits': {
                messages: { max: 100, window: 60000 }, // 100 messages per minute
                apiCalls: { max: 50, window: 60000 }   // 50 API calls per minute
            },
            'security.permissions': {
                'chat.send': true,
                'file.attach': true,
                'mcp.connect': true,
                'workflow.create': true,
                'agent.federate': true
            },
            'security.audit.enabled': true,
            'security.encryption.enabled': true,
            'security.https.enforce': true
        };

        for (const [key, value] of Object.entries(defaults)) {
            const existing = await this.secrets.get(key);
            if (!existing) {
                await this.secrets.store(key, JSON.stringify(value));
            }
        }
    }

    /**
     * Securely store API key
     */
    async storeApiKey(provider, key) {
        await this.initialize();

        const apiKeys = await this.getApiKeys();
        apiKeys[provider] = await this._encryptData(key);
        await this.secrets.store('apiKeys', JSON.stringify(apiKeys));

        // Log security event
        await this._logSecurityEvent('api_key_stored', { provider });
    }

    /**
     * Securely retrieve API key
     */
    async getApiKey(provider) {
        await this.initialize();

        const apiKeys = await this.getApiKeys();
        const encryptedKey = apiKeys[provider];

        if (!encryptedKey) return null;

        return await this._decryptData(encryptedKey);
    }

    /**
     * Get all stored API keys (without decryption)
     */
    async getApiKeys() {
        const stored = await this.secrets.get('apiKeys');
        return stored ? JSON.parse(stored) : {};
    }

    /**
     * Remove API key
     */
    async removeApiKey(provider) {
        await this.initialize();

        const apiKeys = await this.getApiKeys();
        delete apiKeys[provider];
        await this.secrets.store('apiKeys', JSON.stringify(apiKeys));

        await this._logSecurityEvent('api_key_removed', { provider });
    }

    /**
     * Store MCP endpoint configuration securely
     */
    async storeMcpEndpoint(endpoint) {
        await this.initialize();

        const endpoints = await this.getMcpEndpoints();
        endpoints.push({
            ...endpoint,
            id: this._generateId(),
            created: new Date().toISOString(),
            lastValidated: null
        });

        await this.secrets.store('mcp.endpoints', JSON.stringify(endpoints));
        await this._logSecurityEvent('mcp_endpoint_added', { url: endpoint.url });
    }

    /**
     * Get MCP endpoints
     */
    async getMcpEndpoints() {
        const stored = await this.secrets.get('mcp.endpoints');
        return stored ? JSON.parse(stored) : [];
    }

    /**
     * Update rate limiting configuration
     */
    async updateRateLimits(limits) {
        await this.initialize();
        await this.secrets.store('security.rateLimits', JSON.stringify(limits));
        await this._logSecurityEvent('rate_limits_updated', limits);
    }

    /**
     * Get rate limiting configuration
     */
    async getRateLimits() {
        const stored = await this.secrets.get('security.rateLimits');
        return stored ? JSON.parse(stored) : {
            messages: { max: 100, window: 60000 },
            apiCalls: { max: 50, window: 60000 }
        };
    }

    /**
     * Update permissions
     */
    async updatePermissions(permissions) {
        await this.initialize();
        await this.secrets.store('security.permissions', JSON.stringify(permissions));
        await this._logSecurityEvent('permissions_updated', permissions);
    }

    /**
     * Get permissions
     */
    async getPermissions() {
        const stored = await this.secrets.get('security.permissions');
        return stored ? JSON.parse(stored) : {};
    }

    /**
     * Check if user has permission for action
     */
    async hasPermission(action) {
        const permissions = await this.getPermissions();
        return permissions[action] !== false; // Default to true if not explicitly denied
    }

    /**
     * Encrypt sensitive data using AES-256-GCM
     */
    async _encryptData(data) {
        try {
            // Convert hex key to buffer
            const key = Buffer.from(this._encryptionKey, 'hex');

            // Generate random IV (Initialization Vector)
            const iv = crypto.randomBytes(this.IV_LENGTH);

            // Create cipher
            const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);

            // Encrypt the data
            let encrypted = cipher.update(data, 'utf8', 'hex');
            encrypted += cipher.final('hex');

            // Get authentication tag for GCM mode
            const authTag = cipher.getAuthTag();

            // Combine IV + authTag + encrypted data
            const combined = iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;

            return combined;
        } catch (error) {
            throw new Error(`Encryption failed: ${error.message}`);
        }
    }

    /**
     * Decrypt sensitive data using AES-256-GCM
     */
    async _decryptData(encryptedData) {
        try {
            // Split the combined data
            const parts = encryptedData.split(':');
            if (parts.length !== 3) {
                throw new Error('Invalid encrypted data format');
            }

            const iv = Buffer.from(parts[0], 'hex');
            const authTag = Buffer.from(parts[1], 'hex');
            const encrypted = parts[2];

            // Convert hex key to buffer
            const key = Buffer.from(this._encryptionKey, 'hex');

            // Create decipher
            const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);
            decipher.setAuthTag(authTag);

            // Decrypt the data
            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');

            return decrypted;
        } catch (error) {
            console.error('Decryption failed:', error);
            return null;
        }
    }

    /**
     * Generate unique ID
     */
    _generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Log security events
     */
    async _logSecurityEvent(event, details) {
        const auditLog = {
            timestamp: new Date().toISOString(),
            event: event,
            details: details,
            user: vscode.env.machineId || 'unknown'
        };

        // Store audit log (in production, this would go to a secure logging service)
        const logs = await this._getAuditLogs();
        logs.push(auditLog);

        // Keep only last 1000 entries
        if (logs.length > 1000) {
            logs.splice(0, logs.length - 1000);
        }

        await this.secrets.store('security.audit.logs', JSON.stringify(logs));
    }

    /**
     * Get audit logs
     */
    async _getAuditLogs() {
        const stored = await this.secrets.get('security.audit.logs');
        return stored ? JSON.parse(stored) : [];
    }

    /**
     * Get security status for dashboard
     */
    async getSecurityStatus() {
        await this.initialize();

        const apiKeys = await this.getApiKeys();
        const endpoints = await this.getMcpEndpoints();
        const permissions = await this.getPermissions();
        const rateLimits = await this.getRateLimits();

        return {
            encryptionEnabled: true,
            apiKeysConfigured: Object.keys(apiKeys).length,
            mcpEndpointsConfigured: endpoints.length,
            permissionsConfigured: Object.keys(permissions).length,
            rateLimitingEnabled: true,
            auditLoggingEnabled: true,
            lastSecurityCheck: new Date().toISOString()
        };
    }

    /**
     * Clear all secure data (for testing/reset purposes)
     */
    async clearAllSecureData() {
        const keys = [
            'tnf.encryption.key',
            'apiKeys',
            'mcp.endpoints',
            'security.rateLimits',
            'security.permissions',
            'security.audit.logs'
        ];

        for (const key of keys) {
            await this.secrets.delete(key);
        }

        this._initialized = false;
        await this._logSecurityEvent('secure_data_cleared', {});
    }
}

module.exports = SecureConfigManager;