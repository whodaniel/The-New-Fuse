const SecureConfigManager = require('./SecureConfigManager');
const InputValidator = require('./InputValidator');
const AuditLogger = require('./AuditLogger');
const SecureConnectionManager = require('./SecureConnectionManager');
const VulnerabilityScanner = require('./VulnerabilityScanner');

/**
 * Security Orchestrator
 * Central coordinator for all security features and modules
 */
class SecurityOrchestrator {
    constructor(context) {
        this.context = context;
        this.initialized = false;

        // Initialize security modules
        this.configManager = new SecureConfigManager(context);
        this.inputValidator = new InputValidator();
        this.auditLogger = new AuditLogger(context);
        this.connectionManager = new SecureConnectionManager();
        this.vulnerabilityScanner = new VulnerabilityScanner(context);

        // Security state
        this.securityEnabled = true;
        this.emergencyMode = false;
        this.lastSecurityCheck = null;
    }

    /**
     * Initialize all security systems
     */
    async initialize() {
        if (this.initialized) return;

        try {
            console.log('🔐 Initializing Security Orchestrator...');

            // Initialize all security modules
            await this.configManager.initialize();
            await this.auditLogger.initialize();

            // Configure security settings
            await this._configureSecuritySettings();

            // Start security monitoring
            this._startSecurityMonitoring();

            // Perform initial security scan
            await this._performInitialSecurityScan();

            this.initialized = true;
            this.lastSecurityCheck = new Date().toISOString();

            await this.auditLogger.logSecurityEvent('security_orchestrator_initialized', {
                modules: ['config', 'validation', 'audit', 'connection', 'scanner'],
                timestamp: this.lastSecurityCheck
            }, 'info');

            console.log('✅ Security Orchestrator initialized successfully');

        } catch (error) {
            console.error('Failed to initialize Security Orchestrator:', error);
            this.emergencyMode = true;
            throw new Error(`Security initialization failed: ${error.message}`);
        }
    }

    /**
     * Configure security settings from VSCode configuration
     */
    async _configureSecuritySettings() {
        const config = this.context.workspace?.getConfiguration('theNewFuse.security') || {};

        // Configure input validation
        this.inputValidator.configure({
            strictMode: config.get('strictValidation', true),
            maxInputLength: config.get('maxInputLength', 10000)
        });

        // Configure connection manager
        this.connectionManager.configure({
            encryptionEnabled: config.get('encryptionEnabled', true),
            timeout: config.get('connectionTimeout', 30000),
            maxSockets: config.get('maxSockets', 10)
        });

        // Configure vulnerability scanner
        this.vulnerabilityScanner.configure({
            scanInterval: config.get('scanInterval', 24 * 60 * 60 * 1000), // 24 hours
            monitoringEnabled: config.get('monitoringEnabled', true)
        });

        // Configure audit logging
        this.auditLogger.configure({
            logLevel: config.get('logLevel', 'info'),
            maxLogs: config.get('maxLogs', 5000)
        });
    }

    /**
     * Start security monitoring
     */
    _startSecurityMonitoring() {
        // Periodic security checks
        setInterval(async () => {
            try {
                await this._performSecurityHealthCheck();
            } catch (error) {
                console.error('Security health check failed:', error);
            }
        }, 60 * 60 * 1000); // Every hour

        // Rate limit cleanup
        setInterval(() => {
            this.inputValidator.cleanupRateLimits();
        }, 10 * 60 * 1000); // Every 10 minutes

        // Connection cleanup
        setInterval(() => {
            this.connectionManager.cleanup();
        }, 30 * 60 * 1000); // Every 30 minutes
    }

    /**
     * Perform initial security scan
     */
    async _performInitialSecurityScan() {
        try {
            const scanResults = await this.vulnerabilityScanner.performSecurityScan(['configuration']);
            if (scanResults.summary.totalVulnerabilities > 0) {
                await this.auditLogger.logSecurityEvent('initial_scan_findings', {
                    vulnerabilities: scanResults.summary.totalVulnerabilities,
                    critical: scanResults.summary.critical,
                    high: scanResults.summary.high
                }, scanResults.summary.critical > 0 ? 'high' : 'warning');
            }
        } catch (error) {
            console.warn('Initial security scan failed:', error);
        }
    }

    /**
     * Perform security health check
     */
    async _performSecurityHealthCheck() {
        const healthStatus = {
            timestamp: new Date().toISOString(),
            modules: {
                config: await this._checkModuleHealth('config'),
                validation: await this._checkModuleHealth('validation'),
                audit: await this._checkModuleHealth('audit'),
                connection: await this._checkModuleHealth('connection'),
                scanner: await this._checkModuleHealth('scanner')
            },
            overall: 'healthy'
        };

        // Check if any module is unhealthy
        const unhealthyModules = Object.entries(healthStatus.modules)
            .filter(([, status]) => status !== 'healthy')
            .map(([module]) => module);

        if (unhealthyModules.length > 0) {
            healthStatus.overall = 'degraded';
            await this.auditLogger.logSecurityEvent('health_check_warning', {
                unhealthyModules,
                healthStatus
            }, 'warning');
        }

        this.lastSecurityCheck = healthStatus.timestamp;
        return healthStatus;
    }

    /**
     * Check individual module health
     */
    async _checkModuleHealth(moduleName) {
        try {
            switch (moduleName) {
                case 'config':
                    return this.configManager._initialized ? 'healthy' : 'uninitialized';
                case 'validation':
                    return 'healthy'; // InputValidator doesn't have explicit health check
                case 'audit':
                    return this.auditLogger._initialized ? 'healthy' : 'uninitialized';
                case 'connection':
                    return 'healthy'; // Connection manager is always ready
                case 'scanner':
                    return 'healthy'; // Scanner is always ready
                default:
                    return 'unknown';
            }
        } catch (error) {
            return 'error';
        }
    }

    /**
     * Validate and sanitize user input
     */
    async validateInput(input, type = 'general', userId = 'unknown') {
        if (!this.securityEnabled) {
            return { isValid: true, sanitized: input, riskLevel: 'unknown' };
        }

        const validation = this.inputValidator.validateAndSanitizeInput(input, type);

        // Log validation results
        if (!validation.isValid || validation.riskLevel === 'high') {
            await this.auditLogger.logInputValidation({ input, type, userId }, validation);
        }

        // Check rate limits
        const rateLimits = await this.configManager.getRateLimits();
        const rateLimitCheck = this.inputValidator.checkRateLimit(
            userId,
            type === 'message' ? 'messages' : 'apiCalls',
            rateLimits[type === 'message' ? 'messages' : 'apiCalls']
        );

        if (!rateLimitCheck.allowed) {
            await this.auditLogger.logRateLimit(userId, type, true);
            return {
                isValid: false,
                errors: ['Rate limit exceeded'],
                sanitized: '',
                riskLevel: 'high'
            };
        }

        return validation;
    }

    /**
     * Check user permissions
     */
    async checkPermission(userId, action) {
        if (!this.securityEnabled) return true;

        const hasPermission = await this.configManager.getPermissions()[action] !== false;

        if (!hasPermission) {
            await this.auditLogger.logPermissionCheck(action, false, userId);
        }

        return hasPermission;
    }

    /**
     * Make secure API call
     */
    async makeSecureApiCall(endpoint, method = 'GET', data = null, options = {}) {
        if (!this.securityEnabled) {
            throw new Error('Security system is disabled');
        }

        // Check permissions
        const hasPermission = await this.checkPermission(options.userId || 'system', 'api.call');
        if (!hasPermission) {
            throw new Error('Insufficient permissions for API calls');
        }

        // Validate endpoint
        const endpointValidation = this.inputValidator.validateAndSanitizeInput(endpoint, 'url');
        if (!endpointValidation.isValid) {
            throw new Error(`Invalid endpoint: ${endpointValidation.errors.join(', ')}`);
        }

        // Make secure request
        const result = await this.connectionManager.makeSecureApiCall(
            endpointValidation.sanitized,
            method,
            data,
            options
        );

        // Log API call
        await this.auditLogger.logSecurityEvent('api_call', {
            endpoint: endpointValidation.sanitized,
            method,
            success: result.success,
            statusCode: result.statusCode,
            responseTime: result.responseTime,
            userId: options.userId || 'system'
        }, result.success ? 'info' : 'warning');

        return result;
    }

    /**
     * Store API key securely
     */
    async storeApiKey(provider, key, userId = 'system') {
        // Check permissions
        const hasPermission = await this.checkPermission(userId, 'config.manage');
        if (!hasPermission) {
            throw new Error('Insufficient permissions to manage API keys');
        }

        // Validate key format (basic check)
        if (!key || typeof key !== 'string' || key.length < 10) {
            throw new Error('Invalid API key format');
        }

        await this.configManager.storeApiKey(provider, key);

        await this.auditLogger.logSecurityEvent('api_key_stored', {
            provider,
            userId
        }, 'info');
    }

    /**
     * Get API key securely
     */
    async getApiKey(provider, userId = 'system') {
        // Check permissions
        const hasPermission = await this.checkPermission(userId, 'api.use');
        if (!hasPermission) {
            throw new Error('Insufficient permissions to access API keys');
        }

        const key = await this.configManager.getApiKey(provider);

        if (key) {
            await this.auditLogger.logSecurityEvent('api_key_accessed', {
                provider,
                userId
            }, 'info');
        }

        return key;
    }

    /**
     * Log AI interaction
     */
    async logAIInteraction(interaction) {
        await this.auditLogger.logAIInteraction(interaction);
    }

    /**
     * Log MCP interaction
     */
    async logMCPInteraction(interaction) {
        await this.auditLogger.logMCPInteraction(interaction);
    }

    /**
     * Perform security scan
     */
    async performSecurityScan(targets = ['codebase', 'configuration', 'network']) {
        const results = await this.vulnerabilityScanner.performSecurityScan(targets);

        // Log scan results
        await this.auditLogger.logSecurityEvent('security_scan_completed', {
            scanId: results.scanId,
            targets,
            findings: results.summary.totalVulnerabilities,
            critical: results.summary.critical,
            high: results.summary.high,
            duration: results.scanDuration
        }, results.summary.critical > 0 ? 'high' : 'info');

        return results;
    }

    /**
     * Get security dashboard data
     */
    async getSecurityDashboard() {
        const dashboard = {
            securityEnabled: this.securityEnabled,
            emergencyMode: this.emergencyMode,
            lastSecurityCheck: this.lastSecurityCheck,
            modules: {
                config: { status: await this._checkModuleHealth('config') },
                validation: { status: await this._checkModuleHealth('validation') },
                audit: { status: await this._checkModuleHealth('audit') },
                connection: { status: await this._checkModuleHealth('connection') },
                scanner: { status: await this._checkModuleHealth('scanner') }
            },
            vulnerabilityScan: this.vulnerabilityScanner.getSecurityDashboard(),
            auditStats: await this.auditLogger.getSecurityStats(),
            rateLimitStats: this.inputValidator.getSecurityStats(),
            connectionStats: this.connectionManager.getConnectionStats()
        };

        return dashboard;
    }

    /**
     * Enable emergency mode (reduced security for functionality)
     */
    async enableEmergencyMode(reason) {
        this.emergencyMode = true;
        this.securityEnabled = false;

        await this.auditLogger.logSecurityEvent('emergency_mode_enabled', {
            reason,
            timestamp: new Date().toISOString()
        }, 'critical');

        console.warn('🚨 EMERGENCY MODE ENABLED: Security features disabled');
    }

    /**
     * Disable emergency mode
     */
    async disableEmergencyMode() {
        this.emergencyMode = false;
        this.securityEnabled = true;

        await this.auditLogger.logSecurityEvent('emergency_mode_disabled', {
            timestamp: new Date().toISOString()
        }, 'info');

        console.log('✅ Emergency mode disabled, security features restored');
    }

    /**
     * Get security configuration
     */
    async getSecurityConfig() {
        return {
            enabled: this.securityEnabled,
            emergencyMode: this.emergencyMode,
            rateLimits: await this.configManager.getRateLimits(),
            permissions: await this.configManager.getPermissions(),
            auditEnabled: true,
            encryptionEnabled: true,
            httpsEnforced: true
        };
    }

    /**
     * Update security configuration
     */
    async updateSecurityConfig(config, userId = 'system') {
        // Check permissions
        const hasPermission = await this.checkPermission(userId, 'config.manage');
        if (!hasPermission) {
            throw new Error('Insufficient permissions to update security configuration');
        }

        // Update configurations
        if (config.rateLimits) {
            await this.configManager.updateRateLimits(config.rateLimits);
        }

        if (config.permissions) {
            await this.configManager.updatePermissions(config.permissions);
        }

        await this.auditLogger.logConfigurationChange('security', null, config, userId);
    }

    /**
     * Export security audit logs
     */
    async exportAuditLogs(format = 'json', filters = {}) {
        return await this.auditLogger.exportLogs(format, filters);
    }

    /**
     * Clean up security data
     */
    async cleanup() {
        // Clean up rate limits
        this.inputValidator.cleanupRateLimits();

        // Clean up connections
        this.connectionManager.cleanup();

        // Clean up old audit logs
        await this.auditLogger.clearOldLogs();

        console.log('🧹 Security cleanup completed');
    }
}

module.exports = SecurityOrchestrator;