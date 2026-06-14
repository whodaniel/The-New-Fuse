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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminConfigController = void 0;
// @ts-nocheck
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const swagger_1 = require("@nestjs/swagger");
const repositories_1 = require("@the-new-fuse/database/drizzle/repositories");
const admin_guard_1 = require("../guards/admin.guard");
const secure_auth_guard_1 = require("../guards/secure-auth.guard");
const audit_service_1 = require("../services/audit.service");
const LLM_ROUTING_KEY = 'TNF_LLM_ROUTING_V1';
const DEFAULT_ROUTING_TARGETS = [
    'TheNewFuse',
    'api',
    'api-gateway',
    'ai-arcade',
    'backend',
    'clawdbot-cloud_runtime-template',
    'fuse-theia-ide',
    'openclaw-cloud',
    'openclaw-primary',
    'openclaw-sandbox-cloud',
    'picoclaw-perplexity',
    'picoclaw-subject',
    'picoclaw-tester',
    'picoclaw-tester-v2',
    'Postgres',
    'Redis',
    'relay-server',
    'tnf-cloud-sandbox',
    'tnf-cloud-sandbox-v2',
    'zeroclaw-sandbox',
    'Frontend Application',
];
/**
 * Admin Configuration Controller
 *
 * Manages system configuration and environment variables.
 * All endpoints require SUPER_ADMIN access.
 * Sensitive values are always masked in responses.
 */
let AdminConfigController = class AdminConfigController {
    constructor(configService, auditService) {
        this.configService = configService;
        this.auditService = auditService;
    }
    /**
     * Get all configuration items (with sensitive values masked)
     */
    async getAllConfig() {
        // Define configuration structure
        // In production, this would come from a database table
        const configs = [
            {
                key: 'MAX_UPLOAD_SIZE',
                value: this.configService.get('MAX_UPLOAD_SIZE') || '10485760',
                category: 'Application',
                description: 'Maximum file upload size in bytes',
                sensitive: false,
                updatedAt: new Date(),
                updatedBy: 'system',
            },
            {
                key: 'SESSION_TIMEOUT',
                value: this.configService.get('SESSION_TIMEOUT') || '3600',
                category: 'Security',
                description: 'Session timeout in seconds',
                sensitive: false,
                updatedAt: new Date(),
                updatedBy: 'system',
            },
            {
                key: 'API_RATE_LIMIT',
                value: this.configService.get('API_RATE_LIMIT') || '1000',
                category: 'API',
                description: 'API rate limit per hour',
                sensitive: false,
                updatedAt: new Date(),
                updatedBy: 'system',
            },
            {
                key: 'DATABASE_URL',
                value: this.maskSensitiveValue(this.configService.get('DATABASE_URL') || ''),
                category: 'Database',
                description: 'Primary database connection string',
                sensitive: true,
                updatedAt: new Date(),
                updatedBy: 'system',
            },
            {
                key: 'REDIS_URL',
                value: this.maskSensitiveValue(this.configService.get('REDIS_URL') || ''),
                category: 'Cache',
                description: 'Redis cache connection string',
                sensitive: true,
                updatedAt: new Date(),
                updatedBy: 'system',
            },
            {
                key: 'JWT_SECRET',
                value: '••••••••••••••••',
                category: 'Security',
                description: 'JWT signing secret',
                sensitive: true,
                updatedAt: new Date(),
                updatedBy: 'system',
            },
        ];
        return configs;
    }
    /**
     * Get configuration item by key (sensitive values masked)
     */
    async getConfigByKey(key) {
        const value = this.configService.get(key);
        if (value === undefined) {
            throw new common_1.NotFoundException(`Configuration key '${key}' not found`);
        }
        // Determine if this is a sensitive key
        const sensitiveKeys = [
            'DATABASE_URL',
            'REDIS_URL',
            'JWT_SECRET',
            'API_KEY',
            'SECRET',
            'PASSWORD',
            'TOKEN',
        ];
        const isSensitive = sensitiveKeys.some((sensitive) => key.toUpperCase().includes(sensitive));
        return {
            key,
            value: isSensitive ? this.maskSensitiveValue(value) : value,
            category: this.getCategoryForKey(key),
            description: `Configuration for ${key}`,
            sensitive: isSensitive,
            updatedAt: new Date(),
            updatedBy: 'system',
        };
    }
    /**
     * Update configuration item
     * WARNING: This is a dangerous operation that modifies environment variables
     */
    async updateConfig(key, updateData) {
        // In production, this would update environment variables or database
        // For now, we just audit log the attempt
        await this.auditService.log('config.updated', {
            resourceType: 'configuration',
            resourceId: key,
            details: {
                key,
                // Never log the actual value for sensitive keys
                valueUpdated: true,
            },
            status: 'success',
        });
        return {
            key,
            value: this.maskSensitiveValue(updateData.value),
            category: this.getCategoryForKey(key),
            description: `Configuration for ${key}`,
            sensitive: true,
            updatedAt: new Date(),
            updatedBy: 'admin',
        };
    }
    async getLlmRoutingOptions() {
        const enabledProviders = await repositories_1.drizzleLLMConfigRepository.findEnabled();
        const byProvider = new Map();
        for (const item of enabledProviders) {
            if (!byProvider.has(item.provider))
                byProvider.set(item.provider, new Set());
            byProvider.get(item.provider).add(item.modelName);
        }
        const providers = Array.from(byProvider.entries())
            .map(([provider, models]) => ({
            provider,
            models: Array.from(models).sort((a, b) => a.localeCompare(b)),
        }))
            .sort((a, b) => a.provider.localeCompare(b.provider));
        const systemAgents = await repositories_1.drizzleAgentRepository.findAllSystem(1, 250);
        const dynamicTargets = systemAgents.data
            .map((agent) => agent.name?.trim())
            .filter((name) => Boolean(name));
        const targets = Array.from(new Set([...DEFAULT_ROUTING_TARGETS, ...dynamicTargets])).sort((a, b) => a.localeCompare(b));
        return { providers, targets };
    }
    async getLlmRoutingConfig() {
        const stored = await repositories_1.drizzleConfigurationRepository.findConfigByKey(LLM_ROUTING_KEY);
        if (!stored?.value) {
            return this.defaultLlmRoutingConfig();
        }
        try {
            return this.normalizeLlmRoutingConfig(JSON.parse(stored.value));
        }
        catch {
            return this.defaultLlmRoutingConfig();
        }
    }
    async updateLlmRoutingConfig(payload) {
        if (!payload || typeof payload !== 'object') {
            throw new common_1.BadRequestException('Invalid payload');
        }
        const normalized = this.normalizeLlmRoutingConfig(payload);
        await repositories_1.drizzleConfigurationRepository.updateConfig(LLM_ROUTING_KEY, JSON.stringify(normalized), 'admin-config-controller');
        await this.auditService.log('llm.routing.updated', {
            resourceType: 'configuration',
            resourceId: LLM_ROUTING_KEY,
            details: {
                agentsConfigured: Object.keys(normalized.agents).length,
                globalPrimaryProvider: normalized.global.primary.provider,
                globalFallbackProvider: normalized.global.fallback.provider,
            },
            status: 'success',
        });
        return normalized;
    }
    async getEffectiveLlmRouting(target) {
        const config = await this.getLlmRoutingConfig();
        const entry = config.agents[target];
        if (entry?.enabled) {
            return {
                target,
                source: 'agent-override',
                primary: entry.primary,
                fallback: entry.fallback,
            };
        }
        return {
            target,
            source: 'global',
            primary: config.global.primary,
            fallback: config.global.fallback,
        };
    }
    /**
     * Mask sensitive configuration values
     */
    maskSensitiveValue(value) {
        if (!value || value.length === 0)
            return '••••••••';
        // For URLs, show protocol and host but mask credentials
        if (value.startsWith('postgresql://') || value.startsWith('redis://')) {
            // Extract protocol
            const protocolEnd = value.indexOf('://');
            if (protocolEnd === -1)
                return '••••••••••••••••';
            const protocol = value.substring(0, protocolEnd + 3);
            // Find the @ symbol which separates credentials from host
            const atIndex = value.indexOf('@');
            if (atIndex === -1) {
                // No credentials in URL
                return value;
            }
            // Extract host part
            const hostPart = value.substring(atIndex + 1);
            return `${protocol}••••••:••••••@${hostPart}`;
        }
        // For other sensitive values, show first and last 4 characters
        if (value.length <= 8) {
            return '••••••••';
        }
        return `${value.substring(0, 4)}${'•'.repeat(value.length - 8)}${value.substring(value.length - 4)}`;
    }
    /**
     * Get category for a configuration key
     */
    getCategoryForKey(key) {
        const keyUpper = key.toUpperCase();
        if (keyUpper.includes('DATABASE') || keyUpper.includes('DB'))
            return 'Database';
        if (keyUpper.includes('REDIS') || keyUpper.includes('CACHE'))
            return 'Cache';
        if (keyUpper.includes('JWT') || keyUpper.includes('AUTH') || keyUpper.includes('SESSION'))
            return 'Security';
        if (keyUpper.includes('API'))
            return 'API';
        if (keyUpper.includes('EMAIL') || keyUpper.includes('SMTP'))
            return 'Email';
        return 'Application';
    }
    defaultLlmRoutingConfig() {
        return {
            version: 1,
            updatedAt: new Date().toISOString(),
            global: {
                primary: { provider: '', model: '' },
                fallback: { provider: '', model: '' },
            },
            agents: {},
        };
    }
    normalizeLlmRoutingConfig(input) {
        const fallback = this.defaultLlmRoutingConfig();
        const output = {
            version: 1,
            updatedAt: new Date().toISOString(),
            global: {
                primary: this.normalizeSelection(input?.global?.primary),
                fallback: this.normalizeSelection(input?.global?.fallback),
            },
            agents: {},
        };
        const rawAgents = input?.agents && typeof input.agents === 'object' ? input.agents : {};
        for (const [target, config] of Object.entries(rawAgents)) {
            if (!target || typeof target !== 'string')
                continue;
            output.agents[target] = {
                enabled: Boolean(config?.enabled ?? true),
                primary: this.normalizeSelection(config?.primary),
                fallback: this.normalizeSelection(config?.fallback),
            };
        }
        // Keep at least one valid shape.
        if (!output.global.primary.provider &&
            !output.global.fallback.provider &&
            !Object.keys(output.agents).length) {
            return fallback;
        }
        return output;
    }
    normalizeSelection(selection) {
        return {
            provider: typeof selection?.provider === 'string' ? selection.provider.trim() : '',
            model: typeof selection?.model === 'string' ? selection.model.trim() : '',
        };
    }
};
exports.AdminConfigController = AdminConfigController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all configuration items' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of configuration items' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminConfigController.prototype, "getAllConfig", null);
__decorate([
    (0, common_1.Get)(':key'),
    (0, swagger_1.ApiOperation)({ summary: 'Get configuration by key' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Configuration item' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Configuration not found' }),
    __param(0, (0, common_1.Param)('key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminConfigController.prototype, "getConfigByKey", null);
__decorate([
    (0, common_1.Put)(':key'),
    (0, swagger_1.ApiOperation)({ summary: 'Update configuration item' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Configuration updated' }),
    __param(0, (0, common_1.Param)('key')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminConfigController.prototype, "updateConfig", null);
__decorate([
    (0, common_1.Get)('llm-routing/options'),
    (0, swagger_1.ApiOperation)({ summary: 'Get provider/model options and known admin routing targets' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Routing options for super admin control panel' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminConfigController.prototype, "getLlmRoutingOptions", null);
__decorate([
    (0, common_1.Get)('llm-routing'),
    (0, swagger_1.ApiOperation)({ summary: 'Get centralized LLM routing config' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Current global and per-agent LLM routing' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminConfigController.prototype, "getLlmRoutingConfig", null);
__decorate([
    (0, common_1.Put)('llm-routing'),
    (0, swagger_1.ApiOperation)({ summary: 'Update centralized LLM routing config' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Updated LLM routing config' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminConfigController.prototype, "updateLlmRoutingConfig", null);
__decorate([
    (0, common_1.Get)('llm-routing/effective/:target'),
    (0, swagger_1.ApiOperation)({ summary: 'Get effective LLM routing for a target service/agent' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Resolved routing (override if enabled, else global)' }),
    __param(0, (0, common_1.Param)('target')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminConfigController.prototype, "getEffectiveLlmRouting", null);
exports.AdminConfigController = AdminConfigController = __decorate([
    (0, swagger_1.ApiTags)('admin-config'),
    (0, common_1.Controller)('admin/config'),
    (0, common_1.UseGuards)(secure_auth_guard_1.SecureAuthGuard, admin_guard_1.AdminGuard),
    __metadata("design:paramtypes", [config_1.ConfigService,
        audit_service_1.AuditService])
], AdminConfigController);
//# sourceMappingURL=admin-config.controller.js.map