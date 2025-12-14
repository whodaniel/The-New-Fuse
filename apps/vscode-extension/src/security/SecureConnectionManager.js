const https = require('https');
const http = require('http');
const crypto = require('crypto');

/**
 * Secure Connection Manager
 * Handles HTTPS enforcement, request/response encryption, and secure communication
 */
class SecureConnectionManager {
    constructor(secureConfigManager = null) {
        this.httpsAgent = new https.Agent({
            rejectUnauthorized: true,
            keepAlive: true,
            timeout: 30000,
            maxSockets: 10
        });

        this.encryptionEnabled = true;
        this.certificateCache = new Map();
        this.connectionPool = new Map();
        this.secureConfigManager = secureConfigManager;

        // Encryption settings
        this.ALGORITHM = 'aes-256-gcm';
        this.KEY_LENGTH = 32;
        this.IV_LENGTH = 16;

        // Development mode configuration
        this.developmentMode = process.env.NODE_ENV === 'development' ||
                               process.env.TNF_DEV_MODE === 'true';
        this.allowLocalhost = this.developmentMode;
    }

    /**
     * Make a secure HTTP request with encryption
     */
    async makeSecureRequest(options) {
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
            const req = https.request(requestOptions, (res) => {
                // Validate SSL certificate
                this._validateCertificate(res);

                let data = '';

                res.on('data', (chunk) => {
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
                        reject(new Error(`Response decryption failed: ${error.message}`));
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

            // Send data if provided
            if (options.data) {
                let dataToSend = options.data;

                // Encrypt request data if enabled
                if (this.encryptionEnabled && options.encryptData) {
                    dataToSend = await this._encryptData(dataToSend);
                }

                req.write(dataToSend);
            }

            req.end();
        });
    }

    /**
     * Validate hostname for security
     */
    async _validateHostname(hostname) {
        if (!hostname) {
            throw new Error('Hostname is required');
        }

        // Local/private network addresses
        const localAddresses = [
            'localhost',
            '127.0.0.1',
            '0.0.0.0',
            '10.',
            '172.16.',
            '172.17.',
            '172.18.',
            '172.19.',
            '172.20.',
            '172.21.',
            '172.22.',
            '172.23.',
            '172.24.',
            '172.25.',
            '172.26.',
            '172.27.',
            '172.28.',
            '172.29.',
            '172.30.',
            '172.31.',
            '192.168.'
        ];

        // Check if hostname is a local address
        const isLocalAddress = localAddresses.some(addr => hostname.startsWith(addr));

        // Block local addresses in production mode
        if (isLocalAddress && !this.allowLocalhost) {
            throw new Error('Local/private network addresses are blocked in production mode. Set TNF_DEV_MODE=true for development.');
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
    _validateCertificate(response) {
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
    async _encryptHeaders(headers) {
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
     * Get encryption key from secure config manager
     */
    async _getEncryptionKey() {
        if (this.secureConfigManager) {
            // Get key from secure config manager
            const key = this.secureConfigManager._encryptionKey;
            if (key) {
                return Buffer.from(key, 'hex');
            }
        }

        // Fallback: generate session-specific key (not persisted)
        if (!this._sessionKey) {
            this._sessionKey = crypto.randomBytes(this.KEY_LENGTH);
            console.warn('⚠️ Using temporary session key - data will not persist across restarts');
        }
        return this._sessionKey;
    }

    /**
     * Encrypt data using AES-256-GCM
     */
    async _encryptData(data) {
        try {
            const key = await this._getEncryptionKey();
            const iv = crypto.randomBytes(this.IV_LENGTH);

            const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);
            let encrypted = cipher.update(data, 'utf8', 'hex');
            encrypted += cipher.final('hex');

            const authTag = cipher.getAuthTag();

            // Return IV:authTag:encrypted format
            return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
        } catch (error) {
            throw new Error(`Encryption failed: ${error.message}`);
        }
    }

    /**
     * Decrypt data using AES-256-GCM
     */
    async _decryptData(encryptedData) {
        try {
            const parts = encryptedData.split(':');
            if (parts.length !== 3) {
                throw new Error('Invalid encrypted data format');
            }

            const iv = Buffer.from(parts[0], 'hex');
            const authTag = Buffer.from(parts[1], 'hex');
            const encrypted = parts[2];

            const key = await this._getEncryptionKey();

            const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);
            decipher.setAuthTag(authTag);

            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');

            return decrypted;
        } catch (error) {
            throw new Error(`Decryption failed: ${error.message}`);
        }
    }

    /**
     * Decrypt response data
     */
    async _decryptResponse(data) {
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
    async testHttpsConnection(hostname, port = 443) {
        return new Promise((resolve) => {
            const options = {
                hostname,
                port,
                path: '/',
                method: 'HEAD',
                rejectUnauthorized: true,
                timeout: 5000
            };

            const req = https.request(options, (res) => {
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
    getConnectionStats() {
        return {
            activeConnections: this.httpsAgent.requests,
            freeSockets: Object.keys(this.httpsAgent.freeSockets).length,
            cachedCertificates: this.certificateCache.size,
            encryptionEnabled: this.encryptionEnabled,
            agentStats: {
                maxSockets: this.httpsAgent.maxSockets,
                maxFreeSockets: this.httpsAgent.maxFreeSockets,
                timeout: this.httpsAgent.options.timeout
            }
        };
    }

    /**
     * Configure connection settings
     */
    configure(options) {
        if (options.encryptionEnabled !== undefined) {
            this.encryptionEnabled = options.encryptionEnabled;
        }

        if (options.timeout) {
            this.httpsAgent.options.timeout = options.timeout;
        }

        if (options.maxSockets) {
            this.httpsAgent.maxSockets = options.maxSockets;
        }

        if (options.allowLocalhost !== undefined) {
            this.allowLocalhost = options.allowLocalhost;
        }

        if (options.developmentMode !== undefined) {
            this.developmentMode = options.developmentMode;
            this.allowLocalhost = options.developmentMode;
        }
    }

    /**
     * Clean up connections and caches
     */
    cleanup() {
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
    async makeSecureApiCall(endpoint, method = 'GET', data = null, options = {}) {
        const url = new URL(endpoint);

        const requestOptions = {
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
            startTime: Date.now()
        };

        if (data) {
            const jsonData = JSON.stringify(data);
            requestOptions.headers['Content-Length'] = Buffer.byteLength(jsonData);
            requestOptions.data = jsonData;
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
                error: error.message
            };
        }
    }
}

module.exports = SecureConnectionManager;