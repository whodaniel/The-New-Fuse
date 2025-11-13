"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var A2AConfig_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.A2AConfig = exports.A2AConfigDto = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
// Simple config service implementation
class SimpleConfigService {
    get(key, defaultValue) {
        const value = process.env[key];
        if (value === undefined) {
            return defaultValue;
        }
        // Try to parse as number if defaultValue is a number
        if (typeof defaultValue === 'number') {
            const parsed = parseInt(value, 10);
            return (isNaN(parsed) ? defaultValue : parsed);
        }
        // Try to parse as boolean if defaultValue is a boolean
        if (typeof defaultValue === 'boolean') {
            return (value.toLowerCase() === 'true');
        }
        // Try to parse as array if defaultValue is an array
        if (Array.isArray(defaultValue)) {
            try {
                return JSON.parse(value);
            }
            catch {
                return defaultValue;
            }
        }
        return value;
    }
}
class A2AConfigDto {
    gatewayUrl;
    apiKey;
    timeout = 30;
    maxRetries = 3;
    retryDelay = 1000;
    enableLogging = true;
    enableMetrics = true;
    enableHealthChecks = true;
    allowedCapabilities = [];
    blockedCapabilities = [];
    maxMessageSize = 1024 * 1024; // 1MB
    rateLimitWindow = 60; // seconds
    rateLimitMaxRequests = 100;
    enableAgentDiscovery = true;
    enableAgentRegistration = true;
    agentDiscoveryEndpoint = '/a2a/discovery';
    agentRegistrationEndpoint = '/a2a/register';
    messageExchangeEndpoint = '/a2a/messages';
    enableSecurity = true;
    trustedAgents = [];
    blockedAgents = [];
    encryptionKey;
    enableEncryption = false;
    messageRetentionDays = 7;
    enableMessagePersistence = true;
    persistenceProvider = 'memory'; // 'memory', 'redis', 'database'
    redisUrl;
    databaseUrl;
    enableCircuitBreaker = true;
    circuitBreakerFailureThreshold = 5;
    circuitBreakerResetTimeout = 60000; // 1 minute
    enableLoadBalancing = false;
    loadBalancerEndpoints = [];
    loadBalancerStrategy = 'round-robin'; // 'round-robin', 'least-connections', 'random'
    enableCaching = true;
    cacheTtl = 300; // 5 minutes
    cacheMaxSize = 1000;
    enableWebhooks = false;
    webhookEndpoints = [];
    webhookSecret;
    enableMetricsCollection = true;
    metricsEndpoint = '/metrics';
    enableTracing = false;
    tracingEndpoint;
    tracingServiceName = 'a2a-gateway';
    enableGracefulShutdown = true;
    gracefulShutdownTimeout = 10000; // 10 seconds
    enableRequestValidation = true;
    enableResponseValidation = true;
    enableErrorHandling = true;
    enableLoggingMiddleware = true;
    logLevel = 'info'; // 'error', 'warn', 'info', 'debug', 'trace'
    enableStructuredLogging = true;
    logFormat = 'json'; // 'json', 'text'
    enableLogRotation = true;
    maxLogFiles = 10;
    maxLogFileSize = 10; // MB
}
exports.A2AConfigDto = A2AConfigDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], A2AConfigDto.prototype, "gatewayUrl", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], A2AConfigDto.prototype, "apiKey", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(60),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], A2AConfigDto.prototype, "timeout", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(1000),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], A2AConfigDto.prototype, "maxRetries", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(100),
    (0, class_validator_1.Max)(60000),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], A2AConfigDto.prototype, "retryDelay", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], A2AConfigDto.prototype, "enableLogging", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], A2AConfigDto.prototype, "enableMetrics", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], A2AConfigDto.prototype, "enableHealthChecks", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], A2AConfigDto.prototype, "allowedCapabilities", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], A2AConfigDto.prototype, "blockedCapabilities", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(10000),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], A2AConfigDto.prototype, "maxMessageSize", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(1000),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], A2AConfigDto.prototype, "rateLimitWindow", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(10000),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], A2AConfigDto.prototype, "rateLimitMaxRequests", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], A2AConfigDto.prototype, "enableAgentDiscovery", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], A2AConfigDto.prototype, "enableAgentRegistration", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], A2AConfigDto.prototype, "agentDiscoveryEndpoint", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], A2AConfigDto.prototype, "agentRegistrationEndpoint", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], A2AConfigDto.prototype, "messageExchangeEndpoint", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], A2AConfigDto.prototype, "enableSecurity", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], A2AConfigDto.prototype, "trustedAgents", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], A2AConfigDto.prototype, "blockedAgents", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], A2AConfigDto.prototype, "encryptionKey", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], A2AConfigDto.prototype, "enableEncryption", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(365),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], A2AConfigDto.prototype, "messageRetentionDays", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], A2AConfigDto.prototype, "enableMessagePersistence", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], A2AConfigDto.prototype, "persistenceProvider", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], A2AConfigDto.prototype, "redisUrl", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], A2AConfigDto.prototype, "databaseUrl", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], A2AConfigDto.prototype, "enableCircuitBreaker", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], A2AConfigDto.prototype, "circuitBreakerFailureThreshold", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1000),
    (0, class_validator_1.Max)(300000),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], A2AConfigDto.prototype, "circuitBreakerResetTimeout", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], A2AConfigDto.prototype, "enableLoadBalancing", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], A2AConfigDto.prototype, "loadBalancerEndpoints", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], A2AConfigDto.prototype, "loadBalancerStrategy", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], A2AConfigDto.prototype, "enableCaching", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(3600),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], A2AConfigDto.prototype, "cacheTtl", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(10000),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], A2AConfigDto.prototype, "cacheMaxSize", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], A2AConfigDto.prototype, "enableWebhooks", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], A2AConfigDto.prototype, "webhookEndpoints", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], A2AConfigDto.prototype, "webhookSecret", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], A2AConfigDto.prototype, "enableMetricsCollection", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], A2AConfigDto.prototype, "metricsEndpoint", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], A2AConfigDto.prototype, "enableTracing", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], A2AConfigDto.prototype, "tracingEndpoint", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], A2AConfigDto.prototype, "tracingServiceName", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], A2AConfigDto.prototype, "enableGracefulShutdown", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1000),
    (0, class_validator_1.Max)(30000),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], A2AConfigDto.prototype, "gracefulShutdownTimeout", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], A2AConfigDto.prototype, "enableRequestValidation", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], A2AConfigDto.prototype, "enableResponseValidation", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], A2AConfigDto.prototype, "enableErrorHandling", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], A2AConfigDto.prototype, "enableLoggingMiddleware", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], A2AConfigDto.prototype, "logLevel", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], A2AConfigDto.prototype, "enableStructuredLogging", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], A2AConfigDto.prototype, "logFormat", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], A2AConfigDto.prototype, "enableLogRotation", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], A2AConfigDto.prototype, "maxLogFiles", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], A2AConfigDto.prototype, "maxLogFileSize", void 0);
let A2AConfig = A2AConfig_1 = class A2AConfig {
    logger = new common_1.Logger(A2AConfig_1.name);
    config;
    configService;
    constructor() {
        this.configService = new SimpleConfigService();
        this.loadConfig();
    }
    loadConfig() {
        const configData = {
            gatewayUrl: this.configService.get('A2A_GATEWAY_URL'),
            apiKey: this.configService.get('A2A_API_KEY'),
            timeout: this.configService.get('A2A_TIMEOUT'),
            maxRetries: this.configService.get('A2A_MAX_RETRIES'),
            retryDelay: this.configService.get('A2A_RETRY_DELAY'),
            enableLogging: this.configService.get('A2A_ENABLE_LOGGING'),
            enableMetrics: this.configService.get('A2A_ENABLE_METRICS'),
            enableHealthChecks: this.configService.get('A2A_ENABLE_HEALTH_CHECKS'),
            allowedCapabilities: this.configService.get('A2A_ALLOWED_CAPABILITIES'),
            blockedCapabilities: this.configService.get('A2A_BLOCKED_CAPABILITIES'),
            maxMessageSize: this.configService.get('A2A_MAX_MESSAGE_SIZE'),
            rateLimitWindow: this.configService.get('A2A_RATE_LIMIT_WINDOW'),
            rateLimitMaxRequests: this.configService.get('A2A_RATE_LIMIT_MAX_REQUESTS'),
            enableAgentDiscovery: this.configService.get('A2A_ENABLE_AGENT_DISCOVERY'),
            enableAgentRegistration: this.configService.get('A2A_ENABLE_AGENT_REGISTRATION'),
            agentDiscoveryEndpoint: this.configService.get('A2A_AGENT_DISCOVERY_ENDPOINT'),
            agentRegistrationEndpoint: this.configService.get('A2A_AGENT_REGISTRATION_ENDPOINT'),
            messageExchangeEndpoint: this.configService.get('A2A_MESSAGE_EXCHANGE_ENDPOINT'),
            enableSecurity: this.configService.get('A2A_ENABLE_SECURITY'),
            trustedAgents: this.configService.get('A2A_TRUSTED_AGENTS'),
            blockedAgents: this.configService.get('A2A_BLOCKED_AGENTS'),
            encryptionKey: this.configService.get('A2A_ENCRYPTION_KEY'),
            enableEncryption: this.configService.get('A2A_ENABLE_ENCRYPTION'),
            messageRetentionDays: this.configService.get('A2A_MESSAGE_RETENTION_DAYS'),
            enableMessagePersistence: this.configService.get('A2A_ENABLE_MESSAGE_PERSISTENCE'),
            persistenceProvider: this.configService.get('A2A_PERSISTENCE_PROVIDER'),
            redisUrl: this.configService.get('A2A_REDIS_URL'),
            databaseUrl: this.configService.get('A2A_DATABASE_URL'),
            enableCircuitBreaker: this.configService.get('A2A_ENABLE_CIRCUIT_BREAKER'),
            circuitBreakerFailureThreshold: this.configService.get('A2A_CIRCUIT_BREAKER_FAILURE_THRESHOLD'),
            circuitBreakerResetTimeout: this.configService.get('A2A_CIRCUIT_BREAKER_RESET_TIMEOUT'),
            enableLoadBalancing: this.configService.get('A2A_ENABLE_LOAD_BALANCING'),
            loadBalancerEndpoints: this.configService.get('A2A_LOAD_BALANCER_ENDPOINTS'),
            loadBalancerStrategy: this.configService.get('A2A_LOAD_BALANCER_STRATEGY'),
            enableCaching: this.configService.get('A2A_ENABLE_CACHING'),
            cacheTtl: this.configService.get('A2A_CACHE_TTL'),
            cacheMaxSize: this.configService.get('A2A_CACHE_MAX_SIZE'),
            enableWebhooks: this.configService.get('A2A_ENABLE_WEBHOOKS'),
            webhookEndpoints: this.configService.get('A2A_WEBHOOK_ENDPOINTS'),
            webhookSecret: this.configService.get('A2A_WEBHOOK_SECRET'),
            enableMetricsCollection: this.configService.get('A2A_ENABLE_METRICS_COLLECTION'),
            metricsEndpoint: this.configService.get('A2A_METRICS_ENDPOINT'),
            enableTracing: this.configService.get('A2A_ENABLE_TRACING'),
            tracingEndpoint: this.configService.get('A2A_TRACING_ENDPOINT'),
            tracingServiceName: this.configService.get('A2A_TRACING_SERVICE_NAME'),
            enableGracefulShutdown: this.configService.get('A2A_ENABLE_GRACEFUL_SHUTDOWN'),
            gracefulShutdownTimeout: this.configService.get('A2A_GRACEFUL_SHUTDOWN_TIMEOUT'),
            enableRequestValidation: this.configService.get('A2A_ENABLE_REQUEST_VALIDATION'),
            enableResponseValidation: this.configService.get('A2A_ENABLE_RESPONSE_VALIDATION'),
            enableErrorHandling: this.configService.get('A2A_ENABLE_ERROR_HANDLING'),
            enableLoggingMiddleware: this.configService.get('A2A_ENABLE_LOGGING_MIDDLEWARE'),
            logLevel: this.configService.get('A2A_LOG_LEVEL'),
            enableStructuredLogging: this.configService.get('A2A_ENABLE_STRUCTURED_LOGGING'),
            logFormat: this.configService.get('A2A_LOG_FORMAT'),
            enableLogRotation: this.configService.get('A2A_ENABLE_LOG_ROTATION'),
            maxLogFiles: this.configService.get('A2A_MAX_LOG_FILES'),
            maxLogFileSize: this.configService.get('A2A_MAX_LOG_FILE_SIZE'),
        };
        // Filter out undefined values and apply defaults
        const filteredConfig = Object.fromEntries(Object.entries(configData).filter(([_, value]) => value !== undefined));
        this.config = (0, class_transformer_1.plainToClass)(A2AConfigDto, filteredConfig);
        // Validate configuration
        const errors = (0, class_validator_1.validateSync)(this.config);
        if (errors.length > 0) {
            const errorMessages = errors.map(error => Object.values(error.constraints || {})).flat();
            this.logger.error(`A2A configuration validation failed: ${errorMessages.join(', ')});`);
            throw new Error(`Invalid A2A configuration: ${errorMessages.join(', ')}`);
        }
        this.logger.log('A2A configuration loaded successfully');
    }
    get gatewayUrl() {
        return this.config.gatewayUrl;
    }
    get apiKey() {
        return this.config.apiKey;
    }
    get timeout() {
        return this.config.timeout;
    }
    get maxRetries() {
        return this.config.maxRetries;
    }
    get retryDelay() {
        return this.config.retryDelay;
    }
    get enableLogging() {
        return this.config.enableLogging;
    }
    get enableMetrics() {
        return this.config.enableMetrics;
    }
    get enableHealthChecks() {
        return this.config.enableHealthChecks;
    }
    get allowedCapabilities() {
        return this.config.allowedCapabilities || [];
    }
    get blockedCapabilities() {
        return this.config.blockedCapabilities || [];
    }
    get maxMessageSize() {
        return this.config.maxMessageSize;
    }
    get rateLimitWindow() {
        return this.config.rateLimitWindow;
    }
    get rateLimitMaxRequests() {
        return this.config.rateLimitMaxRequests;
    }
    get enableAgentDiscovery() {
        return this.config.enableAgentDiscovery;
    }
    get enableAgentRegistration() {
        return this.config.enableAgentRegistration;
    }
    get agentDiscoveryEndpoint() {
        return this.config.agentDiscoveryEndpoint;
    }
    get agentRegistrationEndpoint() {
        return this.config.agentRegistrationEndpoint;
    }
    get messageExchangeEndpoint() {
        return this.config.messageExchangeEndpoint;
    }
    get enableSecurity() {
        return this.config.enableSecurity;
    }
    get trustedAgents() {
        return this.config.trustedAgents || [];
    }
    get blockedAgents() {
        return this.config.blockedAgents || [];
    }
    get encryptionKey() {
        return this.config.encryptionKey;
    }
    get enableEncryption() {
        return this.config.enableEncryption;
    }
    get messageRetentionDays() {
        return this.config.messageRetentionDays;
    }
    get enableMessagePersistence() {
        return this.config.enableMessagePersistence;
    }
    get persistenceProvider() {
        return this.config.persistenceProvider;
    }
    get redisUrl() {
        return this.config.redisUrl;
    }
    get databaseUrl() {
        return this.config.databaseUrl;
    }
    get enableCircuitBreaker() {
        return this.config.enableCircuitBreaker;
    }
    get circuitBreakerFailureThreshold() {
        return this.config.circuitBreakerFailureThreshold;
    }
    get circuitBreakerResetTimeout() {
        return this.config.circuitBreakerResetTimeout;
    }
    get enableLoadBalancing() {
        return this.config.enableLoadBalancing;
    }
    get loadBalancerEndpoints() {
        return this.config.loadBalancerEndpoints || [];
    }
    get loadBalancerStrategy() {
        return this.config.loadBalancerStrategy;
    }
    get enableCaching() {
        return this.config.enableCaching;
    }
    get cacheTtl() {
        return this.config.cacheTtl;
    }
    get cacheMaxSize() {
        return this.config.cacheMaxSize;
    }
    get enableWebhooks() {
        return this.config.enableWebhooks;
    }
    get webhookEndpoints() {
        return this.config.webhookEndpoints || [];
    }
    get webhookSecret() {
        return this.config.webhookSecret;
    }
    get enableMetricsCollection() {
        return this.config.enableMetricsCollection;
    }
    get metricsEndpoint() {
        return this.config.metricsEndpoint;
    }
    get enableTracing() {
        return this.config.enableTracing;
    }
    get tracingEndpoint() {
        return this.config.tracingEndpoint;
    }
    get tracingServiceName() {
        return this.config.tracingServiceName;
    }
    get enableGracefulShutdown() {
        return this.config.enableGracefulShutdown;
    }
    get gracefulShutdownTimeout() {
        return this.config.gracefulShutdownTimeout;
    }
    get enableRequestValidation() {
        return this.config.enableRequestValidation;
    }
    get enableResponseValidation() {
        return this.config.enableResponseValidation;
    }
    get enableErrorHandling() {
        return this.config.enableErrorHandling;
    }
    get enableLoggingMiddleware() {
        return this.config.enableLoggingMiddleware;
    }
    get logLevel() {
        return this.config.logLevel;
    }
    get enableStructuredLogging() {
        return this.config.enableStructuredLogging;
    }
    get logFormat() {
        return this.config.logFormat;
    }
    get enableLogRotation() {
        return this.config.enableLogRotation;
    }
    get maxLogFiles() {
        return this.config.maxLogFiles;
    }
    get maxLogFileSize() {
        return this.config.maxLogFileSize;
    }
    // Helper methods
    isCapabilityAllowed(capability) {
        if (this.blockedCapabilities.includes(capability)) {
            return false;
        }
        if (this.allowedCapabilities.length > 0) {
            return this.allowedCapabilities.includes(capability);
        }
        return true;
    }
    isAgentTrusted(agentId) {
        if (this.blockedAgents.includes(agentId)) {
            return false;
        }
        if (this.trustedAgents.length > 0) {
            return this.trustedAgents.includes(agentId);
        }
        return true;
    }
    getAllConfig() {
        return { ...this.config };
    }
    updateConfig(updates) {
        const newConfig = { ...this.config, ...updates };
        const validatedConfig = (0, class_transformer_1.plainToClass)(A2AConfigDto, newConfig);
        const errors = (0, class_validator_1.validateSync)(validatedConfig);
        if (errors.length > 0) {
            const errorMessages = errors.map(error => Object.values(error.constraints || {})).flat();
            throw new Error(Invalid, A2A, configuration, update, $, { errorMessages, : .join(', ') } `);
    }

    this.config = validatedConfig;
    this.logger.log('A2A configuration updated successfully');
  }
});
        }
    }
};
exports.A2AConfig = A2AConfig;
exports.A2AConfig = A2AConfig = A2AConfig_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], A2AConfig);
//# sourceMappingURL=A2AConfig.js.map