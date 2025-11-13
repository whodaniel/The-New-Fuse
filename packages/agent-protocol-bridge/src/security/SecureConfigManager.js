"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecureConfigManager = void 0;
const crypto = __importStar(require("crypto"));
// Mock for vscode.SecretStorage
class MockSecretStorage {
    storage = new Map();
    async get(key) {
        return this.storage.get(key);
    }
    async store(key, value) {
        this.storage.set(key, value);
    }
    async delete(key) {
        this.storage.delete(key);
    }
}
/**
 * Secure Configuration Manager
 * Handles secure storage and retrieval of sensitive data using an in-memory store (for backend).
 */
class SecureConfigManager {
    context;
    secrets;
    _encryptionKey = null;
    _initialized = false;
    constructor(context) {
        this.context = { secrets: new MockSecretStorage() };
        this.secrets = this.context.secrets;
    }
    /**
     * Initialize the secure configuration manager
     */
    async initialize() {
        if (this._initialized)
            return;
        try {
            // Generate or retrieve encryption key
            this._encryptionKey = await this._getOrCreateEncryptionKey();
            // Initialize secure storage
            await this._initializeSecureStorage();
            this._initialized = true;
            console.log('🔐 Secure Configuration Manager initialized (in-memory)');
        }
        catch (error) {
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
        return crypto.randomBytes(32).toString('hex');
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
                apiCalls: { max: 50, window: 60000 } // 50 API calls per minute
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
        if (!encryptedKey)
            return null;
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
     * Encrypt sensitive data
     */
    async _encryptData(data) {
        const key = this._encryptionKey;
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);
        const encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]);
        const authTag = cipher.getAuthTag();
        return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')};
    }

    /**
     * Decrypt sensitive data
     */
    async _decryptData(encryptedData: string): Promise<string | null> {
        try {
            const key = this._encryptionKey!;
            const [ivHex, authTagHex, encryptedHex] = encryptedData.split(':');
            const iv = Buffer.from(ivHex, 'hex');
            const authTag = Buffer.from(authTagHex, 'hex');
            const encrypted = Buffer.from(encryptedHex, 'hex');
            const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);
            decipher.setAuthTag(authTag);
            const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
            return decrypted.toString('utf8');
        } catch (error) {
            console.error('Decryption failed:', error);
            return null;
        }
    }

    /**
     * Generate unique ID
     */
    _generateId(): string {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Log security events
     */
    async _logSecurityEvent(event: string, details: any): Promise<void> {
        const auditLog = {
            timestamp: new Date().toISOString(),
            event: event,
            details: details,
            user: 'backend-user'
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
    async _getAuditLogs(): Promise<any[]> {
        const stored = await this.secrets.get('security.audit.logs');
        return stored ? JSON.parse(stored) : [];
    }

    /**
     * Get security status for dashboard
     */
    async getSecurityStatus(): Promise<any> {
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
    async clearAllSecureData(): Promise<void> {
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

    /**
     * Get configuration value`
            * /`;
        async;
        getConfiguration(key, string);
        Promise < any > {} `
        const stored = await this.secrets.get(config.${key});
        return stored ? JSON.parse(stored) : {};
    }

    /**
     * Set configuration value
     */
    async setConfiguration(key: string, value: any): Promise<void> {
        await this.initialize();`;
        await this.secrets.store(config.$, { key } `, JSON.stringify(value));
        await this._logSecurityEvent('configuration_set', { key });
    }
}
        );
    }
}
exports.SecureConfigManager = SecureConfigManager;
//# sourceMappingURL=SecureConfigManager.js.map