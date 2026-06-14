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
exports.ProviderKeysController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../decorators/current-user.decorator");
const provider_keys_dto_1 = require("../dto/provider-keys.dto");
const secure_auth_guard_1 = require("../guards/secure-auth.guard");
const provider_keys_service_1 = require("../services/provider-keys.service");
let ProviderKeysController = class ProviderKeysController {
    constructor(providerKeysService) {
        this.providerKeysService = providerKeysService;
    }
    async list(user) {
        return this.providerKeysService.listForUser(user.id);
    }
    async save(user, dto) {
        return this.providerKeysService.saveForUser(user.id, dto);
    }
    async remove(user, id) {
        await this.providerKeysService.deleteForUser(user.id, id);
        return { success: true };
    }
};
exports.ProviderKeysController = ProviderKeysController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List current user provider API key metadata' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Provider key metadata list' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProviderKeysController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create or update provider API key for current user' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Provider key metadata' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, provider_keys_dto_1.SaveProviderKeyDto]),
    __metadata("design:returntype", Promise)
], ProviderKeysController.prototype, "save", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete provider API key for current user' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Provider key deleted' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ProviderKeysController.prototype, "remove", null);
exports.ProviderKeysController = ProviderKeysController = __decorate([
    (0, swagger_1.ApiTags)('provider-keys'),
    (0, common_1.Controller)('provider-keys'),
    (0, common_1.UseGuards)(secure_auth_guard_1.SecureAuthGuard),
    (0, secure_auth_guard_1.JwtAuth)(),
    (0, secure_auth_guard_1.SetRateLimitTier)(secure_auth_guard_1.RateLimitTier.API),
    __metadata("design:paramtypes", [provider_keys_service_1.ProviderKeysService])
], ProviderKeysController);
//# sourceMappingURL=provider-keys.controller.js.map