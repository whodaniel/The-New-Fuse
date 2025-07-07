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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceRequestController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const service_category_router_service_1 = require("@the-new-fuse/core/services/service-category-router.service");
const enhanced_agency_service_1 = require("@the-new-fuse/core/services/enhanced-agency.service");
const auth_guard_1 = require("../../../guards/auth.guard");
const roles_guard_1 = require("../../../guards/roles.guard");
const roles_decorator_1 = require("../../../decorators/roles.decorator");
const current_user_decorator_1 = require("../../../decorators/current-user.decorator");
const client_1 = require("@prisma/client");
let ServiceRequestController = class ServiceRequestController {
    serviceCategoryRouter;
    enhancedAgencyService;
    constructor(serviceCategoryRouter, enhancedAgencyService) {
        this.serviceCategoryRouter = serviceCategoryRouter;
        this.enhancedAgencyService = enhancedAgencyService;
    }
    async createServiceRequest(requestDto, user) {
        try {
            return await this.enhancedAgencyService.submitServiceRequest(user.agencyId, user.id, requestDto);
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Failed to create service request', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async getServiceRequests(agencyId, status, categoryId, providerId, limit = 50, offset = 0, user) {
        try {
            // Use agencyId from user context if not provided
            const targetAgencyId = agencyId || user.agencyId;
            return await this.enhancedAgencyService.getServiceRequests(targetAgencyId, {
                status,
                categoryId,
                providerId,
                limit,
                offset
            });
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Failed to get service requests', common_1.HttpStatus.NOT_FOUND);
        }
    }
    async getServiceRequest(requestId) {
        try {
            return await this.enhancedAgencyService.getServiceRequestDetails(requestId);
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Service request not found', common_1.HttpStatus.NOT_FOUND);
        }
    }
    async updateRequestStatus(requestId, statusDto) {
        try {
            return await this.enhancedAgencyService.updateServiceRequestStatus(requestId, statusDto.status, statusDto.reason);
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Failed to update status', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async assignRequest(requestId, assignmentDto) {
        try {
            return await this.serviceCategoryRouter.assignRequestToProvider(requestId, assignmentDto.providerId, assignmentDto.priority);
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Failed to assign request', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async autoAssignRequest(requestId) {
        try {
            const requestDetails = await this.enhancedAgencyService.getServiceRequestDetails(requestId);
            const bestProvider = await this.serviceCategoryRouter.findBestProvider(requestDetails.categoryId, requestDetails.agencyId, requestDetails.requirements);
            if (!bestProvider) {
                throw new common_1.HttpException('No suitable provider found', common_1.HttpStatus.NOT_FOUND);
            }
            return await this.serviceCategoryRouter.assignRequestToProvider(requestId, bestProvider.id);
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Failed to auto-assign request', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async getProviderRecommendations(requestId) {
        try {
            const requestDetails = await this.enhancedAgencyService.getServiceRequestDetails(requestId);
            return await this.serviceCategoryRouter.getProviderRecommendations(requestDetails.categoryId, requestDetails.agencyId, requestDetails.requirements);
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Failed to get recommendations', common_1.HttpStatus.NOT_FOUND);
        }
    }
    async completeRequest(requestId, completionDto) {
        try {
            return await this.enhancedAgencyService.completeServiceRequest(requestId, completionDto.deliverables, completionDto.qualityScore, completionDto.notes);
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Failed to complete request', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async submitReview(requestId, reviewDto, user) {
        try {
            return await this.enhancedAgencyService.submitServiceReview(requestId, user.id, reviewDto);
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Failed to submit review', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async getRequestsByCategory(categoryId, agencyId, status, limit = 50, offset = 0) {
        try {
            return await this.serviceCategoryRouter.getRequestsByCategory(categoryId, agencyId, { status, limit, offset });
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Failed to get category requests', common_1.HttpStatus.NOT_FOUND);
        }
    }
};
exports.ServiceRequestController = ServiceRequestController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Submit a new service request' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Service request created' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ServiceRequestController.prototype, "createServiceRequest", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get service requests for agency' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Service requests retrieved' }),
    __param(0, (0, common_1.Query)('agencyId')),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('categoryId')),
    __param(3, (0, common_1.Query)('providerId')),
    __param(4, (0, common_1.Query)('limit')),
    __param(5, (0, common_1.Query)('offset')),
    __param(6, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, Number, Number, Object]),
    __metadata("design:returntype", Promise)
], ServiceRequestController.prototype, "getServiceRequests", null);
__decorate([
    (0, common_1.Get)(':requestId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get specific service request details' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Service request details retrieved' }),
    __param(0, (0, common_1.Param)('requestId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ServiceRequestController.prototype, "getServiceRequest", null);
__decorate([
    (0, common_1.Put)(':requestId/status'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.AGENCY_ADMIN, client_1.UserRole.AGENCY_MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Update service request status' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Status updated successfully' }),
    __param(0, (0, common_1.Param)('requestId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ServiceRequestController.prototype, "updateRequestStatus", null);
__decorate([
    (0, common_1.Post)(':requestId/assign'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.AGENCY_ADMIN, client_1.UserRole.AGENCY_MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Assign service request to provider' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Request assigned successfully' }),
    __param(0, (0, common_1.Param)('requestId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ServiceRequestController.prototype, "assignRequest", null);
__decorate([
    (0, common_1.Post)(':requestId/auto-assign'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.AGENCY_ADMIN, client_1.UserRole.AGENCY_MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Auto-assign service request to best provider' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Request auto-assigned successfully' }),
    __param(0, (0, common_1.Param)('requestId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ServiceRequestController.prototype, "autoAssignRequest", null);
__decorate([
    (0, common_1.Get)(':requestId/recommendations'),
    (0, swagger_1.ApiOperation)({ summary: 'Get provider recommendations for request' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Provider recommendations retrieved' }),
    __param(0, (0, common_1.Param)('requestId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ServiceRequestController.prototype, "getProviderRecommendations", null);
__decorate([
    (0, common_1.Post)(':requestId/complete'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.AGENT_OPERATOR),
    (0, swagger_1.ApiOperation)({ summary: 'Mark service request as completed' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Request marked as completed' }),
    __param(0, (0, common_1.Param)('requestId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ServiceRequestController.prototype, "completeRequest", null);
__decorate([
    (0, common_1.Post)(':requestId/review'),
    (0, swagger_1.ApiOperation)({ summary: 'Submit review for completed service request' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Review submitted successfully' }),
    __param(0, (0, common_1.Param)('requestId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ServiceRequestController.prototype, "submitReview", null);
__decorate([
    (0, common_1.Get)('categories/:categoryId/requests'),
    (0, swagger_1.ApiOperation)({ summary: 'Get requests by service category' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Category requests retrieved' }),
    __param(0, (0, common_1.Param)('categoryId')),
    __param(1, (0, common_1.Query)('agencyId')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('limit')),
    __param(4, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], ServiceRequestController.prototype, "getRequestsByCategory", null);
exports.ServiceRequestController = ServiceRequestController = __decorate([
    (0, swagger_1.ApiTags)('service-requests'),
    (0, common_1.Controller)('api/service-requests'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [typeof (_a = typeof service_category_router_service_1.ServiceCategoryRouterService !== "undefined" && service_category_router_service_1.ServiceCategoryRouterService) === "function" ? _a : Object, typeof (_b = typeof enhanced_agency_service_1.EnhancedAgencyService !== "undefined" && enhanced_agency_service_1.EnhancedAgencyService) === "function" ? _b : Object])
], ServiceRequestController);
