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
exports.ModelsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let ModelsController = class ModelsController {
    async getAllModels(provider) {
        return [];
    }
    async getProviders() {
        return [
            { id: 'openai', name: 'OpenAI', models: ['gpt-4', 'gpt-3.5-turbo'] },
            { id: 'anthropic', name: 'Anthropic', models: ['claude-3-opus', 'claude-3-sonnet'] },
            { id: 'google', name: 'Google', models: ['gemini-pro'] },
            { id: 'google-adk', name: 'Google ADK Gateway', models: ['gemini-2.5-pro'] },
        ];
    }
    async getModelById(id) {
        return { id };
    }
    async selectModel(selection) {
        return { message: 'Model selected', ...selection };
    }
    async getActiveModel() {
        return { modelId: 'gpt-4', provider: 'openai' };
    }
    async testModel(id) {
        return { success: true, message: 'Model connection successful' };
    }
};
exports.ModelsController = ModelsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all available models' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of all models' }),
    __param(0, (0, common_1.Query)('provider')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ModelsController.prototype, "getAllModels", null);
__decorate([
    (0, common_1.Get)('providers'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all model providers' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of providers' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ModelsController.prototype, "getProviders", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get model details' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Model details' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ModelsController.prototype, "getModelById", null);
__decorate([
    (0, common_1.Post)('select'),
    (0, swagger_1.ApiOperation)({ summary: 'Select/set active model' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Model selected' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ModelsController.prototype, "selectModel", null);
__decorate([
    (0, common_1.Get)('current/active'),
    (0, swagger_1.ApiOperation)({ summary: 'Get currently active model' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Active model details' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ModelsController.prototype, "getActiveModel", null);
__decorate([
    (0, common_1.Post)(':id/test'),
    (0, swagger_1.ApiOperation)({ summary: 'Test model connection' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Test result' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ModelsController.prototype, "testModel", null);
exports.ModelsController = ModelsController = __decorate([
    (0, swagger_1.ApiTags)('models'),
    (0, common_1.Controller)('models'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard)
], ModelsController);
//# sourceMappingURL=models.controller.js.map