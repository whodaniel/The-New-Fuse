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
exports.AgentGrantsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../decorators/current-user.decorator");
const agent_grants_dto_1 = require("../dto/agent-grants.dto");
const secure_auth_guard_1 = require("../guards/secure-auth.guard");
const agent_api_grants_service_1 = require("../services/agent-api-grants.service");
let AgentGrantsController = class AgentGrantsController {
    constructor(grantsService) {
        this.grantsService = grantsService;
    }
    async list(user) {
        if (!user || !user.id) {
            throw new common_1.HttpException('Authentication required', common_1.HttpStatus.UNAUTHORIZED);
        }
        try {
            return await this.grantsService.listForUser(user.id);
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException(error.message || 'Failed to list grants', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async create(user, dto) {
        if (!user || !user.id) {
            throw new common_1.HttpException('Authentication required', common_1.HttpStatus.UNAUTHORIZED);
        }
        try {
            return await this.grantsService.createForUser(user.id, dto);
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException(error.message || 'Failed to create grant', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async revoke(user, id) {
        if (!user || !user.id) {
            throw new common_1.HttpException('Authentication required', common_1.HttpStatus.UNAUTHORIZED);
        }
        try {
            return await this.grantsService.revokeForUser(user.id, id);
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException(error.message || 'Failed to revoke grant', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async rotate(user, id) {
        if (!user || !user.id) {
            throw new common_1.HttpException('Authentication required', common_1.HttpStatus.UNAUTHORIZED);
        }
        try {
            return await this.grantsService.rotateForUser(user.id, id);
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException(error.message || 'Failed to rotate token', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.AgentGrantsController = AgentGrantsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List API grants for current user' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of grants' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AgentGrantsController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create scoped API grant for an agent' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Grant created with bearer token' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, agent_grants_dto_1.CreateAgentGrantDto]),
    __metadata("design:returntype", Promise)
], AgentGrantsController.prototype, "create", null);
__decorate([
    (0, common_1.Post)(':id/revoke'),
    (0, swagger_1.ApiOperation)({ summary: 'Revoke an API grant' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Grant revoked' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AgentGrantsController.prototype, "revoke", null);
__decorate([
    (0, common_1.Post)(':id/rotate'),
    (0, swagger_1.ApiOperation)({ summary: 'Rotate grant token (invalidates prior tokens)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'New token issued' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AgentGrantsController.prototype, "rotate", null);
exports.AgentGrantsController = AgentGrantsController = __decorate([
    (0, swagger_1.ApiTags)('agent-grants'),
    (0, common_1.Controller)('agent-grants'),
    (0, secure_auth_guard_1.JwtAuth)(),
    (0, secure_auth_guard_1.SetRateLimitTier)(secure_auth_guard_1.RateLimitTier.API),
    __metadata("design:paramtypes", [agent_api_grants_service_1.AgentApiGrantsService])
], AgentGrantsController);
//# sourceMappingURL=agent-grants.controller.js.map