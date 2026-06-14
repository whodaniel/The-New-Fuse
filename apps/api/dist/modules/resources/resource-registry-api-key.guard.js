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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourceRegistryApiKeyGuard = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let ResourceRegistryApiKeyGuard = class ResourceRegistryApiKeyGuard {
    constructor(configService) {
        this.configService = configService;
    }
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const expectedApiKeys = this.readConfigValues([
            'RESOURCE_REGISTRY_API_KEY',
            'TNF_RESOURCE_REGISTRY_API_KEY',
            'API_KEY',
            'COMMUNITY_API_KEY',
        ]);
        const expectedBearerTokens = this.readConfigValues([
            'RESOURCE_REGISTRY_BEARER_TOKEN',
            'TNF_RESOURCE_REGISTRY_BEARER_TOKEN',
            'SUPER_ADMIN_TOKEN',
        ]);
        if (expectedApiKeys.length === 0 && expectedBearerTokens.length === 0) {
            throw new common_1.UnauthorizedException('Resource registry ingest auth is not configured (missing API key/bearer token env)');
        }
        const authorization = this.normalizeHeader(request.get('authorization'));
        if (authorization?.toLowerCase().startsWith('bearer ')) {
            const providedBearer = authorization.slice('bearer '.length).trim();
            if (providedBearer && expectedBearerTokens.includes(providedBearer)) {
                return true;
            }
        }
        const providedApiKey = this.normalizeHeader(request.get('x-api-key')) ||
            this.normalizeHeader(request.get('X-API-Key')) ||
            this.normalizeHeader(request.get('x-community-api-key'));
        if (providedApiKey && expectedApiKeys.includes(providedApiKey)) {
            return true;
        }
        throw new common_1.UnauthorizedException('Invalid resource registry ingest credentials');
    }
    readConfigValues(keys) {
        return keys
            .map((key) => this.normalizeHeader(this.configService.get(key)))
            .filter((value) => Boolean(value));
    }
    normalizeHeader(value) {
        if (Array.isArray(value)) {
            return String(value[0] || '').trim();
        }
        return String(value || '').trim();
    }
};
exports.ResourceRegistryApiKeyGuard = ResourceRegistryApiKeyGuard;
exports.ResourceRegistryApiKeyGuard = ResourceRegistryApiKeyGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ResourceRegistryApiKeyGuard);
//# sourceMappingURL=resource-registry-api-key.guard.js.map