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
exports.AgentPfpOverridesController = void 0;
const common_1 = require("@nestjs/common");
// @ts-ignore
// @ts-ignore
const swagger_1 = require("@nestjs/swagger");
const database_1 = require("@the-new-fuse/database");
const current_user_decorator_1 = require("../decorators/current-user.decorator");
const secure_auth_guard_1 = require("../guards/secure-auth.guard");
const agent_pfp_overrides_service_1 = require("../services/agent-pfp-overrides.service");
let AgentPfpOverridesController = class AgentPfpOverridesController {
    constructor(overridesService, db) {
        this.overridesService = overridesService;
        this.db = db;
    }
    async access(user) {
        if (!user || !user.id) {
            throw new common_1.HttpException('Authentication required', common_1.HttpStatus.UNAUTHORIZED);
        }
        try {
            return await this.overridesService.getCloudAccess(user.id);
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException(error.message || 'Failed to check cloud access', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async list(user, namespace) {
        if (!user || !user.id) {
            throw new common_1.HttpException('Authentication required', common_1.HttpStatus.UNAUTHORIZED);
        }
        try {
            const normalizedNamespace = this.normalizeNamespace(namespace);
            const overrides = await this.overridesService.listOverrides(user.id, normalizedNamespace);
            return { namespace: normalizedNamespace, overrides };
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException(error.message || 'Failed to list overrides', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async upsert(user, body) {
        if (!user || !user.id) {
            throw new common_1.HttpException('Authentication required', common_1.HttpStatus.UNAUTHORIZED);
        }
        try {
            if (!body?.agentId || !body?.override?.imageUrl) {
                throw new common_1.BadRequestException('agentId and override.imageUrl are required');
            }
            const normalizedNamespace = this.normalizeNamespace(body.namespace);
            await this.overridesService.upsertOverride(user.id, normalizedNamespace, body.agentId, body.override, { requirePaid: true });
            return { success: true };
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException(error.message || 'Failed to upsert override', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async upsertBatch(user, body) {
        if (!user || !user.id) {
            throw new common_1.HttpException('Authentication required', common_1.HttpStatus.UNAUTHORIZED);
        }
        try {
            const updates = Array.isArray(body?.updates) ? body.updates : [];
            if (updates.length === 0) {
                throw new common_1.BadRequestException('updates is required');
            }
            const normalizedNamespace = this.normalizeNamespace(body.namespace);
            for (const update of updates) {
                if (!update?.agentId || !update?.override?.imageUrl) {
                    continue;
                }
                await this.overridesService.upsertOverride(user.id, normalizedNamespace, update.agentId, update.override, { requirePaid: true });
            }
            return { success: true, updated: updates.length };
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException(error.message || 'Failed to upsert batch overrides', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async remove(user, agentId, namespace) {
        if (!user || !user.id) {
            throw new common_1.HttpException('Authentication required', common_1.HttpStatus.UNAUTHORIZED);
        }
        try {
            if (!agentId?.trim()) {
                throw new common_1.BadRequestException('agentId is required');
            }
            const normalizedNamespace = this.normalizeNamespace(namespace);
            await this.overridesService.removeOverride(user.id, normalizedNamespace, agentId, {
                requirePaid: true,
            });
            return { success: true };
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException(error.message || 'Failed to remove override', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async generate(user, body) {
        if (!user || !user.id) {
            throw new common_1.HttpException('Authentication required', common_1.HttpStatus.UNAUTHORIZED);
        }
        try {
            const providerId = String(body?.providerId || '');
            const prompt = String(body?.prompt || '').trim();
            const modelId = String(body?.modelId || '').trim();
            const customEndpoint = String(body?.customEndpoint || '').trim();
            if (!prompt) {
                throw new common_1.BadRequestException('prompt is required');
            }
            if (!providerId) {
                throw new common_1.BadRequestException('providerId is required');
            }
            const image = await this.generateImage({
                userId: user.id,
                providerId,
                modelId,
                prompt,
                apiKey: body?.apiKey,
                customEndpoint,
            });
            return {
                providerId,
                modelId: modelId || this.defaultModel(providerId),
                mimeType: image.mimeType,
                imageDataUrl: `data:${image.mimeType};base64,${image.buffer.toString('base64')}`,
            };
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException(error.message || 'Failed to generate image', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async generateImage(input) {
        const provider = input.providerId;
        if (provider === 'imfinit') {
            const url = new URL('https://api.imfin.it/api/generate');
            url.searchParams.set('prompt', input.prompt);
            url.searchParams.set('ar', '1:1');
            url.searchParams.set('model', input.modelId || 'gemini');
            url.searchParams.set('reroll', 'true');
            const response = await fetch(url.toString());
            return this.readImageResponse(response);
        }
        if (provider === 'pollinations') {
            const seed = String(Date.now());
            const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(input.prompt)}?width=1024&height=1024&nologo=true&private=true&seed=${seed}`;
            const response = await fetch(url);
            return this.readImageResponse(response);
        }
        if (provider === 'openai') {
            const apiKey = await this.resolveApiKey(input.userId, 'openai', input.apiKey);
            const response = await fetch('https://api.openai.com/v1/images/generations', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: input.modelId || 'gpt-image-1',
                    prompt: input.prompt,
                    size: '1024x1024',
                }),
            });
            if (!response.ok) {
                const body = await response.text().catch(() => '');
                throw new common_1.BadGatewayException(`OpenAI generation failed (${response.status}): ${body.slice(0, 180)}`);
            }
            const payload = (await response.json());
            const entry = payload.data?.[0];
            if (entry?.b64_json) {
                return {
                    buffer: Buffer.from(entry.b64_json, 'base64'),
                    mimeType: 'image/png',
                };
            }
            if (entry?.url) {
                const imageResponse = await fetch(entry.url);
                return this.readImageResponse(imageResponse);
            }
            throw new common_1.BadGatewayException('OpenAI did not return an image payload');
        }
        if (provider === 'stability') {
            const apiKey = await this.resolveApiKey(input.userId, 'stability', input.apiKey);
            const isUltra = (input.modelId || '').includes('ultra');
            const endpoint = isUltra
                ? 'https://api.stability.ai/v2beta/stable-image/generate/ultra'
                : 'https://api.stability.ai/v2beta/stable-image/generate/core';
            const form = new FormData();
            form.append('prompt', input.prompt);
            form.append('output_format', 'png');
            form.append('aspect_ratio', '1:1');
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    Accept: 'image/*',
                },
                body: form,
            });
            return this.readImageResponse(response);
        }
        if (provider === 'custom') {
            if (!input.customEndpoint) {
                throw new common_1.BadRequestException('customEndpoint is required for custom provider');
            }
            const response = await fetch(input.customEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(input.apiKey?.trim() ? { Authorization: `Bearer ${input.apiKey.trim()}` } : {}),
                },
                body: JSON.stringify({
                    prompt: input.prompt,
                    model: input.modelId || 'custom',
                    size: '1024x1024',
                }),
            });
            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
                const payload = (await response.json());
                if (payload.b64) {
                    return {
                        buffer: Buffer.from(payload.b64, 'base64'),
                        mimeType: 'image/png',
                    };
                }
                if (payload.imageUrl) {
                    const imageResponse = await fetch(payload.imageUrl);
                    return this.readImageResponse(imageResponse);
                }
                throw new common_1.BadGatewayException('Custom provider returned JSON without image payload');
            }
            return this.readImageResponse(response);
        }
        throw new common_1.BadRequestException(`Unsupported provider: ${provider}`);
    }
    async resolveApiKey(userId, provider, inlineApiKey) {
        const inline = String(inlineApiKey || '').trim();
        if (inline)
            return inline;
        const persisted = await this.db.providerApiKeys.findDecryptedByUserAndProvider(userId, provider);
        if (persisted?.apiKey?.trim()) {
            return persisted.apiKey.trim();
        }
        throw new common_1.BadRequestException(`No API key found for ${provider}. Add one in API settings or pass apiKey in request.`);
    }
    async readImageResponse(response) {
        if (!response.ok) {
            const body = await response.text().catch(() => '');
            throw new common_1.BadGatewayException(`Image provider request failed (${response.status}): ${body.slice(0, 180)}`);
        }
        const buffer = Buffer.from(await response.arrayBuffer());
        if (!buffer.length) {
            throw new common_1.ServiceUnavailableException('Image provider returned an empty image payload');
        }
        const mimeType = response.headers.get('content-type') || 'image/png';
        return { buffer, mimeType };
    }
    defaultModel(provider) {
        if (provider === 'imfinit')
            return 'gemini';
        if (provider === 'pollinations')
            return 'flux';
        if (provider === 'openai')
            return 'gpt-image-1';
        if (provider === 'stability')
            return 'stable-image-core';
        return 'custom';
    }
    normalizeNamespace(namespace) {
        const normalized = String(namespace || 'global')
            .trim()
            .replace(/[^a-zA-Z0-9:_-]+/g, '_')
            .slice(0, 120);
        return normalized || 'global';
    }
};
exports.AgentPfpOverridesController = AgentPfpOverridesController;
__decorate([
    (0, common_1.Get)('access'),
    (0, swagger_1.ApiOperation)({ summary: 'Returns whether current user can save cloud PFP overrides' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Cloud access status' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AgentPfpOverridesController.prototype, "access", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List cloud PFP overrides for current user namespace' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Override map' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('namespace')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AgentPfpOverridesController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Upsert a cloud PFP override for current user (paid members)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Override persisted' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AgentPfpOverridesController.prototype, "upsert", null);
__decorate([
    (0, common_1.Post)('batch'),
    (0, swagger_1.ApiOperation)({ summary: 'Batch upsert cloud PFP overrides for current user (paid members)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Batch persisted' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AgentPfpOverridesController.prototype, "upsertBatch", null);
__decorate([
    (0, common_1.Delete)(':agentId'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete cloud PFP override for current user (paid members)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Override deleted' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('agentId')),
    __param(2, (0, common_1.Query)('namespace')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], AgentPfpOverridesController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)('generate'),
    (0, swagger_1.ApiOperation)({ summary: 'Generate PFP image through backend provider bridge' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Generated image data URL' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AgentPfpOverridesController.prototype, "generate", null);
exports.AgentPfpOverridesController = AgentPfpOverridesController = __decorate([
    (0, swagger_1.ApiTags)('agent-pfp-overrides'),
    (0, common_1.Controller)('agent-pfp-overrides'),
    (0, secure_auth_guard_1.JwtAuth)(),
    (0, secure_auth_guard_1.SetRateLimitTier)(secure_auth_guard_1.RateLimitTier.API),
    __metadata("design:paramtypes", [agent_pfp_overrides_service_1.AgentPfpOverridesService,
        database_1.DatabaseService])
], AgentPfpOverridesController);
//# sourceMappingURL=agent-pfp-overrides.controller.js.map