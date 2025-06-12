import * as vscode from 'vscode';

export interface NewFuseConfiguration {
	serverUrl: string;
	tenantId: string;
	apiKey: string;
	enableDebugLogging: boolean;
	streamingEnabled: boolean;
	autoRefreshInterval: number;
}

/**
 * Configuration Manager for The New Fuse extension
 */
export class ConfigurationManager {
	private static readonly CONFIG_KEY = 'newFuse';

	/**
	 * Get current configuration
	 */
	getConfiguration(): NewFuseConfiguration {
		const config = vscode.workspace.getConfiguration(ConfigurationManager.CONFIG_KEY);
		
		return {
			serverUrl: config.get('serverUrl', 'http://localhost:3000'),
			tenantId: config.get('tenantId', ''),
			apiKey: config.get('apiKey', ''),
			enableDebugLogging: config.get('enableDebugLogging', false),
			streamingEnabled: config.get('streamingEnabled', true),
			autoRefreshInterval: config.get('autoRefreshInterval', 300000)
		};
	}

	/**
	 * Validate current configuration
	 */
	async validateConfiguration(): Promise<boolean> {
		const config = this.getConfiguration();
		
		// Check required fields
		if (!config.serverUrl || !config.tenantId || !config.apiKey) {
			return false;
		}

		// Validate URL format
		try {
			new URL(config.serverUrl);
		} catch {
			return false;
		}

		// Validate tenant ID format (basic validation)
		if (config.tenantId.length < 3) {
			return false;
		}

		// Validate API key format (basic validation)
		if (config.apiKey.length < 10) {
			return false;
		}

		return true;
	}

	/**
	 * Get server URL
	 */
	getServerUrl(): string {
		return this.getConfiguration().serverUrl;
	}

	/**
	 * Get tenant ID
	 */
	getTenantId(): string {
		return this.getConfiguration().tenantId;
	}

	/**
	 * Get API key
	 */
	getApiKey(): string {
		return this.getConfiguration().apiKey;
	}

	/**
	 * Check if debug logging is enabled
	 */
	isDebugLoggingEnabled(): boolean {
		return this.getConfiguration().enableDebugLogging;
	}

	/**
	 * Check if streaming is enabled
	 */
	isStreamingEnabled(): boolean {
		return this.getConfiguration().streamingEnabled;
	}

	/**
	 * Get auto-refresh interval
	 */
	getAutoRefreshInterval(): number {
		return this.getConfiguration().autoRefreshInterval;
	}

	/**
	 * Update a configuration value
	 */
	async updateConfiguration(key: keyof NewFuseConfiguration, value: any): Promise<void> {
		const config = vscode.workspace.getConfiguration(ConfigurationManager.CONFIG_KEY);
		await config.update(key, value, vscode.ConfigurationTarget.Global);
	}

	/**
	 * Reset configuration to defaults
	 */
	async resetConfiguration(): Promise<void> {
		const config = vscode.workspace.getConfiguration(ConfigurationManager.CONFIG_KEY);
		
		await config.update('serverUrl', undefined, vscode.ConfigurationTarget.Global);
		await config.update('tenantId', undefined, vscode.ConfigurationTarget.Global);
		await config.update('apiKey', undefined, vscode.ConfigurationTarget.Global);
		await config.update('enableDebugLogging', undefined, vscode.ConfigurationTarget.Global);
		await config.update('streamingEnabled', undefined, vscode.ConfigurationTarget.Global);
		await config.update('autoRefreshInterval', undefined, vscode.ConfigurationTarget.Global);
	}

	/**
	 * Export configuration (without sensitive data)
	 */
	exportConfiguration(): Partial<NewFuseConfiguration> {
		const config = this.getConfiguration();
		
		return {
			serverUrl: config.serverUrl,
			enableDebugLogging: config.enableDebugLogging,
			streamingEnabled: config.streamingEnabled,
			autoRefreshInterval: config.autoRefreshInterval
			// Exclude tenantId and apiKey for security
		};
	}

	/**
	 * Get configuration status for diagnostics
	 */
	getConfigurationStatus(): {
		isValid: boolean;
		missingFields: string[];
		warnings: string[];
	} {
		const config = this.getConfiguration();
		const missingFields: string[] = [];
		const warnings: string[] = [];

		// Check required fields
		if (!config.serverUrl) missingFields.push('serverUrl');
		if (!config.tenantId) missingFields.push('tenantId');
		if (!config.apiKey) missingFields.push('apiKey');

		// Validate URL
		if (config.serverUrl) {
			try {
				const url = new URL(config.serverUrl);
				if (url.protocol !== 'http:' && url.protocol !== 'https:') {
					warnings.push('Server URL should use http:// or https://');
				}
				if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
					warnings.push('Using localhost - ensure The New Fuse server is running locally');
				}
			} catch {
				warnings.push('Server URL format is invalid');
			}
		}

		// Check tenant ID format
		if (config.tenantId && config.tenantId.length < 3) {
			warnings.push('Tenant ID seems too short');
		}

		// Check API key format
		if (config.apiKey && config.apiKey.length < 10) {
			warnings.push('API key seems too short');
		}

		// Check auto-refresh interval
		if (config.autoRefreshInterval < 60000) {
			warnings.push('Auto-refresh interval is very short (less than 1 minute)');
		}

		return {
			isValid: missingFields.length === 0,
			missingFields,
			warnings
		};
	}
}
