import * as vscode from 'vscode';

export enum LogLevel {
	ERROR = 0,
	WARN = 1,
	INFO = 2,
	DEBUG = 3
}

/**
 * Logging Service for The New Fuse extension
 */
export class LoggingService {
	private outputChannel: vscode.OutputChannel;
	private logLevel: LogLevel = LogLevel.INFO;

	constructor() {
		this.outputChannel = vscode.window.createOutputChannel('The New Fuse');
		this.updateLogLevel();
	}

	/**
	 * Update log level based on configuration
	 */
	private updateLogLevel(): void {
		const config = vscode.workspace.getConfiguration('newFuse');
		const debugEnabled = config.get('enableDebugLogging', false);
		this.logLevel = debugEnabled ? LogLevel.DEBUG : LogLevel.INFO;
	}

	/**
	 * Log an error message
	 */
	error(message: string, error?: any): void {
		if (this.logLevel >= LogLevel.ERROR) {
			const timestamp = new Date().toISOString();
			const logMessage = `[${timestamp}] ERROR: ${message}`;
			
			this.outputChannel.appendLine(logMessage);
			
			if (error) {
				if (error instanceof Error) {
					this.outputChannel.appendLine(`  Stack: ${error.stack}`);
				} else {
					this.outputChannel.appendLine(`  Details: ${JSON.stringify(error, null, 2)}`);
				}
			}
			
			console.error(`[New Fuse] ${message}`, error);
		}
	}

	/**
	 * Log a warning message
	 */
	warn(message: string, data?: any): void {
		if (this.logLevel >= LogLevel.WARN) {
			const timestamp = new Date().toISOString();
			const logMessage = `[${timestamp}] WARN: ${message}`;
			
			this.outputChannel.appendLine(logMessage);
			
			if (data) {
				this.outputChannel.appendLine(`  Data: ${JSON.stringify(data, null, 2)}`);
			}
			
			console.warn(`[New Fuse] ${message}`, data);
		}
	}

	/**
	 * Log an info message
	 */
	info(message: string, data?: any): void {
		if (this.logLevel >= LogLevel.INFO) {
			const timestamp = new Date().toISOString();
			const logMessage = `[${timestamp}] INFO: ${message}`;
			
			this.outputChannel.appendLine(logMessage);
			
			if (data) {
				this.outputChannel.appendLine(`  Data: ${JSON.stringify(data, null, 2)}`);
			}
			
			console.info(`[New Fuse] ${message}`, data);
		}
	}

	/**
	 * Log a debug message
	 */
	debug(message: string, data?: any): void {
		if (this.logLevel >= LogLevel.DEBUG) {
			const timestamp = new Date().toISOString();
			const logMessage = `[${timestamp}] DEBUG: ${message}`;
			
			this.outputChannel.appendLine(logMessage);
			
			if (data) {
				this.outputChannel.appendLine(`  Data: ${JSON.stringify(data, null, 2)}`);
			}
			
			console.debug(`[New Fuse] ${message}`, data);
		}
	}

	/**
	 * Log API request
	 */
	logApiRequest(method: string, url: string, data?: any): void {
		this.debug(`API Request: ${method.toUpperCase()} ${url}`, data);
	}

	/**
	 * Log API response
	 */
	logApiResponse(method: string, url: string, status: number, data?: any): void {
		this.debug(`API Response: ${method.toUpperCase()} ${url} - ${status}`, data);
	}

	/**
	 * Log chat interaction
	 */
	logChatInteraction(participantName: string, prompt: string, responseLength?: number): void {
		this.info(`Chat: ${participantName} - Prompt: "${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}"${responseLength ? ` - Response: ${responseLength} chars` : ''}`);
	}

	/**
	 * Log performance metric
	 */
	logPerformance(operation: string, duration: number, success: boolean): void {
		const status = success ? 'SUCCESS' : 'FAILED';
		this.info(`Performance: ${operation} - ${duration}ms - ${status}`);
	}

	/**
	 * Log configuration change
	 */
	logConfigurationChange(key: string, oldValue?: any, newValue?: any): void {
		this.info(`Configuration changed: ${key}`, {
			old: oldValue,
			new: newValue
		});
	}

	/**
	 * Log extension lifecycle event
	 */
	logLifecycle(event: string, details?: any): void {
		this.info(`Lifecycle: ${event}`, details);
	}

	/**
	 * Show the output channel
	 */
	show(): void {
		this.outputChannel.show();
	}

	/**
	 * Clear the output channel
	 */
	clear(): void {
		this.outputChannel.clear();
	}

	/**
	 * Dispose the output channel
	 */
	dispose(): void {
		this.outputChannel.dispose();
	}

	/**
	 * Create a timer for measuring operation duration
	 */
	createTimer(operation: string): Timer {
		return new Timer(operation, this);
	}
}

/**
 * Timer class for measuring operation duration
 */
export class Timer {
	private startTime: number;
	private operation: string;
	private loggingService: LoggingService;

	constructor(operation: string, loggingService: LoggingService) {
		this.operation = operation;
		this.loggingService = loggingService;
		this.startTime = Date.now();
	}

	/**
	 * End the timer and log the result
	 */
	end(success: boolean = true): number {
		const duration = Date.now() - this.startTime;
		this.loggingService.logPerformance(this.operation, duration, success);
		return duration;
	}

	/**
	 * Get elapsed time without ending the timer
	 */
	elapsed(): number {
		return Date.now() - this.startTime;
	}
}
