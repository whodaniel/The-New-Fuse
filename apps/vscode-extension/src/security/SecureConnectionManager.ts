import * as https from 'https';
import * as http from 'http';

/**
 * Secure Connection Manager
 * Handles HTTPS enforcement, request/response encryption, and secure communication
 */
export class SecureConnectionManager {
	private httpsAgent: https.Agent;
	private encryptionEnabled: boolean = true;
	private certificateCache: Map<string, { validated: boolean; timestamp: number }> = new Map();
	private connectionPool: Map<string, unknown> = new Map();

	constructor() {
		this.httpsAgent = new https.Agent({
			rejectUnauthorized: true,
			keepAlive: true,
			timeout: 30000,
			maxSockets: 10
		});
	}

	/**
	 * Make a secure HTTP request with encryption
	 */
	async makeSecureRequest(options: any): Promise<any> {
		// Enforce HTTPS
		if (options.protocol && options.protocol !== 'https:') {
			throw new Error('HTTPS enforcement: Only HTTPS connections are allowed');
		}

		if (options.url) {
			const url = new URL(options.url);
			if (url.protocol !== 'https:') {
				throw new Error('HTTPS enforcement: Only HTTPS URLs are allowed');
			}
		}

		// Validate hostname
		await this._validateHostname(options.hostname || options.host);

		// Prepare request options
		const requestOptions = {
			...options,
			agent: this.httpsAgent,
			timeout: options.timeout || 30000,
			headers: {
				...options.headers,
				'User-Agent': 'TheNewFuse/7.0.0',
				'X-Requested-With': 'XMLHttpRequest'
			}
		};

		// Encrypt sensitive headers if enabled
		if (this.encryptionEnabled && options.encryptHeaders) {
			requestOptions.headers = await this._encryptHeaders(requestOptions.headers);
		}

		return new Promise((resolve, reject) => {
			const req = https.request(requestOptions, (res: any) => {
				// Validate SSL certificate
				this._validateCertificate(res);

				let data = '';

				res.on('data', (chunk: any) => {
					data += chunk;
				});

				res.on('end', async () => {
					try {
						// Decrypt response if needed
						if (this.encryptionEnabled && options.expectEncrypted) {
							data = await this._decryptResponse(data);
						}

						resolve({
							statusCode: res.statusCode,
							headers: res.headers,
							data: data,
							responseTime: Date.now() - (options.startTime || Date.now())
						});
					} catch (error) {
						reject(new Error(`Response decryption failed: ${(error as Error).message}`));
					}
				});
			});

			req.on('error', (error) => {
				reject(new Error(`Request failed: ${error.message}`));
			});

			req.on('timeout', () => {
				req.destroy();
				reject(new Error('Request timeout'));
			});

			// Send data if provided (must be done synchronously in request callback)
			if (options.data) {
				req.write(options.data);
			}

			req.end();
		});
	}

	/**
	 * Validate hostname for security
	 */
	async _validateHostname(hostname: string): Promise<void> {
		if (!hostname) {
			throw new Error('Hostname is required');
		}

		// Check against known malicious domains (basic check)
		const maliciousDomains = [
			'localhost', // For development only
			'127.0.0.1',
			'0.0.0.0',
			'10.0.0.0/8',
			'172.16.0.0/12',
			'192.168.0.0/16'
		];

		// In production, you would have a more sophisticated domain validation
		// For now, just ensure it's not obviously malicious
		if (maliciousDomains.some(domain => hostname.includes(domain))) {
			throw new Error('Potentially unsafe hostname detected');
		}

		// Cache successful validations
		this.certificateCache.set(hostname, {
			validated: true,
			timestamp: Date.now()
		});
	}

	/**
	 * Validate SSL certificate
	 */
	_validateCertificate(response: any): void {
		if (!response.socket || !response.socket.authorized) {
			throw new Error('SSL certificate validation failed');
		}

		const cert = response.socket.getPeerCertificate();
		if (!cert || !cert.subject) {
			throw new Error('Invalid SSL certificate');
		}

		// Check certificate validity
		const now = Date.now();
		const notBefore = new Date(cert.valid_from).getTime();
		const notAfter = new Date(cert.valid_to).getTime();

		if (now < notBefore || now > notAfter) {
			throw new Error('SSL certificate is not valid for current date');
		}
	}

	/**
	 * Encrypt headers containing sensitive information
	 */
	async _encryptHeaders(headers: any): Promise<any> {
		const encryptedHeaders = { ...headers };
		const sensitiveHeaderKeys = ['authorization', 'x-api-key', 'x-auth-token'];

		for (const key of sensitiveHeaderKeys) {
			if (encryptedHeaders[key]) {
				encryptedHeaders[key] = await this._encryptData(encryptedHeaders[key]);
				encryptedHeaders['x-encrypted-' + key] = 'true';
			}
		}

		return encryptedHeaders;
	}

	/**
	 * Encrypt data using a simple encryption scheme
	 * In production, use proper encryption like AES-256-GCM
	 */
	async _encryptData(data: string): Promise<string> {
		// Simple XOR encryption with a key (for demonstration)
		// In production, use crypto.createCipher
		const key = 'tnf-secure-key-2024';
		let encrypted = '';

		for (let i = 0; i < data.length; i++) {
			const charCode = data.charCodeAt(i) ^ key.charCodeAt(i % key.length);
			encrypted += String.fromCharCode(charCode);
		}

		return Buffer.from(encrypted).toString('base64');
	}

	/**
	 * Decrypt response data
	 */
	async _decryptData(encryptedData: string): Promise<string> {
		try {
			const encrypted = Buffer.from(encryptedData, 'base64').toString();
			const key = 'tnf-secure-key-2024';
			let decrypted = '';

			for (let i = 0; i < encrypted.length; i++) {
				const charCode = encrypted.charCodeAt(i) ^ key.charCodeAt(i % key.length);
				decrypted += String.fromCharCode(charCode);
			}

			return decrypted;
		} catch (error) {
			throw new Error('Decryption failed');
		}
	}

	/**
	 * Decrypt response data
	 */
	async _decryptResponse(data: string): Promise<string> {
		// Check if response is encrypted
		try {
			const parsed = JSON.parse(data);
			if (parsed.encrypted && parsed.data) {
				return await this._decryptData(parsed.data);
			}
		} catch {
			// Not JSON or not encrypted, return as-is
		}

		return data;
	}

	/**
	 * Test HTTPS connection to a host
	 */
	async testHttpsConnection(hostname: string, port: number = 443): Promise<any> {
		return new Promise((resolve) => {
			const options = {
				hostname,
				port,
				path: '/',
				method: 'HEAD',
				rejectUnauthorized: true,
				timeout: 5000
			};

			const req = https.request(options, (res: any) => {
				resolve({
					success: true,
					statusCode: res.statusCode,
					protocol: res.httpVersion,
					cipher: res.socket.getCipher?.()?.name || 'unknown'
				});
			});

			req.on('error', (error) => {
				resolve({
					success: false,
					error: error.message
				});
			});

			req.on('timeout', () => {
				req.destroy();
				resolve({
					success: false,
					error: 'Connection timeout'
				});
			});

			req.end();
		});
	}

	/**
	 * Get connection statistics
	 */
	getConnectionStats(): any {
		return {
			activeConnections: (this.httpsAgent as any).requests,
			freeSockets: Object.keys((this.httpsAgent as any).freeSockets).length,
			cachedCertificates: this.certificateCache.size,
			encryptionEnabled: this.encryptionEnabled,
			agentStats: {
				maxSockets: this.httpsAgent.maxSockets,
				maxFreeSockets: (this.httpsAgent as any).maxFreeSockets,
				timeout: (this.httpsAgent as any).options.timeout
			}
		};
	}

	/**
	 * Configure connection settings
	 */
	configure(options: any): void {
		if (options.encryptionEnabled !== undefined) {
			this.encryptionEnabled = options.encryptionEnabled;
		}

		if (options.timeout) {
			(this.httpsAgent as any).options.timeout = options.timeout;
		}

		if (options.maxSockets) {
			this.httpsAgent.maxSockets = options.maxSockets;
		}
	}

	/**
	 * Clean up connections and caches
	 */
	cleanup(): void {
		// Clear certificate cache (remove entries older than 1 hour)
		const now = Date.now();
		const maxAge = 60 * 60 * 1000; // 1 hour

		for (const [hostname, data] of this.certificateCache.entries()) {
			if (now - data.timestamp > maxAge) {
				this.certificateCache.delete(hostname);
			}
		}

		// Destroy agent (will be recreated on next request)
		this.httpsAgent.destroy();
		this.httpsAgent = new https.Agent({
			rejectUnauthorized: true,
			keepAlive: true,
			timeout: 30000,
			maxSockets: 10
		});
	}

	/**
	 * Make a secure API call with full security features
	 */
	async makeSecureApiCall(endpoint: string, method: string = 'GET', data: any = null, options: any = {}): Promise<any> {
		const url = new URL(endpoint);

		const jsonData = data ? JSON.stringify(data) : undefined;

		const requestOptions: any = {
			hostname: url.hostname,
			port: url.port || 443,
			path: url.pathname + url.search,
			method: method,
			headers: {
				'Content-Type': 'application/json',
				...options.headers
			},
			encryptData: this.encryptionEnabled,
			expectEncrypted: options.expectEncrypted || false,
			startTime: Date.now(),
			data: jsonData
		};

		if (jsonData) {
			requestOptions.headers['Content-Length'] = Buffer.byteLength(jsonData);
		}

		try {
			const response = await this.makeSecureRequest(requestOptions);

			if (response.statusCode >= 200 && response.statusCode < 300) {
				return {
					success: true,
					data: response.data,
					statusCode: response.statusCode,
					responseTime: response.responseTime
				};
			} else {
				return {
					success: false,
					error: `HTTP ${response.statusCode}: ${response.data}`,
					statusCode: response.statusCode
				};
			}
		} catch (error) {
			return {
				success: false,
				error: (error as Error).message
			};
		}
	}
}