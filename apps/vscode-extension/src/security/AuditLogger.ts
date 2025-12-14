import * as vscode from 'vscode';
import { AuditEvent } from '../types';

/**
 * Comprehensive Audit Logging System
 * Logs all security-relevant events and AI interactions
 */
export class AuditLogger {
	private context: vscode.ExtensionContext;
	private logs: AuditEvent[] = [];
	private maxLogs: number = 5000; // Maximum logs to keep in memory
	private flushInterval: number = 5 * 60 * 1000; // Flush every 5 minutes
	public _initialized: boolean = false;
	private _sessionId?: string;

	constructor(context: vscode.ExtensionContext) {
		this.context = context;
	}

	/**
	 * Initialize the audit logger
	 */
	async initialize(): Promise<void> {
		if (this._initialized) return;

		// Load existing logs from storage
		await this._loadLogs();

		// Set up periodic flush
		setInterval(() => this._flushLogs(), this.flushInterval);

		this._initialized = true;
		console.log('📊 Audit Logger initialized');
	}

	/**
	 * Log a security event
	 */
	async logSecurityEvent(eventType: string, details: any, severity: 'info' | 'warning' | 'high' | 'critical' = 'info'): Promise<void> {
		await this.initialize();

		const logEntry: AuditEvent = {
			id: this._generateId(),
			timestamp: new Date().toISOString(),
			eventType,
			severity,
			details: this._sanitizeLogDetails(details),
			userId: this._getUserId(),
			sessionId: this._getSessionId(),
			extensionVersion: '7.0.0'
		};

		this.logs.push(logEntry);

		// Keep logs within limit
		if (this.logs.length > this.maxLogs) {
			this.logs.shift();
		}

		// Immediately flush high-severity events
		if (severity === 'high' || severity === 'critical') {
			await this._flushLogs();
		}

		// Log to console for development
		console.log(`🔐 [${severity.toUpperCase()}] ${eventType}:`, details);
	}

	/**
	 * Log AI interaction
	 */
	async logAIInteraction(interaction: any): Promise<void> {
		await this.logSecurityEvent('ai_interaction', {
			type: interaction.type,
			provider: interaction.provider,
			inputLength: interaction.input?.length || 0,
			outputLength: interaction.output?.length || 0,
			processingTime: interaction.processingTime,
			success: interaction.success,
			error: interaction.error?.message
		}, interaction.success ? 'info' : 'warning');
	}

	/**
	 * Log MCP server interaction
	 */
	async logMCPInteraction(interaction: any): Promise<void> {
		await this.logSecurityEvent('mcp_interaction', {
			server: interaction.server,
			method: interaction.method,
			parameters: this._sanitizeParameters(interaction.parameters),
			response: interaction.response ? 'received' : 'none',
			duration: interaction.duration,
			success: interaction.success,
			error: interaction.error?.message
		}, interaction.success ? 'info' : 'warning');
	}

	/**
	 * Log authentication event
	 */
	async logAuthenticationEvent(event: any): Promise<void> {
		const severity = event.success ? 'info' : 'warning';
		await this.logSecurityEvent('authentication', {
			action: event.action,
			method: event.method,
			success: event.success,
			userId: event.userId,
			ipAddress: event.ipAddress,
			userAgent: event.userAgent
		}, severity);
	}

	/**
	 * Log input validation event
	 */
	async logInputValidation(input: any, result: any): Promise<void> {
		if (result.riskLevel === 'high' || result.errors.length > 0) {
			await this.logSecurityEvent('input_validation', {
				inputType: result.inputType,
				inputLength: input.length,
				riskLevel: result.riskLevel,
				errors: result.errors,
				warnings: result.warnings,
				sanitized: result.sanitized !== input
			}, result.riskLevel === 'high' ? 'high' : 'warning');
		}
	}

	/**
	 * Log rate limit event
	 */
	async logRateLimit(identifier: string, action: string, blocked: boolean): Promise<void> {
		if (blocked) {
			await this.logSecurityEvent('rate_limit_exceeded', {
				identifier,
				action,
				blocked: true
			}, 'warning');
		}
	}

	/**
	 * Log permission check
	 */
	async logPermissionCheck(action: string, allowed: boolean, userId: string): Promise<void> {
		if (!allowed) {
			await this.logSecurityEvent('permission_denied', {
				action,
				userId,
				allowed: false
			}, 'warning');
		}
	}

	/**
	 * Log file operation
	 */
	async logFileOperation(operation: string, filePath: string, success: boolean, details: any = {}): Promise<void> {
		await this.logSecurityEvent('file_operation', {
			operation,
			filePath: this._sanitizeFilePath(filePath),
			success,
			fileSize: details.fileSize,
			mimeType: details.mimeType,
			error: details.error?.message
		}, success ? 'info' : 'warning');
	}

	/**
	 * Log configuration change
	 */
	async logConfigurationChange(key: string, oldValue: any, newValue: any, userId: string): Promise<void> {
		await this.logSecurityEvent('configuration_change', {
			key,
			oldValue: this._sanitizeConfigValue(oldValue),
			newValue: this._sanitizeConfigValue(newValue),
			userId
		}, 'info');
	}

	/**
	 * Log extension lifecycle event
	 */
	async logLifecycleEvent(event: string, details: any = {}): Promise<void> {
		await this.logSecurityEvent('lifecycle', {
			event,
			...details
		}, 'info');
	}

	/**
	 * Get audit logs with filtering
	 */
	async getLogs(filters: any = {}): Promise<AuditEvent[]> {
		await this.initialize();

		let filteredLogs = [...this.logs];

		// Apply filters
		if (filters.eventType) {
			filteredLogs = filteredLogs.filter((log: AuditEvent) => log.eventType === filters.eventType);
		}

		if (filters.severity) {
			filteredLogs = filteredLogs.filter((log: AuditEvent) => log.severity === filters.severity);
		}

		if (filters.startDate) {
			const startDate = new Date(filters.startDate);
			filteredLogs = filteredLogs.filter((log: AuditEvent) => new Date(log.timestamp) >= startDate);
		}

		if (filters.endDate) {
			const endDate = new Date(filters.endDate);
			filteredLogs = filteredLogs.filter((log: AuditEvent) => new Date(log.timestamp) <= endDate);
		}

		if (filters.userId) {
			filteredLogs = filteredLogs.filter((log: AuditEvent) => log.userId === filters.userId);
		}

		// Sort by timestamp (newest first)
		filteredLogs.sort((a: AuditEvent, b: AuditEvent) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

		return filteredLogs;
	}

	/**
	 * Get security statistics
	 */
	async getSecurityStats(timeRange: number = 24 * 60 * 60 * 1000): Promise<any> { // 24 hours
		await this.initialize();

		const now = Date.now();
		const startTime = now - timeRange;

		const recentLogs = this.logs.filter((log: AuditEvent) => new Date(log.timestamp).getTime() > startTime);

		const stats: any = {
			totalEvents: recentLogs.length,
			bySeverity: {},
			byEventType: {},
			highSeverityEvents: [],
			recentErrors: [],
			timeRange: `${timeRange / (60 * 60 * 1000)} hours`
		};

		for (const log of recentLogs) {
			// Count by severity
			stats.bySeverity[log.severity] = (stats.bySeverity[log.severity] || 0) + 1;

			// Count by event type
			stats.byEventType[log.eventType] = (stats.byEventType[log.eventType] || 0) + 1;

			// Track high severity events
			if (log.severity === 'high' || log.severity === 'critical') {
				stats.highSeverityEvents.push(log);
			}

			// Track recent errors
			if (log.severity === 'error' || log.severity === 'critical') {
				stats.recentErrors.push(log);
			}
		}

		return stats;
	}

	/**
	 * Export logs for analysis
	 */
	async exportLogs(format: string = 'json', filters: any = {}): Promise<string> {
		const logs = await this.getLogs(filters);

		switch (format) {
			case 'json':
				return JSON.stringify(logs, null, 2);
			case 'csv':
				return this._convertToCSV(logs);
			default:
				throw new Error(`Unsupported export format: ${format}`);
		}
	}

	/**
	 * Clear old logs
	 */
	async clearOldLogs(maxAge: number = 30 * 24 * 60 * 60 * 1000): Promise<void> { // 30 days
		await this.initialize();

		const now = Date.now();
		const cutoffTime = now - maxAge;

		this.logs = this.logs.filter((log: AuditEvent) => new Date(log.timestamp).getTime() > cutoffTime);

		await this._saveLogs();
		await this.logSecurityEvent('logs_cleaned', { removedCount: this.logs.length, maxAge }, 'info');
	}

	/**
	 * Sanitize log details to prevent sensitive data leakage
	 */
	_sanitizeLogDetails(details: any): any {
		if (!details || typeof details !== 'object') return details;

		const sanitized = { ...details };

		// Remove or mask sensitive fields
		const sensitiveFields = ['password', 'token', 'key', 'secret', 'apiKey', 'authToken'];

		for (const field of sensitiveFields) {
			if (sanitized[field]) {
				sanitized[field] = '[REDACTED]';
			}
		}

		return sanitized;
	}

	/**
	 * Sanitize parameters for logging
	 */
	_sanitizeParameters(params: any): any {
		if (!params) return params;

		// For MCP calls, limit parameter logging to prevent data leakage
		if (typeof params === 'object') {
			const sanitized: any = {};
			for (const [key, value] of Object.entries(params)) {
				if (key.toLowerCase().includes('key') || key.toLowerCase().includes('token')) {
					sanitized[key] = '[REDACTED]';
				} else if (typeof value === 'string' && value.length > 100) {
					sanitized[key] = value.substring(0, 100) + '...';
				} else {
					sanitized[key] = value;
				}
			}
			return sanitized;
		}

		return params;
	}

	/**
	 * Sanitize file paths for logging
	 */
	_sanitizeFilePath(filePath: string): string {
		if (!filePath) return filePath;

		// Remove user-specific paths that might contain sensitive information
		return filePath.replace(/\/Users\/[^\/]+/, '/Users/[USER]')
			.replace(/\/home\/[^\/]+/, '/home/[USER]')
			.replace(/C:\\Users\\[^\\]+/, 'C:\\Users\\[USER]');
	}

	/**
	 * Sanitize configuration values
	 */
	_sanitizeConfigValue(value: any): any {
		if (typeof value === 'string' && value.length > 50) {
			return value.substring(0, 50) + '...';
		}
		return value;
	}

	/**
	 * Get user ID for logging
	 */
	_getUserId(): string {
		// In a real implementation, this would get the actual user ID
		return 'vscode-user-' + Date.now().toString(36);
	}

	/**
	 * Get session ID
	 */
	_getSessionId(): string {
		// Generate or retrieve session ID
		if (!this._sessionId) {
			this._sessionId = 'session-' + Date.now().toString(36) + Math.random().toString(36).substr(2);
		}
		return this._sessionId;
	}

	/**
	 * Generate unique ID
	 */
	_generateId(): string {
		return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
	}

	/**
	 * Load logs from persistent storage
	 */
	async _loadLogs(): Promise<void> {
		try {
			const stored = await this.context.globalState.get('tnf.audit.logs', '[]');
			this.logs = JSON.parse(stored as string);
		} catch (error) {
			console.error('Failed to load audit logs:', error);
			this.logs = [];
		}
	}

	/**
	 * Save logs to persistent storage
	 */
	async _saveLogs(): Promise<void> {
		try {
			await this.context.globalState.update('tnf.audit.logs', JSON.stringify(this.logs));
		} catch (error) {
			console.error('Failed to save audit logs:', error);
		}
	}

	/**
	 * Flush logs to storage
	 */
	async _flushLogs(): Promise<void> {
		if (this.logs.length > 0) {
			await this._saveLogs();
		}
	}

	/**
	 * Convert logs to CSV format
	 */
	_convertToCSV(logs: AuditEvent[]): string {
		const headers = ['timestamp', 'eventType', 'severity', 'userId', 'sessionId', 'details'];
		const rows = logs.map(log => [
			log.timestamp,
			log.eventType,
			log.severity,
			log.userId || '',
			log.sessionId || '',
			JSON.stringify(log.details)
		]);

		return [headers, ...rows].map(row => row.map((field: string) => `"${field}"`).join(',')).join('\n');
	}

	/**
	 * Configure audit logger settings
	 */
	configure(options: { logLevel?: string; maxLogs?: number }): void {
		if (options.maxLogs) {
			this.maxLogs = options.maxLogs;
		}
		console.log('AuditLogger configured with:', options);
	}
}