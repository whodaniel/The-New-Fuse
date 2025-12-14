import * as vscode from 'vscode';
import * as crypto from 'crypto';

/**
 * Secure Configuration Manager
 * Handles secure storage and retrieval of sensitive data using VSCode secrets API
 */
export class SecureConfigManager {
	private context: vscode.ExtensionContext;
	private secrets: vscode.SecretStorage;
	private _encryptionKey: string | null = null;
	public _initialized: boolean = false;

	constructor(context: vscode.ExtensionContext) {
		this.context = context;
		this.secrets = context.secrets;
	}

	/**
	 * Initialize the secure configuration manager
	 */
	async initialize(): Promise<void> {
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
	async _getOrCreateEncryptionKey(): Promise<string> {
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
	_generateSecureKey(): string {
		const array = new Uint8Array(32);
		crypto.getRandomValues(array);
		return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
	}

	/**
	 * Initialize secure storage with default configurations
	 */
	async _initializeSecureStorage(): Promise<void> {
		// Initialize default secure configurations
		const defaults: Record<string, unknown> = {
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
	async storeApiKey(provider: string, key: string): Promise<void> {
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
	async getApiKey(provider: string): Promise<string | null> {
		await this.initialize();

		const apiKeys = await this.getApiKeys();
		const encryptedKey = apiKeys[provider];

		if (!encryptedKey) return null;

		return await this._decryptData(encryptedKey);
	}

	/**
	 * Get all stored API keys (without decryption)
	 */
	async getApiKeys(): Promise<Record<string, string>> {
		const stored = await this.secrets.get('apiKeys');
		return stored ? JSON.parse(stored) : {};
	}

	/**
	 * Remove API key
	 */
	async removeApiKey(provider: string): Promise<void> {
		await this.initialize();

		const apiKeys = await this.getApiKeys();
		delete apiKeys[provider];
		await this.secrets.store('apiKeys', JSON.stringify(apiKeys));

		await this._logSecurityEvent('api_key_removed', { provider });
	}

	/**
	 * Store MCP endpoint configuration securely
	 */
	async storeMcpEndpoint(endpoint: any): Promise<void> {
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
	async getMcpEndpoints(): Promise<unknown[]> {
		const stored = await this.secrets.get('mcp.endpoints');
		return stored ? JSON.parse(stored) : [];
	}

	/**
	 * Update rate limiting configuration
	 */
	async updateRateLimits(limits: any): Promise<void> {
		await this.initialize();
		await this.secrets.store('security.rateLimits', JSON.stringify(limits));
		await this._logSecurityEvent('rate_limits_updated', limits);
	}

	/**
	 * Get rate limiting configuration
	 */
	async getRateLimits(): Promise<any> {
		const stored = await this.secrets.get('security.rateLimits');
		return stored ? JSON.parse(stored) : {
			messages: { max: 100, window: 60000 },
			apiCalls: { max: 50, window: 60000 }
		};
	}

	/**
	 * Update permissions
	 */
	async updatePermissions(permissions: Record<string, boolean>): Promise<void> {
		await this.initialize();
		await this.secrets.store('security.permissions', JSON.stringify(permissions));
		await this._logSecurityEvent('permissions_updated', permissions);
	}

	/**
	 * Get permissions
	 */
	async getPermissions(): Promise<Record<string, boolean>> {
		const stored = await this.secrets.get('security.permissions');
		return stored ? JSON.parse(stored) : {};
	}

	/**
	 * Check if user has permission for action
	 */
	async hasPermission(action: string): Promise<boolean> {
		const permissions = await this.getPermissions();
		return permissions[action] !== false; // Default to true if not explicitly denied
	}

	/**
	 * Encrypt sensitive data using AES-256-GCM
	 */
	async _encryptData(data: string): Promise<string> {
		try {
			const key = this._encryptionKey!;
			
			// Convert hex key to buffer (32 bytes for AES-256)
			const keyBuffer = Buffer.from(key, 'hex');
			
			// Generate random IV (12 bytes for GCM)
			const iv = crypto.randomBytes(12);
			
			// Create cipher with key and IV
			const cipher = crypto.createCipheriv('aes-256-gcm', keyBuffer, iv);
			
			// Encrypt data
			const encrypted = Buffer.concat([
				cipher.update(Buffer.from(data, 'utf8')),
				cipher.final()
			]);
			
			// Get authentication tag
			const authTag = cipher.getAuthTag();
			
			// Combine IV + authTag + encrypted data
			const combined = Buffer.concat([iv, authTag, encrypted]);
			
			return combined.toString('base64');
		} catch (error) {
			console.error('Encryption failed:', error);
			throw new Error('Failed to encrypt data');
		}
	}

	/**
	 * Decrypt sensitive data using AES-256-GCM
	 */
	async _decryptData(encryptedData: string): Promise<string | null> {
		try {
			const key = this._encryptionKey!;
			
			// Convert hex key to buffer
			const keyBuffer = Buffer.from(key, 'hex');
			
			// Decode base64
			const combined = Buffer.from(encryptedData, 'base64');
			
			// Extract IV (first 12 bytes)
			const iv = combined.slice(0, 12);
			
			// Extract auth tag (next 16 bytes)
			const authTag = combined.slice(12, 28);
			
			// Extract encrypted data (remaining bytes)
			const encrypted = combined.slice(28);
			
			// Create decipher with key and IV
			const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, iv);
			decipher.setAuthTag(authTag);
			
			// Decrypt data
			const decrypted = Buffer.concat([
				decipher.update(encrypted),
				decipher.final()
			]);
			
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
	 * Get configuration value
	 */
	async getConfiguration(key: string): Promise<any> {
		const stored = await this.secrets.get(`config.${key}`);
		return stored ? JSON.parse(stored) : {};
	}

	/**
	 * Set configuration value
	 */
	async setConfiguration(key: string, value: any): Promise<void> {
		await this.initialize();
		await this.secrets.store(`config.${key}`, JSON.stringify(value));
		await this._logSecurityEvent('configuration_set', { key });
	}
}