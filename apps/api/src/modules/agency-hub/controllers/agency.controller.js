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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgencyController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const enhanced_agency_service_1 = require("@the-new-fuse/core/services/enhanced-agency.service");
const auth_guard_1 = require("../../guards/auth.guard");
const roles_guard_1 = require("../../guards/roles.guard");
const roles_decorator_1 = require("../../decorators/roles.decorator");
const client_1 = require("@prisma/client");
let AgencyController = class AgencyController {
    enhancedAgencyService;
    constructor(enhancedAgencyService) {
        this.enhancedAgencyService = enhancedAgencyService;
    }
    async createAgency(createAgencyDto) {
        try {
            return await this.enhancedAgencyService.createAgencyWithSwarm(createAgencyDto);
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Failed to create agency', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async getAgency(agencyId) {
        try {
            return await this.enhancedAgencyService.getAgencyWithSwarmStatus(agencyId);
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Agency not found', common_1.HttpStatus.NOT_FOUND);
        }
    }
    async updateAgency(agencyId, updateAgencyDto) {
        try {
            return await this.enhancedAgencyService.updateAgencyConfiguration(agencyId, updateAgencyDto);
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Failed to update agency', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async initializeSwarm(agencyId, config) {
        try {
            return await this.enhancedAgencyService.initializeSwarm(agencyId, config);
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Failed to initialize swarm', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async getSwarmStatus(agencyId) {
        try {
            return await this.enhancedAgencyService.getSwarmStatus(agencyId);
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Failed to get swarm status', common_1.HttpStatus.NOT_FOUND);
        }
    }
    async registerProviders(agencyId, providersDto) {
        try {
            return await this.enhancedAgencyService.registerProviders(agencyId, providersDto);
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Failed to register providers', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async getProviders(agencyId, categoryId, active) {
        try {
            return await this.enhancedAgencyService.getProviders(agencyId, {
                categoryId,
                active
            });
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Failed to get providers', common_1.HttpStatus.NOT_FOUND);
        }
    }
    async getAnalytics(agencyId, timeframe = '30d') {
        try {
            return await this.enhancedAgencyService.getAnalytics(agencyId, timeframe);
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Failed to get analytics', common_1.HttpStatus.NOT_FOUND);
        }
    }
};
exports.AgencyController = AgencyController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new agency with swarm capabilities' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Agency created successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AgencyController.prototype, "createAgency", null);
__decorate([
    (0, common_1.Get)(':agencyId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get agency details with swarm status' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Agency details retrieved' }),
    __param(0, (0, common_1.Param)('agencyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AgencyController.prototype, "getAgency", null);
__decorate([
    (0, common_1.Put)(':agencyId'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.AGENCY_OWNER, client_1.UserRole.AGENCY_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Update agency configuration' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Agency updated successfully' }),
    __param(0, (0, common_1.Param)('agencyId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AgencyController.prototype, "updateAgency", null);
__decorate([
    (0, common_1.Post)(':agencyId/swarm/initialize'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.AGENCY_OWNER, client_1.UserRole.AGENCY_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Initialize swarm for agency' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Swarm initialized successfully' }),
    __param(0, (0, common_1.Param)('agencyId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AgencyController.prototype, "initializeSwarm", null);
__decorate([
    (0, common_1.Get)(':agencyId/swarm/status'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current swarm status for agency' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Swarm status retrieved' }),
    __param(0, (0, common_1.Param)('agencyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AgencyController.prototype, "getSwarmStatus", null);
__decorate([
    (0, common_1.Post)(':agencyId/providers/register'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.AGENCY_ADMIN, client_1.UserRole.AGENCY_MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Register service providers' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Providers registered successfully' }),
    __param(0, (0, common_1.Param)('agencyId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AgencyController.prototype, "registerProviders", null);
__decorate([
    (0, common_1.Get)(':agencyId/providers'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all service providers for agency' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Providers retrieved successfully' }),
    __param(0, (0, common_1.Param)('agencyId')),
    __param(1, (0, common_1.Query)('categoryId')),
    __param(2, (0, common_1.Query)('active')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Boolean]),
    __metadata("design:returntype", Promise)
], AgencyController.prototype, "getProviders", null);
__decorate([
    (0, common_1.Get)(':agencyId/analytics'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.AGENCY_OWNER, client_1.UserRole.AGENCY_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get agency performance analytics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Analytics retrieved successfully' }),
    __param(0, (0, common_1.Param)('agencyId')),
    __param(1, (0, common_1.Query)('timeframe')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AgencyController.prototype, "getAnalytics", null);
exports.AgencyController = AgencyController = __decorate([
    (0, swagger_1.ApiTags)('agencies'),
    (0, common_1.Controller)('api/agencies'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [typeof (_a = typeof enhanced_agency_service_1.EnhancedAgencyService !== "undefined" && enhanced_agency_service_1.EnhancedAgencyService) === "function" ? _a : Object])
], AgencyController);
